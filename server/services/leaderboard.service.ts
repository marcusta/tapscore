import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import type { RoundService } from './round.service';
import type { ParticipantService } from './participant.service';
import type { ScorecardService } from './scorecard.service';
import type { CourseService } from './course.service';
import { computeLeaderboard, type Leaderboard } from '../domain/leaderboard';
import type { ParticipantInput, CourseHole } from '../domain/format';

/**
 * Materialises the inputs to `computeLeaderboard` — course holes, participants
 * with scorecards + snapshots, and format slots — then runs it. Slot assignment
 * in this first cut is: every participant is in `slotIndex = 0` (single-slot
 * rounds). Multi-slot scope_config is exercised in Phase 2.5.
 */
export class LeaderboardService {
    constructor(
        private db: Kysely<Database>,
        private roundService: RoundService,
        private participantService: ParticipantService,
        private scorecardService: ScorecardService,
        private courseService: CourseService,
    ) {}

    async forRound(roundId: string): Promise<Leaderboard> {
        const round = await this.roundService.getById(roundId);
        if (!round) throw new Error(`round ${roundId} not found`);

        const course = await this.courseService.getById(round.courseId);
        if (!course) throw new Error(`course ${round.courseId} not found`);

        const courseHoles: CourseHole[] = course.holes.map((h) => ({
            holeNumber: h.holeNumber,
            par: h.par,
            strokeIndex: h.strokeIndex,
        }));

        const participants = await this.participantService.listByRound(roundId);
        const scorecards = await this.scorecardService.forRound(roundId);
        const cardByParticipant = new Map(scorecards.map((s) => [s.participantId, s]));

        const participantInputs: ParticipantInput[] = participants.map((p) => ({
            participantId: p.id,
            courseHoles,
            playingHandicap: p.playingHandicapSnapshot,
            holes: cardByParticipant.get(p.id)?.holes ?? [],
        }));

        const participantSlots = new Map<string, number>();
        for (const p of participants) {
            // First-cut assignment: every participant is in the first slot.
            // Phase 2.5 will read `round.formatSlots[].scopeConfig` to filter.
            participantSlots.set(p.id, round.formatSlots[0]?.slotIndex ?? 0);
        }

        void this.db;

        return computeLeaderboard({
            participants: participantInputs,
            participantSlots,
            slots: round.formatSlots,
        });
    }
}
