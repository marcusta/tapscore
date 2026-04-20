import type { Kysely, Selectable } from 'kysely';
import type { Database, ScorecardsTable } from '../db/schema';

// --- Output types ---

export interface ScorecardHole {
    holeNumber: number;
    strokes: number | null;
    recordedBy: string | null;
    recordedAt: string;
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
        recordedAt: row.recorded_at,
    };
}

/**
 * Read-only view over the `scorecards` table, which is maintained by the
 * `scorecards_rebuild_on_event` trigger (see migration 012). The write path
 * is append-to-score_events; this service never writes.
 */
export class ScorecardService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private rowsForParticipant(participantId: string) {
        return this.db
            .selectFrom('scorecards')
            .selectAll()
            .where('participant_id', '=', participantId)
            .orderBy('hole');
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
            ])
            .orderBy('scorecards.participant_id')
            .orderBy('scorecards.hole');
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
                recordedAt: row.recorded_at,
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
