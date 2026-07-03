// Phase 2.6b-final / Slice 1 — test-only canary format plugin + fixtures.
//
// The canary uses a previously-UNKNOWN format id and a HIGH-wins metric. It
// proves the plugin contract is expressive enough to add a brand-new format
// that registers, lists in the catalog, plans setup, compiles through the
// existing RoundCompiler, scores, and ranks — WITHOUT editing any
// infrastructure map (no FORMAT_ID_DECOMPOSITION entry, no directionByType
// entry, no client catalog row).
//
// `_`-prefixed + never imported by a production index, so it stays out of
// the server type-check and is never registered at boot.
//
// `materializeSlot` is a deliberately small, test-only precursor to the
// canonical leaderboard materialiser that Slice 2a builds for real. It turns
// compiler output into the `(RoundContext, SlotBall[])` a plugin's `score()`
// consumes, so the canary can exercise the full plan→compile→score→rank
// chain here without rewiring the production leaderboard.

import type { RoundDefinition } from '../round-definition';
import { deriveFlat, latestScoresByPlayHole } from '../strategies/formats/_shared';
import { defaultGridPresenter } from '../strategies/formats/default-grid.presenter';
import { createRoundContext } from '../strategies/round-context';
import type {
    BallHoleResult,
    BallResult,
    PlayHoleSnapshot,
    RoundContext,
    RoundCourseHoleSnapshot,
    RoundTeeHoleSnapshot,
    SlotBall,
    StrategyResult,
    PerProducerCh,
    ProducerSnapshot,
    TeeSnapshot,
} from '../strategies/types';
import type { CompiledRound, CompilerInput, CompilerTeeContext, Gender } from '../compiler/types';
import type {
    FormatMetric,
    FormatPlugin,
    FormatSetupInput,
    FormatSetupPlan,
} from './plugin';

export const CANARY_FORMAT_ID = 'canary_high_points';

interface CanaryConfig {
    /** Optional per-hole points ceiling. */
    pointsCap?: number;
}

/**
 * Canary scoring: per hole, `max(0, (par + 2) − gross)` — birdie-or-better
 * scores high, bogey scores 0. HIGH wins. Optional `pointsCap` clamps each
 * hole. Pickup (0) → 0 pts; DNP/no-event → null pts.
 */
