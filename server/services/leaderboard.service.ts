import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import type { RoundService } from './round.service';
import type { ParticipantService } from './participant.service';
import type { ScorecardService } from './scorecard.service';
import type { CourseService } from './course.service';
import { computeLeaderboard, type Leaderboard, type SlotGroup } from '../domain/leaderboard';
import type { ParticipantInput, CourseHole } from '../domain/format';
import { courseHolesForRound } from '../domain/round-holes';

/**
 * Materialises the inputs to `computeLeaderboard` — course holes, participants
 * with scorecards + snapshots, and format slots — then runs it. Slot assignment
 * in this first cut is: every participant is in `slotIndex = 0` (single-slot
 * rounds). Multi-slot scope_config is exercised in Phase 2.5i.
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

        const allHoles: CourseHole[] = course.holes.map((h) => ({
            holeNumber: h.holeNumber,
            par: h.par,
            strokeIndex: h.strokeIndex,
        }));
        // Stroke allocation happens against the course's FULL SI distribution
        // (WHS rule: on a 9-hole round, you get whichever strokes from your
        // full-course allocation happen to land on the holes you play — not a
        // fresh allocation over 9). We therefore pass `allHoles` to the strategy
        // and trim the result's per-hole rows to the played set afterwards.
        const playedSet = new Set(
            courseHolesForRound(round.roundType, allHoles).map((h) => h.holeNumber),
        );

        const participants = await this.participantService.listByRound(roundId);
        const scorecards = await this.scorecardService.forRound(roundId);
        const cardByParticipant = new Map(scorecards.map((s) => [s.participantId, s]));

        const participantInputs: ParticipantInput[] = participants.map((p) => ({
            participantId: p.id,
            playingHandicap: p.playingHandicapSnapshot,
            holes: cardByParticipant.get(p.id)?.holes ?? [],
        }));

        // First-cut routing: every participant lands in slot 0. Phase 2.5i
        // will read `slot.scopeConfig.scope` to partition participants across
        // multiple slots.
        const defaultSlot = round.formatSlots[0];
        if (!defaultSlot) {
            throw new Error(`round ${roundId} has no format slots`);
        }
        const slotGroups: SlotGroup[] = [
            {
                slot: defaultSlot,
                participants: participantInputs,
                courseHoles: allHoles,
            },
        ];

        void this.db;

        const lb = computeLeaderboard({ slotGroups });

        // Trim per-hole rows to the played set so consumers see a clean 9-hole
        // (or 18-hole) view. Totals computed by the strategy already exclude
        // null-gross holes, so they are unaffected by this trim.
        return {
            ...lb,
            participantResults: lb.participantResults.map((r) => ({
                ...r,
                holes: r.holes.filter((h) => playedSet.has(h.holeNumber)),
            })),
            pairResults: lb.pairResults.map((pr) => ({
                ...pr,
                holes: pr.holes.filter((h) => playedSet.has(h.holeNumber)),
            })),
        };
    }
}
