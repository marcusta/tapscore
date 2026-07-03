import { expect, test } from 'bun:test';
import { esc, renderSlotCards, renderSlotLeaderboard } from '../../src/round/result-render';
import type {
    GridCell,
    GridRow,
    HoleRef,
    MatchSummarySection,
    RankedSection,
    RouteSectionRef,
    ScoreGridSection,
    SlotResultView,
} from '../../src/api/friendly-rounds.gen';

// Route-section grouping (OUT/IN/TOT), repeated-hole occurrence columns, and
// XSS escaping through `esc()` — the generic-section behaviours the M5
// contract requires beyond registry dispatch (covered in result-render.test.ts).

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

function grid(rows: GridRow[], holes: HoleRef[], overrides: Partial<ScoreGridSection> = {}): ScoreGridSection {
    return {
        kind: 'score_grid',
        title: { groups: [['a']], joiner: ' vs. ' },
        subjectBallIds: ['a'],
        holes,
        subtitleFacts: [],
        rows,
        footnotes: [],
        totals: [],
        ...overrides,
    };
}

function count(haystack: string, needle: string): number {
    return haystack.split(needle).length - 1;
}

// --- Route-section grouping -------------------------------------------------

test('route sections split an 18-hole grid into stacked OUT/IN blocks with per-section subtotals', () => {
    const holes = Array.from({ length: 18 }, (_, i) => hole(i + 1));
    const routeSections: RouteSectionRef[] = [
        { id: 's-out', label: 'OUT', fromCanonicalOrdinal: 1, toCanonicalOrdinal: 9 },
        { id: 's-in', label: 'IN', fromCanonicalOrdinal: 10, toCanonicalOrdinal: 18 },
    ];
    const row: GridRow = {
        label: 'Gross',
        subjectBallId: 'a',
        kind: 'gross',
        aggregate: 'sum',
        cells: holes.map((h) => ({ playHoleId: h.playHoleId, holeNumber: h.holeNumber, value: 4, display: '4' })),
    };
    const html = renderSlotCards(slot({ cards: [grid([row], holes)] }), routeSections, nameOf);

    // One stacked table block per route section — never one sideways-scrolling 18er.
    expect(count(html, '<table class="lb-grid">')).toBe(2);
    expect(html).toContain('<th class="lb-sum">OUT</th>');
    expect(html).toContain('<th class="lb-sum">IN</th>');
    // Each block sums ONLY its own section's cells: 9 × 4 = 36, twice.
    expect(count(html, '<td class="lb-sum">36</td>')).toBe(2);
    expect(html).not.toContain('<td class="lb-sum">72</td>');
});

test('without route sections the grid falls back to a single TOT block over all holes', () => {
    const holes = [hole(1), hole(2), hole(3)];
    const row: GridRow = {
        label: 'Gross',
        subjectBallId: 'a',
        kind: 'gross',
        aggregate: 'sum',
        cells: holes.map((h) => ({ playHoleId: h.playHoleId, holeNumber: h.holeNumber, value: 4, display: '4' })),
    };
    const html = renderSlotCards(slot({ cards: [grid([row], holes)] }), [], nameOf);

    expect(count(html, '<table class="lb-grid">')).toBe(1);
    expect(html).toContain('<th class="lb-sum">TOT</th>');
    expect(html).toContain('<td class="lb-sum">12</td>');
});

test('holes outside every route section are omitted; empty sections render no block', () => {
    const holes = [hole(1), hole(2), hole(3)];
    const routeSections: RouteSectionRef[] = [
        { id: 's1', label: 'LOOP', fromCanonicalOrdinal: 1, toCanonicalOrdinal: 2 },
        { id: 's2', label: 'GHOST', fromCanonicalOrdinal: 10, toCanonicalOrdinal: 12 },
    ];
    const row: GridRow = {
        label: 'Gross',
        subjectBallId: 'a',
        kind: 'gross',
        aggregate: 'sum',
        cells: holes.map((h) => ({ playHoleId: h.playHoleId, holeNumber: h.holeNumber, value: 5, display: '5' })),
    };
    const html = renderSlotCards(slot({ cards: [grid([row], holes, { title: { groups: [], joiner: '' } })] }), routeSections, nameOf);

    expect(count(html, '<table class="lb-grid">')).toBe(1);
    expect(html).toContain('<th class="lb-sum">LOOP</th>');
    expect(html).not.toContain('GHOST');
    expect(html).toContain('<td class="lb-sum">10</td>'); // holes 1+2 only
    expect(html).not.toContain('<th>3</th>'); // hole 3 belongs to no section
});

// --- Repeated routes: one physical hole, two occurrence columns --------------

