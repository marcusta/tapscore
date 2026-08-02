import { expect, test } from 'bun:test';
import {
    approachPanel,
    buildDashboardModel,
    buildPriorities,
    buildTrends,
    EMPTY_DASHBOARD_MODEL,
    presentPanels,
    priorityMagnitude,
    puttingPanel,
    shortGamePanel,
    teePanel,
    TREND_MIN_POINTS,
    waterfallMagnitude,
} from '../../src/stats/stats-dashboard-model';
import { strokesLost, ZERO_MEASURES } from '../../src/round/stat-measures';
import type { PlayerRoundStats, StatMeasures } from '../../src/api/player-stats.gen';

// The (rows → screen) reduction. Pure: no service, no DOM, no clock. Twin of
// the Swift `StatsDashboardModelTests`.

function measures(over: Partial<StatMeasures> = {}): StatMeasures {
    return { ...ZERO_MEASURES, ...over };
}

function row(
    over: Partial<PlayerRoundStats> & { roundId: string; date: string },
): PlayerRoundStats {
    return {
        courseId: 'c1',
        courseName: 'Linköping',
        roundType: 'full_18',
        venueType: 'outdoor',
        name: null,
        holeCount: 18,
        measures: ZERO_MEASURES,
        ...over,
    };
}

// --- Shape -------------------------------------------------------------------

test('an empty window builds the empty model', () => {
    expect(buildDashboardModel([])).toEqual(EMPTY_DASHBOARD_MODEL);
    expect(presentPanels(EMPTY_DASHBOARD_MODEL)).toEqual([]);
});

test('round rows come out newest first whatever order they went in', () => {
    const model = buildDashboardModel([
        row({ roundId: 'a', date: '2026-05-01' }),
        row({ roundId: 'c', date: '2026-06-01' }),
        row({ roundId: 'b', date: '2026-05-15' }),
    ]);
    expect(model.rounds.map((r) => r.id)).toEqual(['c', 'b', 'a']);
});

test('a stats-only round has no strokes and no vs-par, rather than a level-par round that never happened', () => {
    const model = buildDashboardModel([
        row({ roundId: 'a', date: '2026-05-01', measures: measures({ teeRecorded: 4, fairwayHits: 2 }) }),
    ]);
    expect(model.rounds[0]!.strokes).toBeNull();
    expect(model.rounds[0]!.vsPar).toBeNull();
});

test('a scored round carries strokes and vs par off the waterfall total', () => {
    const model = buildDashboardModel([
        row({
            roundId: 'a',
            date: '2026-05-01',
            measures: measures({ holesScored: 18, strokesTotal: 80, parTotal: 72 }),
        }),
    ]);
    expect(model.rounds[0]!.strokes).toBe(80);
    expect(model.rounds[0]!.vsPar).toBe(8);
});

// --- Panel gating ------------------------------------------------------------

test('a module with no data is ABSENT, not zeroed', () => {
    const model = buildDashboardModel([row({ roundId: 'a', date: '2026-05-01' })]);
    expect(model.tee).toBeNull();
    expect(model.approach).toBeNull();
    expect(model.putting).toBeNull();
    expect(model.shortGame).toBeNull();
    expect(model.scoring).toBeNull();
});

test('the gate is the RECORDED counter, so ten tee shots and no fairways still gets a panel', () => {
    const panel = teePanel(measures({ teeRecorded: 10, fairwayHits: 0 }), 1);
    expect(panel).not.toBeNull();
    expect(panel!.fairway).toEqual({ value: 0, n: 0, d: 10 });
});

test('putting opens on EITHER counter — a bucketed first putt with no putt count still counts', () => {
    expect(puttingPanel(measures({ puttsRecorded: 0, firstPuttRecorded: 3 }))).not.toBeNull();
    expect(puttingPanel(measures({ puttsRecorded: 3, firstPuttRecorded: 0 }))).not.toBeNull();
    expect(puttingPanel(measures())).toBeNull();
});

