import { sql, type Kysely } from 'kysely';
import type { Database } from '../db/schema';
import type { Round, RoundService } from './round.service';
import type { CourseService } from './course.service';
import type { Leaderboard } from '../domain/leaderboard';
import {
    materializeRound,
    scoreRound,
    type MaterializeBallPlayer,
    type RoundLeaderboardInput,
} from '../domain/leaderboard-engine';
import { findFormatPlugin } from '../domain/formats/plugin';
import { buildSlotResult } from '../domain/strategies/result-builder';
import type { RoundResult } from '../domain/strategies/result-sections';
import type { RoundDefinition } from '../domain/round-definition';
import type { StrategyEvent } from '../domain/strategies/types';
import { courseHolesForRound } from '../domain/round-holes';
import type { CourseHole } from '../domain/format';

/**
 * Materialises the inputs to the canonical scoring engine — round-context
 * snapshots, ordered slot balls, team groupings, format config, and strategy
 * events — straight off the compiler tables (`slots` / `slot_balls` /
 * `slot_ball_teams` / `balls` / `ball_players`) and the `score_events` log,
 * then resolves each slot's registered plugin by `format_id` and scores it.
 *
 * `format_id` is recovered from the latest `round_definitions` version keyed
 * by the stable `slot_def_id` — never from slot array position. The legacy
 * `(scoring_mode, team_shape)` columns on `slots` are not used as a lookup
 * key. The engine adapts each plugin's `StrategyResult` back to the
 * `Leaderboard` shape the static renderer + mobile still consume.
 *
 * Hard errors (before scoring) if:
 *   a) round has no compiled slots;
 *   b) a ball exists under the round but lands in zero slots;
 *   c) a compiled slot's `slot_def_id` is absent from the round definition.
 */
export class LeaderboardService {
    constructor(
        private db: Kysely<Database>,
        private roundService: RoundService,
        private courseService: CourseService,
    ) {}

