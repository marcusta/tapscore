// Phase 2.6d — STATEFUL canary format plugin (test-only).
//
// Proves the §17 stateful format-action seam end-to-end WITHOUT any
// infrastructure edit: a brand-new format that declares its own in-round action
// types, validates their payloads, and replays the validated + supersession-
// resolved actions inside `score()` into a structured result. It exercises the
// three stateful shapes Wolf / scramble-selection / Bingo-Bango-Bongo need:
//
//   - rotating role        `set_captain`   — a captain that changes per hole
//   - per-hole partner      `choose_partner` — partner picked for that hole
//   - ordered in-hole call  `call_it`        — last call (by sequence) binds
//
// `_`-prefixed + `.testkit.` so it is excluded from the server type-check and
// the architecture ratchet, and is never registered at production boot. The
// seed/verify scripts + its unit test register it explicitly (idempotently).
//
// Scoring (deterministic): per occurrence, the captain's SIDE = {captain ball,
// chosen partner ball}. The side calls 'low' (combined gross ≤ 2×par) or 'high'
// (>). A correct call scores 1 point to each side member that hole; the side's
// total is its members' summed points.

import { hasFormatPlugin, registerFormat, type FormatPlugin } from './plugin';
import { deriveFlat, holeIdentity, latestScoresByPlayHole } from '../strategies/formats/_shared';
import type { BallHoleResult, BallResult, StrategyResult } from '../strategies/types';

export const STATEFUL_CANARY_FORMAT_ID = 'stateful_canary';

interface ProducerPayload {
    producerDefId: string;
}
interface CallPayload {
    call: 'low' | 'high';
}

