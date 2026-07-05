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
    <colgroup>
      <col class="lb-rank__col-pos">
      <col class="lb-rank__col-who">
      <col class="lb-rank__col-total">
      <col class="lb-rank__col-thru">
    </colgroup>
    <thead><tr><th class="lb-rank__pos">#</th><th class="lb-rank__who">Player</th><th class="lb-rank__total">Total</th><th class="lb-rank__thru">Thru</th></tr></thead>
    <tbody><tr class="lb-rank__lead">
  <td class="lb-rank__pos">1</td>
  <td class="lb-rank__who"><span class="lb-rank__name">name:a</span></td>
  <td class="lb-rank__total">70</td>
  <td class="lb-rank__thru">18</td>
</tr><tr class="">
  <td class="lb-rank__pos">2</td>
  <td class="lb-rank__who"><span class="lb-rank__name">name:b</span></td>
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

test('ranked section uses stable aligned columns for mobile rows', async () => {
    const ranked: RankedSection = {
        kind: 'ranked',
        metricId: 'points',
        metricLabel: 'Points',
        entries: [{ ballIds: ['a'], total: 24, holesPlayed: 3, position: 1 }],
    };
    const html = renderSlotLeaderboard(slot({ leaderboard: [ranked] }), nameOf);
    const component = await Bun.file(
        new URL('../../src/round/leaderboard.component.ts', import.meta.url),
    ).text();

    expect(html).toContain('<colgroup>');
    expect(html).toContain('<th class="lb-rank__total">Total</th>');
    expect(html).toContain('<th class="lb-rank__thru">Thru</th>');
    expect(component).toContain('table-layout: fixed');
    expect(component).toContain('vertical-align: middle');
    expect(component).toContain('height: 2.25rem');
});

function debugGrid(overrides: Partial<ScoreGridSection> = {}): ScoreGridSection {
    return {
        kind: 'score_grid',
        title: { groups: [['a']], joiner: ' vs. ' },
        subjectBallIds: ['a'],
        holes: [hole(1)],
        subtitleFacts: [
            'slot #0 · Umbrella (4-ball) · 100%',
            'CH 0',
            'PH 0',
            'holes played 1',
        ],
        rows: [
            {
                label: 'Points',
                subjectBallId: 'a',
                kind: 'points',
                aggregate: 'sum',
                cells: [{ playHoleId: 'ph-1', holeNumber: 1, value: 2, display: '2' }],
            },
        ],
        footnotes: ['h1: gross = 4 net = 4; LG + LT = 2'],
        caption: 'Running totals are relative to the leader.',
        totals: [{ label: 'points', value: 2 }],
        ...overrides,
    };
}

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

test('score grid dispatches by compact-match-grid component id', () => {
    const grid: ScoreGridSection = {
        ...debugGrid({
            title: { groups: [], joiner: '' },
            subtitleFacts: ['Taliban · 90%'],
            footnotes: [],
            caption: undefined,
            totals: [],
        }),
        componentId: 'compact-match-grid',
    };
    const html = renderSlotCards(slot({ cards: [grid] }), routeSections, nameOf);

    expect(html).toContain('lb-card--compact-match');
    expect(html).not.toContain('lb-diag');
});

test('score grid dispatches by category-matrix-grid component id', () => {
    const grid: ScoreGridSection = {
        ...debugGrid(),
        componentId: 'category-matrix-grid',
    };
    const html = renderSlotCards(slot({ cards: [grid] }), routeSections, nameOf);

    expect(html).toContain('lb-card--category-matrix');
    expect(html).toContain('lb-r-points');
    expect(html).not.toContain('lb-diag');
});

test('category matrix mobile styles keep triple-digit umbrella point cells readable', async () => {
    const component = await Bun.file(
        new URL('../../src/round/leaderboard.component.ts', import.meta.url),
    ).text();

    expect(component).toContain('table-layout: auto');
    expect(component).toContain('width: max-content');
    expect(component).toContain('min-width: 100%');
    expect(component).toContain('& .lb-card--category-matrix .lb-grid .lb-rowlabel');
    expect(component).toContain('& .lb-card--category-matrix .lb-grid .lb-r-points td');
    expect(component).toContain('& .lb-card--category-matrix .lb-grid .lb-r-running td');
    expect(component).toContain('min-width: 3.25em');
    expect(component).toContain('text-overflow: clip');
});

