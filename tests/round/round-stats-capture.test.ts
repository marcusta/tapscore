import { Signal, effect } from '@basics/core/client/core';
import { beforeEach, expect, mock, test } from 'bun:test';
import { PendingScoreQueue } from '../../src/round/pending-queue';
import { PendingStatQueue } from '../../src/round/pending-stat-queue';
import type { StatModules } from '../../src/round/stat-prompts';

// The service half of player-stats capture — the counterpart of
// `ios/TapScoreTests/Round/RoundStatsCaptureTests.swift`, restricted to what
// lives in `RoundViewService` (the pure model has its own spec in
// `stat-prompts.test.ts`, the queue in `pending-stat-queue.test.ts`).
//
// What is pinned here: who a ball's subject is, what the step opens with
// (server projection, this device's shadow), that answers leave as ONE batch
// per exit and never twice, and — the part with teeth — the classification of a
// failed POST. A transport failure or a 401 keeps its queue place; a genuine
// content refusal drops, and drops ONLY what is actually refused, because the
// server validates a batch all-or-nothing and the queue drains a whole round in
// one request.

type StatItem = {
    playHoleId: string;
    playerId: string;
    key: string;
    value: string | null;
    clientEventId: string;
};

/** Per-call behaviour of `appendEvents`; a test swaps it to fail. */
let appendBehavior: (items: StatItem[]) => void = () => {};
let appendCalls: StatItem[][] = [];

let statConfigs: { playerId: string; modules: StatModules }[] = [];
let statRowsResponse: unknown[] = [];
let statConfigsFail = false;
let statRowsFail = false;

function modules(over: Partial<StatModules> = {}): StatModules {
    return {
        tee: false,
        approach: false,
        putting: false,
        shortGame: false,
        penalties: false,
        recovery: false,
        ...over,
    };
}

const apiMock = {
    setup: { formats: mock(async () => []) },
    friendlyRounds: {
        byToken: mock(async ({ token }: { token: string }) => roundPayload(token)),
        balls: mock(async () => ballsFixture),
        scorecard: mock(async () => scorecardFixture),
        result: mock(async () => null),
        score: mock(async () => ({ accepted: true })),
    },
    playerStats: {
        configsByToken: mock(async () => {
            if (statConfigsFail) throw Object.assign(new Error('nope'), { status: 500 });
            return statConfigs;
        }),
        byToken: mock(async () => {
            if (statRowsFail) throw Object.assign(new Error('nope'), { status: 500 });
            return statRowsResponse;
        }),
        appendEvents: mock(async ({ items }: { token: string; items: StatItem[] }) => {
            appendCalls.push(items);
            appendBehavior(items);
            return { events: [] };
        }),
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { RoundViewService } = await import('../../src/round/round.service');

/** Par 4 then par 3, so the tee prompt's `minPar` gate is exercisable. */
function playHole(id: string, ordinal: number, par: number): unknown {
    return {
        id,
        playHoleDefId: `phd-${ordinal}`,
        ordinal,
        courseHoleNumber: ordinal,
        par,
        baseStrokeIndex: ordinal,
        tees: [],
    };
}

function roundPayload(token: string): unknown {
    return {
        friendlyRound: { id: `fr-${token}`, roundId: `round-${token}`, shareToken: token },
        round: {
            id: `round-${token}`,
            courseNameSnapshot: 'Course',
            completedAt: null,
            date: '2026-07-30',
            status: 'active',
            playHoles: [playHole('ph-1', 1, 4), playHole('ph-2', 2, 3)],
            playingGroups: [],
            formatSlots: [],
        },
    };
}

function member(over: Record<string, unknown> = {}): unknown {
    return {
        producerDefId: 'pd-1',
        playerId: 'p-1',
        guestPlayerId: null,
        displayName: 'Ann',
        handicapIndex: null,
        teeName: null,
        courseHandicap: null,
        pending: false,
        ...over,
    };
}

function ball(id: string, players: unknown[], over: Record<string, unknown> = {}): unknown {
    return { id, label: id, courseHandicap: null, players, slots: [], pending: false, ...over };
}

let ballsFixture: unknown[] = [];

/**
 * The scorecard the round loads with. Empty by default — the GIR derivation
 * needs a SCORE as well as a putt count, so the tests that exercise it put one
 * here and everything else stays underivable, which is what the older cases
 * were written against.
 */
let scorecardFixture: unknown[] = [];

/** A projection row as `GET /friendly-rounds/stats` answers it. */
function statRow(over: Record<string, unknown> = {}): unknown {
    return {
        roundId: 'round-tok',
        playHoleId: 'ph-1',
        playerId: 'p-1',
        teeResult: null,
        gir: null,
        firstPutt: null,
        putts: null,
        shortGameDifficulty: null,
        penalties: null,
        recoveryOk: null,
        ...over,
    };
}

/** Let the fire-and-forget `postStats` chain run to completion. */
async function settle(): Promise<void> {
    for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0));
}