export const statefulCanaryPlugin: FormatPlugin = {
    descriptor: {
        id: STATEFUL_CANARY_FORMAT_ID,
        label: 'Stateful canary',
        description: 'Test-only format proving the stateful format-action seam (rotating role + per-hole partner + ordered call).',
        scoringMode: 'custom',
        teamShape: 'individual',
        requirements: {
            balls: { producerCount: { min: 1, max: 1 }, ballMode: 'own', requiresSlotTeamGrouping: false },
            scoreEntry: { strokes: true },
        },
        defaults: { allowanceConfig: { type: 'flat', pct: 100 } },
        metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
        clientAdapterId: null,
    },

    planSetup(input) {
        return {
            ballStrategies: [{ strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
            slot: {
                formatId: STATEFUL_CANARY_FORMAT_ID,
                allowanceConfig: input.allowanceConfig ?? this.descriptor.defaults.allowanceConfig,
                formatConfig: input.formatConfig,
            },
        };
    },

    validateConfig() {
        return [];
    },

    deriveSlotBalls: deriveFlat,

    actionTypes: [
        { type: 'set_captain', label: 'Set captain', requiresPlayHole: true },
        { type: 'choose_partner', label: 'Choose partner', requiresPlayHole: true },
        { type: 'call_it', label: 'Call high/low', requiresPlayHole: true },
    ],

    validateAction(action) {
        if (action.actionType === 'call_it') {
            const c = (action.payload as CallPayload | null)?.call;
            if (c !== 'low' && c !== 'high') {
                return [{ code: 'invalid_call', message: "call must be 'low' or 'high'", path: 'payload.call' }];
            }
            return [];
        }
        // set_captain / choose_partner
        const pid = (action.payload as ProducerPayload | null)?.producerDefId;
        if (typeof pid !== 'string' || pid.length === 0) {
            return [
                { code: 'missing_producer', message: 'payload.producerDefId is required', path: 'payload.producerDefId' },
            ];
        }
        return [];
    },

    score({ roundContext, slotBalls, events, formatActions }): StrategyResult {
        const actions = formatActions ?? [];
        // ballId for a producer's own-ball.
        const ballByProducer = new Map<string, string>();
        for (const b of slotBalls) {
            for (const p of b.producers) ballByProducer.set(p.producerDefId, b.ballId);
        }
        const scoresByBall = new Map(slotBalls.map((b) => [b.ballId, latestScoresByPlayHole(events, b.ballId)] as const));

        // Per occurrence: resolve captain, partner, final call from the replayed
        // (supersession-resolved, sequence-ordered) actions for that hole.
        interface HoleState {
            captain?: string;
            partner?: string;
            call?: 'low' | 'high';
        }
        const stateByHole = new Map<string, HoleState>();
        for (const a of actions) {
            if (!a.playHoleId) continue;
            const st = stateByHole.get(a.playHoleId) ?? {};
            if (a.actionType === 'set_captain') st.captain = (a.payload as ProducerPayload).producerDefId;
            else if (a.actionType === 'choose_partner') st.partner = (a.payload as ProducerPayload).producerDefId;
            else if (a.actionType === 'call_it') st.call = (a.payload as CallPayload).call; // ordered → last wins
            stateByHole.set(a.playHoleId, st);
        }

        // Points per (ballId, playHoleId).
        const pointsByBallHole = new Map<string, Map<string, number>>();
        const noteByBallHole = new Map<string, Map<string, string>>();
        const sideOf = (st: HoleState) => {
            const ids: string[] = [];
            if (st.captain && ballByProducer.has(st.captain)) ids.push(ballByProducer.get(st.captain)!);
            if (st.partner && ballByProducer.has(st.partner)) ids.push(ballByProducer.get(st.partner)!);
            return ids;
        };
        for (const occ of roundContext.playHoles) {
            const st = stateByHole.get(occ.playHoleId);
            if (!st || !st.captain || !st.partner || !st.call) continue;
            const side = sideOf(st);
            let combined = 0;
            let complete = true;
            for (const bid of side) {
                const g = scoresByBall.get(bid)?.get(occ.playHoleId);
                if (g === undefined || g === null || g === 0) complete = false;
                else combined += g;
            }
            if (!complete || side.length < 2) continue;
            const isLow = combined <= occ.par * 2;
            const correct = (st.call === 'low' && isLow) || (st.call === 'high' && !isLow);
            const pts = correct ? 1 : 0;
            for (const bid of side) {
                const pm = pointsByBallHole.get(bid) ?? new Map<string, number>();
                pm.set(occ.playHoleId, pts);
                pointsByBallHole.set(bid, pm);
                const nm = noteByBallHole.get(bid) ?? new Map<string, string>();
                nm.set(
                    occ.playHoleId,
                    `capt ${st.captain} + ${st.partner}, called ${st.call}, side ${combined} vs ${occ.par * 2} → ${correct ? 'won' : 'lost'}`,
                );
                noteByBallHole.set(bid, nm);
            }
        }

        const ballResults: BallResult[] = slotBalls.map((ball) => {
            const pm = pointsByBallHole.get(ball.ballId);
            const nm = noteByBallHole.get(ball.ballId);
            let total = 0;
            let any = false;
            const holes: BallHoleResult[] = roundContext.playHoles.map((occ) => {
                const pts = pm?.get(occ.playHoleId);
                if (pts === undefined) {
                    return { ...holeIdentity(roundContext, ball.ballId, occ), gross: null, net: null, points: null };
                }
                any = true;
                total += pts;
                return {
                    ...holeIdentity(roundContext, ball.ballId, occ),
                    gross: scoresByBall.get(ball.ballId)?.get(occ.playHoleId) ?? null,
                    net: null,
                    points: pts,
                    note: nm?.get(occ.playHoleId),
                };
            });
            return {
                ballId: ball.ballId,
                holes,
                totals: [{ scoringType: 'points', value: any ? total : null }],
                holesPlayed: holes.filter((h) => h.points !== null).length,
            };
        });
        return { ballResults };
    },
};

/** Register the stateful canary once (idempotent) — for seeds, render, tests. */
export function registerStatefulCanary(): void {
    if (!hasFormatPlugin(STATEFUL_CANARY_FORMAT_ID)) registerFormat(statefulCanaryPlugin);
}