export const canaryPlugin: FormatPlugin = {
    descriptor: {
        id: CANARY_FORMAT_ID,
        label: 'Canary points',
        labels: { en: 'Canary points' },
        description: 'Test-only high-wins format proving the plugin contract.',
        scoringMode: 'canary_points',
        teamShape: 'individual',
        requirements: {
            balls: { producerCount: { min: 1, max: 1 }, ballMode: 'own', requiresSlotTeamGrouping: false },
            scoreEntry: { strokes: true },
        },
        defaults: { allowanceConfig: { type: 'flat', pct: 100 } },
        metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
        clientAdapterId: null,
    },

    planSetup(input: FormatSetupInput): FormatSetupPlan {
        return {
            ballStrategies: [{ strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
            slot: {
                formatId: CANARY_FORMAT_ID,
                allowanceConfig: input.allowanceConfig ?? this.descriptor.defaults.allowanceConfig,
                formatConfig: input.formatConfig,
            },
        };
    },

    validateConfig(config: unknown) {
        if (config === undefined || config === null) return [];
        if (typeof config !== 'object') {
            return [{ code: 'config_not_object', message: 'formatConfig must be an object', path: 'formatConfig' }];
        }
        const cap = (config as CanaryConfig).pointsCap;
        if (cap !== undefined && (typeof cap !== 'number' || cap < 0)) {
            return [
                {
                    code: 'invalid_points_cap',
                    message: 'pointsCap must be a number ≥ 0',
                    path: 'formatConfig.pointsCap',
                },
            ];
        }
        return [];
    },

    deriveSlotBalls: deriveFlat,

    // Canary is individual point-shaped, so it reuses the shared default-grid
    // presenter rather than owning a bespoke one. `renderResult` is required on
    // every plugin now that the central-builder fallback is gone.
    renderResult: defaultGridPresenter(),

    score({ roundContext, slotBalls, events, formatConfig }): StrategyResult {
        const cap = (formatConfig as CanaryConfig | undefined)?.pointsCap;
        const ballResults: BallResult[] = slotBalls.map((ball) => {
            const scores = latestScoresByPlayHole(events, ball.ballId);
            const holes: BallHoleResult[] = [];
            let total = 0;
            let hasValue = false;
            let holesPlayed = 0;
            for (const occ of roundContext.playHoles) {
                if (!scores.has(occ.playHoleId)) {
                    holes.push({ holeNumber: occ.courseHoleNumber, gross: null, net: null, points: null });
                    continue;
                }
                holesPlayed++;
                const strokes = scores.get(occ.playHoleId) ?? null;
                if (strokes === null) {
                    holes.push({ holeNumber: occ.courseHoleNumber, gross: null, net: null, points: null });
                    continue;
                }
                hasValue = true;
                let points = strokes === 0 ? 0 : Math.max(0, occ.par + 2 - strokes);
                if (cap !== undefined) points = Math.min(points, cap);
                total += points;
                holes.push({
                    holeNumber: occ.courseHoleNumber,
                    gross: strokes === 0 ? null : strokes,
                    net: null,
                    points,
                    note: `${points} pts (par ${occ.par} + 2 − ${strokes})`,
                });
            }
            return {
                ballId: ball.ballId,
                holes,
                totals: [{ scoringType: 'points', value: hasValue ? total : null }],
                holesPlayed,
            };
        });
        return { ballResults };
    },
};

// --- Fixtures + test-only materialiser --------------------------------------

const FIXTURE_TEE_ID = 'tee-yellow';

/** 18 par-4 holes, SI 1..18. */
export function canaryCourseHoles(): RoundCourseHoleSnapshot[] {
    return Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, baseStrokeIndex: i + 1 }));
}

function canaryTeeHoles(): RoundTeeHoleSnapshot[] {
    return Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, lengthM: 350, strokeIndexOverride: null }));
}

/**
 * Assemble a single-format `RoundDefinition` from one plugin's setup plan.
 * Assigns stable def-ids — the throwaway version of Slice 5's builder.
 */
export function buildRoundDefinition(
    plan: FormatSetupPlan,
    setup: FormatSetupInput,
    opts: { courseId: string; playedAt: string },
): RoundDefinition {
    return {
        courseId: opts.courseId,
        playedAt: opts.playedAt,
        producers: setup.producers.map((p) => ({
            id: p.producerDefId,
            playerRef: p.playerRef,
            handicapIndex: p.handicapIndex,
            gender: p.gender,
            teeId: p.teeId,
            category: p.category,
        })),
        ballStrategies: plan.ballStrategies.map((s, i) => ({
            id: `strat-${i}`,
            strategyId: s.strategyId,
            derivationConfig: s.derivationConfig,
            composition: s.composition,
        })),
        slots: [
            {
                id: 'slot-0',
                formatId: plan.slot.formatId,
                allowanceConfig: plan.slot.allowanceConfig,
                ballSelector: plan.slot.ballSelector,
                teamGrouping: plan.slot.teamGrouping,
                formatConfig: plan.slot.formatConfig,
            },
        ],
    };
}

/** A `CompilerInput` for the producers in `definition`, all on one tee. */
export function makeCanaryCompilerInput(roundId: string, definition: RoundDefinition): CompilerInput {
    const ratings = new Map<Gender, { courseRating: number; slope: number; teePar: number }>([
        ['M', { courseRating: 71.2, slope: 130, teePar: 72 }],
        ['F', { courseRating: 73.0, slope: 128, teePar: 72 }],
    ]);
    const tees = new Map<string, CompilerTeeContext>([
        [FIXTURE_TEE_ID, { teeName: 'Yellow', holes: canaryTeeHoles(), ratings }],
    ]);
    const playerProfiles = new Map<string, { displayName: string; gender?: Gender; category?: string }>();
    const guestProfiles = new Map<string, { displayName: string; gender?: Gender; category?: string }>();
    for (const p of definition.producers) {
        const profile = { displayName: `Player ${p.id}`, gender: p.gender, category: p.category };
        if (p.playerRef.kind === 'player') playerProfiles.set(p.playerRef.id, profile);
        else guestProfiles.set(p.playerRef.id, profile);
    }
    return { roundId, definition, courseHoles: canaryCourseHoles(), tees, playerProfiles, guestProfiles };
}