function makeService(queue = new PendingStatQueue(null, Date.now(), idFactory())) {
    return { svc: new RoundViewService(new PendingScoreQueue(null), queue), queue };
}

function idFactory(): () => string {
    let n = 0;
    return () => `sid-${++n}`;
}

const CELL = { playerId: 'p-1', playHoleId: 'ph-1' };

beforeEach(() => {
    appendCalls = [];
    appendBehavior = () => {};
    statConfigsFail = false;
    statRowsFail = false;
    statRowsResponse = [];
    statConfigs = [{ playerId: 'p-1', modules: modules({ approach: true, penalties: true }) }];
    ballsFixture = [ball('ball-1', [member()])];
    scorecardFixture = [{ ballId: 'ball-1', holes: [] }];
    apiMock.playerStats.appendEvents.mockClear();
});

// --- Who is prompted -------------------------------------------------------

test('a one-member ball whose player tracks stats has that player as its subject', async () => {
    const { svc } = makeService();
    await svc.loadByToken('tok');
    expect(svc.statSubject(svc.balls.get()[0]!)).toBe('p-1');
});

test('a guest ball, a two-member ball and a player with no config have no subject', async () => {
    ballsFixture = [
        ball('ball-1', [member({ playerId: null, guestPlayerId: 'g-1' })]),
        ball('ball-2', [member(), member({ producerDefId: 'pd-2', playerId: 'p-2' })]),
        ball('ball-3', [member({ producerDefId: 'pd-3', playerId: 'p-3' })]),
        ball('ball-4', [member()], { pending: true }),
    ];
    const { svc } = makeService();
    await svc.loadByToken('tok');
    const balls = svc.balls.get();
    expect(balls.map((b) => svc.statSubject(b))).toEqual([null, null, null, null]);
});

test('a stats-only round still builds a step, and only the enabled modules appear', async () => {
    const { svc } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    expect(svc.statPrompts().map((p) => p.key)).toEqual(['gir', 'penalties']);
});

// --- Prefill ---------------------------------------------------------------

test('an answered hole prefills from the server projection', async () => {
    statRowsResponse = [statRow({ gir: true, penalties: 2 })];
    const { svc } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    expect(svc.statValue('gir')).toBe('1');
    expect(svc.statValue('penalties')).toBe('2');
    expect(svc.statIsAnswered('penalties')).toBe(true);
});

test('an untouched stepper reads its floor, and does not count as answered', async () => {
    const { svc } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    expect(svc.statStepperValue('penalties', 0)).toBe(0);
    expect(svc.statIsAnswered('penalties')).toBe(false);
});

// --- Flushing --------------------------------------------------------------

