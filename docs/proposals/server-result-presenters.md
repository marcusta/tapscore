# Server result presenters

Status: **draft proposal**

Related:

- [Result render contract and format-aware client templates](./result-render-contract.md)
- [Result render contract -- phased implementation plan](./result-render-contract-plan.md)
- [ADR-0001: Format plugins are self-contained and registry-driven](../adr/0001-format-plugins-are-self-contained.md)
- [ADR-0003: Balls are subjects; formats rank a chosen set of balls](../adr/0003-balls-as-subjects.md)

## Context

The result render contract work moved the **client** toward a registry-driven
model:

- `score_grid.componentId` selects a registered score-grid renderer;
- marker/tone vocabulary replaced format-shaped cell tokens;
- mobile and static renderers dispatch through registries instead of checking
  format ids.

That was useful, but it only fixed one side of the pipeline.

The **server** still builds most result sections through one shared
`result-builder.ts`. That builder receives a format's `StrategyResult` and then
decides, mostly by inspecting data shape, which cards, rows, summaries, captions,
footers, and totals should exist.

The current flow is roughly:

```text
format strategy score()
  -> StrategyResult
  -> generic result-builder.ts
       if pairResults exist -> pair card + match summary
       else if team results exist -> team cards
       if categoryDefs exist -> category rows
       if points exist -> points rows
       if runningTotals normalized -> running rows
       if cardTotals hidden -> suppress footer totals
  -> RoundResult JSON
  -> client/static renderer registry
```

The problem is not that `result-builder.ts` contains `if` statements at all.
Some local conditionals are normal. The problem is that this central builder is
where many format-specific **view decisions** are made, even when the decision
belongs to one format.

For example, hiding the Stableford card-footer total required changes in:

- the format descriptor;
- the descriptor type;
- the leaderboard service;
- the shared result builder.

That is a smell. The decision "Stableford does not want this footer" should be
found near Stableford's result presentation, not encoded as another generic flag
that all formats must mentally carry.

## Problem

The server result assembly is currently a god builder with data-driven
heuristics. It does not branch on `formatId`, which is good, but it still has
format behavior encoded as generic predicates and flags.

Examples:

- `hasPoints(...)` means "add a points row";
- `categoryDefs` means "switch to category matrix rows";
- `pairResults` means "build compact match cards";
- `runningTotals: "normalized"` means "add relative running rows and normalize
  totals";
- `cardTotals: "hidden"` means "do not emit footer totals";
- comments mention concrete format families such as match play, Taliban,
  Umbrella, Stableford, and Split sixes inside shared assembly code.

This creates the same pressure the client work was meant to avoid:

- changing one format still often requires editing generic infrastructure;
- format-specific presentation choices are hard to find;
- descriptor flags accumulate as disguised format branches;
- agents can keep adding "just one more generic option" instead of creating a
  real extension point;
- reading the server result path requires knowing every format's conventions at
  once.

The system is halfway migrated: client rendering is polymorphic, but server
result-section production is still centralized.

## Goals

- Make each format's result presentation discoverable from that format/plugin.
- Keep scoring rules in strategies and presentation assembly in presenters.
- Preserve the server-owned JSON contract; do not send server HTML or client
  code.
- Keep shared row/card helpers for reuse.
- Move format-specific card/row/summary decisions out of the central builder.
- Keep static verification and live product rendering on the same `RoundResult`
  contract.
- Avoid `if formatId === ...` in services, builders, and renderers.
- Make adding or changing one format's result view a local change.

## Non-goals

- Do not rewrite scoring strategies.
- Do not remove `score_grid`, `ranked`, or `match_summary`.
- Do not introduce _untyped_ `kind: "component"` Layer 2 sections (no
  `props: Record<string, unknown>` escape). Typed, `componentId`-keyed section
  payloads are in scope (see "Component-selected sections").
- Do not remove reusable helpers; the goal is format-owned composition, not
  copy/paste.
- Do not require every format to have bespoke client rendering.
- Do not big-bang migrate every format in one commit.

## Proposal

Introduce **server result presenters**.

A result presenter is the server-side equivalent of the client renderer
registry: a format-owned function that turns one format's `StrategyResult` into
`SlotResultView` sections.

Conceptually:

```text
format plugin
  score()        -> StrategyResult
  renderResult() -> SlotResultView
```

The shared builder should become a library of helpers, not the owner of result
shape decisions.

