import { sql, type Kysely } from 'kysely';
import type { Database } from '../db/schema';
import type { Round, RoundService } from './round.service';
import type { CourseService } from './course.service';
import {
    materializeRound,
    type MaterializeBallPlayer,
    type RoundLeaderboardInput,
} from '../domain/round-materializer';
import { findFormatPlugin } from '../domain/formats/plugin';
import { buildSlotResult, type ResultColumn } from '../domain/strategies/result-builder';
import type { RoundResult } from '../domain/strategies/result-sections';
import { formatAllowanceLabel, type RoundDefinition } from '../domain/round-definition';
import type { FormatAction, RulingEvent, StrategyEvent } from '../domain/strategies/types';
import { applyRulingsToSlot, rulingEventsOf } from '../domain/strategies/rulings';
import type { CourseHole } from '../domain/round-holes';
import type { RulingKind, RulingTarget } from '../db/schema';

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
 * key. Each plugin's `StrategyResult` is reshaped by the pure `result-builder`
 * into serializable {@link RoundResult} sections — there is no `Leaderboard`
 * adapter (the legacy engine + `forRound()` were deleted in Slice 2c).
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
    ): Promise<{ input: RoundLeaderboardInput; round: Round }> {
        const round = await this.roundService.getById(roundId);
        if (!round) throw new Error(`round ${roundId} not found`);

        const course = await this.courseService.getById(round.courseId);
        if (!course) throw new Error(`course ${round.courseId} not found`);

        // Physical-course reference holes (par + base SI). Scoring iterates the
        // round's explicit itinerary (round.playHoles), NOT this — round_type
        // no longer decides which holes count. Stroke allocation runs over the
        // frozen allocation cycle, not the itinerary length.
        const allHoles: CourseHole[] = course.holes.map((h) => ({
            holeNumber: h.holeNumber,
            par: h.par,
            strokeIndex: h.strokeIndex,
        }));

        // --- format_id + format_config per slot_def_id, from the definition. ---

        const formatBySlotDef = await this.formatBySlotDef(roundId);

        // --- Compiler tables. ---

        const slotRows = await this.db
            .selectFrom('slots')
            .where('round_id', '=', roundId)
            // Presentation order comes from the persisted ordinal — slot_def_id
            // stays opaque (E3), never parsed for a `slot-<N>` index.
            .orderBy('ordinal')
            .select(['id', 'slot_def_id', 'ordinal'])
            .execute();

        if (slotRows.length === 0) {
            throw new Error(`round ${roundId} has no compiled slots`);
        }

        const slots = slotRows.map((s) => {
            const fmt = formatBySlotDef.get(s.slot_def_id);
            if (!fmt) {
                throw new Error(
                    `round ${roundId}: slot_def_id '${s.slot_def_id}' is not present in the round definition`,
                );
            }
            return {
                slotId: s.id,
                slotDefId: s.slot_def_id,
                slotIndex: s.ordinal,
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

        // A ball no slot consumes is simply UNSCORED — a player can be on the
        // roster without being in any format (e.g. a match between 2 of 3). The
        // engine is permissive: it scores only what the formats reference and
        // drops the spare ball from the input, rather than failing. (It is never
        // silently created by the canonical fixtures, so those are unaffected.)
        const ballsSeen = new Set(slotBallRows.map((r) => r.ball_id));
        const usedBallRows = ballRows.filter((b) => ballsSeen.has(b.id));
        const usedBallIds = new Set(usedBallRows.map((b) => b.id));

        const events = await this.strategyEvents(roundId);
        const formatActions = await this.formatActions(roundId);

        const ballPlayers: MaterializeBallPlayer[] = ballPlayerRows
            .filter((r) => usedBallIds.has(r.ball_id))
            .map((r) => ({
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
            playHoles: round.playHoles.map((p) => ({
                playHoleId: p.id,
                playHoleDefId: p.playHoleDefId,
                ordinal: p.ordinal,
                courseHoleNumber: p.courseHoleNumber,
                par: p.par,
                baseStrokeIndex: p.baseStrokeIndex,
                tees: p.tees.map((t) => ({
                    teeId: t.teeRef,
                    lengthM: t.lengthM,
                    // `t.strokeIndex` is the EFFECTIVE per-tee occurrence SI
                    // (round.service already resolved the override against the
                    // occurrence base). createRoundContext does
                    // `strokeIndexOverride ?? baseStrokeIndex`, so passing the
                    // effective value preserves a per-tee override and is a
                    // no-op when there is none. Must not be null — that drops
                    // every per-occurrence SI override (E2a regression).
                    strokeIndexOverride: t.strokeIndex,
                })),
            })),
            allocationCycleSize: round.routeSi.allocationCycleSize,
            playingGroups: round.playingGroups.map((g) => ({
                startPlayHoleId: g.startPlayHoleId,
                ballIds: g.ballIds.filter((id) => usedBallIds.has(id)),
            })),
            ballPlayers,
            balls: usedBallRows.map((b) => ({
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
            formatActions,
        };

        return { input, round };
    }

    /**
     * Canonical per-slot result for generic consumers (static render, and the
     * mobile client in 2.6e). Each slot is scored through its registered
     * plugin and reshaped — by the pure `result-builder` — into serializable
     * sections: scorecard grids + ranked metrics + match summaries. No legacy
     * `Leaderboard` adapter, no format-id branching downstream.
     */
    async resultForRound(roundId: string): Promise<RoundResult> {
        const { input, round } = await this.buildInput(roundId);
        const materialized = materializeRound(input);
        const rc = materialized.roundContext;

        // Scorecard columns = the explicit itinerary occurrences in canonical
        // ordinal order, each carrying its occurrence label (so repeated holes
        // render as `3 (1st)` / `3 (2nd)`). No round_type, no 1–9/10–18.
        const columns: ResultColumn[] = rc.playHoles.map((p) => ({
            playHoleId: p.playHoleId,
            courseHoleNumber: p.courseHoleNumber,
            canonicalOrdinal: p.ordinal,
            occurrenceLabel: rc.occurrenceLabel(p.playHoleId),
            par: p.par,
            baseStrokeIndex: p.baseStrokeIndex,
        }));

        const allowanceLabelBySlot = new Map(
            round.formatSlots.map(
                (s) => [s.slotIndex, formatAllowanceLabel(s.allowanceConfig)] as const,
            ),
        );

        const rulings = rulingEventsOf(materialized.events);

        const slots = materialized.slots.map((slot) => {
            const plugin = findFormatPlugin(slot.formatId);
            const scored = plugin.score({
                roundContext: rc,
                slotBalls: slot.slotBalls,
                slotTeamGroupings: slot.slotTeamGroupings,
                events: materialized.events,
                formatConfig: slot.formatConfig,
                formatActions: slot.formatActions,
            });
            // Competitive rulings are a generic scoring-layer adjustment on the
            // structured result — never a format-id branch, never a re-derivation.
            const { result } = applyRulingsToSlot(scored, rulings, slot.slotDefId);
            const allowanceLabel = allowanceLabelBySlot.get(slot.slotIndex) ?? '—';
            // Per-ball effective SI for single-producer (own-ball) cards: shows
            // each ball the SI its OWN tee allocates against, so the displayed SI
            // row matches the per-tee strokes-given/net on mixed-tee rounds.
            // Multi-producer (team/pair) balls are skipped → those cards keep the
            // occurrence base SI.
            const effectiveSi = new Map<string, Map<string, number>>();
            for (const sb of slot.slotBalls) {
                if (sb.producers.length !== 1) continue;
                const producerDefId = sb.producers[0]!.producerDefId;
                const byHole = new Map<string, number>();
                for (const col of columns) {
                    byHole.set(col.playHoleId, rc.effectiveStrokeIndexForPlayHole(producerDefId, col.playHoleId));
                }
                effectiveSi.set(sb.ballId, byHole);
            }
            return buildSlotResult({
                slotIndex: slot.slotIndex,
                slotDefId: slot.slotDefId,
                formatId: slot.formatId,
                formatLabel: plugin.descriptor.label,
                scoringMode: plugin.descriptor.scoringMode,
                teamShape: plugin.descriptor.teamShape,
                allowanceLabel,
                metrics: plugin.descriptor.metrics,
                runningNormalized: plugin.descriptor.resultDisplay?.runningTotals === 'normalized',
                result,
                slotBalls: slot.slotBalls,
                slotTeamGroupings: slot.slotTeamGroupings,
                columns,
                effectiveSi,
            });
        });

        return {
            slots,
            routeSections: round.routeSections.map((s) => ({
                id: s.id,
                label: s.label,
                fromCanonicalOrdinal: s.fromCanonicalOrdinal,
                toCanonicalOrdinal: s.toCanonicalOrdinal,
            })),
            posting: {
                eligible: round.routeHandicapPolicy.postingEligible,
                reason: round.routeHandicapPolicy.postingIneligibleReason,
            },
        };
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

    /** Load the append-only format-action log (supersession resolved downstream). */
    private async formatActions(roundId: string): Promise<FormatAction[]> {
        const rows = await this.db
            .selectFrom('format_action_events')
            .where('round_id', '=', roundId)
            .orderBy('recorded_at')
            .orderBy('id')
            .select([
                'id',
                'slot_def_id',
                'play_hole_id',
                'sequence',
                'action_type',
                'schema_version',
                'subject_ball_id',
                'subject_producer_def_id',
                'payload',
                'supersedes_action_id',
                'recorded_by_player_id',
                'recorded_at',
            ])
            .execute();
        return rows.map((r) => ({
            id: r.id,
            slotDefId: r.slot_def_id,
            playHoleId: r.play_hole_id,
            sequence: r.sequence,
            actionType: r.action_type,
            schemaVersion: r.schema_version,
            subjectBallId: r.subject_ball_id,
            subjectProducerDefId: r.subject_producer_def_id,
            payload: JSON.parse(r.payload),
            supersedesActionId: r.supersedes_action_id,
            recordedBy: r.recorded_by_player_id ?? '',
            recordedAt: r.recorded_at,
        }));
    }

    /** Replay the event log into the strategy event union (latest-wins inside score()). */
    private async strategyEvents(roundId: string): Promise<StrategyEvent[]> {
        const rows = await this.db
            .selectFrom('score_events')
            .where('round_id', '=', roundId)
            // seq = the persisted total order (migration 030). Latest-wins inside
            // score() then resolves to the highest-seq event per (ball, occurrence),
            // matching the scorecard trigger — never wall-clock recorded_at.
            .orderBy('seq')
            .select([
                'round_id',
                'ball_id',
                'play_hole_id',
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
                playHoleId: r.play_hole_id,
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
                            playHoleId: r.play_hole_id,
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

        // Competitive rulings join the strategy event stream — read by the
        // scoring-layer adjustment (`applyRulingsToSlot`), never re-derived.
        const rulingRows = await this.db
            .selectFrom('ruling_events')
            .where('round_id', '=', roundId)
            .orderBy('recorded_at')
            .orderBy('id')
            .select(['round_id', 'target', 'target_id', 'ruling_kind', 'value', 'reason', 'recorded_by_player_id', 'recorded_at'])
            .execute();
        for (const r of rulingRows) {
            const ev: RulingEvent = {
                kind: 'ruling',
                roundId: r.round_id,
                target: r.target as RulingTarget,
                targetId: r.target_id,
                rulingKind: r.ruling_kind as RulingKind,
                value: JSON.parse(r.value),
                reason: r.reason,
                recordedBy: r.recorded_by_player_id ?? '',
                recordedAt: r.recorded_at,
            };
            events.push(ev);
        }
        return events;
    }
}
