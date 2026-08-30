import '@basics/core/happy-dom';
import { afterEach, expect, test } from 'bun:test';
import { di } from '@basics/core/client/core';
import { PendingScoreQueue } from '../../src/round/pending-queue';
import { PendingStatQueue } from '../../src/round/pending-stat-queue';
import { ScoreEntryComponent } from '../../src/round/score-entry.component';
import { RoundViewService } from '../../src/round/round.service';
import type { StatModules } from '../../src/round/stat-prompts';

// Capture v2, the two rows the pure model added and the component had to learn:
//
//  1. `first_putt_m` — a refinement of the selected bucket. The model hands it
//     over with an EMPTY label, which must not become an empty heading, an
//     unnamed group or an untitled explainer card.
//  2. `shortGameDisclosure() === 'collapsed'` — the two short-game prompts fold
//     behind one worded row on a green hit in regulation, and the fold reopens
//     closed on the next (ball, hole).
//
// `green_miss_dir`'s fifth option is in here too as a regression: it renders
// with no component change at all.

const statModules: StatModules = {
    tee: true,
    approach: true,
    putting: true,
    shortGame: true,
    penalties: true,
    recovery: true,
};

function ball(id: string, playerId: string, displayName: string) {
    return {
        id,
        label: null,
        courseHandicap: null,
        players: [
            {
                producerDefId: `pd-${id}`,
                playerId,
                guestPlayerId: null,
                displayName,
                handicapIndex: null,
                teeName: null,
                courseHandicap: null,
                pending: false,
            },
        ],
        slots: [],
        pending: false,
    };
}

function fixture(service: RoundViewService) {
    service.round.set({
        id: 'round-1',
        courseId: 'course-1',
        name: null,
        visibility: 'friends',
        date: '2026-08-30',
        roundType: 'full_18',
        venueType: 'outdoor',
        startListMode: 'structured',
        windowStart: null,
        windowEnd: null,
        selfOrganize: false,
        status: 'active',
        latestEventId: null,
        courseNameSnapshot: 'Course',
        completedAt: null,
        formatSlots: [],
        playHoles: [
            {
                id: 'ph-1',
                playHoleDefId: 'phd-1',
                ordinal: 1,
                courseHoleNumber: 1,
                par: 4,
                baseStrokeIndex: 1,
                tees: [],
            },
        ],
        routeSi: { mode: 'official', sourceLabel: null, sourceVersion: null, allocationCycleSize: 18 },
        routeHandicapPolicy: { type: 'official_route', postingEligible: true, postingIneligibleReason: null },
        routeSections: [],
        playingGroups: [
            {
                id: 'group-1',
                startTime: '10:00',
                capacity: 4,
                hittingBay: null,
                startPlayHoleId: 'ph-1',
                startOrdinal: 1,
                endPlayHoleId: 'ph-1',
                endOrdinal: 1,
                ballIds: ['b-1', 'b-2'],
                playedOrder: [
                    { playHoleId: 'ph-1', ordinal: 1, courseHoleNumber: 1, groupRelativeOrder: 1 },
                ],
            },
        ],
    });
    service.balls.set([ball('b-1', 'p-1', 'Stats player'), ball('b-2', 'p-2', 'Second player')]);
    service.scorecards.set([
        { ballId: 'b-1', holes: [] },
        { ballId: 'b-2', holes: [] },
    ]);
    // Both players track everything, so a ball hop is a cell change and nothing
    // else — the fold must still close on it.
    service.statModules.set(
        new Map([
            ['p-1', statModules],
            ['p-2', statModules],
        ]),
    );
    service.metadataInputsForHole = () => [];
}

