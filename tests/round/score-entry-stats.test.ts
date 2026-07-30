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
