import { expect, test } from 'bun:test';
import {
    buildRoundStatsModel,
    cellHasAnyStat,
    cellHasPenalty,
    evaluateStoryEligibility,
    hasAnyAnswer,
    historySatisfied,
    holeCell,
    holesUnscoredFor,
    priorRounds,
    roundStatsTitle,
    scoreMarkerForm,
} from '../../src/stats/round-stats-model';
import {
    SG_BASELINES_V1,
    strokesLostForBundle,
    ZERO_MEASURES,
} from '../../src/round/stat-measures';
import { buildDashboardModel } from '../../src/stats/stats-dashboard-model';
import type {
    PlayerHoleStats,
    PlayerRoundHoleStats,
    PlayerRoundStats,
    StatMeasures,
} from '../../src/api/player-stats.gen';
import type { RoundBall, RoundPlayingGroup } from '../../src/api/rounds.gen';

// One round's (rows → screen) reduction, and the story's gate. Pure: no
// service, no DOM, no clock. Twin of the Swift `RoundStatsModelTests`.

function measures(over: Partial<StatMeasures> = {}): StatMeasures {
    return { ...ZERO_MEASURES, ...over };
}

function round(
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
        girArrivalMetres: [],
        ...over,
    };
}

function stats(over: Partial<PlayerHoleStats> = {}): PlayerHoleStats {
    return {
        roundId: 'r1',
        playHoleId: 'h1',
        playerId: 'p1',
        teeResult: null,
        gir: null,
        firstPutt: null,
        firstPuttM: null,
        putts: null,
        shortGameDifficulty: null,
        penalties: null,
        recoveryOk: null,
        teeMissDir: null,
        greenMissDir: null,
        shortGameStrokes: null,
        penaltySource: null,
        ...over,
    };
}

function hole(
    over: Partial<PlayerRoundHoleStats> & { playHoleId: string; ordinal: number },
): PlayerRoundHoleStats {
    return {
        courseHoleNumber: over.ordinal,
        par: 4,
        lengthM: null,
        score: null,
        stats: stats({ playHoleId: over.playHoleId }),
        ...over,
    };
}

// --- Score markers -----------------------------------------------------------
//
// The thresholds are the server's `scoreToParMarker`, reproduced client-side
// because this strip has no presenter behind it. If these ever disagree, a
// birdie is a different colour on the scorecard and on the stats screen.

test('markers classify against par exactly as the server vocabulary does', () => {
    expect(scoreMarkerForm(3, 4)).toBe('ring'); // birdie
    expect(scoreMarkerForm(2, 4)).toBe('double_ring'); // eagle
    expect(scoreMarkerForm(1, 4)).toBe('diamond'); // hole in one
    expect(scoreMarkerForm(2, 5)).toBe('diamond'); // albatross, three under
    expect(scoreMarkerForm(5, 4)).toBe('square'); // bogey
    expect(scoreMarkerForm(6, 4)).toBe('double_square');
    expect(scoreMarkerForm(7, 4)).toBe('box_badge'); // triple or worse
});

test('level par carries no marker — a decoration on every hole decorates nothing', () => {
    expect(scoreMarkerForm(4, 4)).toBeNull();
});

test('a net 1 is not a hole in one', () => {
    // Net scores go through the same classifier; only the gross branch may
    // claim an ace, and a net 1 on a par 3 is a two-under like any other.
    expect(scoreMarkerForm(1, 3, false)).toBe('double_ring');
    expect(scoreMarkerForm(1, 3, true)).toBe('diamond');
});

test('a pick-up, a missing score and a missing par all carry no marker', () => {
    expect(scoreMarkerForm(0, 4)).toBeNull();
    expect(scoreMarkerForm(null, 4)).toBeNull();
    expect(scoreMarkerForm(4, null)).toBeNull();
});

// --- Hole cells --------------------------------------------------------------

test('strokes 0 is a PICK-UP, never the digit zero', () => {
    const cell = holeCell(hole({ playHoleId: 'h1', ordinal: 1, score: 0 }));
    expect(cell.isPickedUp).toBe(true);
    expect(cell.strokes).toBeNull();
    // And so it has no vs-par and no marker: there is no score to compare.
    expect(cell.vsPar).toBeNull();
    expect(cell.marker).toBeNull();
});

test('an unscored hole is absent, and is a different fact from a pick-up', () => {
    const cell = holeCell(hole({ playHoleId: 'h1', ordinal: 1, score: null }));
    expect(cell.isPickedUp).toBe(false);
    expect(cell.strokes).toBeNull();
});