function click(el: Element | null) {
    expect(el).not.toBeNull();
    el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function scoreKey(value: string): Element | null {
    return (
        [...document.querySelectorAll('.se-key')].find(
            (key) => key.querySelector('.se-key__num')?.textContent === value,
        ) ?? null
    );
}

/** The labelled group whose heading reads exactly `label`. */
function group(label: string): Element | null {
    return (
        [...document.querySelectorAll('.se-stats__group')].find(
            (g) => g.querySelector('[bind="glabel"]')?.textContent === label,
        ) ?? null
    );
}

function chips(host: Element | null): string[] {
    return [...(host?.querySelectorAll('[bind="seg"] .se-seg') ?? [])].map(
        (b) => b.textContent ?? '',
    );
}

function chip(host: Element | null, label: string): Element | null {
    return (
        [...(host?.querySelectorAll('[bind="seg"] .se-seg') ?? [])].find(
            (b) => b.textContent === label,
        ) ?? null
    );
}

function subGroup(): Element | null {
    return document.querySelector('.se-stats__group--sub');
}

/**
 * The narrowing classes on every chip of a row. `tighter` contains `tight`, so
 * these have to be compared as whole class names, never as substrings.
 */
function narrowing(host: Element | null): string[][] {
    return [...(host?.querySelectorAll('[bind="seg"] .se-seg') ?? [])].map((b) =>
        b.className.split(/\s+/).filter((c) => c === 'tight' || c === 'tighter'),
    );
}

function bodyText(): string {
    return document.querySelector('.se-stats__body')?.textContent ?? '';
}

/** Open the keypad and score the current ball, landing on the stats step. */
function openStatsStep(strokes: string) {
    click(document.querySelector('.se-row__circle'));
    click(scoreKey(strokes));
}

afterEach(() => {
    document.body.replaceChildren();
    di.reset();
});

test('the metre refinement renders under its bucket, label-free but named', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');

    // Nothing to refine until a bucket is chosen.
    expect(subGroup()).toBeNull();

    const firstPutt = group('First putt');
    expect(chips(firstPutt)).toEqual(['< 1m', '1–2m', '2–4m', '4–8m', '> 8m']);
    click(chip(firstPutt, '2–4m'));

    const sub = subGroup();
    expect(sub).not.toBeNull();
    // Directly under the row it refines, and nowhere else.
    expect(firstPutt!.nextElementSibling).toBe(sub!);
    expect(document.querySelectorAll('.se-stats__group--sub').length).toBe(1);
    expect(chips(sub)).toEqual(['2.5m', '3m', '3.5m', '4m']);

    // No heading element at all — an empty one would be a heading that says
    // nothing. The accessible name lives on the group instead.
    expect(sub!.querySelector('[bind="glabel"]')).toBeNull();
    expect(sub!.querySelector('[bind="seg"]')?.getAttribute('aria-label')).toBe(
        'First putt, exact distance',
    );
    expect(sub!.querySelector('[bind="seg"]')?.getAttribute('role')).toBe('group');

    // A tap selects, and re-tapping the selection is still the way back out.
    click(chip(sub, '3m'));
    expect(chip(subGroup(), '3m')?.className).toContain('on-neutral');
    expect(service.statValue('first_putt_m')).toBe('3');
    click(chip(subGroup(), '3m'));
    expect(service.statValue('first_putt_m')).toBeNull();
    component.destroy();
});

test('the widest bucket keeps its five metre chips narrowed to the plate', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');
    click(chip(group('First putt'), '> 8m'));

    const sub = subGroup();
    expect(chips(sub)).toEqual(['10m', '12m', '14m', '16m', '20+']);
    // Narrowed like the five buckets above it, and no further: '20+' and '10m'
    // are short enough to read at the tight size, so no metre row is `tighter`.
    for (const classes of narrowing(sub)) expect(classes).toEqual(['tight']);

    // Changing the bucket re-draws the row for the new range; a metre from the
    // old one is not an answer here (the model prunes it).
    click(chip(group('First putt'), '1–2m'));
    expect(chips(subGroup())).toEqual(['1m', '1.5m', '2m']);
    component.destroy();
});

test('the metre row gets a real explainer card title', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');
    click(chip(group('First putt'), '2–4m'));
    click(document.querySelector('[bind="statExplain"]'));

    const cards = [...document.querySelectorAll('[bind="infoCards"] .stats-info__card')];
    const titles = cards.map((c) => c.querySelector('[bind="ctitle"]')?.textContent ?? '');
    // No card is untitled, and the refinement's card is named.
    for (const title of titles) expect(title.length).toBeGreaterThan(0);
    expect(titles).toContain('Exact distance');

    const card = cards.find((c) => c.querySelector('[bind="ctitle"]')?.textContent === 'Exact distance');
    expect(card?.querySelector('[bind="ctext"]')?.textContent).toContain('exact distance');
    component.destroy();
});

// The row and its fifth option are pure-model work; the component draws them
// with no change of its own. This is the proof of that claim.
test('Approach carries five options ending in On green, unchanged', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('5');

    // Approach is only asked once the green is a miss.
    expect(group('Approach')).toBeNull();
    click(chip(group('Green in regulation'), 'Miss'));
    const approach = group('Approach');
    expect(chips(approach)).toEqual(['Long', 'Short', 'Left', 'Right', 'On green']);
    // The one row that needs the second step down: 'On green' is 68px at the
    // tight size inside a ~62px chip on a 375px plate.
    for (const classes of narrowing(approach)) expect(classes).toEqual(['tight', 'tighter']);
    expect(approach!.querySelector('[bind="seg"]')?.getAttribute('aria-label')).toBe('Approach');
    component.destroy();
});

