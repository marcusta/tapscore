import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import type { RoundService } from './round.service';
import type { ScorecardService } from './scorecard.service';
import type { CourseService } from './course.service';
import { computeLeaderboard, type Leaderboard, type SlotGroup } from '../domain/leaderboard';
import type { BallInput, BallPlayerInput, CourseHole } from '../domain/format';
import { courseHolesForRound } from '../domain/round-holes';

/**
 * Materialises the inputs to `computeLeaderboard` — course holes, balls
 * with scorecards + snapshots, and format slots — then runs it.
 *
 * Slot routing is read straight off the compiler tables: `slot_balls`
 * (joined with `slots` on `slot_id`) partitions balls per slot. The
 * `slots.slot_def_id` column encodes the legacy slotIndex via the
 * `slot-${index}` pattern written by `synthesize-legacy.ts` — we parse it
 * back to recover the slotIndex that strategies + leaderboard buckets key on.
 *
 * Hard errors (before touching the strategy) if:
 *   a) round has no format slots;
 *   b) a ball exists under the round but lands in zero slots (compiler
 *      drift — ball created outside any slot_balls entry);
 *   c) a `slots.slot_def_id` does not parse as `slot-${N}`.
 *
 * Contract on `BallInput.holes`: this service passes EVERY scorecard row
 * for a ball through as-is, with no source filtering. Team strategies slice
 * the flat list internally (via `pickForSource` from `scorecard.service`
 * or by pre-filtering in their own loop).
 */
