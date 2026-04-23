import { sql, type Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { toIsoUtc } from '../domain/time';

// --- Output types ---

export interface ScorecardHole {
    holeNumber: number;
    strokes: number | null;
    recordedBy: string | null;
    recordedAt: string;
    /**
     * Per-player source within a team participant (better-ball, Taliban,
     * Umbrella). For individual / foursomes both are null. Exactly one
     * non-null otherwise — see `score-event.service.ts::append` invariant.
     */
    sourcePlayerId: string | null;
    sourceGuestPlayerId: string | null;
    /**
     * Supplemental per-hole JSON metadata from the latest event for this
     * `(participant, hole, source)`. Flows through the rebuild trigger
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
    participantId: string;
    holes: ScorecardHole[];
}

// --- Row mapping ---
//
// Migration 020 flipped `scorecards` from `participant_id` to `ball_id`.
// Public API still speaks in `participantId` — translation mirrors
// `score-event.service.ts`:
//
//   forParticipant  : filter via ball_players → participant_players join,
//                     select DISTINCT to collapse the foursomes fan-out
//                     (multiple producer_def_ids on the same ball share
//                     the same participant).
//   forRound        : filter via balls.round_id, project participant_id as
//                     a correlated subquery matching the row's source.

interface ScorecardRowWithParticipant {
    participant_id: string;
    hole: number;
    strokes: number | null;
    recorded_by_player_id: string | null;
    recorded_at: string;
    source_player_id: string | null;
    source_guest_player_id: string | null;
    metadata: string | null;
}

function toHole(row: ScorecardRowWithParticipant): ScorecardHole {
    return {
        holeNumber: row.hole,
        strokes: row.strokes,
        recordedBy: row.recorded_by_player_id,
        recordedAt: toIsoUtc(row.recorded_at),
        sourcePlayerId: row.source_player_id,
        sourceGuestPlayerId: row.source_guest_player_id,
        metadata: parseMetadata(row.metadata),
    };
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
 * Since migration 020 rows are keyed by `(ball_id, hole, source_key)`
 * where `source_key = COALESCE(source_player_id, source_guest_player_id,
 * '')`. Public API still speaks in `participantId`: this service
 * translates at the read boundary (see
 * `score-event.service.ts::selectWithParticipant` for the mirroring
 * pattern on events).
 *
 * Multiple rows per `(participantId, holeNumber)`: a better-ball team
 * with two players will produce two rows per hole — one per source
 * player. Individual and foursomes still produce exactly one row per
 * hole (both source columns null → empty `source_key` bucket).
 * `forRound` and `forParticipant` return every row; callers that want a
 * specific player's hole within a team participant should use
 * `pickForSource`.
 */
export class ScorecardService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    /**
     * Scorecards for one participant. Walks the ball_players → participant_players
     * bridge. A team ball with N producers fans out to N rows per scorecard
     * row in the raw join, so we `DISTINCT`-collapse on the stable fields.
     */
    private rowsForParticipant(participantId: string) {
        return this.db
            .selectFrom('scorecards as sc')
            .innerJoin('ball_players as bp', 'bp.ball_id', 'sc.ball_id')
            .innerJoin('participant_players as pp', 'pp.id', 'bp.producer_def_id')
            .where('pp.participant_id', '=', participantId)
            .where((eb) =>
                eb.or([
                    eb.and([
                        eb('sc.source_player_id', 'is', null),
                        eb('sc.source_guest_player_id', 'is', null),
                    ]),
                    eb('sc.source_player_id', '=', eb.ref('bp.player_id')),
                    eb('sc.source_guest_player_id', '=', eb.ref('bp.guest_player_id')),
                ]),
            )
            .select((eb) => [
                eb.val(participantId).as('participant_id'),
                'sc.hole',
                'sc.strokes',
                'sc.recorded_by_player_id',
                'sc.recorded_at',
                'sc.source_player_id',
                'sc.source_guest_player_id',
                'sc.metadata',
            ])
            .distinct()
            .orderBy('sc.hole')
            .orderBy('sc.source_key');
    }

    /**
     * Scorecards for every participant in a round. Filter via balls.round_id;
     * project participant_id via the same correlated subquery pattern used by
     * score-event.service. No DISTINCT needed here — the subquery returns one
     * participant_id per row regardless of how many producer_def_ids the ball
     * carries (they all share a participant by construction).
     */
    private rowsForRound(roundId: string) {
        return this.db
            .selectFrom('scorecards as sc')
            .innerJoin('balls as b', 'b.id', 'sc.ball_id')
            .where('b.round_id', '=', roundId)
            .select([
                sql<string>`(
                    SELECT DISTINCT pp.participant_id
                    FROM ball_players bp
                    JOIN participant_players pp ON pp.id = bp.producer_def_id
                    WHERE bp.ball_id = sc.ball_id
                      AND (
                          (sc.source_player_id IS NULL AND sc.source_guest_player_id IS NULL)
                          OR (sc.source_player_id IS NOT NULL AND bp.player_id = sc.source_player_id)
                          OR (sc.source_guest_player_id IS NOT NULL AND bp.guest_player_id = sc.source_guest_player_id)
                      )
                    LIMIT 1
                )`.as('participant_id'),
                'sc.hole',
                'sc.strokes',
                'sc.recorded_by_player_id',
                'sc.recorded_at',
                'sc.source_player_id',
                'sc.source_guest_player_id',
                'sc.metadata',
            ] as const)
            .orderBy('participant_id')
            .orderBy('sc.hole')
            .orderBy('sc.source_player_id')
            .orderBy('sc.source_guest_player_id');
    }

    // --- Methods ---

    async forParticipant(participantId: string): Promise<Scorecard> {
        const rows = await this.rowsForParticipant(participantId).execute();
        return {
            participantId,
            holes: rows.map((r) => toHole(r as ScorecardRowWithParticipant)),
        };
    }

    async forRound(roundId: string): Promise<Scorecard[]> {
        const rows = await this.rowsForRound(roundId).execute();
        const byParticipant = new Map<string, ScorecardHole[]>();
        for (const r of rows) {
            const row = r as ScorecardRowWithParticipant;
            const hole = toHole(row);
            const bucket = byParticipant.get(row.participant_id);
            if (bucket) bucket.push(hole);
            else byParticipant.set(row.participant_id, [hole]);
        }
        return Array.from(byParticipant.entries()).map(([participantId, holes]) => ({
            participantId,
            holes,
        }));
    }
}

/**
 * Find the scorecard hole for a specific source within a team participant.
 * Returns null if no row matches. Pass `null, null` to find the
 * non-source row (individual / foursomes shape). Used by per-player team
 * formats (better-ball 2.5e, Taliban 2.5g, Umbrella 2.5h) to extract
 * each player's hole entry from a participant's full scorecard.
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