test('short game opens on scramble ATTEMPTS across both difficulties', () => {
    expect(shortGamePanel(measures({ scrambleAttemptsHard: 2 }))).not.toBeNull();
    expect(shortGamePanel(measures({ scrambleHoledStandard: 1 }))).toBeNull();
});

test('the results summary is built from the ROWS, not from the window sum', () => {
    // Two nines sum to eighteen holes and are not a round: the best round is a
    // per-round fact a summed window would destroy. Nines are first class —
    // wave 1 reported no best score at all here, because neither was an 18.
    const model = buildDashboardModel([
        row({
            roundId: 'a',
            date: '2026-05-01',
            holeCount: 9,
            measures: measures({ holesScored: 9, strokesTotal: 44, parTotal: 36 }),
        }),
        row({
            roundId: 'b',
            date: '2026-05-02',
            holeCount: 9,
            measures: measures({ holesScored: 9, strokesTotal: 43, parTotal: 36 }),
        }),
    ]);
    expect(model.results!.rounds).toBe(2);
    expect(model.results!.scoredRounds).toBe(2);
    expect(model.results!.holesScored).toBe(18);
    // Nothing is missing, so the hero prints no denominator line.
    expect(model.results!.holesExpected).toBe(18);
    expect(model.results!.lengths).toEqual([
        { holeCount: 9, rounds: 2, completeRounds: 2, best: { vsPar: 7, strokes: 43 } },
    ]);
    // (8 + 7) vs par over 18 scored holes, scaled to eighteen: 15 per 18.
    expect(model.results!.avgVsParPer18).toEqual({ value: 15, n: 270, d: 18 });
    // Not a panel — it is gated on nothing but an empty window.
    expect(presentPanels(model)).toEqual(['scoring']);
    expect(EMPTY_DASHBOARD_MODEL.results).toBeNull();
});

test('the panels carry the coverage and split figures their gates are decided on', () => {
    const m = measures({
        teeRecorded: 9,
        girRecorded: 9,
        girHits: 4,
        puttsRecorded: 9,
        puttsTotal: 16,
        puttsRecordedGir: 4,
        puttsTotalGir: 6,
        firstPuttRecorded: 9,
        firstPuttInside1mResolved: 5,
        firstPutt2To4mResolved: 4,
        penaltiesRecorded: 18,
        penaltiesTotal: 2,
        scrambleAttemptsStandard: 3,
        scrambleAttemptsHard: 2,
        scrambleHoledStandard: 2,
        scrambleHoledHard: 1,
    });
    // The recorded-holes count the Penalties row is gated on — `penaltiesPerRound`
    // divides by the ROUND count and so cannot answer "was it ever asked?".
    expect(teePanel(m, 1)!.penaltiesRecordedHoles).toBe(18);
    expect(teePanel(measures({ teeRecorded: 9 }), 1)!.penaltiesRecordedHoles).toBe(0);
    // A property of the approach MISS, so it lives on the approach panel.
    expect(approachPanel(m)!.hardChipShare).toEqual({ value: 0.4, n: 2, d: 5 });

    const putting = puttingPanel(m)!;
    // Shares of the RESOLVED total (9), not of `firstPuttRecorded`.
    expect(putting.firstPuttSpread.inside_1m).toEqual({ value: 5 / 9, n: 5, d: 9 });
    expect(putting.firstPuttSpread['1_to_2m']).toEqual({ value: 0, n: 0, d: 9 });
    // 16 − 6 = 10 putts over 9 − 4 = 5 holes.
    expect(putting.puttsAfterMissedGreen).toEqual({ value: 2, n: 10, d: 5 });

    // Chip-ins are two counts and their total, not one lumped number.
    expect(shortGamePanel(m)!.chipIns).toEqual({ standard: 2, hard: 1, overall: 3 });
});

