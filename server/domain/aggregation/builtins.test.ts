// Phase 4 Slice 3 — built-in aggregation strategies, tested PURE.
//
// Hand-built RoundResults with known ranked totals; every expectation is
// hand-computed arithmetic. No DB, no engine — exactly the seam the ledger
// fixes: `aggregate({ roundResults, roster, config }) → CompetitionResultView`.

import { describe, expect, test } from 'bun:test';
import type { RankedEntry, RoundResult, SlotResultView } from '../strategies/result-sections';
import {
    BEST_N_OF_M_ID,
    BUILTIN_AGGREGATION_STRATEGIES,
    DEFAULT_AGGREGATION,
    ROUND_POINTS_SUM_ID,
    STROKE_TOTAL_ID,
} from './builtins';
import type {
    AggregateInput,
    AggregationParticipant,
    AggregationRoundInput,
    AggregationStrategy,
    IdentityRef,
} from './strategy';

function strategy(id: string): AggregationStrategy {
    const found = BUILTIN_AGGREGATION_STRATEGIES.find((s) => s.descriptor.id === id);
    if (!found) throw new Error(`no built-in '${id}'`);
    return found;
}

// --- Fixture builders ------------------------------------------------------------

function rankedSlot(metricId: string, entries: Array<{ ballIds: string[]; total: number | null }>): SlotResultView {
    const ranked: RankedEntry[] = entries.map((e, i) => ({
        ballIds: e.ballIds,
        total: e.total,
        holesPlayed: 18,
        position: i + 1,
    }));
    return {
        slotIndex: 0,
        slotDefId: 'slot-1',
        formatId: 'test_format',
        formatLabel: 'Test format',
        scoringMode: 'test',
        teamShape: 'individual',
        allowanceLabel: '—',
        cards: [],
        leaderboard: [{ kind: 'ranked', metricId, metricLabel: metricId, entries: ranked }],
    };
}

function roundResult(slots: SlotResultView[]): RoundResult {
    return { slots, routeSections: [], posting: { eligible: false, reason: null } };
}

function player(id: string): IdentityRef {
    return { kind: 'player', id };
}
function guest(id: string): IdentityRef {
    return { kind: 'guest', id };
}

/** One round: `values` maps ballId → metric total; `refs` maps ballId → identities. */
function round(
    roundNumber: number,
    metricId: string,
    values: Record<string, number | null>,
    refs: Record<string, IdentityRef[]>,
    opts: { postCut?: boolean } = {},
): AggregationRoundInput {
    return {
        roundNumber,
        cutEligible: true,
        postCut: opts.postCut ?? false,
        result: roundResult([
            rankedSlot(
                metricId,
                Object.entries(values).map(([ballId, total]) => ({ ballIds: [ballId], total })),
            ),
        ]),
        ballRefs: refs,
    };
}

function participant(
    participantId: string,
    playerRef: IdentityRef,
    opts: Partial<Omit<AggregationParticipant, 'participantId' | 'playerRef'>> = {},
): AggregationParticipant {
    return {
        participantId,
        playerRef,
        displayName: opts.displayName ?? participantId,
        category: opts.category ?? null,
        withdrawn: opts.withdrawn ?? false,
        cutAfterRound: opts.cutAfterRound ?? null,
    };
}

function entryOf(view: ReturnType<AggregationStrategy['aggregate']>, participantId: string) {
    const entry = view.entries.find((e) => e.participantId === participantId);
    if (!entry) throw new Error(`entry '${participantId}' not in view`);
    return entry;
}

// --- stroke_total -------------------------------------------------------------------

