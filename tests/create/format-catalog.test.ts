import { expect, test } from 'bun:test';
import { FormatCatalogService, MAX_TEAM_SIZE } from '../../src/create/format-catalog.service';
import type { FormatConfigField, FormatDescriptor } from '../../src/api/setup.gen';
import { registerBuiltInFormats } from '../../server/domain/formats';
import { clearFormats, formatCatalog } from '../../server/domain/formats/plugin';

// Catalog classification (2.6e M3) — the pure descriptor → UI-shape mapping the
// whole catalog-driven format step hangs off. No fetch involved: `classify`
// reads only the descriptor object, so we feed synthetic descriptors straight
// into the service's `descriptors` signal.

function descriptor(
    id: string,
    balls: FormatDescriptor['requirements']['balls'],
    labels: FormatDescriptor['labels'] = { en: id },
): FormatDescriptor {
    return {
        id,
        label: labels.en,
        labels,
        description: '',
        scoringMode: 'stableford',
        teamShape: 'individual',
        requirements: { balls },
        defaults: { allowanceConfig: { type: 'flat', pct: 100 } },
        metrics: [],
        clientAdapterId: null,
    };
}

const individual = descriptor('stableford_individual', {
    producerCount: { min: 1, max: 1 },
    ballMode: 'own',
});
const teamBall = descriptor('scramble', {
    producerCount: { min: 2, max: 4 },
    ballMode: 'team',
});
const sideFormat = descriptor('better_ball', {
    producerCount: { min: 1, max: 1 },
    ballMode: 'own',
    requiresSlotTeamGrouping: true,
    slotTeamGrouping: { teamSize: { min: 2, max: 2 }, teamCount: { min: 2 } },
});
const bareGrouping = descriptor('bare_grouping', {
    producerCount: { min: 1, max: 1 },
    ballMode: 'own',
    requiresSlotTeamGrouping: true,
});

function catalog(): FormatCatalogService {
    const svc = new FormatCatalogService();
    svc.descriptors.set([individual, teamBall, sideFormat, bareGrouping]);
    return svc;
}

test('classify: team ball mode → team_ball with the per-ball producer bounds', () => {
    const c = catalog().classify(teamBall);
    expect(c.kind).toBe('team_ball');
    expect(c.teamSize).toEqual({ min: 2, max: 4 });
    expect(c.teamCount).toBeUndefined();
});

test('classify: slot team grouping → team_grouping with declared size + count bounds', () => {
    const c = catalog().classify(sideFormat);
    expect(c.kind).toBe('team_grouping');
    expect(c.teamSize).toEqual({ min: 2, max: 2 });
    expect(c.teamCount).toEqual({ min: 2 });
});

test('classify: grouping without declared bounds defaults to pairs, no teamCount', () => {
    const c = catalog().classify(bareGrouping);
    expect(c.kind).toBe('team_grouping');
    expect(c.teamSize).toEqual({ min: 2, max: 2 });
    expect(c.teamCount).toBeUndefined();
});

test('classify: plain own-ball format is individual (1/1)', () => {
    const c = catalog().classify(individual);
    expect(c.kind).toBe('individual');
    expect(c.teamSize).toEqual({ min: 1, max: 1 });
});

test('classifyId / byId return null for an unknown format id', () => {
    const svc = catalog();
    expect(svc.byId('wolf')).toBeNull();
    expect(svc.classifyId('wolf')).toBeNull();
});

test('needsTeams is true for every non-individual kind', () => {
    const svc = catalog();
    expect(svc.needsTeams('stableford_individual')).toBe(false);
    expect(svc.needsTeams('scramble')).toBe(true);
    expect(svc.needsTeams('better_ball')).toBe(true);
    expect(svc.needsTeams('missing')).toBe(false);
});

test('isSideFormat: only team_grouping formats aggregate sides; a team ball is not a side', () => {
    const svc = catalog();
    expect(svc.isSideFormat('better_ball')).toBe(true);
    expect(svc.isSideFormat('scramble')).toBe(false);
    expect(svc.isSideFormat('stableford_individual')).toBe(false);
});

test('acceptsSideSubjects (ADR-0004): metadata-free ball formats only', () => {
    const metaFormat: FormatDescriptor = {
        ...descriptor('umbrella_individual', { producerCount: { min: 1, max: 1 }, ballMode: 'own' }),
        requirements: {
            balls: { producerCount: { min: 1, max: 1 }, ballMode: 'own' },
            scoreEntry: { strokes: true, metadata: [{ key: 'gir', label: 'GIR', kind: 'boolean' }] },
        },
    };
    const svc = new FormatCatalogService();
    svc.descriptors.set([individual, teamBall, sideFormat, metaFormat]);
    expect(svc.acceptsSideSubjects('stableford_individual')).toBe(true); // aggregated virtual subject
    expect(svc.acceptsSideSubjects('better_ball')).toBe(false); // side format: consumes sides directly
    expect(svc.acceptsSideSubjects('umbrella_individual')).toBe(false); // per-ball metadata: undefined aggregation
    expect(svc.acceptsSideSubjects('missing')).toBe(false);
});