Instead of:

```text
LeaderboardService
  -> buildSlotResult(input)
       central builder decides pair/team/individual/category/points/totals
```

Use:

```text
LeaderboardService
  -> plugin.renderResult(input)
       format presenter decides cards/rows/sections
       presenter calls shared helpers
```

The default presenter can initially delegate to today's builder so migration is
incremental. Over time, formats move to explicit presenters.

## Core API

Add a presenter hook to `FormatPlugin`.

```ts
export interface FormatPlugin {
  descriptor: FormatDescriptor;
  score(input: ScoreInput): StrategyResult;
  renderResult?: FormatResultPresenter;
}

export type FormatResultPresenter = (input: FormatResultInput) => SlotResultView;
```

`FormatResultInput` should be close to today's `BuildSlotInput`, but named after
the extension point rather than the old central builder.

```ts
export interface FormatResultInput {
  slotIndex: number;
  slotDefId: string;
  formatId: string;
  formatLabel: string;
  scoringMode: string;
  teamShape: string;
  allowanceLabel: string;
  metrics: FormatMetric[];
  result: StrategyResult;
  slotBalls: SlotBall[];
  slotTeamGroupings: SlotTeamGrouping[];
  columns: ResultColumn[];
  effectiveSi?: Map<string, Map<string, number>>;
}
```

The format presenter should return the same `SlotResultView` contract the client
already consumes:

```ts
export interface SlotResultView {
  slotIndex: number;
  slotDefId: string;
  formatId: string;
  formatLabel: string;
  scoringMode: string;
  teamShape: string;
  allowanceLabel: string;
  cards: ScoreGridSection[];
  leaderboard: LeaderboardSection[];
}
```

The leaderboard service chooses the presenter by plugin dispatch:

```ts
const presenter = plugin.renderResult ?? defaultResultPresenter;
const slotView = presenter(input);
```

No service code should infer result behavior from `formatId`, `scoringMode`,
`teamShape`, or structural details such as `categoryDefs`.

## Shared Presenter Helpers

Create a helper module, for example:

```text
server/domain/strategies/result-presenter-helpers.ts
```

It contains reusable low-level building blocks currently buried in
`result-builder.ts`:

- `parRow`
- `siRow`
- `ballScoreRows`
- `pointsRow`
- `categoryRows`
- `categoryPointsRow`
- `runningRow`
- `rankedSection`
- `matchSummarySection`
- `scoreGridCard`
- `normalizeTotals`
- `groupTeamResults`
- `ballName/subject helpers` if needed

Helpers stay dumb. They are pure, low-level building blocks: they take explicit
arguments and return rows/cards/sorted entries. They do **not** decide. Anything
that decides — which card type to build, how odd/unmatched balls are handled, how
a match panel is assembled — is a view decision and lives in the format
presenter, not in a shared helper.

Good helper (vocabulary-oriented, decision-free):

```ts
categoryRows(columns, result)
```

Bad helper (embeds a view decision — rejected):

```ts
compactMatchCard(input, pair)   // decides card shape / odd-ball handling
stablefordRows(input)            // format-named
```

Format-specific composition may exist, but it lives beside that format's
presenter, not in the shared helper module. Enforce with tests: the shared
helper module contains no format ids, and no helper branches on `StrategyResult`
shape. If a helper needs an `if` about format behavior, it belongs in a
presenter.

## Format Presenters

Each presenter owns the result-section choices for its format.

### Stableford Individual

Stableford decides:

- use `default-score-grid`;
- emit Par, SI, Given, Gross, Net, Points rows;
- emit ranked Points section;
- do not emit duplicate card-footer totals;
- preserve verification footnotes when applicable.

That becomes local:

```ts
export const stablefordIndividualPresenter: FormatResultPresenter = (input) => {
  const cards = input.result.ballResults.map((result) =>
    scoreGridCard({
      componentId: "default-score-grid",
      title: oneBallTitle(result.ballId),
      subjectBallIds: [result.ballId],
      holes: holes(input.columns),
      subtitleFacts: stablefordFacts(input, result),
      rows: [
        parRow(input.columns),
        siRow(input.columns, input.effectiveSi?.get(result.ballId)),
        ...ballScoreRows(input.columns, result),
        pointsRow(input.columns, result),
      ],
      footnotes: pointFootnotes(result),
      totals: [],
    }),
  );

  return slotView(input, {
    cards,
    leaderboard: [rankedSection(input, "points")],
  });
};
```