describe('stroke_total', () => {
    // Anna (player) R1 74 + R2 70 = 144; Greg (guest) R1 71 + R2 76 = 147.
    const input: AggregateInput = {
        roundResults: [
            round(1, 'gross', { a1: 74, g1: 71 }, { a1: [player('anna')], g1: [guest('greg')] }),
            round(2, 'gross', { a2: 70, g2: 76 }, { a2: [player('anna')], g2: [guest('greg')] }),
        ],
        roster: [participant('P-anna', player('anna')), participant('P-greg', guest('greg'))],
        config: {},
    };

    test('sums gross across rounds, lowest wins, guest joined via identity ref', () => {
        const view = strategy(STROKE_TOTAL_ID).aggregate(input);
        expect(view.kind).toBe('competition_ranked');
        expect(view.metricId).toBe('gross');
        expect(view.direction).toBe('low');
        expect(view.operator).toEqual({ kind: 'sum' });
        expect(view.rounds).toEqual([
            { roundNumber: 1, postCut: false },
            { roundNumber: 2, postCut: false },
        ]);

        // Anna 144 beats Greg 147 (lowest wins).
        expect(view.entries.map((e) => [e.participantId, e.total, e.position])).toEqual([
            ['P-anna', 144, 1],
            ['P-greg', 147, 2],
        ]);
    });

    test('every entry carries exact per-round arithmetic (R1 74 + R2 70 = 144)', () => {
        const view = strategy(STROKE_TOTAL_ID).aggregate(input);
        const anna = entryOf(view, 'P-anna');
        expect(anna.rounds).toEqual([
            { roundNumber: 1, value: 74, included: true, status: 'counted' },
            { roundNumber: 2, value: 70, included: true, status: 'counted' },
        ]);
        expect(anna.total).toBe(144);
        expect(anna.roundsCounted).toBe(2);
        expect(anna.incomplete).toBe(false);
        expect(anna.withdrawn).toBe(false);
        expect(anna.playerRef).toEqual({ kind: 'player', id: 'anna' });
    });

    test('config metric net reads the net sections instead', () => {
        const netInput: AggregateInput = {
            roundResults: [round(1, 'net', { a1: 68 }, { a1: [player('anna')] })],
            roster: [participant('P-anna', player('anna'))],
            config: { metric: 'net' },
        };
        const view = strategy(STROKE_TOTAL_ID).aggregate(netInput);
        expect(view.metricId).toBe('net');
        expect(entryOf(view, 'P-anna').total).toBe(68);
    });

    test('the exported default aggregation is stroke_total gross', () => {
        expect(DEFAULT_AGGREGATION.strategyId).toBe(STROKE_TOTAL_ID);
        const view = strategy(DEFAULT_AGGREGATION.strategyId).aggregate({
            ...input,
            config: DEFAULT_AGGREGATION.config,
        });
        expect(view.metricId).toBe('gross');
    });

    test('ties share a position (1, 1, 3)', () => {
        const view = strategy(STROKE_TOTAL_ID).aggregate({
            roundResults: [
                round(
                    1,
                    'gross',
                    { a: 70, b: 70, c: 72 },
                    { a: [player('a')], b: [player('b')], c: [player('c')] },
                ),
            ],
            roster: [
                participant('P-a', player('a')),
                participant('P-b', player('b')),
                participant('P-c', player('c')),
            ],
            config: {},
        });
        expect(view.entries.map((e) => e.position)).toEqual([1, 1, 3]);
    });

    test('a missing round demotes: partial totals never beat complete ones', () => {
        const view = strategy(STROKE_TOTAL_ID).aggregate({
            roundResults: [
                round(1, 'gross', { a1: 74, g1: 71 }, { a1: [player('anna')], g1: [guest('greg')] }),
                // Greg has no result in round 2.
                round(2, 'gross', { a2: 80 }, { a2: [player('anna')] }),
            ],
            roster: [participant('P-anna', player('anna')), participant('P-greg', guest('greg'))],
            config: {},
        });
        // Greg's 71 < Anna's 154, but Greg counted 1 of 2 rounds → below Anna.
        expect(view.entries.map((e) => [e.participantId, e.total, e.position])).toEqual([
            ['P-anna', 154, 1],
            ['P-greg', 71, 2],
        ]);
        const greg = entryOf(view, 'P-greg');
        expect(greg.incomplete).toBe(true);
        expect(greg.rounds[1]).toEqual({ roundNumber: 2, value: null, included: false, status: 'missing' });
    });

    test('team/multi-identity entries are skipped — no individual owner', () => {
        const view = strategy(STROKE_TOTAL_ID).aggregate({
            roundResults: [
                round(
                    1,
                    'gross',
                    { solo: 74, teamBall: 60 },
                    {
                        solo: [player('anna')],
                        // A scramble-style team ball: two identities.
                        teamBall: [player('anna'), guest('greg')],
                    },
                ),
            ],
            roster: [participant('P-anna', player('anna')), participant('P-greg', guest('greg'))],
            config: {},
        });
        expect(entryOf(view, 'P-anna').total).toBe(74); // team 60 NOT attributed
        expect(entryOf(view, 'P-greg').total).toBeNull();
        expect(entryOf(view, 'P-greg').rounds[0]!.status).toBe('missing');
    });

    test('withdrawn participants render at the bottom, marked, arithmetic intact', () => {
        const view = strategy(STROKE_TOTAL_ID).aggregate({
            roundResults: [
                round(1, 'gross', { a: 74, w: 65 }, { a: [player('a')], w: [player('w')] }),
            ],
            roster: [
                participant('P-a', player('a')),
                participant('P-w', player('w'), { withdrawn: true }),
            ],
            config: {},
        });
        // 65 beats 74, but the withdrawn entry still sorts last.
        expect(view.entries.map((e) => [e.participantId, e.position])).toEqual([
            ['P-a', 1],
            ['P-w', 2],
        ]);
        const withdrawn = entryOf(view, 'P-w');
        expect(withdrawn.withdrawn).toBe(true);
        expect(withdrawn.total).toBe(65);
    });

    test('post-cut rounds are marked cut (not missing) for cut participants', () => {
        const view = strategy(STROKE_TOTAL_ID).aggregate({
            roundResults: [
                round(1, 'gross', { a1: 74, c1: 71 }, { a1: [player('a')], c1: [player('cut')] }),
                round(2, 'gross', { a2: 70 }, { a2: [player('a')] }, { postCut: true }),
            ],
            roster: [
                participant('P-a', player('a')),
                participant('P-cut', player('cut'), { cutAfterRound: 1 }),
            ],
            config: {},
        });
        const cut = entryOf(view, 'P-cut');
        expect(cut.rounds).toEqual([
            { roundNumber: 1, value: 71, included: true, status: 'counted' },
            { roundNumber: 2, value: null, included: false, status: 'cut' },
        ]);
        // Absent by design ≠ missing: the entry is not flagged incomplete…
        expect(cut.incomplete).toBe(false);
        expect(cut.cutAfterRound).toBe(1);
        // …but it counted fewer rounds, so it ranks below the full-distance field.
        expect(view.entries.map((e) => e.participantId)).toEqual(['P-a', 'P-cut']);
        expect(view.rounds[1]).toEqual({ roundNumber: 2, postCut: true });
    });

    test('rounds arrive unsorted; the view is ordered by round number', () => {
        const view = strategy(STROKE_TOTAL_ID).aggregate({
            roundResults: [
                round(2, 'gross', { a2: 70 }, { a2: [player('a')] }),
                round(1, 'gross', { a1: 74 }, { a1: [player('a')] }),
            ],
            roster: [participant('P-a', player('a'))],
            config: {},
        });
        expect(entryOf(view, 'P-a').rounds.map((c) => [c.roundNumber, c.value])).toEqual([
            [1, 74],
            [2, 70],
        ]);
    });

    test('validateConfig: bad metric and non-object config produce diagnostics', () => {
        const s = strategy(STROKE_TOTAL_ID);
        expect(s.validateConfig({})).toEqual([]);
        expect(s.validateConfig(undefined)).toEqual([]);
        expect(s.validateConfig({ metric: 'net' })).toEqual([]);
        expect(s.validateConfig({ metric: 'stableford' })[0]!.code).toBe('stroke_total_metric_invalid');
        expect(s.validateConfig('gross')[0]!.code).toBe('aggregation_config_not_object');
    });
});