    private async buildInput(
        roundId: string,
    ): Promise<{ input: RoundLeaderboardInput; round: Round; playedSet: Set<number> }> {
        const round = await this.roundService.getById(roundId);
        if (!round) throw new Error(`round ${roundId} not found`);

        const course = await this.courseService.getById(round.courseId);
        if (!course) throw new Error(`course ${round.courseId} not found`);

        // Full course holes — stroke allocation runs against the course's FULL
        // SI distribution (WHS: a 9-hole round keeps whichever of the full-
        // course strokes land on the played holes). We score over all holes
        // and trim the per-hole rows to the played set afterwards.
        const allHoles: CourseHole[] = course.holes.map((h) => ({
            holeNumber: h.holeNumber,
            par: h.par,
            strokeIndex: h.strokeIndex,
        }));
        const playedSet = new Set(
            courseHolesForRound(round.roundType, allHoles).map((h) => h.holeNumber),
        );

        // --- format_id + format_config per slot_def_id, from the definition. ---

        const formatBySlotDef = await this.formatBySlotDef(roundId);

        // --- Compiler tables. ---

        const slotRows = await this.db
            .selectFrom('slots')
            .where('round_id', '=', roundId)
            .select(['id', 'slot_def_id'])
            .execute();

        if (slotRows.length === 0) {
            throw new Error(`round ${roundId} has no compiled slots`);
        }

        const slots = slotRows.map((s) => {
            // Parse the presentation key first so a corrupt slot_def_id surfaces
            // as a parse error (drift check) before the definition lookup.
            const slotIndex = parseSlotIndex(roundId, s.slot_def_id);
            const fmt = formatBySlotDef.get(s.slot_def_id);
            if (!fmt) {
                throw new Error(
                    `round ${roundId}: slot_def_id '${s.slot_def_id}' is not present in the round definition`,
                );
            }
            return {
                slotId: s.id,
                slotDefId: s.slot_def_id,
                slotIndex,
                formatId: fmt.formatId,
                formatConfig: fmt.formatConfig,
            };
        });

        const ballRows = await this.db
            .selectFrom('balls')
            .where('round_id', '=', roundId)
            .select(['id', 'label', 'course_handicap_snapshot', 'per_producer_ch'])
            .execute();

        const ballPlayerRows = await this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            // Insertion order == per-producer CH order; the engine relies on it
            // as the fallback when a ball carries no audit JSON.
            .orderBy(sql`bp.rowid`)
            .select([
                'bp.ball_id',
                'bp.producer_def_id',
                'bp.player_id',
                'bp.guest_player_id',
                'bp.display_name_snapshot',
                'bp.handicap_index_snapshot',
                'bp.category_snapshot',
                'bp.gender_snapshot',
                'bp.tee_id',
                'bp.tee_name_snapshot',
                'bp.course_rating_snapshot',
                'bp.slope_snapshot',
                'bp.tee_par_snapshot',
                'bp.course_handicap_snapshot',
            ])
            .execute();

        const slotBallRows = await this.db
            .selectFrom('slot_balls as sb')
            .innerJoin('slots as s', 's.id', 'sb.slot_id')
            .where('s.round_id', '=', roundId)
            // rowid == compiler insertion order == the ball-order contract
            // (match-play pairs in order, etc.).
            .orderBy(sql`sb.rowid`)
            .select(['sb.slot_id', 'sb.ball_id', 'sb.playing_handicap_snapshot'])
            .execute();

        const slotBallTeamRows = await this.db
            .selectFrom('slot_ball_teams as sbt')
            .innerJoin('slots as s', 's.id', 'sbt.slot_id')
            .where('s.round_id', '=', roundId)
            .orderBy(sql`sbt.rowid`)
            .select(['sbt.slot_id', 'sbt.team_label', 'sbt.ball_id'])
            .execute();

        // Every ball must land in at least one slot — otherwise the compiler
        // (or a seed helper) drifted.
        const ballsSeen = new Set(slotBallRows.map((r) => r.ball_id));
        for (const b of ballRows) {
            if (!ballsSeen.has(b.id)) {
                throw new Error(
                    `ball ${b.id} in round ${roundId} is not assigned to any slot (slot_balls has no row for it)`,
                );
            }
        }

        const events = await this.strategyEvents(roundId);

        const ballPlayers: MaterializeBallPlayer[] = ballPlayerRows.map((r) => ({
            ballId: r.ball_id,
            producerDefId: r.producer_def_id,
            playerId: r.player_id,
            guestPlayerId: r.guest_player_id,
            displayName: r.display_name_snapshot,
            handicapIndex: r.handicap_index_snapshot,
            category: r.category_snapshot,
            gender: r.gender_snapshot,
            teeId: r.tee_id,
            teeName: r.tee_name_snapshot,
            courseRating: r.course_rating_snapshot,
            slope: r.slope_snapshot,
            teePar: r.tee_par_snapshot,
            courseHandicap: r.course_handicap_snapshot,
        }));

        const input: RoundLeaderboardInput = {
            courseHoles: allHoles.map((h) => ({
                holeNumber: h.holeNumber,
                par: h.par,
                baseStrokeIndex: h.strokeIndex,
            })),
            ballPlayers,
            balls: ballRows.map((b) => ({
                id: b.id,
                label: b.label,
                courseHandicapSnapshot: b.course_handicap_snapshot,
                perProducerChJson: b.per_producer_ch,
            })),
            slots,
            slotBalls: slotBallRows.map((r) => ({
                slotId: r.slot_id,
                ballId: r.ball_id,
                playingHandicapSnapshot: r.playing_handicap_snapshot,
            })),
            slotBallTeams: slotBallTeamRows.map((r) => ({
                slotId: r.slot_id,
                teamLabel: r.team_label,
                ballId: r.ball_id,
            })),
            events,
        };

        return { input, round, playedSet };
    }

