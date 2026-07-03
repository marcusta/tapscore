import { expect, test } from 'bun:test';
import { FormatCatalogService } from '../../src/create/format-catalog.service';
import type { FormatDescriptor } from '../../src/api/setup.gen';

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
