import { expect, test } from 'bun:test';
import {
    layoutMatchSummary,
    layoutRanked,
    layoutScoreGrid,
    scoreGridComponentId,
} from '../../src/round/result-layout';
import type {
    GridRow,
    HoleRef,
    MatchSummarySection,
    RankedSection,
    RouteSectionRef,
    ScoreGridSection,
} from '../../src/api/friendly-rounds.gen';

// N3 — the ONE platform-neutral layout fold. Every derived layout decision the
// web renderer, the static oracle and (N4) the native client share lives here:
// route-section column grouping, subtotals, the TOT column, cell decorations,
// pace values. These tests pin the TREE, not anyone's markup — the renderers'
// byte-for-byte output is pinned by result-render.test.ts and the fixture
// oracle. Inputs are contract values (`src/api/friendly-rounds.gen`), proving
// the client's generated types satisfy the fold's structural input types.

const nameOf = (id: string): string => `name:${id}`;

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

function sumRow(holes: HoleRef[], value: number | null, overrides: Partial<GridRow> = {}): GridRow {
    return {
        label: 'Gross',
        subjectBallId: 'a',
        kind: 'gross',
        aggregate: 'sum',
        cells: holes.map((h) => ({
            playHoleId: h.playHoleId,
            holeNumber: h.holeNumber,
            value,
            display: value === null ? '' : String(value),
        })),
        ...overrides,
    };
}

const OUT_IN: RouteSectionRef[] = [
    { id: 's-out', label: 'OUT', fromCanonicalOrdinal: 1, toCanonicalOrdinal: 9 },
    { id: 's-in', label: 'IN', fromCanonicalOrdinal: 10, toCanonicalOrdinal: 18 },
];

// --- column grouping ---------------------------------------------------------

test('route sections become column groups in canonical order, with a whole-card total', () => {
    const holes = Array.from({ length: 18 }, (_, i) => hole(i + 1));
    const layout = layoutScoreGrid(grid([sumRow(holes, 4)], holes), OUT_IN, nameOf);

    expect(layout.columnGroups.map((g) => g.label)).toEqual(['OUT', 'IN']);
    expect(layout.columnGroups[0]!.columns.map((c) => c.label)).toEqual(
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    );
    expect(layout.hasTotalColumn).toBe(true);
    const row = layout.rows[0]!;
    expect(row.groups.map((g) => g.subtotal)).toEqual(['36', '36']);
    expect(row.total).toBe('72');
});

test('no route sections ⇒ ONE TOT group over every column and no separate total column', () => {
    const holes = [hole(1), hole(2), hole(3)];
    const layout = layoutScoreGrid(grid([sumRow(holes, 4)], holes), [], nameOf);

    expect(layout.columnGroups.map((g) => g.label)).toEqual(['TOT']);
    expect(layout.hasTotalColumn).toBe(false);
    expect(layout.rows[0]!.groups[0]!.subtotal).toBe('12');
});

test('columns sort by canonicalOrdinal; a column in no section is dropped, an empty section makes no group', () => {
    const holes = [hole(3), hole(1), hole(2)];
    const sections: RouteSectionRef[] = [
        { id: 's2', label: 'GHOST', fromCanonicalOrdinal: 10, toCanonicalOrdinal: 12 },
        { id: 's1', label: 'LOOP', fromCanonicalOrdinal: 1, toCanonicalOrdinal: 2 },
    ];
    const layout = layoutScoreGrid(grid([sumRow(holes, 5)], holes), sections, nameOf);

    expect(layout.columnGroups.map((g) => g.label)).toEqual(['LOOP']);
    expect(layout.columnGroups[0]!.columns.map((c) => c.label)).toEqual(['1', '2']);
    // The group subtotal counts only its own columns…
    expect(layout.rows[0]!.groups[0]!.subtotal).toBe('10');
    // …while the card total is every cell the row carries, sectioned or not.
    expect(layout.rows[0]!.total).toBe('15');
});

