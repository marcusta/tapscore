import '@basics/core/happy-dom';
import { afterEach, expect, test } from 'bun:test';
import { di } from '@basics/core/client/core';
import { PendingScoreQueue } from '../../src/round/pending-queue';
import { PendingStatQueue } from '../../src/round/pending-stat-queue';
import { ScoreEntryComponent } from '../../src/round/score-entry.component';
import { RoundViewService } from '../../src/round/round.service';
import { HOLE_ADVANCE_DELAY_MS } from '../../src/round/advance-policy';

// Advance-policy CALLER CONTRACT #7: a LANDED auto-jump closes the keypad, so
// the group is handed back to the score view standing on the next hole. A
// correction visit answers `stay` and must leave the keypad exactly where it
// is — the two halves of that rule are the two tests below.

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

function hole(id: string, ordinal: number) {
    return {
        id,
        playHoleDefId: `phd-${ordinal}`,
        ordinal,
        courseHoleNumber: ordinal,
        par: 4,
        baseStrokeIndex: ordinal,
        tees: [],
    };
}

/** Two holes, two balls, no stats of any kind — the plain advance path. */
function fixture(service: RoundViewService) {
    service.round.set({
        id: 'round-1',
        courseId: 'course-1',
        name: null,
        visibility: 'friends',
        date: '2026-08-23',
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
        playHoles: [hole('ph-1', 1), hole('ph-2', 2)],
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
                endPlayHoleId: 'ph-2',
                endOrdinal: 2,
                ballIds: ['b-1', 'b-2'],
                playedOrder: [
                    { playHoleId: 'ph-1', ordinal: 1, courseHoleNumber: 1, groupRelativeOrder: 1 },
                    { playHoleId: 'ph-2', ordinal: 2, courseHoleNumber: 2, groupRelativeOrder: 2 },
                ],
            },
        ],
    });
    service.balls.set([ball('b-1', 'p-1', 'Player one'), ball('b-2', 'p-2', 'Player two')]);
    service.scorecards.set([
        { ballId: 'b-1', holes: [] },
        { ballId: 'b-2', holes: [] },
    ]);
    service.metadataInputsForHole = () => [];
}

/** Hole 1 already in the book — what makes the second visit a correction. */
function scored(strokes: number) {
    return {
        playHoleId: 'ph-1',
        holeNumber: 1,
        courseHoleNumber: 1,
        canonicalOrdinal: 1,
        occurrenceLabel: '1',
        strokes,
        recordedBy: null,
        recordedAt: '2026-08-23T10:00:00.000Z',
        sourcePlayerId: null,
        sourceGuestPlayerId: null,
        metadata: null,
    };
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

function modalHidden(): boolean {
    return (document.querySelector('.se-modal')?.className ?? '').includes('hidden');
}

/** Let the real 700ms advance timer fire. */
const afterTheJump = () =>
    new Promise((resolve) => setTimeout(resolve, HOLE_ADVANCE_DELAY_MS + 100));

afterEach(() => {
    document.body.replaceChildren();
    di.reset();
});

test('a landed auto-jump closes the keypad on the next hole', async () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);

    click(document.querySelector('.se-row__circle'));
    expect(modalHidden()).toBe(false);

    click(scoreKey('4'));
    click(scoreKey('5'));
    // The pause is the confirmation — the keypad is still up during it.
    expect(modalHidden()).toBe(false);

    await afterTheJump();

    expect(modalHidden()).toBe(true);
    // The jump still happened: reopening resumes on hole 2, not hole 1.
    expect(service.currentPlayedHole()?.playHoleId).toBe('ph-2');
    component.destroy();
});

test('correcting an already-scored hole leaves the keypad open', async () => {
    const service = new RoundViewService(new PendingScoreQueue(null), new PendingStatQueue(null));
    fixture(service);
    service.scorecards.set([
        { ballId: 'b-1', holes: [scored(4)] },
        { ballId: 'b-2', holes: [scored(5)] },
    ]);
    di.set(RoundViewService, service);

    const component = new ScoreEntryComponent();
    component.mount(document.body);

    click(document.querySelector('.se-row__circle'));
    click(scoreKey('6'));

    await afterTheJump();

    expect(modalHidden()).toBe(false);
    expect(service.currentPlayedHole()?.playHoleId).toBe('ph-1');
    component.destroy();
});
