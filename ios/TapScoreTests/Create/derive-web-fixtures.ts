// Derive the iOS create-flow parity fixtures FROM THE WEB CLIENT ITSELF.
//
//   bun run ios/TapScoreTests/Create/derive-web-fixtures.ts
//
// The native draft builder's whole job is to send the server exactly what the
// web would send for the same choices. A hand-written expectation would only
// pin what the iOS author BELIEVED the web sends, so the expectations are
// generated instead: this script drives the real `SetupService` — the same
// class the web ships — with the real server format catalog, captures the
// draft it hands to `api.friendlyRounds.create`, and writes those drafts out
// as `WebDraftFixtures.swift`.
//
// The harness (api mock + builtin-format registration) mirrors
// `tests/create/setup-games.test.ts`, which is where the web's own card-layer
// behaviour is pinned; if that file's setup changes, this one follows.
//
// Regenerate whenever a format's declared ball requirement or the web's
// composition rules change. A diff in the generated Swift file IS the parity
// break, visible in review before it can reach a user.

import { mock } from 'bun:test';
import type { FormatDescriptor, SetupCourse, Tee } from '../../../src/api/setup.gen';
import { shapeKey, sortDeep, uncoveredShapes } from './format-shape-key';

let lastDraft: unknown = null;
let nextGuestId = 0;

class ApiError extends Error {}

const apiMock = {
    setup: {
        courses: mock(async () => []),
        teesByCourse: mock(async () => []),
        formats: mock(async () => []),
    },
    guestPlayers: {
        create: mock(async (input: { displayName: string }) => ({
            id: `guest-${++nextGuestId}`,
            displayName: input.displayName,
        })),
    },
    friendlyRounds: {
        create: mock(async ({ draft }: { draft: unknown }) => {
            lastDraft = draft;
            return {
                ok: true,
                friendlyRound: { id: 'fr-1', shareToken: 'tok-1' },
                round: { courseNameSnapshot: 'Test GC', status: 'not_started', completedAt: null },
            };
        }),
    },
};

mock.module('../../../src/api', () => ({ api: apiMock, ApiError }));
mock.module('../../src/api', () => ({ api: apiMock, ApiError }));

const { SetupService } = await import('../../../src/create/setup.service');
const { FormatCatalogService } = await import('../../../src/create/format-catalog.service');
const { di } = await import('@basics/core/client/core');
const { registerBuiltInFormats } = await import('../../../server/domain/formats');
const { clearFormats, formatCatalog } = await import('../../../server/domain/formats/plugin');

const course: SetupCourse = {
    id: 'c1',
    clubId: 'club-1',
    clubName: 'Club',
    name: 'Course',
    holeCount: 18,
    holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
};

const tee: Tee = {
    id: 'tee-y',
    courseId: 'c1',
    name: 'Yellow',
    colour: null,
    holeLengths: [],
    ratings: [
        { gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 5800 },
        { gender: 'F', courseRating: 74, slope: 120, par: 72, totalLengthM: 5200 },
    ],
};

type Setup = InstanceType<typeof SetupService>;

function makeService(): Setup {
    clearFormats();
    registerBuiltInFormats();
    const svc = new SetupService();
    svc.reset();
    di.get(FormatCatalogService).descriptors.set(
        JSON.parse(JSON.stringify(formatCatalog())) as FormatDescriptor[],
    );
    svc.courses.set([course]);
    svc.courseId.set('c1');
    svc.tees.set([tee]);
    return svc;
}

/** One scenario: a game and a roster, exactly as a user would set it up. */
interface Scenario {
    name: string;
    formatId: string;
    players: string[];
    /** Handicap index text per player, defaulting to '12' (as typed). */
    indices?: string[];
}

