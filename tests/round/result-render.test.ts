import { test, expect } from 'bun:test';
import { renderSlotCards, renderSlotLeaderboard } from '../../src/round/result-render';
import type {
    HoleRef,
    MatchSummarySection,
    RankedSection,
    RouteSectionRef,
    ScoreGridSection,
    SlotResultView,
} from '../../src/api/friendly-rounds.gen';

// Phase 1 registry dispatch must preserve existing output byte-for-byte and route
// unsupported section kinds / grid component ids to a visible diagnostic instead
// of dropping content. These fixtures are deliberately tiny.

const nameOf = (id: string): string => `name:${id}`;

function slot(overrides: Partial<SlotResultView>): SlotResultView {
    return {
        slotIndex: 0,
        slotDefId: 'slot-0',
        formatId: 'fmt',
        formatLabel: 'Format',
        scoringMode: 'stroke',
        teamShape: 'individual',
        allowanceLabel: '100%',
        cards: [],
        leaderboard: [],
        ...overrides,
    };
}

const hole = (n: number): HoleRef => ({
    holeNumber: n,
    playHoleId: `ph-${n}`,
    courseHoleNumber: n,
    canonicalOrdinal: n,
    occurrenceLabel: String(n),
});

const routeSections: RouteSectionRef[] = [];

test('ranked section renders exactly as before through the registry', () => {
    const ranked: RankedSection = {
        kind: 'ranked',
        metricId: 'net',
        metricLabel: 'Net',
        entries: [
            { ballIds: ['a'], total: 70, holesPlayed: 18, position: 1 },
            { ballIds: ['b'], total: 72, holesPlayed: 18, position: 2 },
        ],
    };
    const html = renderSlotLeaderboard(slot({ leaderboard: [ranked] }), nameOf);

    const expected = `<div class="lb-section">
  <h4 class="lb-section__title">Net</h4>
  <table class="lb-rank">
    <thead><tr><th>#</th><th>Player</th><th>Total</th><th>Thru</th></tr></thead>
    <tbody><tr class="lb-rank__lead">
  <td class="lb-rank__pos">1</td>
  <td class="lb-rank__who">name:a</td>
  <td class="lb-rank__total">70</td>
  <td class="lb-rank__thru">18</td>
</tr><tr class="">
  <td class="lb-rank__pos">2</td>
  <td class="lb-rank__who">name:b</td>
  <td class="lb-rank__total">72</td>
  <td class="lb-rank__thru">18</td>
</tr></tbody>
  </table>
</div>`;
    expect(html).toBe(expected);
});

test('match summary renders exactly as before through the registry', () => {
    const ms: MatchSummarySection = {
        kind: 'match_summary',
        title: 'Match',
        matches: [
            {
                sideA: { ballIds: ['a'] },
                sideB: { ballIds: ['b'] },
                leader: 'a',
                magnitude: 2,
                finished: false,
                thru: 9,
            },
        ],
    };
    const html = renderSlotLeaderboard(slot({ leaderboard: [ms] }), nameOf);

    const expected = `<div class="lb-section">
  <h4 class="lb-section__title">Match</h4><div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a lb-mp__team--lead">name:a</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">2 UP</span><span class="lb-mp__status">thru 9</span></div>
    <div class="lb-mp__team lb-mp__team--b">name:b</div>
  </div>
</div>`;
    expect(html).toBe(expected);
});

test('score grid renders through default-score-grid (componentId absent)', () => {
    const grid: ScoreGridSection = {
        kind: 'score_grid',
        title: { groups: [['a']], joiner: ' vs. ' },
        subjectBallIds: ['a'],
        holes: [hole(1), hole(2)],
        subtitleFacts: [],
        rows: [
            {
                label: 'Gross',
                subjectBallId: 'a',
                kind: 'gross',
                aggregate: 'sum',
                cells: [
                    { playHoleId: 'ph-1', holeNumber: 1, value: 4, display: '4' },
                    { playHoleId: 'ph-2', holeNumber: 2, value: 5, display: '5' },
                ],
            },
        ],
        footnotes: [],
        totals: [],
    };
    const html = renderSlotCards(slot({ cards: [grid] }), routeSections, nameOf);

    expect(html).toContain('<article class="lb-card">');
    expect(html).toContain('<table class="lb-grid">');
    expect(html).toContain('name:a Gross');
    // No diagnostic for the supported default grid.
    expect(html).not.toContain('lb-diag');
});

