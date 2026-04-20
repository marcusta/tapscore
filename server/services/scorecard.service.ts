import type { Kysely, Selectable } from 'kysely';
import type { Database, ScorecardsTable } from '../db/schema';
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
}

export interface Scorecard {
    participantId: string;
    holes: ScorecardHole[];
}

// --- Row mapping ---

type ScorecardRow = Selectable<ScorecardsTable>;

function toHole(row: ScorecardRow): ScorecardHole {
    return {
        holeNumber: row.hole,
        strokes: row.strokes,
        recordedBy: row.recorded_by_player_id,
        recordedAt: toIsoUtc(row.recorded_at),
        sourcePlayerId: row.source_player_id,
        sourceGuestPlayerId: row.source_guest_player_id,
    };
}

/**
 * Read-only view over the `scorecards` table, which is maintained by the
 * `scorecards_rebuild_on_event` trigger (see migrations 012 / 013). The
 * write path is append-to-score_events; this service never writes.
 *
 * Multiple rows per `(participantId, holeNumber)`: since migration 013,
 * scorecards are keyed by `(participant_id, hole, source_key)` where
 * `source_key = COALESCE(source_player_id, source_guest_player_id, '')`.
 * A better-ball team with two players will therefore produce two rows
 * per hole — one per source player. Individual and foursomes still produce
 * exactly one row per hole (both source columns null → empty `source_key`
 * bucket). `forRound` and `forParticipant` return every row; callers that
 * want a specific player's hole within a team participant should use
 * `pickForSource`.
 */
export class ScorecardService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private rowsForParticipant(participantId: string) {
        return this.db
            .selectFrom('scorecards')
            .selectAll()
            .where('participant_id', '=', participantId)
            .orderBy('hole')
            .orderBy('source_key');
    }

    private rowsForRound(roundId: string) {
        return this.db
            .selectFrom('scorecards')
            .innerJoin('participants', 'participants.id', 'scorecards.participant_id')
            .where('participants.round_id', '=', roundId)
            .select([
                'scorecards.participant_id',
                'scorecards.hole',
                'scorecards.strokes',
                'scorecards.recorded_by_player_id',
                'scorecards.recorded_at',
                'scorecards.latest_event_id',
                'scorecards.source_player_id',
                'scorecards.source_guest_player_id',
            ])
            .orderBy('scorecards.participant_id')
            .orderBy('scorecards.hole')
            .orderBy('scorecards.source_player_id')
            .orderBy('scorecards.source_guest_player_id');
    }

    // --- Methods ---

    async forParticipant(participantId: string): Promise<Scorecard> {
        const rows = await this.rowsForParticipant(participantId).execute();
        return {
            participantId,
            holes: rows.map(toHole),
        };
    }

    async forRound(roundId: string): Promise<Scorecard[]> {
        const rows = await this.rowsForRound(roundId).execute();
        const byParticipant = new Map<string, ScorecardHole[]>();
        for (const row of rows) {
            const hole: ScorecardHole = {
                holeNumber: row.hole,
                strokes: row.strokes,
                recordedBy: row.recorded_by_player_id,
                recordedAt: toIsoUtc(row.recorded_at),
                sourcePlayerId: row.source_player_id,
                sourceGuestPlayerId: row.source_guest_player_id,
            };
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
