import '@basics/core/happy-dom';
import { afterEach, expect, test } from 'bun:test';
import { di } from '@basics/core/client/core';
import { PendingScoreQueue } from '../../src/round/pending-queue';
import { PendingStatQueue } from '../../src/round/pending-stat-queue';
import { ScoreEntryComponent } from '../../src/round/score-entry.component';
import { RoundViewService } from '../../src/round/round.service';
import type { StatModules } from '../../src/round/stat-prompts';

// Regression: Umbrella needs a GIR decision for every own ball, but personal
// stats belong only to the player who opted in. The web keypad must therefore
// discard the previous player's stat step synchronously when it advances to
// the next ball, before that player's detail sheet can render.

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
        date: '2026-07-30',
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
                ballIds: ['b-1', 'b-2', 'b-3', 'b-4'],
                playedOrder: [
                    { playHoleId: 'ph-1', ordinal: 1, courseHoleNumber: 1, groupRelativeOrder: 1 },
                ],
            },
        ],
    });
    service.balls.set([
        ball('b-1', 'p-1', 'Stats player'),
        ball('b-2', 'p-2', 'Player two'),
        ball('b-3', 'p-3', 'Player three'),
        ball('b-4', 'p-4', 'Player four'),
    ]);
    service.scorecards.set([
        { ballId: 'b-1', holes: [] },
        { ballId: 'b-2', holes: [] },
        { ballId: 'b-3', holes: [] },
        { ballId: 'b-4', holes: [] },
    ]);
    service.statModules.set(new Map([['p-1', statModules]]));
    // Umbrella's per-ball scoring requirement. Stubbed at the service seam so
    // this DOM test stays about the keypad, not format registration.
    service.metadataInputsForHole = () => [{ key: 'gir', label: 'Green in regulation', kind: 'boolean' }];
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

afterEach(() => {
    document.body.replaceChildren();
    di.reset();
});

test('Umbrella gives opt-out players only GIR after an opted-in player completes details', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);

    expect(document.body.innerHTML).toContain('se-row__circle');
    click(document.querySelector('.se-row__circle'));
    click(scoreKey('4'));
    expect(document.querySelector('.se-stats__body')?.textContent).toContain('Tee shot');

    click(document.querySelector('[bind="statsNext"]'));
    for (let player = 2; player <= 4; player++) {
        click(scoreKey('4'));
        const detail = document.querySelector('.se-stats__body')?.textContent ?? '';
        expect(detail).toContain('Green in regulation');
        expect(detail).not.toContain('Tee shot');
        expect(detail).not.toContain('Putts');
        if (player < 4) click(document.querySelector('[bind="statsNext"]'));
    }
    component.destroy();
});

// A screen reader must hear which chip is chosen, not just see the tint. The
// chips are toggle buttons (aria-pressed), not radios: tap-again-to-deselect
// makes "no selection" a legal state, which role=radio cannot express.
test('stat chips carry aria-pressed that follows select and deselect', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    click(document.querySelector('.se-row__circle'));
    click(scoreKey('4'));

    const girGroup = [...document.querySelectorAll('.se-stats__group')].find(
        (g) => g.querySelector('[bind="glabel"]')?.textContent === 'Green in regulation',
    )!;
    const segs = [...girGroup.querySelectorAll('[bind="seg"] .se-seg')];
    expect(segs.length).toBe(2);
    // Untouched: nothing pressed.
    for (const seg of segs) expect(seg.getAttribute('aria-pressed')).toBe('false');

    const hit = segs.find((s) => s.textContent === 'Hit')!;
    const miss = segs.find((s) => s.textContent === 'Miss')!;
    click(hit);
    expect(hit.getAttribute('aria-pressed')).toBe('true');
    expect(miss.getAttribute('aria-pressed')).toBe('false');

    // The visual state and the spoken state are the same fact.
    expect(hit.className).toContain('on-neutral');

    // Tap again de-selects: back to "did not answer", spoken as un-pressed.
    click(hit);
    for (const seg of segs) expect(seg.getAttribute('aria-pressed')).toBe('false');
    component.destroy();
});

// The format's own Miss/Hit pair has the same duty. Its default is Miss (a
// boolean metadata answer, not a stat), so Miss is pressed from the start.
test('format meta chips carry aria-pressed mirroring the tinted chip', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    click(document.querySelector('.se-row__circle'));
    // Score player one and step past their stat card; player two has no stats
    // opt-in, so their card shows the format's GIR chip pair.
    click(scoreKey('4'));
    click(document.querySelector('[bind="statsNext"]'));
    click(scoreKey('4'));

    const miss = document.querySelector('[bind="miss"]')!;
    const hit = document.querySelector('[bind="hit"]')!;
    expect(miss.getAttribute('aria-pressed')).toBe('true');
    expect(hit.getAttribute('aria-pressed')).toBe('false');

    click(hit);
    expect(miss.getAttribute('aria-pressed')).toBe('false');
    expect(hit.getAttribute('aria-pressed')).toBe('true');
    component.destroy();
});

// Capture v2, §D.4: explanation lives behind ONE worded trigger. The cards on
// the step stay wordless, and no prompt grows a glyph.
test('the stats step carries a worded explainer trigger, not a paragraph per row', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    click(document.querySelector('.se-row__circle'));
    click(scoreKey('4'));

    const trigger = document.querySelector('[bind="statExplain"]');
    expect(trigger?.textContent).toBe('What these mean');
    // Closed until asked for.
    expect(document.querySelector('[bind="infoSheet"]')?.className).toContain('hidden');

    click(trigger);
    const sheet = document.querySelector('[bind="infoSheet"]');
    expect(sheet?.className).not.toContain('hidden');
    const cards = document.querySelectorAll('[bind="infoCards"] [bind="ctext"]');
    // One card per VISIBLE prompt, and every one of them has real words.
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) expect((card.textContent ?? '').length).toBeGreaterThan(20);
    expect(document.querySelector('[bind="infoTitle"]')?.textContent).toBe('What these mean');

    click(document.querySelector('[bind="infoDone"]'));
    expect(document.querySelector('[bind="infoSheet"]')?.className).toContain('hidden');
    component.destroy();
});

// §B.5: an unanswered GIR the scorecard can settle says so, in words, next to
// the untouched segments — it does not pre-select an answer.
test('a derivable GIR announces itself instead of pre-selecting', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    click(document.querySelector('.se-row__circle'));
    click(scoreKey('4'));

    // Two putts on a par 4 scored 4 — the card can work GIR out on its own.
    const steppers = [...document.querySelectorAll('.se-stats__group')].filter((g) =>
        g.querySelector('.se-stats__step'),
    );
    const putts = steppers.find(
        (g) => g.querySelector('[bind="glabel"]')?.textContent === 'Putts',
    )!;
    const plus = putts.querySelector('[bind="plus"]')!;
    click(plus);
    click(plus);

    const girGroup = [...document.querySelectorAll('.se-stats__group')].find(
        (g) => g.querySelector('[bind="glabel"]')?.textContent === 'Green in regulation',
    )!;
    const note = girGroup.querySelector('[bind="gnote"]')!;
    expect(note.className).not.toContain('hidden');
    expect(note.textContent).toBe('Will be filled in from your score when you close this.');
    // No segment is selected — the derivation has not fired yet, and a
    // pre-selected answer would be an answer the golfer never gave.
    const segs = girGroup.querySelectorAll('[bind="seg"] .se-seg');
    expect(segs.length).toBe(2);
    for (const seg of segs) expect(seg.className).not.toContain('on-neutral');
    component.destroy();
});