Changing Stableford's footer, row order, or summary then means editing the
Stableford presenter.

### Umbrella Individual

Umbrella decides:

- use `category-matrix-grid`;
- emit category rows;
- emit category points row;
- emit normalized running row;
- emit normalized ranked totals;
- keep category arithmetic as tooltips/verification details.

This should live beside `umbrella-individual.ts`, not as `categoryDefs` checks in
a global builder.

### Match Play / Taliban

Match-like formats may share composition through a thin presenter constructor
they own — e.g. `matchPlayPresenter(config)` registered as each format's
`renderResult`. That is a format-owned presenter factory, not a shared helper:
it decides card shape and odd/unmatched-ball handling, so it stays on the format
side. The decision to use it belongs to the presenter or plugin registration.

Shared helpers stay dumb: a `matchPanel(sideA, sideB, leader, magnitude)` builder
that assembles a `MatchPanel` from explicit fields is fine because it makes no
decision. A helper that turns a `PairBallResult` into a card — choosing the card
shape — is a view decision and belongs to the presenter. The central service must
not decide "pair results exist, therefore this is the view."

## Component-selected sections

Presenters must be able to select the client rendering component for a section
and emit a payload shaped for that component — not just for score grids, but for
leaderboard sections too.

Today this is asymmetric:

- `ScoreGridSection` has `componentId` (the server picks the client grid
  renderer);
- `RankedSection` and `MatchSummarySection` are fixed shapes — a presenter
  cannot request a leaderboard component that wants a different payload.

Extend the same mechanism to leaderboard sections: a `componentId` plus a
payload typed and closed per component, exactly like the score-grid contract.
The constraints from the render-contract work carry over:

- **No untyped escape.** No `props: Record<string, unknown>`. Each component's
  payload is a typed, `componentId`-keyed contract (a discriminated union on
  `componentId`), so the server emits a valid shape and the client switches to a
  renderer typed for it. This is the same rule `VScoreGridSection` already states.
- **No server-side registry.** The registry lives on the client. The server
  needs only the type contract; the presenter selects a `componentId` and fills
  the matching payload.
- **Add components on demand.** Do not pre-build leaderboard component variants.
  The default ranked/match shapes stay until a real format needs a different
  structure (e.g. split sixes, a ladder); then add that one typed component.

This makes the proposal's earlier non-goal precise: arbitrary *untyped* component
sections are out; typed, `componentId`-keyed section payloads are in.

## What Happens To `resultDisplay`

`resultDisplay` should stop growing into a bag of format-specific flags.

Keep only truly generic, stable declarations:

- `scoreGridComponentId` may remain if it is simply metadata for default
  presenters or catalog visibility.

Avoid adding more knobs like:

- `cardTotals: "hidden"`;
- `hidePointsRow`;
- `showGrossRows`;
- `categoryMode`;
- `runningTotals: "normalized"` as a central-builder behavior flag.

Those are presenter decisions.

Migration rule:

> If adding a descriptor field requires `result-builder.ts` to interpret it, ask
> whether the field belongs in a format presenter instead.

For already-added fields, presenters can absorb the behavior and later delete the
flag from the descriptor when no default builder needs it.

## Default Presenter

Keep a default presenter temporarily:

```ts
export const defaultResultPresenter: FormatResultPresenter = (input) =>
  buildSlotResultWithLegacyHeuristics(input);
```

Its job is compatibility while formats migrate. It is not the architecture's
destination.

Mark it explicitly:

```ts
/**
 * Transitional presenter for formats not migrated to explicit result
 * presenters yet. Do not add new format-specific behavior here.
 */
```

Any new format-specific view change should be made in a presenter, not by adding
a new heuristic to the default presenter.

The default presenter is strictly transitional and **must die completely**. The
end state has no fallback: dispatch becomes `plugin.renderResult(input)` with no
`?? defaultResultPresenter`. The `??` exists only during Phases B--F; Phase G
deletes `default-result-presenter.ts` outright. Deletion is enforced by an
architecture test (every production plugin has `renderResult`), so the type
system forbids regressing — not a code comment.

## Migration Strategy

Do this one format or format family at a time.

### Phase A -- Extract Helper Library

Goal: move pure reusable row/card helpers out of `result-builder.ts` without
changing output.

