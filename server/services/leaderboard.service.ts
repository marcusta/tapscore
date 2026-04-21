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
 * with scorecards + snapshots, and format slots — then runs it.
 *
 * Slot routing (Phase 2.5i):
 *   - Single-slot round (one format slot, no `scope.participantIds` on it):
 *     every participant lands in that slot. This is the 9-seed
 *     backwards-compat branch — none of the existing seeds populate scope.
 *   - Multi-slot round: every slot MUST have `scopeConfig.scope.participantIds`
 *     populated. Each participant is routed to the slot whose scope lists
 *     their id. Hard errors (before touching the strategy) if:
 *       a) any slot has no scope on a multi-slot round,
 *       b) a participant matches zero slots' scope,
 *       c) a participant matches more than one slot's scope.
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
 * Per-player snapshots live on `participant_players` (migration 015).
 * Team formats consume the linked players' own frozen playing handicaps;
 * only when an old row predates the migration (or was added without enough
 * snapshot context to backfill accurately) do we fall back to the team's
 * participant-level `playingHandicapSnapshot`.
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
            players: p.players.map((link) => ({
                playerId: link.playerId,
                guestPlayerId: link.guestPlayerId,
                playingHandicap:
                    link.playingHandicapSnapshot ?? p.playingHandicapSnapshot,
            })),
        }));

        if (round.formatSlots.length === 0) {
            throw new Error(`round ${roundId} has no format slots`);
        }

        // Route participants to slots via `scopeConfig.scope.participantIds`.
        // Single-slot rounds with no scope fall back to "everyone in slot 0"
        // (the existing 9 seeds all hit this branch byte-for-byte).
        const participantsBySlotIndex = new Map<number, ParticipantInput[]>();
        for (const s of round.formatSlots) {
            participantsBySlotIndex.set(s.slotIndex, []);
        }

        const singleSlotNoScope =
            round.formatSlots.length === 1 &&
            (round.formatSlots[0]!.scopeConfig?.scope?.participantIds ?? null) === null;

        if (singleSlotNoScope) {
            participantsBySlotIndex.get(round.formatSlots[0]!.slotIndex)!.push(...participantInputs);
        } else {
            // Multi-slot (or single-slot with explicit scope) — every slot
            // must carry a scope; participants must match exactly one slot.
            for (const slot of round.formatSlots) {
                const ids = slot.scopeConfig?.scope?.participantIds;
                if (!ids) {
                    throw new Error(
                        `slot #${slot.slotIndex} in round ${roundId} has no scope.participantIds — multi-slot rounds require explicit participant scoping`,
                    );
                }
            }
            for (const pin of participantInputs) {
                const matches = round.formatSlots.filter((slot) =>
                    slot.scopeConfig!.scope!.participantIds.includes(pin.participantId),
                );
                if (matches.length === 0) {
                    throw new Error(
                        `participant ${pin.participantId} in round ${roundId} is not assigned to any slot's scope`,
                    );
                }
                if (matches.length > 1) {
                    throw new Error(
                        `participant ${pin.participantId} in round ${roundId} is assigned to multiple slots' scope (#${matches.map((m) => m.slotIndex).join(', #')})`,
                    );
                }
                participantsBySlotIndex.get(matches[0]!.slotIndex)!.push(pin);
            }
        }

        const slotGroups: SlotGroup[] = round.formatSlots.map((slot) => ({
            slot,
            participants: participantsBySlotIndex.get(slot.slotIndex) ?? [],
            // `courseHoles` comes from the round's single course — all slots
            // share it. Multi-slot routing doesn't change the course axis.
            courseHoles: allHoles,
        }));

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