/**
 * Build the `(RoundContext, SlotBall[])` a plugin `score()` needs from
 * compiler output. Test-only precursor to Slice 2a's leaderboard materialiser.
 */
export function materializeSlot(
    input: CompilerInput,
    compiled: CompiledRound,
    slotDefId: string,
): { roundContext: RoundContext; slotBalls: SlotBall[] } {
    const teeHoles = new Map<string, RoundTeeHoleSnapshot[]>();
    for (const [teeId, ctx] of input.tees) teeHoles.set(teeId, ctx.holes);

    const producers = new Map<string, ProducerSnapshot>();
    for (const bp of compiled.ballPlayers) {
        if (producers.has(bp.producerDefId)) continue;
        const tee: TeeSnapshot = {
            teeId: bp.teeId,
            teeName: bp.teeNameSnapshot,
            courseRating: bp.courseRatingSnapshot,
            slope: bp.slopeSnapshot,
            teePar: bp.teeParSnapshot,
        };
        producers.set(bp.producerDefId, {
            producerDefId: bp.producerDefId,
            playerRef: bp.playerId
                ? { kind: 'player', id: bp.playerId }
                : { kind: 'guest', id: bp.guestPlayerId! },
            displayName: bp.displayNameSnapshot,
            handicapIndex: bp.handicapIndexSnapshot,
            gender: bp.genderSnapshot ?? undefined,
            tee,
            courseHandicap: bp.courseHandicapSnapshot,
        });
    }

    const orderedCourseHoles = [...input.courseHoles].sort((a, b) => a.holeNumber - b.holeNumber);
    const playHoles: PlayHoleSnapshot[] = orderedCourseHoles.map((h, i) => ({
        playHoleId: `ph-${h.holeNumber}`,
        playHoleDefId: `ph-${h.holeNumber}`,
        ordinal: i + 1,
        courseHoleNumber: h.holeNumber,
        par: h.par,
        baseStrokeIndex: h.baseStrokeIndex,
        tees: [],
    }));

    const roundContext = createRoundContext({
        playHoles,
        allocationCycleSize: input.courseHoles.length,
        producers,
        courseHoles: input.courseHoles,
        teeHoles,
        ballGroupStart: new Map(),
    });

    const slot = compiled.slots.find((s) => s.slotDefId === slotDefId);
    if (!slot) throw new Error(`no compiled slot for slotDefId ${slotDefId}`);
    const ballById = new Map(compiled.balls.map((b) => [b.id, b] as const));
    const slotBalls: SlotBall[] = compiled.slotBalls
        .filter((sb) => sb.slotId === slot.id)
        .map((sb) => {
            const ball = ballById.get(sb.ballId);
            if (!ball) throw new Error(`slotBall references unknown ballId ${sb.ballId}`);
            const perProducer = JSON.parse(ball.perProducerChJson) as PerProducerCh[];
            return {
                ballId: ball.id,
                label: ball.label ?? undefined,
                courseHandicapSnapshot: ball.courseHandicapSnapshot,
                playingHandicapSnapshot: sb.playingHandicapSnapshot,
                producers: perProducer,
            };
        });
    return { roundContext, slotBalls };
}

/** Rank ball results by a metric's declared direction — proves no string guessing. */
export function rankByMetric(ballResults: BallResult[], metric: FormatMetric): BallResult[] {
    const valueOf = (b: BallResult) => b.totals.find((t) => t.scoringType === metric.id)?.value ?? null;
    return [...ballResults].sort((a, b) => {
        const va = valueOf(a);
        const vb = valueOf(b);
        if (va === null && vb === null) return 0;
        if (va === null) return 1;
        if (vb === null) return -1;
        return metric.direction === 'high' ? vb - va : va - vb;
    });
}