test('repeated occurrences of one physical hole stay distinct columns keyed by playHoleId', () => {
    const holes: HoleRef[] = [
        { holeNumber: 7, playHoleId: 'ph-7-1', courseHoleNumber: 7, canonicalOrdinal: 1, occurrenceLabel: '7 (1st)' },
        { holeNumber: 7, playHoleId: 'ph-7-2', courseHoleNumber: 7, canonicalOrdinal: 2, occurrenceLabel: '7 (2nd)' },
    ];
    const row: GridRow = {
        label: 'Gross',
        kind: 'gross',
        aggregate: 'sum',
        cells: [
            { playHoleId: 'ph-7-1', holeNumber: 7, value: 3, display: '3' },
            { playHoleId: 'ph-7-2', holeNumber: 7, value: 5, display: '5' },
        ],
    };
    const layout = layoutScoreGrid(grid([row], holes), [], nameOf);

    expect(layout.columnGroups[0]!.columns.map((c) => c.label)).toEqual(['7 (1st)', '7 (2nd)']);
    expect(layout.rows[0]!.groups[0]!.cells.map((c) => c.text)).toEqual(['3', '5']);
    expect(layout.rows[0]!.groups[0]!.subtotal).toBe('8');
});

// --- aggregates --------------------------------------------------------------

test('aggregate=last takes the latest non-null value (one decimal), and carries it into the total', () => {
    const holes = [hole(1), hole(2), hole(10)];
    const running: GridRow = {
        label: 'Running',
        kind: 'running',
        aggregate: 'last',
        cells: [
            { playHoleId: 'ph-1', holeNumber: 1, value: 1, display: '1' },
            { playHoleId: 'ph-2', holeNumber: 2, value: 2.5, display: '2.5' },
            { playHoleId: 'ph-10', holeNumber: 10, value: null, display: '' },
        ],
    };
    const layout = layoutScoreGrid(grid([running], holes), OUT_IN, nameOf);

    expect(layout.rows[0]!.groups.map((g) => g.subtotal)).toEqual(['2.5', '—']);
    // A running row's card total is the LAST group's standing, never a sum.
    expect(layout.rows[0]!.total).toBe('—');
});

test('an all-null sum and an aggregate=none row both read as a dash', () => {
    const holes = [hole(1), hole(2)];
    const none: GridRow = { label: 'Note', kind: 'free', aggregate: 'none', cells: [] };
    const layout = layoutScoreGrid(grid([sumRow(holes, null), none], holes), [], nameOf);

    expect(layout.rows[0]!.groups[0]!.subtotal).toBe('—');
    expect(layout.rows[1]!.groups[0]!.subtotal).toBe('—');
    expect(layout.rows[1]!.total).toBe('—');
});

// --- cells -------------------------------------------------------------------

test('a column with no cell for the row lays out as empty and undecorated', () => {
    const holes = [hole(1), hole(2)];
    const row: GridRow = {
        label: 'Gross',
        kind: 'gross',
        aggregate: 'sum',
        cells: [{ playHoleId: 'ph-1', holeNumber: 1, value: 4, display: '4' }],
    };
    const cells = layoutScoreGrid(grid([row], holes), [], nameOf).rows[0]!.groups[0]!.cells;

    expect(cells[1]).toEqual({ text: '', title: null, decoration: { kind: 'plain' } });
});

test('a team without a marker is a pill; with a marker the marker takes the team fill', () => {
    const holes = [hole(1), hole(2)];
    const row: GridRow = {
        label: 'Net',
        kind: 'net',
        aggregate: 'sum',
        cells: [
            { playHoleId: 'ph-1', holeNumber: 1, value: 4, display: '4', team: 'a' },
            {
                playHoleId: 'ph-2',
                holeNumber: 2,
                value: 3,
                display: '3',
                team: 'b',
                marker: { template: 'ring', tone: 'success', label: 'Birdie (-1)' },
            },
        ],
    };
    const cells = layoutScoreGrid(grid([row], holes), [], nameOf).rows[0]!.groups[0]!.cells;

    expect(cells[0]!.decoration).toEqual({ kind: 'pill', team: 'a' });
    expect(cells[1]!.decoration).toEqual({
        kind: 'marker',
        template: 'ring',
        tone: 'success',
        label: 'Birdie (-1)',
        teamFill: 'b',
    });
});

