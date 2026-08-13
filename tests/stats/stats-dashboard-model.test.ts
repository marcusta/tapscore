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
import { SG_BASELINES_V1, strokesLostV3, ZERO_MEASURES } from '../../src/round/stat-measures';
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
    const hcp12 = SG_BASELINES_V1.hcp12;
    expect(puttingPanel(measures({ puttsRecorded: 0, firstPuttRecorded: 3 }), hcp12)).not.toBeNull();
    expect(puttingPanel(measures({ puttsRecorded: 3, firstPuttRecorded: 0 }), hcp12)).not.toBeNull();
    expect(puttingPanel(measures(), hcp12)).toBeNull();
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

    const putting = puttingPanel(m, SG_BASELINES_V1.hcp12)!;
    // Shares of the RESOLVED total (9), not of `firstPuttRecorded`.
    expect(putting.firstPuttSpread.inside_1m).toEqual({ value: 5 / 9, n: 5, d: 9 });
    expect(putting.firstPuttSpread['1_to_2m']).toEqual({ value: 0, n: 0, d: 9 });
    // 16 − 6 = 10 putts over 9 − 4 = 5 holes.
    expect(putting.puttsAfterMissedGreen).toEqual({ value: 2, n: 10, d: 5 });

    // Chip-ins are two counts and their total, not one lumped number.
    expect(shortGamePanel(m)!.chipIns).toEqual({ standard: 2, hard: 1, bunker: 0, overall: 3 });
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
    const panel = puttingPanel(measures({ firstPuttRecorded: 5 }), SG_BASELINES_V1.hcp12)!;
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

test('a round without stat capture feeds the Results and nothing else — the doubles breakdown never sees it', () => {
    // The owner's own window (2026-08-13): rounds scored without any stat
    // answers. Their doubles would ALL classify as "Not enough recorded" and
    // drown the recorded rounds, so the doubles-cause block filters at the
    // round level. Score-derived figures keep the whole window.
    const captured = measures({
        holesScored: 18,
        strokesTotal: 90,
        parTotal: 72,
        teeRecorded: 18,
        doubleBogeyPlus: 4,
        dblThreePutt: 3,
        dblUnattributed: 1,
    });
    const scoreOnly = measures({
        holesScored: 18,
        strokesTotal: 95,
        parTotal: 72,
        doubleBogeyPlus: 6,
        dblUnattributed: 6,
    });
    const model = buildDashboardModel([
        row({ roundId: 'a', date: '2026-05-01', measures: captured }),
        row({ roundId: 'b', date: '2026-05-02', measures: scoreOnly }),
    ]);
    // The header's one coverage line reads this: 2 rounds, stat capture on 1.
    expect(model.statCaptureRounds).toBe(1);
    // The breakdown is over the CAPTURED round's 4 doubles, not the window's 10
    // — three putts 3 of 4, not-enough-recorded 1 of 4, not 7 of 10.
    expect(model.scoring!.doubleBogeyPlusHoles).toBe(4);
    const threePutt = model.scoring!.doubleCauseGroups.find((g) => g.id === 'threePutt')!;
    const unattributed = model.scoring!.doubleCauseGroups.find((g) => g.id === 'unattributed')!;
    expect(threePutt.share).toEqual({ value: 0.75, n: 3, d: 4 });
    expect(unattributed.share).toEqual({ value: 0.25, n: 1, d: 4 });
    // The score-derived figures still read the whole window.
    expect(model.scoring!.doubleBogeyPlusPerRound).toEqual({ value: 5, n: 10, d: 2 });
    expect(model.results!.rounds).toBe(2);
    expect(model.results!.holesScored).toBe(36);
});

// --- Priorities --------------------------------------------------------------

test('priorities rank worst first and absent components sink to the bottom', () => {
    // Coverage is a full eighteen ATTRIBUTED, so `sgPer18` is the identity here
    // and the ranking is the arithmetic as written.
    const cover = { attributed: 18, holesScored: 18 };
    const waterfalls = [
        { tee: 0.5, approach: 0, shortGame: null, putting: 1, penalties: 2, total: 3.5, coverage: cover },
        { tee: 0.5, approach: 0, shortGame: null, putting: 3, penalties: 0, total: 3.5, coverage: cover },
    ];
    const out = buildPriorities(waterfalls);
    expect(out.map((p) => p.component)).toEqual([
        'putting',
        'penalties',
        'tee',
        'approach',
        'shortGame',
    ]);
    expect(out[0]!.per18).toBe(2); // mean of 1 and 3
    // The absent one is UNKNOWN, not best — it says so rather than ranking at 0.
    expect(out[4]!.per18).toBeNull();
    expect(out[4]!.roundsCovered).toBe(0);
    expect(out[4]!.roundsInWindow).toBe(2);
});