test('the whole step leaves as ONE batch, each item carrying its own id', async () => {
    const { svc } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '1');
    svc.stepStat('penalties', 1);
    expect(svc.flushStats()).toBe(true);
    await settle();

    expect(appendCalls).toHaveLength(1);
    expect(appendCalls[0]).toEqual([
        { playHoleId: 'ph-1', playerId: 'p-1', key: 'gir', value: '1', clientEventId: 'sid-1' },
        {
            playHoleId: 'ph-1',
            playerId: 'p-1',
            key: 'penalties',
            value: '1',
            clientEventId: 'sid-2',
        },
    ]);
});

test('a second exit posts nothing — the draft was folded in when it was queued', async () => {
    const { svc } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '1');
    expect(svc.flushStats()).toBe(true);
    await settle();
    // Back chevron, then the keypad close: the same two exits the component wires.
    expect(svc.flushStats()).toBe(false);
    await settle();
    expect(appendCalls).toHaveLength(1);
});

test('moving to another cell flushes the batch the previous one accumulated', async () => {
    const { svc } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '0');
    svc.seedStatStep({ playerId: 'p-1', playHoleId: 'ph-2' });
    await settle();
    expect(appendCalls).toHaveLength(1);
    expect(appendCalls[0]!.map((i) => i.playHoleId)).toEqual(['ph-1']);
});

test('de-selecting a stored answer posts an explicit null, not an omission', async () => {
    statRowsResponse = [statRow({ gir: true })];
    const { svc } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.answerStat('gir', null);
    expect(svc.statValue('gir')).toBeNull();
    svc.flushStats();
    await settle();
    expect(appendCalls[0]).toEqual([
        { playHoleId: 'ph-1', playerId: 'p-1', key: 'gir', value: null, clientEventId: 'sid-1' },
    ]);
});

test('a just-answered hole re-opens from local truth, before any load has confirmed it', async () => {
    const { svc } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '1');
    svc.seedStatStep({ playerId: 'p-1', playHoleId: 'ph-2' });
    await settle();
    // Back to the hole: the server row is still empty, the shadow answers.
    svc.seedStatStep(CELL);
    expect(svc.statValue('gir')).toBe('1');
});

// --- Derived GIR: flush is not a close --------------------------------------
//
// §3.4b rule 1: the derivation fires at step COMPLETION. `flushStats()` is the
// non-closing commit — a foreground refresh, a background hop — and it must NOT
// write the derived answer, because the golfer is still looking at the card and
// a written `gir` prunes the short-game prompts under their thumb. Only
// `closeStatStep()` materialises. Twin of `RoundStatsCaptureTests.swift`.

/** A hole with a score, so `canDeriveGir` can actually run. */
function scoredHole(playHoleId: string, ordinal: number, strokes: number): unknown {
    return {
        playHoleId,
        holeNumber: ordinal,
        courseHoleNumber: ordinal,
        canonicalOrdinal: ordinal,
        occurrenceLabel: String(ordinal),
        strokes,
        recordedBy: null,
        recordedAt: '2026-07-30T00:00:00.000Z',
        sourcePlayerId: null,
        sourceGuestPlayerId: null,
    };
}

/** Par 4 in 4 with 2 putts: 4 − 2 = 2 ≤ 4 − 2, so the derived answer is a GIR. */
function derivableStep() {
    scorecardFixture = [{ ballId: 'ball-1', holes: [scoredHole('ph-1', 1, 4)] }];
    statConfigs = [{ playerId: 'p-1', modules: modules({ approach: true, putting: true }) }];
    return makeService();
}

test('a flush is not a close: the pending derived GIR is not written', async () => {
    const { svc } = derivableStep();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.stepStat('putts', 2);
    expect(svc.statGirState()).toEqual({ state: 'pending', derived: '1' });

    expect(svc.flushStats()).toBe(true);
    await settle();
    expect(appendCalls).toHaveLength(1);
    expect(appendCalls[0]!.map((i) => i.key)).toEqual(['putts']);
    // Still unanswered and still pending — the card the golfer is looking at
    // has not silently acquired a segment.
    expect(svc.statValue('gir')).toBeNull();
    expect(svc.statGirState()).toEqual({ state: 'pending', derived: '1' });
});