test('cell markers render the presentation shape through the vocabulary', () => {
    const grid: ScoreGridSection = {
        kind: 'score_grid',
        title: { groups: [], joiner: '' },
        subjectBallIds: ['a', 'b'],
        holes: [hole(1), hole(2), hole(3)],
        subtitleFacts: [],
        rows: [
            {
                label: '',
                subjectBallId: 'a',
                kind: 'net',
                aggregate: 'sum',
                team: 'a',
                cells: [
                    {
                        playHoleId: 'ph-1',
                        holeNumber: 1,
                        value: 4,
                        display: '4',
                        marker: { template: 'ring', tone: 'side_a', label: 'Hole won, +1' },
                    },
                    {
                        playHoleId: 'ph-2',
                        holeNumber: 2,
                        value: 3,
                        display: '3',
                        marker: { template: 'double_ring', tone: 'side_a', label: 'Down-team birdie, +2' },
                    },
                    {
                        playHoleId: 'ph-3',
                        holeNumber: 3,
                        value: 2,
                        display: '2',
                        marker: { template: 'diamond', tone: 'side_a', label: 'Down-team eagle, +5' },
                    },
                ],
            },
        ],
        footnotes: [],
        totals: [],
    };
    const html = renderSlotCards(slot({ cards: [grid] }), routeSections, nameOf);

    expect(html).toContain(
        '<span class="lb-mark lb-mark--ring" title="Hole won, +1" aria-label="Hole won, +1">4</span>',
    );
    expect(html).toContain(
        '<span class="lb-mark lb-mark--double_ring" title="Down-team birdie, +2" aria-label="Down-team birdie, +2">3</span>',
    );
    expect(html).toContain(
        '<span class="lb-mark lb-mark--diamond" title="Down-team eagle, +5" aria-label="Down-team eagle, +5">2</span>',
    );
    // No legacy golf tokens leak into the markup.
    expect(html).not.toContain('win5');
    expect(html).not.toContain('win2');
});

// TEMPORARY Phase 2 compatibility: the renderer still maps the legacy
// `mark` ('win'/'win2'/'win5') to a presentation shape so a stale cached
// payload renders while generated clients catch up. Remove with the shim.
test('[temporary phase-2 shim] legacy mark still maps to the presentation shape', () => {
    const grid = {
        kind: 'score_grid',
        title: { groups: [], joiner: '' },
        subjectBallIds: ['a'],
        holes: [hole(1)],
        subtitleFacts: [],
        rows: [
            {
                label: '',
                subjectBallId: 'a',
                kind: 'net',
                aggregate: 'sum',
                team: 'a',
                cells: [{ playHoleId: 'ph-1', holeNumber: 1, value: 2, display: '2', mark: 'win5' }],
            },
        ],
        footnotes: [],
        totals: [],
    } as unknown as ScoreGridSection;
    const html = renderSlotCards(slot({ cards: [grid] }), routeSections, nameOf);

    expect(html).toContain('<span class="lb-mark lb-mark--diamond">2</span>');
});

test('generated GridCell no longer exposes the legacy mark tokens', async () => {
    const friendly = await Bun.file(
        new URL('../../src/api/friendly-rounds.gen.ts', import.meta.url),
    ).text();
    const leaderboards = await Bun.file(
        new URL('../../src/api/leaderboards.gen.ts', import.meta.url),
    ).text();
    for (const gen of [friendly, leaderboards]) {
        expect(gen).not.toContain('win5');
        expect(gen).not.toContain('win2');
        expect(gen).not.toContain("mark?:");
        expect(gen).toContain('marker?:');
    }
});

test('unknown leaderboard section kind yields a visible diagnostic, not dropped content', () => {
    const bogus = { kind: 'totally_unknown' } as unknown as RankedSection;
    const html = renderSlotLeaderboard(slot({ leaderboard: [bogus] }), nameOf);

    expect(html).toContain('lb-diag');
    expect(html).toContain('totally_unknown');
});

test('unknown score-grid componentId yields a visible diagnostic, not dropped content', () => {
    const grid = {
        kind: 'score_grid',
        componentId: 'wolf-rotation-grid',
        title: { groups: [['a']], joiner: ' vs. ' },
        subjectBallIds: ['a'],
        holes: [hole(1)],
        subtitleFacts: [],
        rows: [],
        footnotes: [],
        totals: [],
    } as unknown as ScoreGridSection;
    const html = renderSlotCards(slot({ cards: [grid] }), routeSections, nameOf);

    expect(html).toContain('lb-diag');
    expect(html).toContain('wolf-rotation-grid');
});