test('a green hit in regulation folds the short game behind one worded row', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');

    // Untouched GIR says nothing about a short-game shot: no rows, no fold.
    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    expect(bodyText()).not.toContain('Short game');

    click(chip(group('Green in regulation'), 'Hit'));
    expect(service.statShortGameDisclosure()).toBe('collapsed');
    const disclose = document.querySelector('.se-stats__disclose');
    expect(disclose?.textContent).toBe('Add short game');
    expect(group('Short game')).toBeNull();
    expect(group('Shots to the green')).toBeNull();
    // The stand-in sits where the pair would: after the approach half, before
    // the putting half.
    expect(bodyText().indexOf('Add short game')).toBeGreaterThan(
        bodyText().indexOf('Green in regulation'),
    );
    expect(bodyText().indexOf('Add short game')).toBeLessThan(bodyText().indexOf('First putt'));
    // Folded away means folded away everywhere — the sheet reads the card.
    click(document.querySelector('[bind="statExplain"]'));
    const titles = [...document.querySelectorAll('[bind="infoCards"] [bind="ctitle"]')].map(
        (c) => c.textContent,
    );
    expect(titles).not.toContain('Short game');
    click(document.querySelector('[bind="infoDone"]'));

    click(disclose);
    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    expect(group('Short game')).not.toBeNull();
    expect(group('Shots to the green')).not.toBeNull();
    component.destroy();
});

test('a missed green renders the short game with no fold at all', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('5');
    click(chip(group('Green in regulation'), 'Miss'));

    expect(service.statShortGameDisclosure()).toBe('none');
    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    expect(group('Short game')).not.toBeNull();
    expect(group('Shots to the green')).not.toBeNull();
    component.destroy();
});

test('an answered short game stays open, with no fold to close', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');
    click(chip(group('Green in regulation'), 'Hit'));
    click(document.querySelector('.se-stats__disclose'));
    click(chip(group('Short game'), 'Bunker'));

    // The value is what holds the rows open now, not the transient tap.
    expect(service.statShortGameDisclosure()).toBe('expanded');
    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    expect(group('Short game')).not.toBeNull();
    component.destroy();
});

// The narrowing rule in one test: four or more chips are tight, and the second
// step down is spent only where a long label needs it.
test('the second narrowing step goes to the long labels and nowhere else', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('5');

    // Five short buckets: tight is enough.
    for (const classes of narrowing(group('First putt'))) expect(classes).toEqual(['tight']);
    // Five options, one of them a two-word label.
    click(chip(group('Green in regulation'), 'Miss'));
    for (const classes of narrowing(group('Approach')))
        expect(classes).toEqual(['tight', 'tighter']);
    // Two options: neither.
    for (const classes of narrowing(group('Green in regulation'))) expect(classes).toEqual([]);
    component.destroy();
});

test('a three-option bucket leaves the narrowing classes off', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');
    click(chip(group('First putt'), '1–2m'));

    const sub = subGroup();
    expect(chips(sub)).toEqual(['1m', '1.5m', '2m']);
    for (const classes of narrowing(sub)) expect(classes).toEqual([]);

    // Five metre chips are narrowed once, not twice — they already fit.
    click(chip(group('First putt'), '> 8m'));
    for (const classes of narrowing(subGroup())) expect(classes).toEqual(['tight']);
    component.destroy();
});

// The fold must never collapse under the finger. Clearing a short-game value
// is exactly the moment the model drops back to 'collapsed', and the rows the
// golfer is tapping in would vanish if the view followed it literally.
test('clearing a short-game value leaves the rows standing', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('5');

    // Reached WITHOUT a disclosure tap: a missed green shows the rows outright.
    click(chip(group('Green in regulation'), 'Miss'));
    click(chip(group('Short game'), 'Bunker'));
    click(chip(group('Green in regulation'), 'Hit'));
    expect(document.querySelector('.se-stats__disclose')).toBeNull();

    // Re-tap to deselect: the model says 'collapsed' again, the view does not.
    click(chip(group('Short game'), 'Bunker'));
    expect(service.statValue('short_game_difficulty')).toBeNull();
    expect(service.statShortGameDisclosure()).toBe('collapsed');
    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    expect(group('Short game')).not.toBeNull();
    expect(group('Shots to the green')).not.toBeNull();
    component.destroy();
});