test('a close materialises the pending derived GIR into the batch', async () => {
    const { svc } = derivableStep();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.stepStat('putts', 2);

    expect(svc.closeStatStep()).toBe(true);
    await settle();
    expect(appendCalls).toHaveLength(1);
    // Canonical key order, not the order they were touched in.
    expect(appendCalls[0]).toEqual([
        { playHoleId: 'ph-1', playerId: 'p-1', key: 'gir', value: '1', clientEventId: 'sid-1' },
        { playHoleId: 'ph-1', playerId: 'p-1', key: 'putts', value: '2', clientEventId: 'sid-2' },
    ]);
    // Written, not merely inferred: re-reading says persisted, not pending.
    expect(svc.statValue('gir')).toBe('1');
    expect(svc.statGirState()).toEqual({ state: 'persisted' });
});

test('a close after a flush still writes the GIR the flush left pending', async () => {
    const { svc } = derivableStep();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.stepStat('putts', 2);
    svc.flushStats();
    await settle();

    // The keypad closes a moment later. The putt count is already on disk, so
    // this batch is the derived answer alone.
    expect(svc.closeStatStep()).toBe(true);
    await settle();
    expect(appendCalls).toHaveLength(2);
    expect(appendCalls[1]).toEqual([
        { playHoleId: 'ph-1', playerId: 'p-1', key: 'gir', value: '1', clientEventId: 'sid-2' },
    ]);
});

test('a close writes nothing for a step the golfer never used', async () => {
    const { svc } = derivableStep();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    // A score exists, but no putt count — underivable, so there is nothing to
    // materialise and nothing to flush.
    expect(svc.statGirState()).toEqual({ state: 'idle' });
    expect(svc.closeStatStep()).toBe(false);
    await settle();
    expect(appendCalls).toHaveLength(0);
});

test('a close leaves a manually answered GIR alone, derivation or not', async () => {
    const { svc } = derivableStep();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.stepStat('putts', 2);
    // The derivation says `1`; the golfer says otherwise and the tap wins.
    svc.answerStat('gir', '0');
    expect(svc.statGirState()).toEqual({ state: 'manual' });

    expect(svc.closeStatStep()).toBe(true);
    await settle();
    expect(appendCalls).toHaveLength(1);
    expect(appendCalls[0]!.find((i) => i.key === 'gir')!.value).toBe('0');
    expect(appendCalls[0]!.filter((i) => i.key === 'gir')).toHaveLength(1);
});

test('moving off a cell closes it — the previous hole’s derived GIR goes with the batch', async () => {
    const { svc } = derivableStep();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.stepStat('putts', 2);
    svc.seedStatStep({ playerId: 'p-1', playHoleId: 'ph-2' });
    await settle();

    expect(appendCalls).toHaveLength(1);
    expect(appendCalls[0]!.map((i) => i.key)).toEqual(['gir', 'putts']);
    expect(appendCalls[0]!.every((i) => i.playHoleId === 'ph-1')).toBe(true);
});

// --- Failure classification ------------------------------------------------

test('a batch that failed in transit stays queued and goes out again with the same ids', async () => {
    const { svc, queue } = makeService();
    await svc.loadByToken('tok');
    appendBehavior = () => {
        throw Object.assign(new Error('offline'), { status: 500 });
    };
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '1');
    svc.flushStats();
    await settle();

    expect(queue.entriesFor('tok').map((e) => e.key)).toEqual(['gir']);
    const id = queue.entriesFor('tok')[0]!.clientEventId;

    appendBehavior = () => {};
    await svc.flushPendingStats();
    await settle();
    expect(appendCalls).toHaveLength(2);
    expect(appendCalls[1]![0]!.clientEventId).toBe(id);
    expect(queue.entriesFor('tok')).toEqual([]);
});