test('present panels come back in reading order, tee to green then the scorecard', () => {
    const model = buildDashboardModel([
        row({
            roundId: 'a',
            date: '2026-05-01',
            measures: measures({
                teeRecorded: 9,
                fairwayHits: 5,
                holesScored: 9,
                strokesTotal: 45,
                parTotal: 36,
            }),
        }),
    ]);
    expect(presentPanels(model)).toEqual(['tee', 'scoring']);
});

// --- Panel content -----------------------------------------------------------

test('inPlayOnly excludes fairway hits, so the split bar cannot double-count', () => {
    // 10 tee shots: 5 fairway, 8 in play (cumulative), 2 trouble.
    const panel = teePanel(
        measures({ teeRecorded: 10, fairwayHits: 5, inPlayHits: 8, troubleCount: 2 }),
        1,
    )!;
    expect(panel.inPlayOnly.n).toBe(3);
    expect(panel.fairway.n + panel.inPlayOnly.n + panel.trouble.n).toBe(10);
});

test('the ladder baseline inverts the expected-putts table and floors at zero', () => {
    const panel = puttingPanel(measures({ firstPuttRecorded: 5 }))!;
    const baselines = Object.fromEntries(panel.ladder.map((r) => [r.bucket, r.baseline]));
    expect(baselines['inside_1m']).toBeCloseTo(0.95, 10);
    expect(baselines['1_to_2m']).toBeCloseTo(0.55, 10);
    // 4–8 m expects 2.10 putts and >8 m 2.40 — the table expects a two-putt,
    // not "you should hole none of these".
    expect(baselines['4_to_8m']).toBe(0);
    expect(baselines['over_8m']).toBe(0);
});

test('per-round figures divide by the ROW count — a nine-hole round is one round', () => {
    const nine = measures({ holesScored: 9, strokesTotal: 45, parTotal: 36, penaltiesTotal: 2, penaltiesRecorded: 9 });
    const model = buildDashboardModel([
        row({ roundId: 'a', date: '2026-05-01', holeCount: 9, measures: nine }),
        row({ roundId: 'b', date: '2026-05-02', holeCount: 9, measures: nine }),
    ]);
    // Two nines are two rounds, not one notional eighteen.
    expect(model.scoring!.doubleBogeyPlusPerRound.d).toBe(2);
});

// --- Priorities --------------------------------------------------------------

test('priorities rank worst first and absent components sink to the bottom', () => {
    const waterfalls = [
        { putting: 1, shortGame: null, penalties: 2, longGame: 0.5, total: 3.5, coverage: { holesScored: 18, puttsRecorded: 18 } },
        { putting: 3, shortGame: null, penalties: 0, longGame: 0.5, total: 3.5, coverage: { holesScored: 18, puttsRecorded: 18 } },
    ];
    const out = buildPriorities(waterfalls);
    expect(out.map((p) => p.component)).toEqual(['putting', 'penalties', 'longGame', 'shortGame']);
    expect(out[0]!.perRound).toBe(2); // mean of 1 and 3
    // The absent one is UNKNOWN, not best — it says so rather than ranking at 0.
    expect(out[3]!.perRound).toBeNull();
    expect(out[3]!.roundsCovered).toBe(0);
    expect(out[3]!.roundsInWindow).toBe(2);
});

test('the mean is over the rounds that HAVE the component, not over the window', () => {
    const base = { shortGame: null, penalties: 0, longGame: null, total: null, coverage: { holesScored: 0, puttsRecorded: 0 } };
    const out = buildPriorities([
        { ...base, putting: 2 },
        { ...base, putting: null },
    ]);
    // 2 over one covered round, not 1 over two. Dividing by rounds that never
    // recorded a putt would dilute the estimate and flatten the ranking.
    expect(out[0]!.perRound).toBe(2);
    expect(out[0]!.roundsCovered).toBe(1);
    expect(out[0]!.roundsInWindow).toBe(2);
});

