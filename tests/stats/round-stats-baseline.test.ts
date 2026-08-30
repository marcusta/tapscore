// A real DOM: this is a WIRING test, and the only place the wiring exists is
// the props `RoundStatsComponent` hands `StatsPanelsComponent`. Asserting it
// any other way — calling `panelInfoCards` with a baseline the test supplies
// itself — would pass with the bug still in the file.
import '@basics/core/happy-dom';
import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { Router, Signal, di } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ZERO_MEASURES } from '../../src/round/stat-measures';
import type { PlayerRoundHoleStats, PlayerRoundStats } from '../../src/api/player-stats.gen';

// THE BUG THIS PINS: the per-round screen priced its ladder with the
// dashboard's selected cohort (`RoundStatsService.model` reads
// `dashboard.sgBundle`) but told the reader it was priced against the shipping
// default, because the panels were spawned with a frozen
// `DEFAULT_SG_BASELINE_INFO`. Costs from one table under a sentence naming
// another is the worst kind of wrong: confident, and invisible.

const measures = {
    ...ZERO_MEASURES,
    holesScored: 18,
    strokesTotal: 90,
    parTotal: 72,
    firstPuttRecorded: 18,
    puttsRecorded: 18,
    puttsTotal: 33,
    firstPuttInside1mResolved: 6,
    puttsTotalInside1mResolved: 7,
    onePuttInside1m: 5,
    firstPutt1To2mResolved: 4,
    puttsTotal1To2mResolved: 6,
    onePutt1To2m: 2,
    firstPutt2To4mResolved: 5,
    puttsTotal2To4mResolved: 9,
    onePutt2To4m: 2,
    firstPutt4To8mResolved: 2,
    puttsTotal4To8mResolved: 4,
    onePutt4To8m: 0,
    firstPuttOver8mResolved: 1,
    puttsTotalOver8mResolved: 3,
    onePuttOver8m: 0,
    holesZeroPutt: 1,
    holesOnePutt: 6,
    holesTwoPutt: 9,
};

function round(roundId: string, date: string): PlayerRoundStats {
    return {
        roundId,
        date,
        courseId: 'c1',
        courseName: 'Linköping',
        roundType: 'full_18',
        venueType: 'outdoor',
        name: null,
        holeCount: 18,
        measures,
        girArrivalMetres: [],
    };
}

const holeRows: PlayerRoundHoleStats[] = [
    {
        playHoleId: 'h1',
        ordinal: 1,
        courseHoleNumber: 1,
        par: 4,
        lengthM: null,
        score: 5,
        stats: {
            roundId: 'r1',
            playHoleId: 'h1',
            playerId: 'p1',
            teeResult: 'fairway',
            gir: false,
            firstPutt: null,
            firstPuttM: null,
            putts: 2,
            shortGameDifficulty: null,
            penalties: 0,
            recoveryOk: null,
            teeMissDir: null,
            greenMissDir: null,
            shortGameStrokes: null,
            penaltySource: null,
        },
    },
];

// Only the two reads this screen makes. The profile read behind `auto` is
// deliberately absent: every test below picks an EXPLICIT tier, so a handicap
// could only muddy which cohort the assertion is about.
const apiMock = {
    playerStats: {
        myRoundStats: mock(async () => holeRows),
        myStats: mock(async () => ({
            playerId: 'p1',
            roundsWithStats: 0,
            totals: null,
            rounds: [] as PlayerRoundStats[],
            nextCursor: null,
        })),
    },
    players: { me: mock(async () => null), myHandicapHistory: mock(async () => []) },
    clubs: { list: mock(async () => []) },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { RoundStatsService } = await import('../../src/stats/round-stats.service');
const { StatsDashboardService } = await import('../../src/stats/stats-dashboard.service');
const { RoundStatsComponent } = await import('../../src/stats/round-stats.component');
const { SG_COHORTS } = await import('../../src/round/stat-measures');
const { cohortLabel } = await import('../../src/stats/sg-baseline');

function click(el: Element | null | undefined): void {
    expect(el).toBeTruthy();
    el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/**
 * Mount the screen on `r1`, with `cohort` selected on the dashboard, and open
 * the putting card's sheet. Returns everything the sheet says.
 *
 * The tier is set on `StatsDashboardService` — the one this screen has no
 * control of its own for — because that is the real path: a reader changes
 * "Compared to" in Filters, then taps a round.
 */
async function puttingSheetText(cohort: (typeof SG_COHORTS)[number]): Promise<string> {
    di.get(StatsDashboardService).sgChoice.set(cohort);
    di.get(StatsDashboardService).loadedRounds.set([
        round('r1', '2026-07-20'),
        round('r0', '2026-07-19'),
    ]);
    di.set(AuthService, { currentUser: new Signal({ id: 'p1' }) } as unknown as AuthService);
    di.get(Router).navigate('/round-stats?id=r1');
    // Loaded BEFORE mount so the screen renders `ready` on its first pass —
    // the effect in `render` would get there too, an await later.
    await di.get(RoundStatsService).load('r1');

    const component = new RoundStatsComponent();
    component.mount(document.body);

    const panels = document.querySelector('.roundstats__panels')!;
    const putting = [...panels.querySelectorAll('[bind="head"]')].find((h) =>
        (h.textContent ?? '').includes('Putting'),
    );
    click(putting);
    // The trigger lives in the PUTTING card's own header row — scoped to that
    // section, because every card carries one and the first in document order
    // belongs to "Off the tee". It appears only once the card is open, so this
    // order is the user's order, not a convenience.
    click(putting!.closest('.panel')!.querySelector('[bind="infoTrigger"]'));
    const sheet = panels.querySelector('[bind="infoSheet"]')!;
    expect(sheet.className).not.toContain('hidden');
    const text = sheet.textContent ?? '';
    component.destroy();
    return text;
}

beforeEach(() => {
    di.reset();
    document.body.replaceChildren();
});

afterEach(() => {
    document.body.replaceChildren();
    di.reset();
});

test('the per-round putting sheet names the cohort the ladder was priced against', async () => {
    const text = await puttingSheetText('scratch');
    expect(text).toContain(`Measured against the ${cohortLabel('scratch')} reference`);
    // And it does NOT quietly name the shipping default. Without this line the
    // test passes on `hcp12` by accident, since that is what the frozen
    // `DEFAULT_SG_BASELINE_INFO` resolves to.
    expect(text).not.toContain(cohortLabel('hcp12'));
});

test('every tier a reader can select reaches the per-round sheet', async () => {
    // One tier could be threaded by luck. Four cannot: this only passes if the
    // sheet reads the SAME signal the model was priced from.
    for (const cohort of SG_COHORTS) {
        const text = await puttingSheetText(cohort);
        expect(text).toContain(`Measured against the ${cohortLabel(cohort)} reference`);
        di.reset();
        document.body.replaceChildren();
    }
});
