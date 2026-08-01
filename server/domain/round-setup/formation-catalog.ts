// Ball teams (docs/proposals/ball-teams-composition.md) Phase A — the
// serializable formation catalog.
//
// A `formation` on a `single_ball` `DraftRoundTeam` (draft.ts) used to be pure
// metadata: a display label the builder read only to name the merged ball. It
// becomes a RULE OBJECT here — size bounds plus the default per-position
// allowance recipe the setup UI seeds member percentages from. The draft schema
// is UNCHANGED: `DraftRoundTeam` already carries `formation` + per-member
// `allowancePct`, and the builder still never needs the recipe. Seeding is a
// setup-time concern; what reaches the builder is always frozen percentages.
//
// This is a fixed table, not a plugin registry — a formation carries no
// behaviour to dispatch (contrast `../formats/plugin.ts` and
// `../aggregation/strategy.ts`, which register functions). So: no registry, no
// `register*` seam, just the descriptors, served by `GET /setup/formations`.
// Both clients read this one source; adding a formation never touches client
// code.
//
// `custom` is deliberately ABSENT: it stays a valid draft `formation` value for
// the web flexible editor (unbounded size, hand-entered percentages) precisely
// because it has no recipe to describe.
//
// The server does NOT enforce these bounds — single-ball team size is
// unvalidated server-side today (`DraftTeamMember` has `minItems: 1` and no
// max; builder.ts checks kind/nesting only). Bounds are a setup-UI concern
// like the rest of the seeding, alongside the web client's `MAX_TEAM_SIZE`
// (src/create/format-catalog.service.ts) = 10.
//
// Unlike `FormatDescriptor`/`AggregationDescriptor` there is no legacy
// `label: string` mirror and no `description` — formations have no
// English-only consumer, and the card copy lives with the setup UI.

/** Per-language display names — same convention as `FormatLabels`. Formation
 * names are used as-is in Swedish golf, so `sv` differs only in inflection. */
export interface FormationLabels {
    en: string;
    sv?: string;
}

/** Team size bounds, inclusive. Named (rather than inlined) so the generated
 * clients get a `FormationSize` instead of borrowing a structurally identical
 * type from an unrelated descriptor. */
export interface FormationSize {
    min: number;
    max: number;
}

/**
 * Serializable formation metadata. Carries NO functions —
 * `JSON.parse(JSON.stringify(descriptor))` must round-trip identically (the
 * proposal's `allowances(memberCount)` ships as the per-size table below).
 */
export interface FormationDescriptor {
    /** Stable, language-independent key; matches `DraftRoundTeam.formation`. */
    id: string;
    labels: FormationLabels;
    /** Foursomes/greensomes are exactly 2; scramble is capped at 8, under the
     * setup UI's `MAX_TEAM_SIZE` of 10. */
    size: FormationSize;
    /**
     * Default allowance % by position, keyed by member count. Members are
     * sorted by playing handicap ASCENDING, so position 1 (index 0) is the
     * lowest handicap. Keys are strings because that is what a JSON object
     * carries; every key lies within `size` and every array's length equals its
     * key (formation-catalog.test.ts holds that shut).
     *
     * Defaults are computed, overrides are sticky: the setup UI re-seeds on a
     * membership/handicap change unless the team was hand-edited.
     */
    allowancesBySize: Record<string, number[]>;
}

// --- The catalog ------------------------------------------------------------
//
// Established WHS/USGA conventions for foursomes (50/50) and greensomes
// (60/40); scramble convention exists up to 4 (35/15, 30/20/10, 25/20/15/10)
// and no further — 5-8 extend it with 5 then a 0 floor. That tail is a
// DOCUMENTED DEFAULT, not a rule, and is freely overridable per member.

const FORMATIONS: FormationDescriptor[] = [
    {
        id: 'foursomes',
        labels: { en: 'Foursomes', sv: 'Foursome' },
        size: { min: 2, max: 2 },
        allowancesBySize: { 2: [50, 50] },
    },
    {
        id: 'greensomes',
        labels: { en: 'Greensomes', sv: 'Greensome' },
        size: { min: 2, max: 2 },
        allowancesBySize: { 2: [60, 40] },
    },
    {
        id: 'scramble',
        labels: { en: 'Scramble', sv: 'Scramble' },
        size: { min: 2, max: 8 },
        allowancesBySize: {
            2: [35, 15],
            3: [30, 20, 10],
            4: [25, 20, 15, 10],
            5: [25, 20, 15, 10, 5],
            6: [25, 20, 15, 10, 5, 0],
            7: [25, 20, 15, 10, 5, 0, 0],
            8: [25, 20, 15, 10, 5, 0, 0, 0],
        },
    },
];

/** Serializable catalog — deterministically ordered by id, like
 * `formatCatalog()` / `aggregationCatalog()`. Chip order is a client concern. */
export function formationCatalog(): FormationDescriptor[] {
    return [...FORMATIONS].sort((a, b) => a.id.localeCompare(b.id));
}