export class LeaderboardService {
    constructor(
        private db: Kysely<Database>,
        private roundService: RoundService,
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
        // fresh allocation over 9). We therefore pass `allHoles` to the
        // strategy and trim the result's per-hole rows to the played set
        // afterwards.
        const playedSet = new Set(
            courseHolesForRound(round.roundType, allHoles).map((h) => h.holeNumber),
        );

        if (round.formatSlots.length === 0) {
            throw new Error(`round ${roundId} has no format slots`);
        }

        // --- Enumerate balls for the round + their per-slot assignments. ---

        const ballRows = await this.db
            .selectFrom('balls')
            .where('round_id', '=', roundId)
            .select(['id', 'label'])
            .execute();

        // ball_players — per-player snapshot (player_id / guest xor,
        // per-producer CH snapshot used as PH fallback for team formats).
        const ballPlayerRows = await this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            .select([
                'bp.ball_id',
                'bp.player_id',
                'bp.guest_player_id',
                'bp.course_handicap_snapshot',
            ])
            .execute();

        const playersByBall = new Map<string, BallPlayerInput[]>();
        for (const r of ballPlayerRows) {
            const list = playersByBall.get(r.ball_id) ?? [];
            list.push({
                playerId: r.player_id,
                guestPlayerId: r.guest_player_id,
                playingHandicap: r.course_handicap_snapshot,
            });
            playersByBall.set(r.ball_id, list);
        }

        // Phase 2.6b/3b.3.3 — labels live on `balls.label` (option 3a).
        // The compiler populates this from producer displayNames (or from
        // the strategy composition label for pair balls). A single read off
        // `balls.label` covers every code path — no `participants` join.
        const teamLabelByBall = new Map<string, string | null>();
        for (const b of ballRows) {
            teamLabelByBall.set(b.id, b.label ?? null);
        }

        // slot_balls joined with slots — per (ball, slot-index, PH).
        const slotBallRows = await this.db
            .selectFrom('slot_balls as sb')
            .innerJoin('slots as s', 's.id', 'sb.slot_id')
            .where('s.round_id', '=', roundId)
            .select([
                'sb.ball_id',
                'sb.playing_handicap_snapshot',
                's.slot_def_id',
                's.id as slot_id',
                's.team_shape',
            ])
            .execute();

        // slot_ball_teams — per (slot, team_label, ball). Forwarded to the
        // strategy as `SlotInput.teams` so team-format strategies iterate
        // team groupings (not the flat ball list). Slots without any
        // slot_ball_teams rows pass `teams: undefined` through — the
        // individual / foursomes strategies ignore it.
        const slotBallTeamRows = await this.db
            .selectFrom('slot_ball_teams as sbt')
            .innerJoin('slots as s', 's.id', 'sbt.slot_id')
            .where('s.round_id', '=', roundId)
            .select(['sbt.slot_id', 'sbt.team_label', 'sbt.ball_id'])
            .execute();

        // slotId → Map<teamLabel, ballIds> — preserves row-insertion order
        // so team iteration is deterministic by team_label.
        const teamsBySlot = new Map<string, Map<string, string[]>>();
        for (const r of slotBallTeamRows) {
            let bySlot = teamsBySlot.get(r.slot_id);
            if (!bySlot) {
                bySlot = new Map();
                teamsBySlot.set(r.slot_id, bySlot);
            }
            const list = bySlot.get(r.team_label) ?? [];
            list.push(r.ball_id);
            bySlot.set(r.team_label, list);
        }

        // slot_def_id → slotIndex (strip `slot-` prefix).
        function parseSlotIndex(slotDefId: string): number {
            const m = /^slot-(\d+)$/.exec(slotDefId);
            if (!m) {
                throw new Error(
                    `round ${roundId}: cannot parse slot_def_id '${slotDefId}' — expected 'slot-<N>'`,
                );
            }
            return Number.parseInt(m[1]!, 10);
        }

        // --- Read scorecards. ---

        const scorecards = await this.scorecardService.forRound(roundId);
        const cardByBall = new Map(scorecards.map((s) => [s.ballId, s]));

        // --- Build ball inputs per slot. ---

        const ballInputsBySlotIndex = new Map<number, BallInput[]>();
        const teamsBySlotIndex = new Map<
            number,
            { teamLabel: string; ballIds: string[] }[]
        >();
        for (const s of round.formatSlots) {
            ballInputsBySlotIndex.set(s.slotIndex, []);
        }

        const slotIndexBySlotId = new Map<string, number>();
        const ballsSeen = new Set<string>();
        for (const row of slotBallRows) {
            const slotIndex = parseSlotIndex(row.slot_def_id);
            const bucket = ballInputsBySlotIndex.get(slotIndex);
            if (!bucket) {
                throw new Error(
                    `round ${roundId}: slot index ${slotIndex} present in slots table but missing from round_format_slots`,
                );
            }
            slotIndexBySlotId.set(row.slot_id, slotIndex);
            const input: BallInput = {
                ballId: row.ball_id,
                playingHandicap: row.playing_handicap_snapshot,
                holes: cardByBall.get(row.ball_id)?.holes ?? [],
                teamLabel: teamLabelByBall.get(row.ball_id) ?? null,
                players: playersByBall.get(row.ball_id) ?? [],
            };
            bucket.push(input);
            ballsSeen.add(row.ball_id);
        }

        // Attach team groupings per slot so team-format strategies can
        // iterate them directly (no collapsing / merging of own-balls).
        for (const [slotId, teams] of teamsBySlot) {
            const slotIndex = slotIndexBySlotId.get(slotId);
            if (slotIndex === undefined) continue;
            const list: { teamLabel: string; ballIds: string[] }[] = [];
            for (const [teamLabel, ballIds] of teams) {
                list.push({ teamLabel, ballIds });
            }
            teamsBySlotIndex.set(slotIndex, list);
        }

        // Every ball in the round must have landed in at least one slot —
        // otherwise the compiler (or seed helper) drifted.
        for (const b of ballRows) {
            if (!ballsSeen.has(b.id)) {
                throw new Error(
                    `ball ${b.id} in round ${roundId} is not assigned to any slot (slot_balls has no row for it)`,
                );
            }
        }

        const slotGroups: SlotGroup[] = round.formatSlots.map((slot) => ({
            slot,
            balls: ballInputsBySlotIndex.get(slot.slotIndex) ?? [],
            // `courseHoles` comes from the round's single course — all slots
            // share it. Multi-slot routing doesn't change the course axis.
            courseHoles: allHoles,
            teams: teamsBySlotIndex.get(slot.slotIndex),
        }));

        const lb = computeLeaderboard({ slotGroups });

        // Trim per-hole rows to the played set so consumers see a clean 9-hole
        // (or 18-hole) view. Totals computed by the strategy already exclude
        // null-gross holes, so they are unaffected by this trim.
        return {
            ...lb,
            ballResults: lb.ballResults.map((r) => ({
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