test('a 401 keeps its queue place — a lapsed session says nothing about the content', async () => {
    const { svc, queue } = makeService();
    await svc.loadByToken('tok');
    appendBehavior = () => {
        throw Object.assign(new Error('unauthorized'), { status: 401 });
    };
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '1');
    svc.stepStat('penalties', 1);
    svc.flushStats();
    await settle();
    expect(appendCalls).toHaveLength(1);
    expect(queue.entriesFor('tok').map((e) => e.key)).toEqual(['gir', 'penalties']);
});

test('a refused single-item batch is dropped rather than retried forever', async () => {
    const { svc, queue } = makeService();
    await svc.loadByToken('tok');
    appendBehavior = () => {
        throw Object.assign(new Error('module off'), { status: 409 });
    };
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '1');
    svc.flushStats();
    await settle();
    expect(queue.entriesFor('tok')).toEqual([]);

    // …and a later answer is not stuck behind the dropped one.
    appendBehavior = () => {};
    svc.stepStat('penalties', 1);
    svc.flushStats();
    await settle();
    expect(appendCalls[1]!.map((i) => i.key)).toEqual(['penalties']);
});

test('one refused item does not condemn the rest of the round: the batch is isolated', async () => {
    const { svc, queue } = makeService();
    await svc.loadByToken('tok');
    // The server validates all-or-nothing, so the batch refusal names nothing
    // the client can act on — only a solo post proves which item is poison.
    appendBehavior = (items) => {
        if (items.some((i) => i.key === 'gir')) {
            throw Object.assign(new Error('module off'), { status: 409 });
        }
    };
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '1');
    svc.stepStat('penalties', 2);
    svc.flushStats();
    await settle();

    // The batch, then each item alone.
    expect(appendCalls.map((c) => c.map((i) => i.key))).toEqual([
        ['gir', 'penalties'],
        ['gir'],
        ['penalties'],
    ]);
    expect(queue.entriesFor('tok')).toEqual([]);
});

test('isolation that hits a transport failure leaves the untried items queued', async () => {
    const { svc, queue } = makeService();
    await svc.loadByToken('tok');
    appendBehavior = (items) => {
        if (items.length > 1) throw Object.assign(new Error('refused'), { status: 409 });
        if (items[0]!.key === 'penalties') throw Object.assign(new Error('down'), { status: 503 });
    };
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '1');
    svc.stepStat('penalties', 2);
    svc.flushStats();
    await settle();

    // `gir` went through on its own; `penalties` could not be reached and keeps
    // its place with its original id.
    expect(queue.entriesFor('tok').map((e) => e.key)).toEqual(['penalties']);
});

// --- Loads ----------------------------------------------------------------

test('a queued answer from a previous page load is replayed on the next load, id intact', async () => {
    const queue = new PendingStatQueue(null, Date.now(), idFactory());
    queue.enqueueBatch('tok', 'ph-1', 'p-1', [{ key: 'penalties', value: '1' }]);
    const { svc } = makeService(queue);
    await svc.loadByToken('tok');
    await settle();

    expect(appendCalls).toHaveLength(1);
    expect(appendCalls[0]![0]).toMatchObject({ clientEventId: 'sid-1', value: '1' });
    // …and it prefills the step it belongs to.
    svc.seedStatStep(CELL);
    expect(svc.statValue('penalties')).toBe('1');
});

test('a degraded refresh keeps the modules, the step and the answers', async () => {
    const { svc } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '0');
    svc.stepStat('penalties', 1);
    const before = svc.statPrompts().map((p) => p.key);

    statConfigsFail = true;
    statRowsFail = true;
    await svc.loadByToken('tok');
    await settle();

    expect(svc.statPrompts().map((p) => p.key)).toEqual(before);
    expect(svc.statValue('gir')).toBe('0');
    expect(svc.statValue('penalties')).toBe('1');
    // The draft was committed on the way through, not merely kept in memory for
    // the next kill to take with it.
    expect(appendCalls[0]!.map((i) => i.key)).toEqual(['gir', 'penalties']);
});

