import '@basics/core/happy-dom';
import { afterEach, expect, test } from 'bun:test';
import { di } from '@basics/core/client/core';
import { PendingScoreQueue } from '../../src/round/pending-queue';
import { PendingStatQueue } from '../../src/round/pending-stat-queue';
import { ScoreEntryComponent } from '../../src/round/score-entry.component';
import { RoundViewService } from '../../src/round/round.service';
import type { StatModules } from '../../src/round/stat-prompts';

// Fairways and greens captures putts as a FORMAT input — a number, from every
// player in the group, whether or not they track personal stats. The keypad's
// metadata half was boolean-only until then, so these pin the number path:
// the control is the same stepper the stats half uses, an untouched row is
// "not answered" rather than zero, and the persisted blob says which.

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

/** Two balls, one hole (par 4), and the format's own fairway + putts inputs. */
function fixture(service: RoundViewService, opts: { statsFor?: string } = {}) {
    service.round.set({
        id: 'round-1',
        courseId: 'course-1',
        name: null,
        visibility: 'friends',
        date: '2026-08-04',
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
                playedOrder: [{ playHoleId: 'ph-1', ordinal: 1, courseHoleNumber: 1, groupRelativeOrder: 1 }],
            },
        ],
    });
    service.balls.set([ball('b-1', 'p-1', 'Player one'), ball('b-2', 'p-2', 'Player two')]);
    service.scorecards.set([
        { ballId: 'b-1', holes: [] },
        { ballId: 'b-2', holes: [] },
    ]);
    service.statModules.set(opts.statsFor ? new Map([[opts.statsFor, statModules]]) : new Map());
    // Stubbed at the service seam (as the sibling stats test does) so this stays
    // a keypad test, not a format-registration one.
    service.metadataInputsForHole = () => [
        { key: 'fairway', label: 'Fairway', kind: 'boolean', appliesWhen: { minPar: 4 } },
        { key: 'putts', label: 'Putts', kind: 'number', min: 0, max: 3 },
    ];
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

function group(label: string): Element {
    const found = [...document.querySelectorAll('.se-stats__group')].find(
        (g) => g.querySelector('[bind="glabel"]')?.textContent === label,
    );
    expect(found).toBeTruthy();
    return found!;
}

/**
 * Record every score write so the persisted metadata blob can be asserted. The
 * real method still runs — a later metadata write re-sends the strokes it reads
 * back out of the scorecard, so a stub that skips the optimistic update would
 * silently swallow every write after the first.
 */
function captureWrites(service: RoundViewService): Record<string, unknown>[] {
    const seen: Record<string, unknown>[] = [];
    const original = service.setScore.bind(service);
    service.setScore = async (ballId, playHoleId, strokes, metadata) => {
        if (metadata) seen.push(metadata);
        return original(ballId, playHoleId, strokes, metadata);
    };
    return seen;
}

afterEach(() => {
    document.body.replaceChildren();
    di.reset();
});

test('a number metadata input renders as a stepper, dimmed until answered', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    click(document.querySelector('.se-row__circle'));
    click(scoreKey('4'));

    const putts = group('Putts');
    const val = putts.querySelector('[bind="val"]')!;
    // The floor is shown, but marked as nobody's answer.
    expect(val.textContent).toBe('0');
    expect(val.className).toContain('unanswered');
    expect(val.getAttribute('aria-label')).toBe('Putts not answered');

    // The boolean input in the same round still gets the Miss/Hit pair.
    expect(group('Fairway').querySelector('.se-stats__seg')).not.toBeNull();
    component.destroy();
});

test('stepping answers the input, clamps to its declared bounds, and shows the cap as "3+"', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    click(document.querySelector('.se-row__circle'));
    click(scoreKey('4'));

    const putts = group('Putts');
    const val = putts.querySelector('[bind="val"]')!;
    const plus = putts.querySelector('[bind="plus"]')!;
    const minus = putts.querySelector('[bind="minus"]')!;

    // Any nudge answers the input, so "0 putts" is one tap of `−` — the same
    // rule (and the same first-tap feel) as the stats stepper beside it.
    click(minus);
    expect(val.textContent).toBe('0');
    expect(val.className).not.toContain('unanswered');
    expect(val.getAttribute('aria-label')).toBe('Putts 0');

    click(plus);
    click(plus);
    expect(val.textContent).toBe('2');
    click(plus);
    click(plus);
    // Capped at the declared max, where 3 means "3 or more".
    expect(val.textContent).toBe('3+');
    click(minus);
    expect(val.textContent).toBe('2');
    component.destroy();
});

test('the persisted blob carries the number, and an explicit null while untouched', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);
    const writes = captureWrites(service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    click(document.querySelector('.se-row__circle'));
    click(scoreKey('4'));

    // The score itself goes out with both keys declared: the toggle false, the
    // untouched number null — never 0, which would claim a fact.
    expect(writes[0]).toEqual({ fairway: false, putts: null });

    const putts = group('Putts');
    click(putts.querySelector('[bind="plus"]')!);
    click(putts.querySelector('[bind="plus"]')!);
    click(group('Fairway').querySelector('[bind="hit"]')!);

    expect(writes.at(-1)).toEqual({ fairway: true, putts: 2 });
    component.destroy();
});

test('a player who tracks putting answers once — the stats prompt drives the format channel', () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service, { statsFor: 'p-1' });
    di.set(RoundViewService, service);
    const writes = captureWrites(service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);
    click(document.querySelector('.se-row__circle'));
    click(scoreKey('4'));

    // ONE Putts row on the plate: the stats prompt. The format's duplicate is
    // filtered out, and its answer is mirrored across.
    const puttsRows = [...document.querySelectorAll('.se-stats__group')].filter(
        (g) => g.querySelector('[bind="glabel"]')?.textContent === 'Putts',
    );
    expect(puttsRows).toHaveLength(1);

    const plus = puttsRows[0]!.querySelector('[bind="plus"]')!;
    click(plus);
    click(plus);
    expect(writes.at(-1)).toMatchObject({ putts: 2 });
    component.destroy();
});