test('only styled marker tones survive; an empty marker label or cell title collapses to null', () => {
    const holes = [hole(1), hole(2)];
    const row: GridRow = {
        label: 'Gross',
        kind: 'gross',
        aggregate: 'sum',
        cells: [
            { playHoleId: 'ph-1', holeNumber: 1, value: 5, display: '5', title: '', marker: { template: 'square', tone: 'side_a', label: '' } },
            { playHoleId: 'ph-2', holeNumber: 2, value: 6, display: '6', marker: { template: 'box_badge' } },
        ],
    };
    const cells = layoutScoreGrid(grid([row], holes), [], nameOf).rows[0]!.groups[0]!.cells;

    expect(cells[0]!.title).toBeNull();
    expect(cells[0]!.decoration).toEqual({ kind: 'marker', template: 'square', tone: null, label: null, teamFill: null });
    expect(cells[1]!.decoration).toEqual({ kind: 'marker', template: 'box_badge', tone: null, label: null, teamFill: null });
});

// --- card chrome -------------------------------------------------------------

test('title groups resolve to live names; row subjects and label text stay separate parts', () => {
    const holes = [hole(1)];
    const row = sumRow(holes, 4, { label: 'Gross', subjectBallId: 'a' });
    const anonymous = sumRow(holes, 4, { label: 'Par', subjectBallId: undefined });
    const layout = layoutScoreGrid(
        grid([row, anonymous], holes, { title: { groups: [['a', 'b'], ['c']], joiner: ' vs. ' } }),
        [],
        nameOf,
    );

    // Both separators ride as DATA: the contract's group joiner, plus the
    // fold's own intra-group name joiner (no adapter hardcodes ' & ').
    expect(layout.title).toEqual({
        groups: [['name:a', 'name:b'], ['name:c']],
        joiner: ' vs. ',
        nameJoiner: ' & ',
    });
    expect(layout.rows[0]!.subjectName).toBe('name:a');
    expect(layout.rows[0]!.labelText).toBe('Gross');
    expect(layout.rows[1]!.subjectName).toBeNull();
});

test('product mode hides slot/CH/PH facts; verification mode keeps every fact', () => {
    const facts = ['slot #0 Stableford', 'CH 12.3', 'PH -1', 'Stableford', '100%'];
    const section = grid([], [], { subtitleFacts: facts });

    expect(layoutScoreGrid(section, [], nameOf).subtitleFacts).toEqual(['Stableford', '100%']);
    expect(layoutScoreGrid(section, [], nameOf, { mode: 'product' }).subtitleFacts).toEqual(['Stableford', '100%']);
    expect(layoutScoreGrid(section, [], nameOf, { mode: 'verification' }).subtitleFacts).toEqual(facts);
});

test('card totals become display strings (a missing total is a dash) and a missing caption is null', () => {
    const layout = layoutScoreGrid(
        grid([], [], { totals: [{ label: 'Points', value: 0 }, { label: 'Net', value: null }] }),
        [],
        nameOf,
    );

    expect(layout.totals).toEqual([{ label: 'Points', value: '0' }, { label: 'Net', value: '—' }]);
    expect(layout.caption).toBeNull();
});

test('a missing componentId means the default score grid', () => {
    expect(scoreGridComponentId(grid([], []))).toBe('default-score-grid');
    expect(scoreGridComponentId(grid([], [], { componentId: 'compact-match-grid' }))).toBe('compact-match-grid');
    expect(layoutScoreGrid(grid([], []), [], nameOf).componentId).toBe('default-score-grid');
});

// --- ranked ------------------------------------------------------------------

function ranked(entries: RankedSection['entries'], overrides: Partial<RankedSection> = {}): RankedSection {
    return { kind: 'ranked', metricId: 'points', metricLabel: 'Points', entries, ...overrides };
}

test('a board without any pace declares none; one paced entry grows the column for the whole board', () => {
    const noPace = layoutRanked(ranked([{ ballIds: ['a'], total: 70, holesPlayed: 18, position: 1 }]), nameOf);
    expect(noPace.hasPace).toBe(false);
    expect(noPace.entries[0]!.pace).toBeNull();

    const mixed = layoutRanked(
        ranked([
            { ballIds: ['a'], total: 33, holesPlayed: 18, paceDelta: -3, position: 1 },
            { ballIds: ['b'], total: 30, holesPlayed: 18, position: 2 },
        ]),
        nameOf,
    );
    expect(mixed.hasPace).toBe(true);
    expect(mixed.entries[1]!.pace).toBeNull();
});

