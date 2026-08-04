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

// `tee-y` MUST stay first: the web's `addPlayer` seeds every row with
// `tees[0]`, so the tee-blind scenarios below (and the eight drafts they
// pinned before per-player tees existed) depend on it being Yellow.
const tees: Tee[] = [
    {
        id: 'tee-y',
        courseId: 'c1',
        name: 'Yellow',
        colour: null,
        holeLengths: [],
        ratings: [
            { gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 5800 },
            { gender: 'F', courseRating: 74, slope: 120, par: 72, totalLengthM: 5200 },
        ],
    },
    {
        id: 'tee-r',
        courseId: 'c1',
        name: 'Red',
        colour: null,
        holeLengths: [],
        ratings: [
            { gender: 'M', courseRating: 68.4, slope: 124, par: 72, totalLengthM: 5000 },
            { gender: 'F', courseRating: 72.1, slope: 128, par: 72, totalLengthM: 5000 },
        ],
    },
];

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
    svc.tees.set(tees);
    return svc;
}

/**
 * A game the round is played under that NO card owns — the "+ Custom game"
 * path (spec §6.3). It is not a card pick with extra fields: the web's
 * `addCustomGame` mints a slot and NO balls, which is why a custom slot's
 * subjects are whoever is ticked rather than sides the client invented.
 */
interface CustomGame {
    formatId: string;
    /** As typed into the allowance field; the web parses it at build time. */
    allowancePct?: string;
    /** Roster indices (0-based) ticked OUT of this slot's subjects. */
    excludePlayers?: number[];
}

/** One scenario: a roster and the game(s) it plays, as a user would set it up. */
interface Scenario {
    name: string;
    /** Card picks, in pick order — which is wire order. */
    formatIds: string[];
    /** Slots added through "+ Custom game", after the cards. */
    custom?: CustomGame[];
    players: string[];
    /** Handicap index text per player, defaulting to '12' (as typed). */
    indices?: string[];
    /** The route preset, defaulting to the whole course from hole 1. */
    preset?: 'full_18' | 'front_9' | 'back_9';
    /** The hole play starts on, defaulting to the preset's first. */
    startHole?: number;
    /** Tee id per player, defaulting to `tees[0]` as the web's roster does. */
    tees?: string[];
    /** Gender per player, defaulting to the web's `M`. */
    genders?: ('M' | 'F')[];
}

const scenarios: Scenario[] = [
    {
        name: 'stablefordIndividualThree',
        formatIds: ['stableford_individual'],
        players: ['Anna', 'Bert', 'Cleo'],
        indices: ['12', '18.4', '+2.4'],
    },
    {
        name: 'talibanBetterBallFour',
        formatIds: ['taliban_better_ball'],
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    {
        name: 'stablefordBetterBallFour',
        formatIds: ['stableford_better_ball'],
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    {
        name: 'kopenhamnareFour',
        formatIds: ['kopenhamnare_individual'],
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    {
        name: 'umbrellaIndividualThree',
        formatIds: ['umbrella_individual'],
        players: ['Anna', 'Bert', 'Cleo'],
    },
    {
        // Per-ball metadata AND config fields on one individual format — the
        // shape umbrella does not cover, since it declares no config.
        name: 'fairwaysGreensIndividualThree',
        formatIds: ['fairways_greens_individual'],
        players: ['Anna', 'Bert', 'Cleo'],
    },
    {
        name: 'matchPlayIndividualTwo',
        formatIds: ['match_play_individual'],
        players: ['Anna', 'Bert'],
    },
    {
        name: 'matchPlayBetterBallFour',
        formatIds: ['match_play_better_ball'],
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    {
        name: 'umbrella4BallFour',
        formatIds: ['umbrella_4_ball'],
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    // --- Route encodings (spec §3.3). The head-of-the-set cases pin the rule
    // that matters most on the wire: a conventional round emits the BARE
    // `roundType` and no `route` key at all.
    {
        name: 'frontNineFromHoleOne',
        formatIds: ['stableford_individual'],
        players: ['Anna', 'Bert'],
        preset: 'front_9',
    },
    {
        name: 'backNineFromHoleTen',
        formatIds: ['stableford_individual'],
        players: ['Anna', 'Bert'],
        preset: 'back_9',
    },
    {
        name: 'fullEighteenFromHoleTen',
        formatIds: ['stableford_individual'],
        players: ['Anna', 'Bert'],
        preset: 'full_18',
        startHole: 10,
    },
    {
        name: 'backNineFromHoleFourteen',
        formatIds: ['stableford_individual'],
        players: ['Anna', 'Bert'],
        preset: 'back_9',
        startHole: 14,
    },
    // --- Per-player tees (spec §4.5 B4.8): tees ride on the PRODUCER, and two
    // players in the same round can be on different ones.
    {
        name: 'mixedTeesAndGenders',
        formatIds: ['stableford_individual'],
        players: ['Anna', 'Bert'],
        tees: ['tee-r', 'tee-y'],
        genders: ['F', 'M'],
    },
    // --- Several games on one round (spec §6.2 B6.3). Slot order is wire
    // order, and the two leaderboards are scored side by side off one set of
    // scores.
    {
        name: 'twoIndividualAndBetterBall',
        formatIds: ['stableford_individual', 'stableford_better_ball'],
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    // Two SIDE games. The second must adopt the sides the first already made
    // rather than mint a parallel pairing — "set your pairs up once". This is
    // the fixture that catches a native builder re-seeding per slot.
    {
        name: 'twoSideGamesShareTeams',
        formatIds: ['taliban_better_ball', 'stableford_better_ball'],
        players: ['Anna', 'Bert', 'Cleo', 'Dan'],
    },
    // --- The custom path (spec §6.3): a card game plus a slot no card owns,
    // with its own allowance and its own subject list.
    {
        name: 'customStrokePlayAlongsideCard',
        formatIds: ['stableford_individual'],
        custom: [
            {
                formatId: 'stroke_play_individual',
                allowancePct: '90',
                excludePlayers: [3],
            },
        ],
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
        scenarios.flatMap((s) =>
            s.formatIds.map((id) => {
                const d = allDescriptors.find((x) => x.id === id);
                if (!d) throw new Error(`scenario ${s.name}: no such format ${id}`);
                return shapeKey(d);
            }),
        ),
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
        svc.patchPlayer(p.key, {
            name,
            handicapIndex: scenario.indices?.[i] ?? '12',
            ...(scenario.tees ? { teeId: scenario.tees[i] } : {}),
            ...(scenario.genders ? { gender: scenario.genders[i] } : {}),
        });
    });
    if (scenario.preset) svc.setPreset(scenario.preset);
    if (scenario.startHole !== undefined) svc.startHole.set(scenario.startHole);
    for (const formatId of scenario.formatIds) svc.pickGame(formatId);
    for (const custom of scenario.custom ?? []) {
        // The same two calls the "+ Custom game" button makes: mint a slot no
        // card owns, then point it at the format the user actually wanted.
        svc.addCustomGame();
        const slot = svc.formatSlots.get().at(-1)!;
        svc.setSlotFormat(slot.key, custom.formatId);
        if (custom.allowancePct) svc.setSlotAllowance(slot.key, custom.allowancePct);
        for (const index of custom.excludePlayers ?? []) {
            svc.setSubjectPlayer(slot.key, svc.players.get()[index]!.key, false);
        }
    }
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
const usedIds = new Set(
    scenarios.flatMap((s) => [...s.formatIds, ...(s.custom ?? []).map((c) => c.formatId)]),
);
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