test('a cell carries only the dimensions that were recorded', () => {
    const cell = holeCell(
        hole({
            playHoleId: 'h1',
            ordinal: 1,
            par: 4,
            score: 5,
            stats: stats({ teeResult: 'trouble', putts: 2 }),
        }),
    );
    expect(cell.strokes).toBe(5);
    expect(cell.vsPar).toBe(1);
    expect(cell.marker).toBe('square');
    expect(cell.tee).toBe('trouble');
    expect(cell.putts).toBe(2);
    // Never answered. NOT false, NOT zero.
    expect(cell.gir).toBeNull();
    expect(cell.penalties).toBeNull();
    expect(cell.firstPutt).toBeNull();
});

test('the penalty flag needs a RECORDED penalty above zero', () => {
    const none = holeCell(hole({ playHoleId: 'h', ordinal: 1, stats: stats({ penalties: 0 }) }));
    const some = holeCell(hole({ playHoleId: 'h', ordinal: 1, stats: stats({ penalties: 1 }) }));
    const unknown = holeCell(hole({ playHoleId: 'h', ordinal: 1 }));
    // "I took none" must not fly a flag, and neither must "nobody said".
    expect(cellHasPenalty(none)).toBe(false);
    expect(cellHasPenalty(unknown)).toBe(false);
    expect(cellHasPenalty(some)).toBe(true);
});

test('a recorded zero still counts as having a stat — it is an answer', () => {
    expect(cellHasAnyStat(holeCell(hole({ playHoleId: 'h', ordinal: 1 })))).toBe(false);
    expect(
        cellHasAnyStat(holeCell(hole({ playHoleId: 'h', ordinal: 1, stats: stats({ penalties: 0 }) }))),
    ).toBe(true);
    expect(
        cellHasAnyStat(holeCell(hole({ playHoleId: 'h', ordinal: 1, stats: stats({ gir: false }) }))),
    ).toBe(true);
});

test('cells come out in canonical ordinal order whatever order they arrived in', () => {
    const model = buildRoundStatsModel({
        round: round({ roundId: 'r1', date: '2026-05-01' }),
        holes: [
            hole({ playHoleId: 'c', ordinal: 3 }),
            hole({ playHoleId: 'a', ordinal: 1 }),
            hole({ playHoleId: 'b', ordinal: 2 }),
        ],
        history: [],
    });
    expect(model.cells.map((c) => c.id)).toEqual(['a', 'b', 'c']);
});

// --- The model ---------------------------------------------------------------

test('the round header takes its name, then the course, then a fallback', () => {
    expect(roundStatsTitle({ name: 'Tuesday roll-up', courseName: 'Linköping' })).toBe(
        'Tuesday roll-up',
    );
    expect(roundStatsTitle({ name: '  ', courseName: 'Linköping' })).toBe('Linköping');
    expect(roundStatsTitle({ name: null, courseName: null })).toBe('Round');
});

test('a scored round carries strokes and vs par, off the same reduction as the dashboard', () => {
    const model = buildRoundStatsModel({
        round: round({
            roundId: 'r1',
            date: '2026-05-01',
            measures: measures({ holesScored: 18, strokesTotal: 80, parTotal: 72 }),
        }),
        holes: [],
        history: [],
    });
    expect(model.strokes).toBe(80);
    expect(model.vsPar).toBe(8);
});

test('the FIRST round with stats has no personal baseline, rather than a zeroed one', () => {
    const model = buildRoundStatsModel({
        round: round({ roundId: 'r1', date: '2026-05-01' }),
        holes: [],
        history: [],
    });
    // A fixed-baseline waterfall it has; a comparison to itself it does not.
    expect(model.deltas).toBeNull();
    expect(model.windowCount).toBe(0);
    expect(model.insights).toEqual([]);
});

// The round and the history it is compared with must be priced by the SAME
// bundle: a delta between a round on one tier and a baseline on another is not
// a delta at all.
test('the baseline bundle prices the round and its personal baseline alike', () => {
    // Nine par-3 greens hit, two putts each — over the per-18 floor on both
    // sides, so the deltas and the insights actually report.
    const m = measures({
        holesScored: 9,
        attHolesPar3Gir: 9,
        attStrokes: 27,
        attPutts: 18,
        attGirFirstPutt2To4m: 9,
    });
    const args = {
        round: round({ roundId: 'r1', date: '2026-05-02', measures: m }),
        holes: [],
        history: [round({ roundId: 'r0', date: '2026-05-01', measures: m })],
    };

    const scratch = buildRoundStatsModel({ ...args, bundle: SG_BASELINES_V1.scratch });
    const soft = buildRoundStatsModel({ ...args, bundle: SG_BASELINES_V1.hcp20 });

    expect(scratch.waterfall.total!).toBeGreaterThan(soft.waterfall.total!);
    // Identical rounds on either side, so the delta is zero WHICHEVER tier is in
    // force — that is the point: the two halves moved together.
    expect(scratch.deltas!.putting!).toBeCloseTo(0, 9);
    expect(soft.deltas!.putting!).toBeCloseTo(0, 9);
    // …and the default is the tier the app shipped with.
    expect(buildRoundStatsModel(args)).toEqual(
        buildRoundStatsModel({ ...args, bundle: SG_BASELINES_V1.hcp12 }),
    );
});

