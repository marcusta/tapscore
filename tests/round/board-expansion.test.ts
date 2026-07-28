// A real DOM, because two of the tests below parse the rendered board and read
// `data-expand-key` back off an element — the round-trip the toggle depends on
// cannot be asserted against a string.
import '@basics/core/happy-dom';
import { test, expect } from 'bun:test';
import { ExpansionState, entryKey, planBoard } from '../../src/round/board-expansion';
import { renderCards, renderSlotLeaderboard } from '../../src/round/result-render';
import type {
    HoleRef,
    MatchSummarySection,
    RankedSection,
    RouteSectionRef,
    ScoreGridSection,
    SlotResultView,
} from '../../src/api/friendly-rounds.gen';

// Gamebook-style board expansion: a card that maps 1:1 to a ranked entry folds
// into that row (tap to expand) and DISAPPEARS from the card list below; every
// other card keeps rendering exactly where it does today.

const nameOf = (id: string): string => `name:${id}`;
const routeSections: RouteSectionRef[] = [];
/** The slot every fixture below belongs to — expansion keys are slot-scoped. */
const SLOT = 'slot-0';

function slot(overrides: Partial<SlotResultView>): SlotResultView {
    return {
        slotIndex: 0,
        slotDefId: SLOT,
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

function card(subjectBallIds: string[]): ScoreGridSection {
    return {
        kind: 'score_grid',
        title: { groups: [subjectBallIds], joiner: ' vs. ' },
        subjectBallIds,
        holes: [hole(1)],
        subtitleFacts: [],
        rows: [
            {
                label: 'Gross',
                subjectBallId: subjectBallIds[0],
                kind: 'gross',
                aggregate: 'sum',
                cells: [{ playHoleId: 'ph-1', holeNumber: 1, value: 4, display: '4' }],
            },
        ],
        footnotes: [],
        totals: [],
    };
}

function ranked(entries: { ballIds: string[]; position: number }[]): RankedSection {
    return {
        kind: 'ranked',
        metricId: 'net',
        metricLabel: 'Net',
        entries: entries.map((e) => ({ ...e, total: 70 + e.position, holesPlayed: 18 })),
    };
}

// --- keying ------------------------------------------------------------------

test('entry key is order- and repetition-insensitive (a pairing is a set)', () => {
    expect(entryKey(SLOT, ['b', 'a'])).toBe(entryKey(SLOT, ['a', 'b']));
    expect(entryKey(SLOT, ['a', 'a'])).toBe(entryKey(SLOT, ['a']));
    expect(entryKey(SLOT, ['a'])).not.toBe(entryKey(SLOT, ['b']));
});

test('the same balls on two different slots are different keys', () => {
    // Two format slots over one round rank the same balls. Their boards must
    // expand independently, so the slot id is part of the key.
    expect(entryKey('slot-0', ['a', 'b'])).not.toBe(entryKey('slot-1', ['a', 'b']));
});

test('a key survives the data-attribute round-trip that drives every toggle', () => {
    // THE reason the separator is '|' and not a control character. The toggle
    // path is: render the key into `data-expand-key`, let the HTML parser build
    // the element, then read the attribute back on click and look it up in
    // ExpansionState. If the parser rewrites even one character, the key read
    // back is a different string and no row ever opens. Assert the whole loop
    // against a REAL element, not against the string alone.
    const key = entryKey('slot-0', ['ball-b', 'ball-a']);
    const host = document.createElement('table');
    host.innerHTML = `<tbody><tr data-expand-key="${key}"><td>x</td></tr></tbody>`;
    const row = host.querySelector('tr[data-expand-key]');

    expect(row).not.toBeNull();
    expect(row?.getAttribute('data-expand-key')).toBe(key);

    // ...and the round-tripped value still hits the same ExpansionState entry.
    const state = new ExpansionState();
    state.toggle(key);
    expect(state.isOpen(row?.getAttribute('data-expand-key') ?? '')).toBe(true);
});

test('the key rendered into the board round-trips out of the parsed DOM', () => {
    // Same pin, but end-to-end: the key the RENDERER emitted (not one the test
    // built) must come back out of a parsed element and match the plan's key —
    // that is the coupling between result-render and leaderboard.component.
    const view = slot({
        leaderboard: [ranked([{ ballIds: ['a', 'b'], position: 1 }])],
        cards: [card(['a', 'b'])],
    });
    const plan = planBoard(view);
    const host = document.createElement('div');
    host.innerHTML = boardHtml(view);

    const rendered = host.querySelector('tr[data-expand-key]')?.getAttribute('data-expand-key');
    expect(rendered).toBe(entryKey(SLOT, ['a', 'b']));
    expect([...plan.attached.keys()]).toEqual([rendered!]);
});

// --- plan --------------------------------------------------------------------

test('a 1:1 card attaches to its row and leaves the standalone list', () => {
    const plan = planBoard(
        slot({
            leaderboard: [ranked([{ ballIds: ['a'], position: 1 }, { ballIds: ['b'], position: 2 }])],
            cards: [card(['a']), card(['b'])],
        }),
    );

    expect(plan.standalone).toEqual([]);
    expect(plan.attached.get(entryKey(SLOT, ['a']))?.subjectBallIds).toEqual(['a']);
    expect(plan.attached.get(entryKey(SLOT, ['b']))?.subjectBallIds).toEqual(['b']);
});

test('a card whose subject spans more than one entry stays standalone', () => {
    // The match-card shape: the card covers both sides, the entries are per side.
    const shared = card(['a', 'b']);
    const plan = planBoard(
        slot({
            leaderboard: [ranked([{ ballIds: ['a'], position: 1 }, { ballIds: ['b'], position: 2 }])],
            cards: [shared],
        }),
    );

    expect(plan.attached.size).toBe(0);
    expect(plan.standalone).toEqual([shared]);
});

test('with no ranked board at all, every card stays standalone', () => {
    const ms: MatchSummarySection = {
        kind: 'match_summary',
        title: 'Match',
        matches: [
            { sideA: { ballIds: ['a'] }, sideB: { ballIds: ['b'] }, leader: null, magnitude: 0, finished: false, thru: 9 },
        ],
    };
    const plan = planBoard(slot({ leaderboard: [ms], cards: [card(['a'])] }));

    expect(plan.rankedSection).toBeNull();
    expect(plan.attached.size).toBe(0);
    expect(plan.standalone.length).toBe(1);
});

test('a team entry attaches to its team card regardless of ball order', () => {
    const plan = planBoard(
        slot({
            leaderboard: [ranked([{ ballIds: ['b', 'a'], position: 1 }])],
            cards: [card(['a', 'b'])],
        }),
    );

    expect(plan.standalone).toEqual([]);
    expect(plan.attached.get(entryKey(SLOT, ['a', 'b']))).toBeDefined();
});

// --- open state --------------------------------------------------------------

test('rows start collapsed, toggle independently, and multiple may be open', () => {
    const state = new ExpansionState();
    const a = entryKey(SLOT, ['a']);
    const b = entryKey(SLOT, ['b']);

    expect(state.isOpen(a)).toBe(false);
    expect(state.toggle(a)).toBe(true);
    expect(state.toggle(b)).toBe(true);
    expect(state.keys()).toEqual([a, b].sort());
    expect(state.toggle(a)).toBe(false);
    expect(state.isOpen(a)).toBe(false);
    expect(state.isOpen(b)).toBe(true);
});

test('open state survives a result swap that reorders rows and ball ids', () => {
    const state = new ExpansionState();
    const before = planBoard(
        slot({
            leaderboard: [ranked([{ ballIds: ['a', 'b'], position: 1 }, { ballIds: ['c'], position: 2 }])],
            cards: [card(['a', 'b']), card(['c'])],
        }),
    );
    const openedKey = [...before.attached.keys()].find((k) => k === entryKey(SLOT, ['a', 'b']))!;
    state.toggle(openedKey);

    // The SSE refetch: same balls, new order, new objects.
    const after = planBoard(
        slot({
            leaderboard: [ranked([{ ballIds: ['c'], position: 1 }, { ballIds: ['b', 'a'], position: 2 }])],
            cards: [card(['c']), card(['b', 'a'])],
        }),
    );

    expect([...after.attached.keys()]).toContain(openedKey);
    expect(state.isOpen(openedKey)).toBe(true);
    expect(state.isOpen(entryKey(SLOT, ['c']))).toBe(false);
});

test('retain drops keys for entries that left the board', () => {
    const state = new ExpansionState();
    state.toggle(entryKey(SLOT, ['a']));
    state.toggle(entryKey(SLOT, ['gone']));
    state.retain([entryKey(SLOT, ['a'])]);

    expect(state.keys()).toEqual([entryKey(SLOT, ['a'])]);
});

// --- rendering ---------------------------------------------------------------

function boardHtml(view: SlotResultView, open: string[] = []): string {
    const plan = planBoard(view);
    return renderSlotLeaderboard(view, nameOf, () => null, {
        plan,
        routeSections,
        isOpen: (key) => open.includes(key),
    });
}

test('an attached row renders a button, aria-expanded and its card panel', () => {
    const view = slot({
        leaderboard: [ranked([{ ballIds: ['a'], position: 1 }])],
        cards: [card(['a'])],
    });
    const html = boardHtml(view);

    expect(html).toContain('lb-rank__row--expandable');
    expect(html).toContain('<button type="button" class="lb-rank__toggle" aria-expanded="false"');
    expect(html).toContain(`data-expand-key="${entryKey(SLOT, ['a'])}"`);
    expect(html).toContain('class="lb-rank__panel"');
    expect(html).toContain('<article class="lb-card">');
    // aria-controls resolves to the panel wrapper's id.
    const controls = /aria-controls="([^"]+)"/.exec(html)?.[1];
    expect(controls).toBeTruthy();
    expect(html).toContain(`id="${controls}"`);
});