// --- round_points_sum ------------------------------------------------------------------

describe('round_points_sum', () => {
    test('sums points across rounds, highest wins; a missed round is not demoted', () => {
        const view = strategy(ROUND_POINTS_SUM_ID).aggregate({
            roundResults: [
                round(1, 'points', { a1: 36, g1: 40 }, { a1: [player('anna')], g1: [guest('greg')] }),
                // Greg skips round 2.
                round(2, 'points', { a2: 30 }, { a2: [player('anna')] }),
            ],
            roster: [participant('P-anna', player('anna')), participant('P-greg', guest('greg'))],
            config: {},
        });
        expect(view.metricId).toBe('points');
        expect(view.direction).toBe('high');
        // Anna 36+30=66 beats Greg's single 40 — totals stay comparable (a
        // missed round just contributes nothing), so no rounds-counted block.
        expect(view.entries.map((e) => [e.participantId, e.total, e.position])).toEqual([
            ['P-anna', 66, 1],
            ['P-greg', 40, 2],
        ]);
        const greg = entryOf(view, 'P-greg');
        expect(greg.incomplete).toBe(true);
        expect(greg.rounds[1]!.status).toBe('missing');
    });

    test('an incomplete higher total outranks a complete lower one (no demotion)', () => {
        const view = strategy(ROUND_POINTS_SUM_ID).aggregate({
            roundResults: [
                round(1, 'points', { a1: 20, g1: 44 }, { a1: [player('a')], g1: [player('g')] }),
                round(2, 'points', { a2: 20 }, { a2: [player('a')] }),
            ],
            roster: [participant('P-a', player('a')), participant('P-g', player('g'))],
            config: {},
        });
        expect(view.entries.map((e) => [e.participantId, e.total, e.position])).toEqual([
            ['P-g', 44, 1],
            ['P-a', 40, 2],
        ]);
    });

    test('validateConfig accepts an alternate metric id, refuses a non-string', () => {
        const s = strategy(ROUND_POINTS_SUM_ID);
        expect(s.validateConfig({})).toEqual([]);
        expect(s.validateConfig({ metric: 'quota' })).toEqual([]);
        expect(s.validateConfig({ metric: 7 })[0]!.code).toBe('round_points_metric_invalid');
    });
});