// The window baseline this screen compares against must be priced the SAME way
// the round itself is. The round's waterfall uses its exact arrival metres
// (migration 064); a window folded without them would price the same play
// differently, and the pricing difference would surface as form.
test('the window baseline prices each prior round with its own arrival metres', () => {
    const m = measures({
        holesScored: 9,
        attHolesPar3Gir: 9,
        attStrokes: 27,
        attPutts: 18,
        attGirFirstPutt2To4m: 9,
    });
    const cells = [{ meters: 2, holes: 9 }];
    const prior = round({
        roundId: 'r0',
        date: '2026-05-01',
        measures: m,
        girArrivalMetres: cells,
    });
    const bundle = SG_BASELINES_V1.hcp12;

    // The same round priced by the dashboard's per-round path, which has always
    // been handed the cells.
    const dashboard = buildDashboardModel([prior], bundle).rounds[0]!.waterfall;

    const model = buildRoundStatsModel({
        round: round({
            roundId: 'r1',
            date: '2026-05-02',
            measures: m,
            girArrivalMetres: cells,
        }),
        holes: [],
        history: [prior],
        bundle,
    });

    // The refinement is real — the bucket price and the metre price differ —
    // so this test would fail on an unrefined window fold.
    expect(dashboard.putting!).not.toBeCloseTo(
        strokesLostForBundle(m, bundle).putting!,
        6,
    );
    expect(model.waterfall.putting!).toBeCloseTo(dashboard.putting!, 9);
    // Unchanged play, refined on both sides: nothing to report.
    expect(model.deltas!.putting!).toBeCloseTo(0, 9);
});

// --- The window --------------------------------------------------------------

test('priorRounds returns only rounds strictly OLDER than the one being read', () => {
    const target = round({ roundId: 'b', date: '2026-05-02' });
    const window = priorRounds(
        target,
        [
            round({ roundId: 'c', date: '2026-05-03' }), // newer — not a baseline
            round({ roundId: 'a', date: '2026-05-01' }),
            round({ roundId: 'z', date: '2026-04-01' }),
        ],
        10,
    );
    expect(window.map((r) => r.roundId)).toEqual(['a', 'z']);
});

test('a history that CONTAINS the round cannot leak it into its own baseline', () => {
    // `stat-measures`' window contract says the caller filters. This is that
    // filter, and it holds even when the caller hands over the round itself.
    const target = round({ roundId: 'b', date: '2026-05-02' });
    const window = priorRounds(target, [target, round({ roundId: 'a', date: '2026-05-01' })], 10);
    expect(window.map((r) => r.roundId)).toEqual(['a']);
});

test('the window is capped at the limit, newest first', () => {
    const target = round({ roundId: 'x', date: '2026-05-09' });
    const history = ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04'].map((d, i) =>
        round({ roundId: `h${i}`, date: d }),
    );
    expect(priorRounds(target, history, 2).map((r) => r.roundId)).toEqual(['h3', 'h2']);
    expect(priorRounds(target, history, 0)).toEqual([]);
});

test('rounds sharing a date are ordered by id, so the window is deterministic', () => {
    const target = round({ roundId: 'm', date: '2026-05-02' });
    const window = priorRounds(
        target,
        [round({ roundId: 'z', date: '2026-05-02' }), round({ roundId: 'a', date: '2026-05-02' })],
        10,
    );
    // Descending id within a date — `z` sorts above `m`, `a` below it.
    expect(window.map((r) => r.roundId)).toEqual(['a']);
});

test('the walk is satisfied by rounds OLDER than the target, not by a raw row count', () => {
    const rows = [
        round({ roundId: 'new1', date: '2026-06-01' }),
        round({ roundId: 'new2', date: '2026-06-02' }),
        round({ roundId: 'target', date: '2026-05-01' }),
    ];
    // Three rows in hand, but nothing behind the target: a stop-on-count walk
    // would leave the round with no baseline at all.
    expect(historySatisfied(rows, 'target', 2)).toBe(false);
    rows.push(round({ roundId: 'old1', date: '2026-04-01' }));
    rows.push(round({ roundId: 'old2', date: '2026-03-01' }));
    expect(historySatisfied(rows, 'target', 2)).toBe(true);
});

test('a walk that has not yet seen the target is never satisfied', () => {
    expect(historySatisfied([round({ roundId: 'a', date: '2026-05-01' })], 'target', 0)).toBe(false);
});

// --- Finished card -----------------------------------------------------------

