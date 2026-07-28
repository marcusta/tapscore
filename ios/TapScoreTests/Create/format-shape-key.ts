// The structural identity of a format, for fixture-coverage purposes.
//
// The native draft builder branches on the DESCRIPTOR's declared ball
// requirement, never on a per-format table (that is the whole point of
// `FormatCatalog.playableShape`). So what the parity fixtures have to cover is
// not "every format" but "every structurally distinct requirement": two formats
// declaring the same shape — stroke play and Stableford individual, say — run
// the identical code path, and a second fixture for the second one would add
// bytes and no coverage.
//
// Shared by `derive-web-fixtures.ts` (which refuses to generate an incomplete
// fixture set) and `scripts/web-draft-fixtures.test.ts` (which checks the
// COMMITTED file the same way, so a shape gap is caught by `bun run test`
// whether or not anyone ran the generator).

import type { FormatDescriptor } from '../../../src/api/setup.gen';

/** Stable key order, so a key is a function of VALUES only. */
export function sortDeep(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortDeep);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
                .map(([k, v]) => [k, sortDeep(v)]),
        );
    }
    return value;
}

/** The parts of a descriptor the draft builder actually branches on. */
export function shapeKey(d: FormatDescriptor): string {
    const balls = d.requirements.balls;
    return JSON.stringify(
        sortDeep({
            ballMode: balls.ballMode,
            requiresSlotTeamGrouping: balls.requiresSlotTeamGrouping ?? false,
            slotBallCount: balls.slotBallCount ?? null,
            producerCount: balls.producerCount ?? null,
            slotTeamGrouping: balls.slotTeamGrouping ?? null,
            // Per-ball metadata (umbrella's GIR) excludes a format from side
            // aggregation — a branch, not a label.
            hasScoreEntryMetadata: (d.requirements.scoreEntry?.metadata?.length ?? 0) > 0,
            hasConfigFields: (d.configFields?.length ?? 0) > 0,
        }),
    );
}

/**
 * Every descriptor whose shape is not in `covered`, grouped by shape — so the
 * message can say "any one of these will do", which is true.
 */
export function uncoveredShapes(
    all: FormatDescriptor[],
    covered: Set<string>,
): Map<string, string[]> {
    const missing = new Map<string, string[]>();
    for (const d of all) {
        const key = shapeKey(d);
        if (covered.has(key)) continue;
        missing.set(key, [...(missing.get(key) ?? []), d.id]);
    }
    return missing;
}