test('pace reads in golf’s ONE sign convention: + is always worse than expectation', () => {
    const high = layoutRanked(
        ranked(
            [
                { ballIds: ['a'], total: 39, holesPlayed: 18, paceDelta: 3, position: 1 },
                { ballIds: ['b'], total: 36, holesPlayed: 18, paceDelta: 0, position: 2 },
                { ballIds: ['c'], total: 33, holesPlayed: 18, paceDelta: -3, position: 3 },
            ],
            { direction: 'high' },
        ),
        nameOf,
    );
    // A `high` metric (points) is negated for display: 3 points ABOVE pace is −3.
    expect(high.entries.map((e) => e.pace)).toEqual([
        { text: '−3', tone: 'under' },
        { text: 'E', tone: 'even' },
        { text: '+3', tone: 'over' },
    ]);

    const low = layoutRanked(
        ranked([{ ballIds: ['a'], total: 75, holesPlayed: 18, paceDelta: 3, position: 1 }], { direction: 'low' }),
        nameOf,
    );
    // A `low` metric (strokes) already runs that way and displays raw.
    expect(low.entries[0]!.pace).toEqual({ text: '+3', tone: 'over' });
});

test('entries resolve joined names, a leader flag, a dashed missing total and a shared group tag', () => {
    const groupOf = (id: string): string | null => (id === 'c' ? 'Group 2' : 'Group 1');
    const layout = layoutRanked(
        ranked([
            { ballIds: ['a', 'b'], total: null, holesPlayed: 9, position: 1 },
            { ballIds: ['b', 'c'], total: 12, holesPlayed: 9, position: 1 },
        ]),
        nameOf,
        groupOf,
    );

    expect(layout.entries[0]).toEqual({
        position: 1,
        lead: true,
        name: 'name:a & name:b',
        group: 'Group 1',
        total: '—',
        holesPlayed: 9,
        pace: null,
    });
    // Balls from two groups → no tag rather than a guess.
    expect(layout.entries[1]!.group).toBeNull();
    // Without a group resolver (the single-group round) nothing is tagged.
    expect(layoutRanked(ranked([{ ballIds: ['a'], total: 1, holesPlayed: 1, position: 2 }]), nameOf).entries[0]).toMatchObject({
        group: null,
        lead: false,
    });
});

// --- match summary -----------------------------------------------------------

test('match panels carry the golf idiom: AS / N UP and Final / thru N', () => {
    const section: MatchSummarySection = {
        kind: 'match_summary',
        title: 'Matches',
        matches: [
            { sideA: { ballIds: ['a'] }, sideB: { ballIds: ['b'] }, leader: null, magnitude: 0, finished: false, thru: 7 },
            { sideA: { ballIds: ['a', 'b'] }, sideB: { ballIds: ['c'] }, leader: 'a', magnitude: 3, finished: true, thru: 16 },
        ],
    };
    const layout = layoutMatchSummary(section, nameOf);

    expect(layout.title).toBe('Matches');
    expect(layout.matches[0]).toEqual({
        sideAName: 'name:a',
        sideBName: 'name:b',
        leader: null,
        standing: 'AS',
        status: 'thru 7',
    });
    expect(layout.matches[1]).toMatchObject({ sideAName: 'name:a & name:b', standing: '3 UP', status: 'Final' });
});

// --- serializability ---------------------------------------------------------

test('the layout tree is plain JSON — N4’s native renderer consumes exactly this shape', () => {
    const holes = [hole(1), hole(10)];
    const layout = layoutScoreGrid(
        grid([sumRow(holes, 4)], holes, { caption: 'Normalised to the leader', footnotes: ['h1: 2 × 3'] }),
        OUT_IN,
        nameOf,
    );

    expect(JSON.parse(JSON.stringify(layout))).toEqual(layout);
    expect(JSON.parse(JSON.stringify(layoutRanked(ranked([]), nameOf)))).toEqual(layoutRanked(ranked([]), nameOf));
});