// --- best_n_of_m ----------------------------------------------------------------------

describe('best_n_of_m', () => {
    test('points: counts the best n rounds, drops the rest with a struck cell', () => {
        const view = strategy(BEST_N_OF_M_ID).aggregate({
            roundResults: [
                round(1, 'points', { a1: 36 }, { a1: [player('a')] }),
                round(2, 'points', { a2: 28 }, { a2: [player('a')] }),
                round(3, 'points', { a3: 40 }, { a3: [player('a')] }),
            ],
            roster: [participant('P-a', player('a'))],
            config: { n: 2 },
        });
        expect(view.operator).toEqual({ kind: 'best_n', n: 2 });
        expect(view.direction).toBe('high'); // points default
        const a = entryOf(view, 'P-a');
        // Best two of 36/28/40 → 40 + 36 = 76; the 28 is dropped, visible.
        expect(a.rounds).toEqual([
            { roundNumber: 1, value: 36, included: true, status: 'counted' },
            { roundNumber: 2, value: 28, included: false, status: 'dropped' },
            { roundNumber: 3, value: 40, included: true, status: 'counted' },
        ]);
        expect(a.total).toBe(76);
        expect(a.roundsCounted).toBe(2);
    });

    test('gross: lowest n count; inclusion tie resolves to the earlier round', () => {
        const view = strategy(BEST_N_OF_M_ID).aggregate({
            roundResults: [
                round(1, 'gross', { a1: 74 }, { a1: [player('a')] }),
                round(2, 'gross', { a2: 74 }, { a2: [player('a')] }),
                round(3, 'gross', { a3: 71 }, { a3: [player('a')] }),
            ],
            roster: [participant('P-a', player('a'))],
            config: { n: 2, metric: 'gross' },
        });
        expect(view.direction).toBe('low');
        const a = entryOf(view, 'P-a');
        // Best two of 74/74/71 → 71 + the EARLIER 74 (round 1).
        expect(a.rounds.map((c) => c.status)).toEqual(['counted', 'dropped', 'counted']);
        expect(a.total).toBe(145);
    });

    test('fewer than n counted rounds ranks below full best-n entries', () => {
        const view = strategy(BEST_N_OF_M_ID).aggregate({
            roundResults: [
                round(1, 'points', { a1: 30, b1: 44 }, { a1: [player('a')], b1: [player('b')] }),
                round(2, 'points', { a2: 30 }, { a2: [player('a')] }),
            ],
            roster: [participant('P-a', player('a')), participant('P-b', player('b'))],
            config: { n: 2 },
        });
        // b's 44 > a's 60? No: b counted 1 < n=2 → demoted below a.
        expect(view.entries.map((e) => [e.participantId, e.total, e.position])).toEqual([
            ['P-a', 60, 1],
            ['P-b', 44, 2],
        ]);
    });

    test('validateConfig: n required, integer ≥ 1; metric restricted to the known three', () => {
        const s = strategy(BEST_N_OF_M_ID);
        expect(s.validateConfig({ n: 2 })).toEqual([]);
        expect(s.validateConfig({ n: 2, metric: 'net' })).toEqual([]);
        expect(s.validateConfig({}).map((d) => d.code)).toEqual(['best_n_missing_n']);
        expect(s.validateConfig({ n: 0 })[0]!.code).toBe('best_n_invalid_n');
        expect(s.validateConfig({ n: 1.5 })[0]!.code).toBe('best_n_invalid_n');
        expect(s.validateConfig({ n: 2, metric: 'eagles' })[0]!.code).toBe('best_n_metric_invalid');
    });
});

// --- Purity + serializability -----------------------------------------------------------

describe('aggregate() is pure and its view serializable', () => {
    test('same input twice → deeply equal views; JSON round-trips identically', () => {
        const input: AggregateInput = {
            roundResults: [
                round(1, 'gross', { a1: 74, g1: 71 }, { a1: [player('anna')], g1: [guest('greg')] }),
            ],
            roster: [participant('P-anna', player('anna')), participant('P-greg', guest('greg'))],
            config: {},
        };
        const s = strategy(STROKE_TOTAL_ID);
        const first = s.aggregate(input);
        const second = s.aggregate(input);
        expect(second).toEqual(first);
        expect(JSON.parse(JSON.stringify(first))).toEqual(first);
    });
});