function ball(id: string, playerId: string | null): RoundBall {
    return {
        id,
        label: id,
        courseHandicap: null,
        players: [
            {
                producerDefId: 'd1',
                playerId,
                guestPlayerId: null,
                displayName: 'Marcus',
                handicapIndex: null,
                teeName: null,
                courseHandicap: null,
                pending: false,
            },
        ],
        slots: [],
        pending: false,
    } as unknown as RoundBall;
}

function group(ballIds: string[], playHoleIds: string[]): RoundPlayingGroup {
    return {
        id: 'g1',
        startTime: null,
        capacity: 4,
        hittingBay: null,
        startPlayHoleId: playHoleIds[0] ?? null,
        startOrdinal: 1,
        endPlayHoleId: playHoleIds[playHoleIds.length - 1] ?? null,
        endOrdinal: playHoleIds.length,
        ballIds,
        playedOrder: playHoleIds.map((playHoleId, i) => ({ playHoleId, ordinal: i + 1 })),
    } as unknown as RoundPlayingGroup;
}

test('holesUnscored counts the holes on that player’s own card with no score', () => {
    const scores = new Map([['b1|h1', 4]]);
    expect(
        holesUnscoredFor({
            playerId: 'p1',
            balls: [ball('b1', 'p1')],
            groups: [group(['b1'], ['h1', 'h2', 'h3'])],
            strokesFor: (ballId, playHoleId) => scores.get(`${ballId}|${playHoleId}`) ?? null,
        }),
    ).toBe(2);
});

test('a player with no ball in the round is null, not zero', () => {
    // Null is "not playing here"; zero is "finished". Collapsing them would let
    // the story card fire for a spectator.
    expect(
        holesUnscoredFor({
            playerId: 'stranger',
            balls: [ball('b1', 'p1')],
            groups: [group(['b1'], ['h1'])],
            strokesFor: () => 4,
        }),
    ).toBeNull();
});

test('a ball in no group is null too — there is no played order to count against', () => {
    expect(
        holesUnscoredFor({
            playerId: 'p1',
            balls: [ball('b1', 'p1')],
            groups: [group(['other'], ['h1'])],
            strokesFor: () => 4,
        }),
    ).toBeNull();
});

// --- Story eligibility -------------------------------------------------------

const recorded = [stats({ playerId: 'p1', putts: 2 })];

function eligibility(over: {
    signedInPlayerId?: string | null;
    statConfigPlayerIds?: ReadonlySet<string>;
    statRows?: readonly PlayerHoleStats[];
    holesUnscored?: number | null;
}) {
    return evaluateStoryEligibility({
        signedInPlayerId: 'p1',
        statConfigPlayerIds: new Set(['p1']),
        statRows: recorded,
        holesUnscored: 0,
        ...over,
    });
}

test('a signed-in player with their own stats on a finished card gets the story', () => {
    expect(eligibility({})).toEqual({ reason: 'eligible', playerId: 'p1' });
});

test('logged out, there is no story — the read is session-scoped', () => {
    expect(eligibility({ signedInPlayerId: null }).reason).toBe('notSignedIn');
    expect(eligibility({ signedInPlayerId: '' }).reason).toBe('notSignedIn');
});

test('a phone that only SCORED for others gets nothing', () => {
    // The scorer's own player id tracks no modules in this round: the story
    // speaks in the second person, and it would otherwise be about someone else.
    expect(eligibility({ statConfigPlayerIds: new Set(['friend']) }).reason).toBe(
        'noStatsConfigured',
    );
});

test('another player’s recorded stats never satisfy the gate', () => {
    expect(eligibility({ statRows: [stats({ playerId: 'friend', putts: 2 })] }).reason).toBe(
        'noStatsRecorded',
    );
});

test('configured but nothing answered is not a story', () => {
    expect(eligibility({ statRows: [stats({ playerId: 'p1' })] }).reason).toBe('noStatsRecorded');
});

test('an unfinished card holds the story back, and so does no card at all', () => {
    expect(eligibility({ holesUnscored: 3 }).reason).toBe('roundUnfinished');
    expect(eligibility({ holesUnscored: null }).reason).toBe('roundUnfinished');
});

test('only the eligible answer names a player', () => {
    for (const reason of [
        eligibility({ signedInPlayerId: null }),
        eligibility({ statConfigPlayerIds: new Set<string>() }),
        eligibility({ statRows: [] }),
        eligibility({ holesUnscored: 1 }),
    ]) {
        expect(reason.playerId).toBeNull();
    }
});

test('an all-null row is not an answer', () => {
    expect(hasAnyAnswer(stats())).toBe(false);
    expect(hasAnyAnswer(stats({ recoveryOk: false }))).toBe(true);
    expect(hasAnyAnswer(stats({ penalties: 0 }))).toBe(true);
});