// A refresh landing mid-visit is the other way the rows can appear without a
// disclosure tap: the step re-reads its durable half under the SAME cell, so
// nothing re-seeds the fold. The rows are on screen all the same, and clearing
// the value they arrived with must not pull them away.
test('a mid-visit refresh that reveals the pair leaves it standing when cleared', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');
    click(chip(group('Green in regulation'), 'Hit'));
    expect(document.querySelector('.se-stats__disclose')).not.toBeNull();

    // What a background load does: new rows, then a re-read of the open step.
    service.statRows.set([
        {
            roundId: 'round-1',
            playHoleId: 'ph-1',
            playerId: 'p-1',
            teeResult: null,
            teeMissDir: null,
            gir: true,
            greenMissDir: null,
            firstPutt: null,
            firstPuttM: null,
            putts: null,
            shortGameDifficulty: 'bunker',
            shortGameStrokes: null,
            penalties: null,
            penaltySource: null,
            recoveryOk: null,
        },
    ]);
    (service as unknown as { refreshStatStep(): void }).refreshStatStep();

    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    expect(group('Short game')).not.toBeNull();

    click(chip(group('Short game'), 'Bunker'));
    expect(service.statValue('short_game_difficulty')).toBeNull();
    expect(service.statShortGameDisclosure()).toBe('collapsed');
    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    expect(group('Short game')).not.toBeNull();
    component.destroy();
});

test('a hole that arrives with a short game opens unfolded and stays that way', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    // Captured earlier and read back from the server: gir hit, chip recorded.
    service.statRows.set([
        {
            roundId: 'round-1',
            playHoleId: 'ph-1',
            playerId: 'p-1',
            teeResult: null,
            teeMissDir: null,
            gir: true,
            greenMissDir: null,
            firstPutt: null,
            firstPuttM: null,
            putts: null,
            shortGameDifficulty: 'bunker',
            shortGameStrokes: null,
            penalties: null,
            penaltySource: null,
            recoveryOk: null,
        },
    ]);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');

    expect(service.statShortGameDisclosure()).toBe('expanded');
    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    expect(group('Short game')).not.toBeNull();

    // Clearing the value that seeded it open must not take the rows away.
    click(chip(group('Short game'), 'Bunker'));
    expect(service.statShortGameDisclosure()).toBe('collapsed');
    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    expect(group('Short game')).not.toBeNull();
    component.destroy();
});

test('reopening the keypad on the same hole reopens the fold as the values left it', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    // Closing the keypad COMMITS the step, and a commit is token-scoped: without
    // a write token nothing is kept and the reopened hole would be blank for
    // reasons that have nothing to do with the fold.
    (service as unknown as { token: string | null }).token = 'tok-1';
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');
    click(chip(group('Green in regulation'), 'Hit'));
    click(document.querySelector('.se-stats__disclose'));
    click(chip(group('Short game'), 'Bunker'));

    // Close by the ✕ and come straight back to the same ball and hole.
    click(document.querySelector('.se-modal__close'));
    openStatsStep('4');
    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    expect(group('Short game')).not.toBeNull();

    // The transient tap alone does not survive the close: clear the value and
    // reopen, and the hole is folded again.
    click(chip(group('Short game'), 'Bunker'));
    click(document.querySelector('.se-modal__close'));
    openStatsStep('4');
    expect(document.querySelector('.se-stats__disclose')?.textContent).toBe('Add short game');
    expect(group('Short game')).toBeNull();
    component.destroy();
});

// The legitimate vanish, and the one case that must NOT be sticky: an answer
// that rules the short game out entirely.
test('On green removes the short-game rows outright, fold or no fold', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('5');
    click(chip(group('Green in regulation'), 'Miss'));
    click(chip(group('Short game'), 'Bunker'));
    expect(group('Short game')).not.toBeNull();

    click(chip(group('Approach'), 'On green'));
    expect(service.statShortGameDisclosure()).toBe('none');
    expect(group('Short game')).toBeNull();
    expect(group('Shots to the green')).toBeNull();
    // Contradicted, not folded — there is nothing to unfold.
    expect(document.querySelector('.se-stats__disclose')).toBeNull();
    component.destroy();
});

test('tapping the fold open moves focus onto the revealed pair', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');
    click(chip(group('Green in regulation'), 'Hit'));
    click(document.querySelector('.se-stats__disclose'));

    const first = group('Short game')?.querySelector('.se-seg') ?? null;
    expect(first).not.toBeNull();
    expect(document.activeElement).toBe(first);
    component.destroy();
});

test('the fold closes again on the next ball', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    openStatsStep('4');
    click(chip(group('Green in regulation'), 'Hit'));
    click(document.querySelector('.se-stats__disclose'));
    expect(group('Short game')).not.toBeNull();

    // Next ball: a different (player, hole) cell, so the tap does not carry.
    click(document.querySelector('[bind="statsNext"]'));
    click(scoreKey('4'));
    click(chip(group('Green in regulation'), 'Hit'));
    expect(document.querySelector('.se-stats__disclose')?.textContent).toBe('Add short game');
    expect(group('Short game')).toBeNull();
    component.destroy();
});