test('the mean is over the rounds that HAVE the component, not over the window', () => {
    const base = {
        tee: null,
        approach: null,
        shortGame: null,
        penalties: 0,
        total: null,
        coverage: { attributed: 18, holesScored: 18 },
    };
    const out = buildPriorities([
        { ...base, putting: 2 },
        { ...base, putting: null },
    ]);
    // 2 over one covered round, not 1 over two. Dividing by rounds that never
    // recorded a putt would dilute the estimate and flatten the ranking.
    expect(out[0]!.per18).toBe(2);
    expect(out[0]!.roundsCovered).toBe(1);
    expect(out[0]!.roundsInWindow).toBe(2);
});

test('priorityMagnitude is the shared scale the signed bars are drawn against', () => {
    expect(
        priorityMagnitude([
            { component: 'putting', per18: 1.5, roundsCovered: 1, roundsInWindow: 1 },
            { component: 'penalties', per18: -2.5, roundsCovered: 1, roundsInWindow: 1 },
            { component: 'tee', per18: null, roundsCovered: 0, roundsInWindow: 1 },
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
    // A trend point is a CROSS-ROUND comparison, so it normalizes per 18
    // attributed holes and inherits the floor: nine par-3 greens hit, two putts
    // each, is the smallest round that clears it.
    const putting = measures({
        firstPuttInside1mResolved: 6,
        puttsTotalInside1mResolved: 7,
        puttsRecorded: 6,
        holesScored: 9,
        attHolesPar3Gir: 9,
        attStrokes: 27,
        attPutts: 18,
        attGirFirstPutt2To4m: 9,
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

// --- Handicap cohorts --------------------------------------------------------

// One bundle prices the WHOLE model. This is the wiring test for that claim:
// every strokes-lost figure the screen shows has to move when the tier does, or
// a card is quietly still on the shipped table while the sheet above it names
// another one.
test('the baseline bundle reaches every strokes-lost figure on the screen', () => {
    // Nine par-3 greens hit, two putts each — over the per-18 floor, so the
    // trend and the priorities both report.
    const m = measures({
        holesScored: 9,
        attHolesPar3Gir: 9,
        attStrokes: 27,
        attPutts: 18,
        attGirFirstPutt2To4m: 9,
    });
    const rows = ['c', 'b', 'a'].map((id, i) =>
        row({ roundId: id, date: `2026-05-0${3 - i}`, measures: m }),
    );

    const scratch = buildDashboardModel(rows, SG_BASELINES_V1.scratch);
    const soft = buildDashboardModel(rows, SG_BASELINES_V1.hcp20);

    // The window total, the per-round strips, the priorities and the putting
    // trend — four separate call sites, all of which have to have been threaded.
    expect(scratch.waterfall.total!).toBeGreaterThan(soft.waterfall.total!);
    expect(scratch.rounds[0]!.waterfall.total!).toBeGreaterThan(soft.rounds[0]!.waterfall.total!);
    const putt = (model: typeof scratch) =>
        model.priorities.find((p) => p.component === 'putting')!.per18!;
    expect(putt(scratch)).toBeGreaterThan(putt(soft));
    const trendPoints = (model: typeof scratch) =>
        model.trends.find((t) => t.id === 'putting')!.points;
    expect(trendPoints(scratch)[0]!).toBeGreaterThan(trendPoints(soft)[0]!);

    // …and the default is the tier the app shipped with, so an un-threaded
    // caller reads exactly as it did before cohorts existed.
    expect(buildDashboardModel(rows)).toEqual(buildDashboardModel(rows, SG_BASELINES_V1.hcp12));
    expect(buildTrends(rows)).toEqual(buildTrends(rows, SG_BASELINES_V1.hcp12));
});

// --- Magnitudes --------------------------------------------------------------

test('waterfallMagnitude ignores null terms and is zero when nothing is measurable', () => {
    expect(waterfallMagnitude([strokesLostV3(ZERO_MEASURES)])).toBe(0);
    expect(
        waterfallMagnitude([
            {
                tee: null,
                approach: null,
                shortGame: null,
                putting: -1.5,
                penalties: 3,
                total: null,
                coverage: { attributed: 0, holesScored: 0 },
            },
        ]),
    ).toBe(3);
});

// --- Wave 3 panel fields -----------------------------------------------------
//
// The panels carry the wave-3 rates as `Rate`s, not as strings — every division
// happens here, every display decision downstream. Numbers are the window-W
// oracle the block tests and the Swift twin render.

test('the tee panel carries penalty geography and its cost, and neither changes the gate', () => {
    const p = teePanel(
        measures({
            teeRecorded: 60,
            penaltiesRecorded: 54,
            holesWithPenalty: 9,
            holesScoredPenalty: 9,
            strokesVsParPenalty: 14,
            holesScoredPenaltyFree: 45,
            strokesVsParPenaltyFree: 4,
            // 9 + 45 — the tax's two sides ARE the scored window, and the share
            // divides by that same window rather than by the answered holes.
            holesScored: 54,
        }),
        1,
    )!;
    expect(p.penaltyHoleShare).toEqual({ value: 9 / 54, n: 9, d: 54 });
    expect(p.vsParByPenalty.penalty).toEqual({ value: 14 / 9, n: 14, d: 9 });
    expect(p.vsParByPenalty.clean).toEqual({ value: 4 / 45, n: 4, d: 45 });
    // The DIFFERENCE, over the product of the two hole counts: n/d IS the
    // difference, and d is zero exactly when either side is empty.
    expect(p.penaltyTax.value).toBeCloseTo(14 / 9 - 4 / 45, 12);
    expect(p.penaltyTax.d).toBe(405);

    // A tee panel exists on tee shots alone; the penalty rates are simply absent.
    const noPenalties = teePanel(measures({ teeRecorded: 9, fairwayHits: 4 }), 1)!;
    expect(noPenalties.penaltyHoleShare.value).toBeNull();
    expect(noPenalties.penaltyTax.value).toBeNull();
});

test('the approach panel splits greens hit by par and prices the misses', () => {
    const p = approachPanel(
        measures({
            girRecorded: 60,
            girHits: 26,
            girHolesScored: 26,
            strokesVsParGirHit: 2,
            holesScoredGirMiss: 34,
            strokesVsParGirMiss: 31,
            girRecordedPar3: 12,
            girHitsPar3: 5,
            girRecordedPar4: 36,
            girHitsPar4: 14,
            girRecordedPar5: 12,
            girHitsPar5: 7,
        }),
    )!;
    expect(p.girByPar.par3.value).toBeCloseTo(5 / 12, 12);
    expect(p.girByPar.par4.value).toBeCloseTo(14 / 36, 12);
    expect(p.girByPar.par5.value).toBeCloseTo(7 / 12, 12);
    // The three partition the panel's own denominator.
    expect(p.girByPar.par3.d + p.girByPar.par4.d + p.girByPar.par5.d).toBe(p.gir.d);

    expect(p.costOfMissedGreen.hit).toEqual({ value: 2 / 26, n: 2, d: 26 });
    expect(p.costOfMissedGreen.miss).toEqual({ value: 31 / 34, n: 31, d: 34 });
    expect(p.costOfMissedGreen.delta.value).toBeCloseTo(31 / 34 - 2 / 26, 12);
    expect(p.costOfMissedGreen.delta.d).toBe(34 * 26);
});

test('a green never hit leaves the difference absent rather than pricing a miss against nothing', () => {
    const p = approachPanel(
        measures({ girRecorded: 20, girHits: 0, holesScoredGirMiss: 20, strokesVsParGirMiss: 18 }),
    )!;
    expect(p.costOfMissedGreen.miss.value).toBeCloseTo(0.9, 12);
    expect(p.costOfMissedGreen.hit.value).toBeNull();
    expect(p.costOfMissedGreen.delta.value).toBeNull();
});

test('the putting panel carries the four-bucket partition and the by-par averages', () => {
    const p = puttingPanel(
        measures({
            puttsRecorded: 54,
            puttsTotal: 100,
            holesZeroPutt: 3,
            holesOnePutt: 18,
            holesTwoPutt: 27,
            threePutts: 6,
            puttsRecordedPar3: 12,
            puttsTotalPar3: 21,
            puttsRecordedPar4: 30,
            puttsTotalPar4: 56,
            puttsRecordedPar5: 12,
            puttsTotalPar5: 23,
        }),
        SG_BASELINES_V1.hcp12,
    )!;
    const d = p.puttDistribution;
    expect([d.zero.n, d.one.n, d.two.n, d.threePlus.n]).toEqual([3, 18, 27, 6]);
    // All four share one denominator, so the shares sum to exactly 1.
    expect(d.zero.value! + d.one.value! + d.two.value! + d.threePlus.value!).toBeCloseTo(1, 12);
    // The bucket and the standalone three-putt rate are the same measure.
    expect(d.threePlus.value).toBe(p.threePutt.value);

    expect(p.puttsPerHoleByPar.par3.value).toBeCloseTo(21 / 12, 12);
    expect(p.puttsPerHoleByPar.par4.value).toBeCloseTo(56 / 30, 12);
    expect(p.puttsPerHoleByPar.par5.value).toBeCloseTo(23 / 12, 12);
    expect(
        p.puttsPerHoleByPar.par3.d + p.puttsPerHoleByPar.par4.d + p.puttsPerHoleByPar.par5.d,
    ).toBe(54);
});

test('a putting panel on first-putt distances alone has an absent distribution, not a zeroed one', () => {
    const p = puttingPanel(
        measures({ firstPuttRecorded: 9, firstPuttInside1mResolved: 9 }),
        SG_BASELINES_V1.hcp12,
    )!;
    expect(p.puttDistribution.zero.value).toBeNull();
    expect(p.puttDistribution.threePlus.value).toBeNull();
    expect(p.puttsPerHoleByPar.par4.value).toBeNull();
});