test('an open row is marked open on both the row and its panel', () => {
    const view = slot({
        leaderboard: [ranked([{ ballIds: ['a'], position: 1 }])],
        cards: [card(['a'])],
    });
    const html = boardHtml(view, [entryKey(SLOT, ['a'])]);

    expect(html).toContain('lb-rank__row--open');
    expect(html).toContain('lb-rank__panel lb-rank__panel--open');
    expect(html).toContain('aria-expanded="true"');
});

test('a row with no attached card is inert — no button, no panel, old markup', () => {
    const view = slot({
        leaderboard: [ranked([{ ballIds: ['a'], position: 1 }, { ballIds: ['b'], position: 2 }])],
        cards: [card(['a'])],
    });
    const html = boardHtml(view);

    expect(html).toContain('<span class="lb-rank__name">name:b</span>');
    // Exactly one toggle (row a) and one panel on the whole board.
    expect(html.match(/lb-rank__toggle/g)?.length).toBe(1);
    expect(html.match(/lb-rank__panel"/g)?.length).toBe(1);
    // The inert row still renders the plain cell markup it always did.
    expect(html).toContain(
        '<td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">name:b</span></span></td>',
    );
});

test('attached cards are consumed — only standalone cards render below', () => {
    const shared = card(['a', 'b']);
    const view = slot({
        leaderboard: [ranked([{ ballIds: ['a'], position: 1 }, { ballIds: ['b'], position: 2 }])],
        cards: [card(['a']), card(['b']), shared],
    });
    const plan = planBoard(view);
    const below = renderCards(plan.standalone, routeSections, nameOf);

    expect(plan.standalone).toEqual([shared]);
    expect(below.match(/<article class="lb-card">/g)?.length).toBe(1);
    expect(below).toContain('name:a Gross');
});

test('the panel colspan covers the pace column when the board has one', () => {
    const withPace: RankedSection = {
        kind: 'ranked',
        metricId: 'points',
        metricLabel: 'Points',
        direction: 'high',
        entries: [{ ballIds: ['a'], total: 33, holesPlayed: 18, position: 1, paceDelta: -3 }],
    };
    const view = slot({ leaderboard: [withPace], cards: [card(['a'])] });

    expect(boardHtml(view)).toContain('colspan="5"');
    expect(boardHtml(slot({ leaderboard: [ranked([{ ballIds: ['a'], position: 1 }])], cards: [card(['a'])] })))
        .toContain('colspan="4"');
});

test('a second ranked board is never expanded — only the classified one', () => {
    const first = ranked([{ ballIds: ['a'], position: 1 }]);
    const second: RankedSection = { ...ranked([{ ballIds: ['a'], position: 1 }]), metricId: 'gross', metricLabel: 'Gross' };
    const view = slot({ leaderboard: [first, second], cards: [card(['a'])] });
    const html = boardHtml(view);

    expect(html.match(/lb-rank__toggle/g)?.length).toBe(1);
    expect(html).toContain('<h4 class="lb-section__title">Gross</h4>');
});

test('without an expansion context the board renders byte-identically', () => {
    const view = slot({
        leaderboard: [ranked([{ ballIds: ['a'], position: 1 }])],
        cards: [card(['a'])],
    });

    const plain = renderSlotLeaderboard(view, nameOf);
    expect(plain).not.toContain('lb-rank__toggle');
    expect(plain).not.toContain('lb-rank__panel');
    expect(plain).toContain('<td class="lb-rank__who"><span class="lb-rank__whobox">');
});
