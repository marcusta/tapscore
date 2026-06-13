import { type Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { toIsoUtc } from '../domain/time';

// --- Output types ---

export interface ScorecardHole {
    /** Stable play-hole occurrence id. */
    playHoleId: string;
    /** Physical hole number (== courseHoleNumber); kept as `holeNumber` for back-compat. */
    holeNumber: number;
    courseHoleNumber: number;
    /** Canonical itinerary ordinal (1..N). */
    canonicalOrdinal: number;
    /** Display label distinguishing repeated visits (`"3"`, `"3 (1st)"`). */
    occurrenceLabel: string;
    strokes: number | null;
    recordedBy: string | null;
    recordedAt: string;
    /**
     * Per-player source within a team ball (better-ball, Taliban,
     * Umbrella). For individual / foursomes both are null. Exactly one
     * non-null otherwise — see `score-event.service.ts::append` invariant.
     */
    sourcePlayerId: string | null;
    sourceGuestPlayerId: string | null;
    /**
     * Supplemental per-hole JSON metadata from the latest event for this
     * `(ball, hole, source)`. Flows through the rebuild trigger
     * (migration 014). Null when no metadata was attached. Umbrella reads
     * `metadata.gir` (boolean); absent → treated as not GIR.
     *
     * Optional in the TypeScript type so pre-014 test fixtures that build
     * ScorecardHole literals by hand don't need per-fixture updates. The
     * runtime read path (`toHole`, `forRound`) always populates it (null
     * or parsed object) — see `parseMetadata`.
     */
    metadata?: Record<string, unknown> | null;
}

export interface Scorecard {
    ballId: string;
    holes: ScorecardHole[];
}

// --- Row mapping ---
//
// Since migration 020 `scorecards` rows are keyed by
// `(ball_id, hole, source_key)` where
// `source_key = COALESCE(source_player_id, source_guest_player_id, '')`.
// Public API is ball-keyed too (Phase 2.6b/3b.3.1 flipped the read side).

interface ScorecardRow {
    ball_id: string;
    play_hole_id: string;
    course_hole_number: number;
    ordinal: number;
    strokes: number | null;
    recorded_by_player_id: string | null;
    recorded_at: string;
    source_player_id: string | null;
    source_guest_player_id: string | null;
    metadata: string | null;
}

function toHole(row: ScorecardRow, occurrenceLabel: string): ScorecardHole {
    return {
        playHoleId: row.play_hole_id,
        holeNumber: row.course_hole_number,
        courseHoleNumber: row.course_hole_number,
        canonicalOrdinal: row.ordinal,
        occurrenceLabel,
        strokes: row.strokes,
        recordedBy: row.recorded_by_player_id,
        recordedAt: toIsoUtc(row.recorded_at),
        sourcePlayerId: row.source_player_id,
        sourceGuestPlayerId: row.source_guest_player_id,
        metadata: parseMetadata(row.metadata),
    };
}

const ORDINAL_WORDS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

/**
 * Compute occurrence labels for a set of rows belonging to one round: a
 * physical hole that appears once renders as its bare number; repeated visits
 * get "(1st)" / "(2nd)" suffixes in canonical ordinal order. Keyed by
 * play_hole_id (distinct rows per source share a play hole and label).
 */
function occurrenceLabels(rows: ScorecardRow[]): Map<string, string> {
    const ordinalByPlayHole = new Map<string, number>();
    for (const r of rows) ordinalByPlayHole.set(r.play_hole_id, r.ordinal);
    const byCourseHole = new Map<number, { playHoleId: string; ordinal: number }[]>();
    for (const [playHoleId, ordinal] of ordinalByPlayHole) {
        const courseHoleNumber = rows.find((r) => r.play_hole_id === playHoleId)!.course_hole_number;
        const list = byCourseHole.get(courseHoleNumber) ?? [];
        list.push({ playHoleId, ordinal });
        byCourseHole.set(courseHoleNumber, list);
    }
    const out = new Map<string, string>();
    for (const [courseHoleNumber, occ] of byCourseHole) {
        occ.sort((a, b) => a.ordinal - b.ordinal);
        occ.forEach((o, i) => {
            out.set(
                o.playHoleId,
                occ.length === 1
                    ? String(courseHoleNumber)
                    : `${courseHoleNumber} (${ORDINAL_WORDS[i] ?? `${i + 1}th`})`,
            );
        });
    }
    return out;
}

/**
 * Parse a scorecard row's `metadata` TEXT. Null stays null. A string is
 * JSON.parse'd and must be an object; anything else throws. Mirrors
 * `score-event.service.ts::parseMetadata` — kept local to this service so
 * the read-time contract is visible at the call site.
 */
function parseMetadata(raw: string | null): Record<string, unknown> | null {
    if (raw === null) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        throw new Error(
            `scorecard metadata: malformed JSON in DB — ${(err as Error).message} (raw: ${raw.slice(0, 80)})`,
        );
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(
            `scorecard metadata: expected JSON object, got ${parsed === null ? 'null' : Array.isArray(parsed) ? 'array' : typeof parsed}`,
        );
    }
    return parsed as Record<string, unknown>;
}