// labelOf (2.7d — format-label i18n): picks labels[locale], falling back to
// labels.en, then to the descriptor's canonical `label`. `locale` is an
// explicit param here (defaults to `currentLocale()` in production) so these
// tests never touch `navigator.language`.

const withSwedish = descriptor(
    'stableford_individual',
    { producerCount: { min: 1, max: 1 }, ballMode: 'own' },
    { en: 'Stableford', sv: 'Poängbogey' },
);
const englishOnly = descriptor(
    'match_play_individual',
    { producerCount: { min: 1, max: 1 }, ballMode: 'own' },
    { en: 'Match play' },
);

test('labelOf: sv locale picks the Swedish label when present', () => {
    const svc = new FormatCatalogService();
    svc.descriptors.set([withSwedish]);
    expect(svc.labelOf(withSwedish, 'sv')).toBe('Poängbogey');
    expect(svc.labelOf('stableford_individual', 'sv')).toBe('Poängbogey');
});

test('labelOf: en locale picks labels.en', () => {
    const svc = new FormatCatalogService();
    svc.descriptors.set([withSwedish]);
    expect(svc.labelOf(withSwedish, 'en')).toBe('Stableford');
});

test('labelOf: sv locale falls back to labels.en when no Swedish label is declared', () => {
    const svc = new FormatCatalogService();
    svc.descriptors.set([englishOnly]);
    expect(svc.labelOf(englishOnly, 'sv')).toBe('Match play');
    expect(svc.labelOf('match_play_individual', 'sv')).toBe('Match play');
});

test('labelOf: unknown format id returns null', () => {
    const svc = catalog();
    expect(svc.labelOf('wolf', 'sv')).toBeNull();
});

// --- playableShape (format-templates Phase B) --------------------------------
//
// "The ball shape is derived, not declared": what a game is contested between
// comes out of the strategy's own `ballRequirement()`, so a correctly-declared
// new format gets a correct card with NO client change. These assert against
// the REAL builtin descriptors — JSON-round-tripped exactly as they cross the
// wire — so a strategy that changes its ball requirement fails here.

function builtins(): FormatCatalogService {
    clearFormats();
    registerBuiltInFormats();
    const svc = new FormatCatalogService();
    svc.descriptors.set(JSON.parse(JSON.stringify(formatCatalog())) as FormatDescriptor[]);
    return svc;
}

function shapeOf(svc: FormatCatalogService, id: string) {
    const d = svc.byId(id);
    if (!d) throw new Error(`no builtin descriptor for '${id}'`);
    return svc.playableShape(d);
}

test('playableShape: taliban is 2 balls of exactly 2 (its declared grouping)', () => {
    const svc = builtins();
    expect(shapeOf(svc, 'taliban_better_ball')).toEqual({
        count: { min: 2, max: 2 },
        size: { min: 2, max: 2 },
    });
    // The grouping wins over the format's own slotBallCount (4 = total players,
    // not the number of contesting balls).
    expect(svc.byId('taliban_better_ball')!.requirements.balls.slotBallCount).toEqual({
        min: 4,
        max: 4,
    });
});

test('playableShape: umbrella 4-ball is 2 balls of exactly 2', () => {
    expect(shapeOf(builtins(), 'umbrella_4_ball')).toEqual({
        count: { min: 2, max: 2 },
        size: { min: 2, max: 2 },
    });
});

test('playableShape: köpenhamnare is 3 balls, each a player OR a side (ADR-0004)', () => {
    expect(shapeOf(builtins(), 'kopenhamnare_individual')).toEqual({
        count: { min: 3, max: 3 },
        size: { min: 1, max: MAX_TEAM_SIZE },
    });
});

test('playableShape: umbrella individual is 3 SINGLE-player balls — it consumes per-ball metadata', () => {
    const svc = builtins();
    expect(svc.acceptsSideSubjects('umbrella_individual')).toBe(false);
    expect(shapeOf(svc, 'umbrella_individual')).toEqual({
        count: { min: 3, max: 3 },
        size: { min: 1, max: 1 },
    });
});

test('playableShape: formats declaring no ball count at all are one ball per player, unbounded', () => {
    const svc = builtins();
    for (const id of ['stableford_individual', 'stroke_play_individual']) {
        expect({ id, shape: shapeOf(svc, id) }).toEqual({
            id,
            shape: { count: { min: 1 }, size: { min: 1, max: 1 } },
        });
    }
});

test('playableShape: better-ball stableford is ≥2 sides of 2–10, straight off its grouping', () => {
    // The declared `slotTeamGrouping` is the whole derivation: no teamCount ⇒
    // "add a ball" stays open, teamSize 2..10 ⇒ any side size the engine takes.
    expect(shapeOf(builtins(), 'stableford_better_ball')).toEqual({
        count: { min: 2 },
        size: { min: 2, max: 10 },
    });
});