test('cell markers render the presentation shape through the vocabulary', () => {
    const grid: ScoreGridSection = {
        kind: 'score_grid',
        title: { groups: [], joiner: '' },
        subjectBallIds: ['a', 'b'],
        holes: [hole(1), hole(2), hole(3), hole(4), hole(5), hole(6)],
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
                    {
                        playHoleId: 'ph-4',
                        holeNumber: 4,
                        value: 3,
                        display: '3',
                        marker: { template: 'ring', tone: 'success', label: 'Birdie (-1)' },
                    },
                    {
                        playHoleId: 'ph-5',
                        holeNumber: 5,
                        value: 6,
                        display: '6',
                        marker: { template: 'double_square', tone: 'danger', label: 'Double bogey (+2)' },
                    },
                    {
                        playHoleId: 'ph-6',
                        holeNumber: 6,
                        value: 7,
                        display: '7',
                        marker: {
                            template: 'box_badge',
                            tone: 'danger',
                            label: 'Triple bogey or worse (+3)',
                            value: '+3',
                        },
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
    expect(html).toContain(
        '<span class="lb-mark lb-mark--ring lb-mark-tone--success" title="Birdie (-1)" aria-label="Birdie (-1)">3</span>',
    );
    expect(html).toContain(
        '<span class="lb-mark lb-mark--double_square lb-mark-tone--danger" title="Double bogey (+2)" aria-label="Double bogey (+2)">6</span>',
    );
    expect(html).toContain(
        '<span class="lb-mark lb-mark--box_badge lb-mark-tone--danger" title="Triple bogey or worse (+3)" aria-label="Triple bogey or worse (+3)">7</span>',
    );
    // No legacy golf tokens leak into the markup.
    expect(html).not.toContain('win5');
    expect(html).not.toContain('win2');
});

test('generated GridCell no longer exposes the legacy mark tokens', async () => {
    const friendly = await Bun.file(
        new URL('../../src/api/friendly-rounds.gen.ts', import.meta.url),
    ).text();
    const leaderboards = await Bun.file(
        new URL('../../src/api/leaderboards.gen.ts', import.meta.url),
    ).text();
    const shared = await Bun.file(
        new URL('../../server/domain/strategies/result-sections.ts', import.meta.url),
    ).text();
    for (const contract of [friendly, leaderboards, shared]) {
        expect(contract).not.toContain('win5');
        expect(contract).not.toContain('win2');
        expect(contract).not.toContain('mark?:');
        expect(contract).toContain('marker?:');
    }
});

test('result renderers do not branch on format ids', async () => {
    const mobile = await Bun.file(
        new URL('../../src/round/result-render.ts', import.meta.url),
    ).text();
    const statik = await Bun.file(
        new URL('../../scripts/render/sections/result.ts', import.meta.url),
    ).text();

    for (const renderer of [mobile, statik]) {
        expect(renderer).not.toMatch(/\bformatId\b/);
        expect(renderer).not.toMatch(/\bformat_id\b/);
        expect(renderer).not.toContain('match_play');
        expect(renderer).not.toContain('taliban');
        expect(renderer).not.toContain('umbrella');
    }
});

// --- pace chip (live-board ranking) -----------------------------------------
//
// A ranked entry carrying `paceDelta` shows a compact chip next to the total so
// the server's pace ordering explains itself: `+4` (over), `−5` (under), `E`
// (even). Entries without `paceDelta` (non-pace metrics) render exactly as
// before — no chip.

function rankedWith(entries: RankedSection['entries']): RankedSection {
    return { kind: 'ranked', metricId: 'points', metricLabel: 'Points', entries };
}

test('pace chip renders +N / −N / E next to the total, tone-classed', () => {
    const ranked = rankedWith([
        { ballIds: ['a'], total: 8, holesPlayed: 2, paceDelta: 4, position: 1 },
        { ballIds: ['b'], total: 9, holesPlayed: 7, paceDelta: -5, position: 2 },
        { ballIds: ['c'], total: 36, holesPlayed: 18, paceDelta: 0, position: 3 },
    ]);
    const html = renderSlotLeaderboard(slot({ leaderboard: [ranked] }), nameOf);

    // over-pace: signed positive
    expect(html).toContain('<span class="lb-rank__pace lb-rank__pace--over">+4</span>');
    // under-pace: real minus sign (U+2212), not ASCII hyphen
    expect(html).toContain('<span class="lb-rank__pace lb-rank__pace--under">−5</span>');
    // even: E
    expect(html).toContain('<span class="lb-rank__pace lb-rank__pace--even">E</span>');
    // the chip sits inside the total cell, after the total value
    expect(html).toContain('<td class="lb-rank__total">8 <span class="lb-rank__pace lb-rank__pace--over">+4</span></td>');
});

test('no pace chip when the entry carries no paceDelta (non-pace metric)', () => {
    const ranked = rankedWith([
        { ballIds: ['a'], total: 70, holesPlayed: 18, position: 1 },
        { ballIds: ['b'], total: 72, holesPlayed: 18, position: 2 },
    ]);
    const html = renderSlotLeaderboard(slot({ leaderboard: [ranked] }), nameOf);

    expect(html).not.toContain('lb-rank__pace');
    // total cell is exactly the value, no trailing chip span
    expect(html).toContain('<td class="lb-rank__total">70</td>');
});

test('pace chip still shown when total is present but zero', () => {
    const ranked = rankedWith([{ ballIds: ['a'], total: 0, holesPlayed: 4, paceDelta: -8, position: 1 }]);
    const html = renderSlotLeaderboard(slot({ leaderboard: [ranked] }), nameOf);
    expect(html).toContain('<td class="lb-rank__total">0 <span class="lb-rank__pace lb-rank__pace--under">−8</span></td>');
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

test('product mode hides score-grid audit chrome', () => {
    const html = renderSlotCards(slot({ cards: [debugGrid()] }), routeSections, nameOf);

    expect(html).not.toContain('slot #0');
    expect(html).not.toContain('CH 0');
    expect(html).not.toContain('PH 0');
    expect(html).not.toContain('Points breakdown');
    expect(html).not.toContain('gross = 4 net = 4');
    expect(html).not.toContain('Running totals are relative');
    expect(html).toContain('holes played 1');
    expect(html).toContain('points');
});

test('verification mode preserves score-grid audit chrome', () => {
    const html = renderSlotCards(slot({ cards: [debugGrid()] }), routeSections, nameOf, {
        mode: 'verification',
    });

    expect(html).toContain('slot #0');
    expect(html).toContain('CH 0');
    expect(html).toContain('PH 0');
    expect(html).toContain('Points breakdown');
    expect(html).toContain('gross = 4 net = 4');
    expect(html).toContain('Running totals are relative');
});