/**
 * Read-only view over the `scorecards` table, which is maintained by the
 * `scorecards_rebuild_on_event` trigger (see migrations 012 / 013 / 020).
 * The write path is append-to-score_events; this service never writes.
 *
 * Multiple rows per `(ballId, holeNumber)`: a better-ball team ball with
 * two players will produce two rows per hole — one per source player.
 * Individual and foursomes still produce exactly one row per hole (both
 * source columns null → empty `source_key` bucket). `forRound` and
 * `forBall` return every row; callers that want a specific player's hole
 * within a team ball should use `pickForSource`.
 */
export class ScorecardService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private rowsForBall(ballId: string) {
        return this.db
            .selectFrom('scorecards as sc')
            .innerJoin('round_play_holes as ph', 'ph.id', 'sc.play_hole_id')
            .where('sc.ball_id', '=', ballId)
            .select([
                'sc.ball_id',
                'sc.play_hole_id',
                'ph.course_hole_number',
                'ph.ordinal',
                'sc.strokes',
                'sc.recorded_by_player_id',
                'sc.recorded_at',
                'sc.source_player_id',
                'sc.source_guest_player_id',
                'sc.metadata',
            ])
            .orderBy('ph.ordinal')
            .orderBy('sc.source_key');
    }

    private rowsForRound(roundId: string) {
        return this.db
            .selectFrom('scorecards as sc')
            .innerJoin('balls as b', 'b.id', 'sc.ball_id')
            .innerJoin('round_play_holes as ph', 'ph.id', 'sc.play_hole_id')
            .where('b.round_id', '=', roundId)
            .select([
                'sc.ball_id',
                'sc.play_hole_id',
                'ph.course_hole_number',
                'ph.ordinal',
                'sc.strokes',
                'sc.recorded_by_player_id',
                'sc.recorded_at',
                'sc.source_player_id',
                'sc.source_guest_player_id',
                'sc.metadata',
            ])
            .orderBy('sc.ball_id')
            .orderBy('ph.ordinal')
            .orderBy('sc.source_key');
    }

    // --- Methods ---

    async forBall(ballId: string): Promise<Scorecard> {
        const rows = await this.rowsForBall(ballId).execute();
        const labels = occurrenceLabels(rows);
        return {
            ballId,
            holes: rows.map((r) => toHole(r, labels.get(r.play_hole_id) ?? String(r.course_hole_number))),
        };
    }

    async forRound(roundId: string): Promise<Scorecard[]> {
        const rows = await this.rowsForRound(roundId).execute();
        const labels = occurrenceLabels(rows);
        const byBall = new Map<string, ScorecardHole[]>();
        for (const row of rows) {
            const hole = toHole(row, labels.get(row.play_hole_id) ?? String(row.course_hole_number));
            const bucket = byBall.get(row.ball_id);
            if (bucket) bucket.push(hole);
            else byBall.set(row.ball_id, [hole]);
        }
        return Array.from(byBall.entries()).map(([ballId, holes]) => ({
            ballId,
            holes,
        }));
    }
}

/**
 * Find the scorecard hole for a specific source within a team ball.
 * Returns null if no row matches. Pass `null, null` to find the
 * non-source row (individual / foursomes shape). Used by per-player team
 * formats (better-ball 2.5e, Taliban 2.5g, Umbrella 2.5h) to extract
 * each player's hole entry from a ball's full scorecard.
 *
 * Match semantics: a row matches when its `sourcePlayerId` equals the
 * argument AND its `sourceGuestPlayerId` equals the argument. This means
 * `pickForSource(holes, playerXId, null)` will not return a guest's hole
 * even if that guest happens to be on the same team.
 */
export function pickForSource(
    holes: ScorecardHole[],
    sourcePlayerId: string | null,
    sourceGuestPlayerId: string | null,
): ScorecardHole | null {
    for (const h of holes) {
        if (
            h.sourcePlayerId === sourcePlayerId &&
            h.sourceGuestPlayerId === sourceGuestPlayerId
        ) {
            return h;
        }
    }
    return null;
}
