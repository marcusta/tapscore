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
 *
 * Contract on `ParticipantInput.holes`: this service passes EVERY scorecard
 * row for a participant through as-is, with no source filtering. For
 * individual / foursomes that's one row per hole (null / null source). For
 * team formats (better-ball from 2.5e on) it's up to two rows per hole
 * (one per player source). Individual strategies stay correct because
 * their upstream seeds never append team-source events under their
 * participants, so every row they read is null-source. Team strategies
 * slice the flat list internally (via `pickForSource` from
 * `scorecard.service` or by pre-filtering in their own loop).
 *
 * Per-player playing handicaps: `participant_players` does not (yet) carry
 * a per-player `playing_handicap_snapshot` column. Until that migration
 * lands, we fall back to the team-level `playingHandicapSnapshot` for
 * every linked player. This is good enough for better-ball when both
 * players are on the same tee with similar course handicaps (the common
 * case), and is a documented known limitation — future work.
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
            teamLabel: p.teamLabel,
            // Per-player PH fallback: until `participant_players` carries a
            // per-player PH snapshot column, every linked player inherits
            // the team's PH. Documented fallback; see module header.
            players: p.players.map((link) => ({
                playerId: link.playerId,
                guestPlayerId: link.guestPlayerId,
                playingHandicap: p.playingHandicapSnapshot,
            })),
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