- Create `result-presenter-helpers.ts`.
- Move low-level helpers there.
- Keep `buildSlotResult` behavior unchanged.
- Add tests that output is unchanged for representative formats.

Gate:

- `bun run generate` has no diff.
- `bun run check:server`
- `bun run check:client`
- `bun run check:test`
- `bun test server/domain/strategies/`
- `bun run check:format-fixtures`
- `bun run render:formats`

### Phase B -- Add Presenter Hook

Goal: plugin dispatch exists, but all formats still use the default presenter.

- Add `renderResult?: FormatResultPresenter` to `FormatPlugin`.
- Move `BuildSlotInput` to a presenter-oriented type.
- Add `defaultResultPresenter`.
- `LeaderboardService` calls `plugin.renderResult ?? defaultResultPresenter`.

Gate:

- No generated result-shape diff.
- Existing format fixture HTML unchanged.
- No format presenter yet required.

### Phase C -- Migrate Stableford Individual

Goal: prove the model on the format that exposed the problem.

- Add `stableford-individual.presenter.ts` or co-locate presenter beside the
  strategy.
- Stableford presenter owns:
  - default score grid;
  - points row;
  - ranked points section;
  - no card footer totals.
- Remove Stableford-specific `cardTotals: "hidden"` interpretation from the
  central/default builder if nothing else uses it.
- Regenerate clients after removing `cardTotals` from the descriptor type; the
  committed generated clients are currently stale and omit the server-side
  `cardTotals?: "hidden"` field.

Gate:

- Zero diff on the `stableford_individual` snapshot (invariance guard green).
- Stableford output intentionally lacks duplicate footer.
- No central builder change needed for future Stableford row/card decisions.

### Phase D -- Migrate Category Formats

Goal: remove `categoryDefs` as a central builder mode switch.

- Add presenters for:
  - `umbrella_individual`;
  - `umbrella_4_ball`.
- Category presenters own category rows, category points rows, normalized running
  rows, captions, and normalized totals — including selecting the
  `category-matrix-grid` component.
- Shared helpers provide only decision-free blocks (`categoryRows`,
  `categoryPointsRow`, `runningRow`, the `scoreGridCard` shell). Choosing the
  matrix component and assembling the card is presenter-owned.

Gate:

- Zero diff on the `umbrella_individual` and `umbrella_4_ball` snapshots
  (invariance guard green, no `UPDATE_SNAPSHOTS`).
- Default presenter no longer needs to know about `categoryDefs`.

### Phase E -- Migrate Match-Like Formats

Goal: remove `pairResults` as a central builder mode switch.

- Add presenters for:
  - `match_play_individual`;
  - `match_play_better_ball`;
  - `taliban_better_ball`.
- Match-like formats share composition through a format-owned presenter
  constructor (e.g. `matchPlayPresenter(config)`), not a shared card helper.
- Shared helpers provide only decision-free blocks (`matchPanel(...)`,
  `matchSummarySection(...)` shell, ranked sort).
- Each presenter owns whether pair cards exist and how odd/unmatched balls are
  handled.

Gate:

- Zero diff on the `match_play_individual`, `match_play_better_ball`, and
  `taliban_better_ball` snapshots (invariance guard green).
- Default presenter no longer needs to infer pair views from `pairResults`.

### Phase F -- Migrate Remaining Default-Grid Formats

Goal: every production format has an explicit result presenter.

Candidates:

- `stroke_play_individual`;
- `stableford_better_ball`;
- `kopenhamnare_individual`;
- any remaining team/stroke variants.

Each presenter can be small if it fits the default grid. To avoid N
near-identical files, provide a format-owned presenter constructor
`defaultGridPresenter(config)`; small formats register
`renderResult: defaultGridPresenter({...})`. This is a thin presenter factory the
format owns, **not** a shared god-helper — it gives discoverability without
copy/paste. The value is that format result shape lives with the format.

### Phase G -- Retire Legacy Builder

Goal: `result-builder.ts` is no longer a god builder.

- Delete the default presenter (`default-result-presenter.ts`) and remove the
  `?? defaultResultPresenter` fallback; dispatch is plain `plugin.renderResult`.
- Keep only shared helper modules.
- Remove descriptor flags that only existed for the default builder.
- Add architecture tests:
  - every production format plugin has `renderResult`;
  - no production presenter imports another format's presenter directly;
  - central services do not inspect `formatId`, `scoringMode`, `teamShape`, or
    `StrategyResult` shape to decide rendering.