    /**
     * Legacy `Leaderboard` shape — still consumed by the round API + mobile
     * (`src/`) until 2.6e. Built through the canonical plugin engine, then
     * adapted back to the legacy types in `leaderboard-engine.ts`. The static
     * renderer no longer calls this; it uses {@link resultForRound}.
     */
    async forRound(roundId: string): Promise<Leaderboard> {
        const { input, playedSet } = await this.buildInput(roundId);
        const lb = scoreRound(materializeRound(input), findFormatPlugin);

        // Trim per-hole rows to the played set so consumers see a clean 9-hole
        // (or 18-hole) view. Totals already exclude null-gross holes.
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

    /**
     * Canonical per-slot result for generic consumers (static render, and the
     * mobile client in 2.6e). Each slot is scored through its registered
     * plugin and reshaped — by the pure `result-builder` — into serializable
     * sections: scorecard grids + ranked metrics + match summaries. No legacy
     * `Leaderboard` adapter, no format-id branching downstream.
     */
    async resultForRound(roundId: string): Promise<RoundResult> {
        const { input, round, playedSet } = await this.buildInput(roundId);
        const materialized = materializeRound(input);
        const playedHoles = materialized.roundContext.courseHoles
            .filter((h) => playedSet.has(h.holeNumber))
            .sort((a, b) => a.holeNumber - b.holeNumber);
        const allowanceBySlot = new Map(
            round.formatSlots.map((s) => [s.slotIndex, s.allowancePct] as const),
        );

        const slots = materialized.slots.map((slot) => {
            const plugin = findFormatPlugin(slot.formatId);
            const result = plugin.score({
                roundContext: materialized.roundContext,
                slotBalls: slot.slotBalls,
                slotTeamGroupings: slot.slotTeamGroupings,
                events: materialized.events,
                formatConfig: slot.formatConfig,
            });
            const pct = allowanceBySlot.get(slot.slotIndex);
            return buildSlotResult({
                slotIndex: slot.slotIndex,
                slotDefId: slot.slotDefId,
                formatId: slot.formatId,
                formatLabel: plugin.descriptor.label,
                scoringMode: plugin.descriptor.scoringMode,
                teamShape: plugin.descriptor.teamShape,
                allowanceLabel: pct === undefined ? '—' : `${pct}%`,
                metrics: plugin.descriptor.metrics,
                runningNormalized: plugin.descriptor.resultDisplay?.runningTotals === 'normalized',
                result,
                slotBalls: slot.slotBalls,
                slotTeamGroupings: slot.slotTeamGroupings,
                courseHoles: playedHoles,
            });
        });

        return { slots };
    }

    /** Latest `round_definitions` version → `slot_def_id` → format id + config. */
    private async formatBySlotDef(
        roundId: string,
    ): Promise<Map<string, { formatId: string; formatConfig: unknown }>> {
        const row = await this.db
            .selectFrom('round_definitions')
            .where('round_id', '=', roundId)
            .where('superseded_by_version', 'is', null)
            .select(['definition_json'])
            .executeTakeFirst();

        const out = new Map<string, { formatId: string; formatConfig: unknown }>();
        if (!row) return out;
        const def = JSON.parse(row.definition_json) as RoundDefinition;
        for (const slot of def.slots) {
            out.set(slot.id, { formatId: slot.formatId, formatConfig: slot.formatConfig });
        }
        return out;
    }

    /** Replay the event log into the strategy event union (latest-wins inside score()). */
    private async strategyEvents(roundId: string): Promise<StrategyEvent[]> {
        const rows = await this.db
            .selectFrom('score_events')
            .where('round_id', '=', roundId)
            .orderBy('recorded_at')
            .orderBy('id')
            .select([
                'round_id',
                'ball_id',
                'hole',
                'strokes',
                'recorded_by_player_id',
                'recorded_at',
                'client_event_id',
                'source_player_id',
                'source_guest_player_id',
                'metadata',
            ])
            .execute();

        const events: StrategyEvent[] = [];
        for (const r of rows) {
            events.push({
                kind: 'score',
                roundId: r.round_id,
                ballId: r.ball_id,
                hole: r.hole,
                strokes: r.strokes,
                clientEventId: r.client_event_id,
                recordedBy: r.recorded_by_player_id ?? '',
                recordedAt: r.recorded_at,
            });
            if (r.metadata) {
                const blob = JSON.parse(r.metadata) as Record<string, unknown> | null;
                if (blob && typeof blob === 'object') {
                    for (const [type, value] of Object.entries(blob)) {
                        events.push({
                            kind: 'metadata',
                            roundId: r.round_id,
                            ballId: r.ball_id,
                            hole: r.hole,
                            producerPlayerId: r.source_player_id,
                            producerGuestPlayerId: r.source_guest_player_id,
                            type,
                            value,
                            clientEventId: r.client_event_id,
                            recordedBy: r.recorded_by_player_id ?? '',
                            recordedAt: r.recorded_at,
                        });
                    }
                }
            }
        }
        return events;
    }
}

/** `slot-${N}` → N. The legacy presentation key; identity comes from format_id. */
function parseSlotIndex(roundId: string, slotDefId: string): number {
    const m = /^slot-(\d+)$/.exec(slotDefId);
    if (!m) {
        throw new Error(
            `round ${roundId}: cannot parse slot_def_id '${slotDefId}' — expected 'slot-<N>'`,
        );
    }
    return Number.parseInt(m[1]!, 10);
}