test('repeated physical hole occurrences stay distinct columns keyed by playHoleId', () => {
    // Course hole 7 played twice: same holeNumber, DISTINCT playHoleIds.
    const holes: HoleRef[] = [
        { holeNumber: 7, playHoleId: 'ph-7-1', courseHoleNumber: 7, canonicalOrdinal: 1, occurrenceLabel: '7 (1st)' },
        { holeNumber: 7, playHoleId: 'ph-7-2', courseHoleNumber: 7, canonicalOrdinal: 2, occurrenceLabel: '7 (2nd)' },
    ];
    const row: GridRow = {
        label: 'Gross',
        subjectBallId: 'a',
        kind: 'gross',
        aggregate: 'sum',
        cells: [
            { playHoleId: 'ph-7-1', holeNumber: 7, value: 3, display: '3' },
            { playHoleId: 'ph-7-2', holeNumber: 7, value: 5, display: '5' },
        ],
    };
    const html = renderSlotCards(slot({ cards: [grid([row], holes)] }), [], nameOf);

    // Both occurrences appear as their own labelled column, in canonical order…
    expect(html).toContain('<th>7 (1st)</th><th>7 (2nd)</th>');
    // …their values do not collapse onto one cell (keyed by playHoleId, not hole number)…
    expect(html).toContain('<td class="">3</td><td class="">5</td>');
    // …and the subtotal counts both occurrences.
    expect(html).toContain('<td class="lb-sum">8</td>');
});

test('aggregate=last subtotals pick the latest non-null value; all-null sums show a dash', () => {
    const holes = [hole(1), hole(2), hole(3)];
    const running: GridRow = {
        label: 'Running',
        subjectBallId: 'a',
        kind: 'running',
        aggregate: 'last',
        cells: [
            { playHoleId: 'ph-1', holeNumber: 1, value: 1, display: '1' },
            { playHoleId: 'ph-2', holeNumber: 2, value: 2.5, display: '2.5' },
            { playHoleId: 'ph-3', holeNumber: 3, value: null, display: '' },
        ],
    };
    const emptyGross: GridRow = {
        label: 'Gross',
        subjectBallId: 'a',
        kind: 'gross',
        aggregate: 'sum',
        cells: holes.map((h) => ({ playHoleId: h.playHoleId, holeNumber: h.holeNumber, value: null })),
    };
    const html = renderSlotCards(slot({ cards: [grid([running, emptyGross], holes)] }), [], nameOf);

    expect(html).toContain('<td class="lb-sum">2.5</td>');
    expect(html).toContain('<td class="lb-sum">—</td>');
});

// --- XSS escaping through esc() ----------------------------------------------

test('esc escapes the four HTML metacharacters', () => {
    expect(esc('&<>"')).toBe('&amp;&lt;&gt;&quot;');
    expect(esc(null)).toBe('null');
    expect(esc(7)).toBe('7');
});

const HOSTILE = '<img src=x onerror=alert(1)>"&';
const hostileNameOf = (id: string): string => (id === 'evil' ? HOSTILE : `name:${id}`);

test('a hostile player name never reaches the ranked/match markup unescaped', () => {
    const ranked: RankedSection = {
        kind: 'ranked',
        metricId: 'net',
        metricLabel: 'Net <b>points</b>',
        entries: [{ ballIds: ['evil'], total: 70, holesPlayed: 18, position: 1 }],
    };
    const ms: MatchSummarySection = {
        kind: 'match_summary',
        title: 'Match <i>play</i>',
        matches: [
            { sideA: { ballIds: ['evil'] }, sideB: { ballIds: ['b'] }, leader: 'a', magnitude: 1, finished: false, thru: 3 },
        ],
    };
    const html = renderSlotLeaderboard(slot({ leaderboard: [ranked, ms] }), hostileNameOf);

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>');
    expect(html).not.toContain('<i>');
    expect(count(html, '&lt;img src=x onerror=alert(1)&gt;&quot;&amp;')).toBe(2);
    expect(html).toContain('Net &lt;b&gt;points&lt;/b&gt;');
    expect(html).toContain('Match &lt;i&gt;play&lt;/i&gt;');
});

test('a hostile name/label/title is escaped everywhere the score grid surfaces it', () => {
    const cell: GridCell = {
        playHoleId: 'ph-1',
        holeNumber: 1,
        value: 4,
        display: '4',
        title: '"><script>steal()</script>',
        marker: { template: 'ring', tone: 'success', label: '<script>mark()</script>' },
    };
    const g = grid(
        [{ label: '<u>row</u>', subjectBallId: 'evil', kind: 'gross', aggregate: 'sum', cells: [cell] }],
        [{ holeNumber: 1, playHoleId: 'ph-1', courseHoleNumber: 1, canonicalOrdinal: 1, occurrenceLabel: '<em>1</em>' }],
        {
            title: { groups: [['evil']], joiner: ' vs. ' },
            subtitleFacts: ['<i>fact</i>'],
            totals: [{ label: '<u>total</u>', value: 4 }],
        },
    );
    const html = renderSlotCards(slot({ cards: [g] }), [], hostileNameOf);

    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<em>');
    expect(html).not.toContain('<u>');
    expect(html).not.toContain('<i>fact');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;&quot;&amp;'); // grid title + row label
    expect(html).toContain('title="&quot;&gt;&lt;script&gt;steal()&lt;/script&gt;"');
    expect(html).toContain('&lt;script&gt;mark()&lt;/script&gt;');
    expect(html).toContain('&lt;em&gt;1&lt;/em&gt;');
});

test('empty slots stay visible with an escaped format label, never blank output', () => {
    const html = renderSlotLeaderboard(slot({ formatLabel: '<b>Skins</b>' }), nameOf);
    expect(html).toContain('lb-empty');
    expect(html).toContain('&lt;b&gt;Skins&lt;/b&gt;');
    expect(html).not.toContain('<b>Skins</b>');
});