## Tests And Guardrails

Add tests that enforce the direction:

- Every built-in format has a result presenter once migration is complete.
- `LeaderboardService` dispatches through `plugin.renderResult`.
- No `formatId` checks in renderers/builders.
- No new `resultDisplay` fields without an explicit review.
- Default presenter contains no format names.
- Shared helper module contains no production format ids.
- Each migrated format has a focused test asserting component ids and key rows.
- The committed-snapshot invariance guard (below) stays green with no
  `UPDATE_SNAPSHOTS` across every migration phase.

### Invariance guard (primary regression gate)

`bun run check:format-fixtures` and `bun run render:formats` do **not** prove a
migration is behavior-preserving: `render:formats` writes into the gitignored
`tmp/formats/`, and `check:format-fixtures` only asserts the fixture DB exists
plus a round count. Neither compares output.

The actual invariance gate is the committed-snapshot test
`server/domain/strategies/result-view-invariance.test.ts` with snapshots under
`server/domain/strategies/__snapshots__/result-views/*.json`. It drives the real
`LeaderboardService.resultForRound` path for every production format and asserts
each `SlotResultView` deep-equals its committed snapshot. Volatile compiler ids
(hashes of random seed UUIDs) are canonicalized to first-appearance tokens so
snapshots are rebuild-stable.

Convention:

- A format's snapshot is captured **while it is still on the default builder**, so
  it freezes the pre-migration baseline. Every format slated for migration must
  have a snapshot **before** its phase.
- A behavior-preserving migration (Phases C--F) MUST produce a **zero snapshot
  diff**. A green run with no snapshot change is the byte-identical proof.
- `UPDATE_SNAPSHOTS=1 bun test …/result-view-invariance.test.ts` regenerates
  snapshots. A snapshot diff in a migration PR is **not** a free re-baseline: it
  means observable output changed and must be reviewed as an intentional change.

Still run `check:format-fixtures` / `render:formats` for the human-inspectable
HTML, but the snapshot guard is what gates correctness.

## Naming

Recommended names:

- `FormatResultPresenter` -- function type.
- `FormatResultInput` -- input passed from leaderboard service to presenter.
- `result-presenter-helpers.ts` -- shared low-level helpers.
- `default-result-presenter.ts` -- transitional legacy presenter.
- `<format-id>.presenter.ts` -- format-owned presenter, if separated from the
  strategy file.

Avoid:

- `builder` for the new extension point, because it carries the old centralizing
  shape.
- `viewStrategy`, because "strategy" already means scoring strategy in this
  codebase.
- `template`, because client score-grid components already occupy that mental
  space.

## Open Questions

1. Should presenters live in the same file as scoring strategies or in sibling
   `*.presenter.ts` files?

   Recommendation: sibling files for larger formats, co-located export for very
   small formats. The plugin registration should make the pairing obvious.

2. Should `scoreGridComponentId` stay in `FormatDescriptor` after all formats
   have presenters?

   Recommendation: only if the setup/catalog UI needs to expose it. Otherwise,
   let presenters put `componentId` directly on `ScoreGridSection`.

3. Should ranked / leaderboard sections also become component-selected?

   Resolved: yes. Today `ScoreGridSection` carries `componentId` so the server
   selects the client grid renderer, but `RankedSection` and
   `MatchSummarySection` are fixed shapes — a presenter cannot pick a leaderboard
   component that expects a different payload. The contract must let server code
   select a client component **and** emit the payload shape that component
   expects. See "Component-selected sections". There is no server-side registry;
   the registry is the client's, and the server only needs the typed,
   `componentId`-keyed contract so presenters emit valid shapes.

4. Should static verification use different presenters than product?

   Recommendation: no. Presenters emit audit-capable data once. Product vs
   verification remains renderer mode, so the same `RoundResult` can serve both.

## Summary

The current result-render work made the client more open/closed, but the server
still has a centralized view-shape builder. That is why format-specific changes
still touch generic files.

Server result presenters complete the architecture:

- scoring strategy owns scoring;
- result presenter owns section/card/row composition;
- shared helpers provide reuse;
- client/static registries own visual rendering;
- services only dispatch through plugins.

The destination is not "no conditionals anywhere." The destination is that the
conditionals that express Stableford live in Stableford, the conditionals that
express Umbrella live in Umbrella, and shared infrastructure stops accumulating
format-shaped flags.