test('priorityMagnitude is the shared scale the signed bars are drawn against', () => {
    expect(
        priorityMagnitude([
            { component: 'putting', perRound: 1.5, roundsCovered: 1, roundsInWindow: 1 },
            { component: 'penalties', perRound: -2.5, roundsCovered: 1, roundsInWindow: 1 },
            { component: 'longGame', perRound: null, roundsCovered: 0, roundsInWindow: 1 },
        ]),
    ).toBe(2.5);
});

// --- Trends ------------------------------------------------------------------

function teeRound(id: string, date: string, hits: number, recorded = 9): PlayerRoundStats {
    return row({ roundId: id, date, measures: measures({ teeRecorded: recorded, fairwayHits: hits }) });
}

test('a trend needs at least three points or it is not drawn at all', () => {
    const two = buildTrends([teeRound('b', '2026-05-02', 5), teeRound('a', '2026-05-01', 4)]);
    expect(two).toEqual([]);
    expect(TREND_MIN_POINTS).toBe(3);
    const three = buildTrends([
        teeRound('c', '2026-05-03', 6),
        teeRound('b', '2026-05-02', 5),
        teeRound('a', '2026-05-01', 4),
    ]);
    expect(three.map((t) => t.id)).toEqual(['fairway']);
});

test('trend points run oldest → newest, the opposite of every list on the screen', () => {
    const trend = buildTrends([
        teeRound('c', '2026-05-03', 9),
        teeRound('b', '2026-05-02', 6),
        teeRound('a', '2026-05-01', 3),
    ])[0]!;
    expect(trend.points).toEqual([3 / 9, 6 / 9, 1]);
    expect(trend.kind).toBe('percentage');
});

test('a round with no value for the measure is a SKIP, never a zero', () => {
    const trend = buildTrends([
        teeRound('d', '2026-05-04', 9),
        row({ roundId: 'c', date: '2026-05-03' }), // no tee data at all
        teeRound('b', '2026-05-02', 6),
        teeRound('a', '2026-05-01', 3),
    ])[0]!;
    expect(trend.points).toEqual([3 / 9, 6 / 9, 1]);
});

test('a thin round cannot headline a trend — the percentage floor applies to points too', () => {
    // A 1-of-1 round would otherwise front the tile as "100%" with the
    // authority of a full round.
    const trend = buildTrends([
        teeRound('d', '2026-05-04', 1, 1),
        teeRound('c', '2026-05-03', 9),
        teeRound('b', '2026-05-02', 6),
        teeRound('a', '2026-05-01', 3),
    ])[0]!;
    expect(trend.points).toEqual([3 / 9, 6 / 9, 1]);
});

test('putting trends on strokes lost, where lower is better', () => {
    const putting = measures({
        firstPuttInside1mResolved: 6,
        puttsTotalInside1mResolved: 7,
        puttsRecorded: 6,
        holesScored: 6,
    });
    const trends = buildTrends([
        row({ roundId: 'c', date: '2026-05-03', measures: putting }),
        row({ roundId: 'b', date: '2026-05-02', measures: putting }),
        row({ roundId: 'a', date: '2026-05-01', measures: putting }),
    ]);
    const trend = trends.find((t) => t.id === 'putting')!;
    expect(trend.kind).toBe('strokesLost');
    expect(trend.points).toHaveLength(3);
});

// --- Magnitudes --------------------------------------------------------------

test('waterfallMagnitude ignores null terms and is zero when nothing is measurable', () => {
    expect(waterfallMagnitude([strokesLost(ZERO_MEASURES)])).toBe(0);
    expect(
        waterfallMagnitude([
            { putting: -1.5, shortGame: null, penalties: 3, longGame: null, total: null, coverage: { holesScored: 0, puttsRecorded: 0 } },
        ]),
    ).toBe(3);
});