const scenarios: Scenario[] = [
    {
        name: 'stablefordIndividualThree',
        formatId: 'stableford_individual',
        players: ['Anna', 'Bert', 'Cleo'],
        indices: ['12', '18.4', '+2.4'],
    },
    {
        name: 'talibanBetterBallFour',
        formatId: 'taliban_better_ball',
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    {
        name: 'stablefordBetterBallFour',
        formatId: 'stableford_better_ball',
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    {
        name: 'kopenhamnareFour',
        formatId: 'kopenhamnare_individual',
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    {
        name: 'umbrellaIndividualThree',
        formatId: 'umbrella_individual',
        players: ['Anna', 'Bert', 'Cleo'],
    },
    {
        name: 'matchPlayIndividualTwo',
        formatId: 'match_play_individual',
        players: ['Anna', 'Bert'],
    },
    {
        name: 'matchPlayBetterBallFour',
        formatId: 'match_play_better_ball',
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    {
        name: 'umbrella4BallFour',
        formatId: 'umbrella_4_ball',
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
];

/// A format whose SHAPE no scenario covers fails the generator before it
/// writes anything (see `format-shape-key.ts` for what a shape is and why it,
/// rather than the format list, is the coverage unit). Declaring a new ball
/// requirement server-side therefore surfaces as a loud generator failure
/// instead of a native builder quietly guessing at a shape no fixture pinned.
function assertEveryShapeIsCovered(all: FormatDescriptor[], covered: Set<string>): void {
    const missing = uncoveredShapes(all, covered);
    if (missing.size === 0) return;
    const lines = [...missing.values()].map((ids) => `  - ${ids.join(', ')}`);
    throw new Error(
        `no scenario covers ${missing.size} distinct format shape(s):\n${lines.join('\n')}\n` +
            'Add a scenario for one format per group above (any of them will do — ' +
            'they declare the same shape) and regenerate.',
    );
}

/** The date every fixture claims to have been played on (see below). */
const FROZEN_PLAYED_AT = '2026-01-02';

// Fail before writing anything, so a shape gap is a generator error rather
// than a fixture file that silently stopped covering something.
clearFormats();
registerBuiltInFormats();
const allDescriptors = JSON.parse(JSON.stringify(formatCatalog())) as FormatDescriptor[];
assertEveryShapeIsCovered(
    allDescriptors,
    new Set(
        scenarios.map((s) => {
            const d = allDescriptors.find((x) => x.id === s.formatId);
            if (!d) throw new Error(`scenario ${s.name}: no such format ${s.formatId}`);
            return shapeKey(d);
        }),
    ),
);

const out: string[] = [];
for (const scenario of scenarios) {
    nextGuestId = 0;
    lastDraft = null;
    const svc = makeService();
    scenario.players.forEach((name, i) => {
        svc.addPlayer();
        const p = svc.players.get().at(-1)!;
        svc.patchPlayer(p.key, { name, handicapIndex: scenario.indices?.[i] ?? '12' });
    });
    svc.pickGame(scenario.formatId);
    const result = await svc.submit();
    if (!result.ok) throw new Error(`${scenario.name}: the web refused its own setup`);
    // `playedAt` is "today" on both clients, so pinning the run date would make
    // the fixture rot overnight. Freeze it; the Swift test builds its draft
    // with the same literal, which keeps the FIELD asserted without asserting
    // the calendar.
    (lastDraft as { playedAt: string }).playedAt = FROZEN_PLAYED_AT;
    out.push(
        `    static let ${scenario.name} = """\n${JSON.stringify(sortDeep(lastDraft), null, 2)
            .split('\n')
            .map((line) => `    ${line}`)
            .join('\n')}\n    """`,
    );
}

// The catalog the web read while building those drafts, so the Swift side
// derives its shapes from the SAME descriptors rather than a hand-typed copy.
// Only the formats the scenarios use, to keep the fixture readable.
const usedIds = new Set(scenarios.map((s) => s.formatId));
clearFormats();
registerBuiltInFormats();
const catalogJSON = JSON.stringify(
    sortDeep((formatCatalog() as FormatDescriptor[]).filter((d) => usedIds.has(d.id))),
    null,
    2,
)
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');

const header = `// GENERATED by ios/TapScoreTests/Create/derive-web-fixtures.ts — DO NOT EDIT.
//
// Each fixture is the draft the WEB client (\`src/create/setup.service.ts\`,
// driven with the real server format catalog) POSTs for the named game and
// roster. \`CreateDraftParityTests\` asserts the native builder produces the
// same JSON — key order normalised, values verbatim.
//
// Regenerate with:
//   bun run ios/TapScoreTests/Create/derive-web-fixtures.ts

enum WebDraftFixtures {
    /// Every fixture's \`playedAt\`, frozen so the expectations do not rot
    /// overnight. The test builds its draft with this same date.
    static let playedAt = "${FROZEN_PLAYED_AT}"

    /// The server format descriptors these drafts were built against — the same
    /// bytes \`GET /setup/formats\` serves, narrowed to the formats used below.
    static let catalogJSON = """
${catalogJSON}
    """

`;

await Bun.write(
    new URL('WebDraftFixtures.swift', import.meta.url).pathname,
    `${header}${out.join('\n\n')}\n}\n`,
);
console.log(`wrote ${scenarios.length} fixtures`);