test('a settled local answer yields to a newer server row on the next load', async () => {
    const { svc, queue } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '1');
    svc.flushStats();
    await settle();
    expect(queue.entriesFor('tok')).toEqual([]);
    expect(svc.statValue('gir')).toBe('1');

    // Someone else corrects the hole; the next load carries their row.
    statRowsResponse = [statRow({ gir: false })];
    await svc.loadByToken('tok');
    await settle();
    expect(svc.statValue('gir')).toBe('0');
    // …and yielding is not itself a write.
    expect(appendCalls).toHaveLength(1);
});

test('an unsettled local answer survives a load that landed without it', async () => {
    const { svc, queue } = makeService();
    await svc.loadByToken('tok');
    appendBehavior = () => {
        throw Object.assign(new Error('offline'), { status: 500 });
    };
    svc.seedStatStep(CELL);
    svc.answerStat('gir', '1');
    svc.flushStats();
    await settle();

    // The server has never seen it, so its empty row must not erase it.
    statRowsResponse = [statRow()];
    await svc.loadByToken('tok');
    await settle();
    expect(svc.statValue('gir')).toBe('1');
    expect(queue.entriesFor('tok').map((e) => e.key)).toEqual(['gir']);
});

test('missing stats endpoints degrade to no prompts, not to a broken round', async () => {
    statConfigsFail = true;
    statRowsFail = true;
    const { svc } = makeService();
    await svc.loadByToken('tok');
    expect(svc.error.get()).toBeNull();
    expect(svc.balls.get()).toHaveLength(1);
    svc.seedStatStep(CELL);
    expect(svc.statPrompts()).toEqual([]);
    expect(svc.statSubject(svc.balls.get()[0]!)).toBeNull();
});

// --- Reactivity ------------------------------------------------------------
//
// The keypad seeds the step from a tracked effect that also renders off
// `statRev`, so seeding is on a cycle with its own invalidation. Two rules keep
// that cycle finite, and both were broken at once: the bump must not READ
// `statRev` (that subscribes the seeding effect to the signal it is about to
// write), and a same-cell reseed that changes nothing must not bump at all.

test('reseeding the same cell with nothing changed does not bump the revision', async () => {
    statRowsResponse = [statRow({ gir: true })];
    const { svc } = makeService();
    await svc.loadByToken('tok');
    svc.seedStatStep(CELL);
    const rev = svc.statRev.get();
    svc.seedStatStep(CELL);
    svc.seedStatStep(CELL);
    expect(svc.statRev.get()).toBe(rev);
    // Still bumps when the durable half actually moves.
    svc.answerStat('gir', '0');
    expect(svc.statRev.get()).toBeGreaterThan(rev);
});

test('a seeding effect does not recurse, and does not subscribe itself to the revision', async () => {
    const { svc } = makeService();
    await svc.loadByToken('tok');

    // The keypad's two scopes, kept apart as they are in the component: one
    // effect seeds from round state, a separate one renders off `statRev`.
    const cell = new Signal(CELL);
    let seedRuns = 0;
    let renderRuns = 0;
    const stopSeed = effect(() => {
        seedRuns++;
        svc.seedStatStep(cell.get());
    });
    const stopRender = effect(() => {
        renderRuns++;
        svc.statPrompts();
    });
    expect(seedRuns).toBe(1);

    // A cell change with a draft in hand flushes on the way out, and flushing
    // bumps — the one bump that lands inside the seeding effect's tracked run.
    svc.answerStat('gir', '1');
    cell.set({ playerId: 'p-1', playHoleId: 'ph-2' });
    expect(seedRuns).toBe(2);

    // The seeding effect must not have picked `statRev` up as a dependency from
    // that bump: an answer is a render concern only.
    const seedAfter = seedRuns;
    const renderAfter = renderRuns;
    svc.answerStat('gir', '0');
    expect(renderRuns).toBeGreaterThan(renderAfter);
    expect(seedRuns).toBe(seedAfter);

    stopSeed?.();
    stopRender?.();
});