test('playableShape: match play is ≥2 balls, each a player or an aggregated side', () => {
    // `slotBallCount { min: 2 }` with no max — the same open-ended count the
    // card seeds two balls for, and a ball may be a side (no metadata).
    expect(shapeOf(builtins(), 'match_play_individual')).toEqual({
        count: { min: 2 },
        size: { min: 1, max: MAX_TEAM_SIZE },
    });
});

test('playableShape: an unbounded team count stays unbounded (the better-ball family)', () => {
    // `sideFormat` declares teamCount { min: 2 } with no max — V1 seeds two
    // balls and offers "add a ball" rather than inventing a ceiling.
    expect(catalog().playableShape(sideFormat)).toEqual({
        count: { min: 2 },
        size: { min: 2, max: 2 },
    });
    // A grouping format that declares no bounds at all falls back to pairs.
    expect(catalog().playableShape(bareGrouping)).toEqual({
        count: { min: 2 },
        size: { min: 2, max: 2 },
    });
});

test('playableShape: a team-ball format is contested between TEAMS, not players', () => {
    // No builtin declares `ballMode: 'team'` yet (foursomes / greensomes /
    // scramble). Pinned so registering one yields a correct card with no client
    // change — and so it can never silently fall through to "one ball each",
    // which is what `classify` already refuses to do for the same descriptor.
    expect(catalog().playableShape(teamBall)).toEqual({
        count: { min: 2 },
        size: { min: 2, max: 4 },
    });
    // The declared ball count wins when there is one.
    const fixedFourballs = descriptor('scramble_4', {
        producerCount: { min: 2, max: 2 },
        ballMode: 'team',
        slotBallCount: { min: 4, max: 4 },
    });
    expect(catalog().playableShape(fixedFourballs)).toEqual({
        count: { min: 4, max: 4 },
        size: { min: 2, max: 2 },
    });
});

// --- configLabelOf / presets (format-templates Phase B) ----------------------

const bonusRule: FormatConfigField = {
    kind: 'select',
    key: 'bonusRule',
    labels: { en: 'Birdie/eagle bonus on', sv: 'Birdie/örn-bonus på' },
    options: [
        { value: 'gross', labels: { en: 'Gross', sv: 'Brutto' } },
        { value: 'net', labels: { en: 'Net' } },
    ],
    default: 'gross',
};

test('configLabelOf: config fields and options carry labels only — no bare `label` fallback', () => {
    const svc = catalog();
    expect(svc.configLabelOf(bonusRule, 'sv')).toBe('Birdie/örn-bonus på');
    expect(svc.configLabelOf(bonusRule, 'en')).toBe('Birdie/eagle bonus on');
    expect(svc.configLabelOf(bonusRule.options[0]!, 'sv')).toBe('Brutto');
    // No Swedish option label → English, never the raw enum value.
    expect(svc.configLabelOf(bonusRule.options[1]!, 'sv')).toBe('Net');
});

test('configLabelOf: every builtin knob is labelled in both locales the client asks for', () => {
    const svc = builtins();
    for (const d of svc.descriptors.get()) {
        for (const field of d.configFields ?? []) {
            expect(svc.configLabelOf(field, 'en')).not.toBe('');
            expect(svc.configLabelOf(field, 'sv')).not.toBe('');
            for (const option of field.options) {
                expect(svc.configLabelOf(option, 'en')).not.toBe('');
                expect(svc.configLabelOf(option, 'sv')).not.toBe(option.value);
            }
        }
    }
});

test('presets: only descriptors declaring one, ordered by rank', () => {
    const svc = builtins();
    const offered = svc.presets('en');
    expect(offered.length).toBeGreaterThan(0);
    for (const d of offered) expect(d.preset).toBeTruthy();
    const ranks = offered.map((d) => d.preset!.rank ?? Number.POSITIVE_INFINITY);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    // A format with no preset is NOT a card (it stays reachable as a custom game).
    const excluded = svc.descriptors.get().filter((d) => !d.preset).map((d) => d.id);
    for (const id of excluded) expect(offered.map((d) => d.id)).not.toContain(id);
});

test('presets: an absent rank sorts last, and reading it never reorders the catalog', () => {
    const svc = new FormatCatalogService();
    const withPreset = (id: string, rank?: number): FormatDescriptor => ({
        ...descriptor(id, { producerCount: { min: 1, max: 1 }, ballMode: 'own' }),
        preset: { tagline: { en: id, sv: id }, ...(rank === undefined ? {} : { rank }) },
    });
    const all = [
        withPreset('unranked'),
        descriptor('no_preset', { producerCount: { min: 1, max: 1 }, ballMode: 'own' }),
        withPreset('second', 2),
        withPreset('first', 1),
    ];
    svc.descriptors.set(all);
    expect(svc.presets('en').map((d) => d.id)).toEqual(['first', 'second', 'unranked']);
    expect(svc.descriptors.get().map((d) => d.id)).toEqual([
        'unranked',
        'no_preset',
        'second',
        'first',
    ]);
});
