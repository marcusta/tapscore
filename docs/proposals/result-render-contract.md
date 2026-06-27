# Result render contract and format-aware client templates

Status: **draft proposal**

Related:

- [ADR-0001: Format plugins are self-contained and registry-driven](../adr/0001-format-plugins-are-self-contained.md)
- [ADR-0003: Balls are subjects; formats rank a chosen set of balls](../adr/0003-balls-as-subjects.md)

## Context

Tapscore currently renders live leaderboards from a canonical server-produced
`RoundResult`.

The server owns scoring:

- replay score events;
- apply handicap and net scoring;
- run the registered format plugin;
- build serializable result sections such as `score_grid`, `ranked`, and
  `match_summary`.

The client owns presentation:

- resolve ball ids to display names;
- group holes into route sections;
- render tables, cards, match panels, colors, marks, and responsive layout.

This split is intentionally good: the client does not reimplement golf rules,
and the server does not send arbitrary UI code.

The problem is that some current "generic" render hints are not truly generic.
For example, `GridCell.mark = "win" | "win2" | "win5"` came from Taliban's
visual language. The generic renderer therefore knows that `win5` should draw a
diamond. That is not a golf-wide concept; it is a format-specific result visual
that leaked into the shared contract.

## Problem

The current result-section model sits between two shapes:

1. It is not fully semantic, because some hints describe visuals directly.
2. It is not fully template-oriented, because a format cannot ask for a richer
   client component with named slots.

This creates pressure in two bad directions:

- keep adding format-shaped enum values to generic types;
- or add `if formatId === ...` branches in the client renderer.

Both weaken the format-plugin model.

## Goals

- Keep scoring rules server-side.
- Keep the response machine-readable JSON, not arbitrary HTML.
- Let the server select reusable client-side result templates.
- Let format plugins express special presentation needs without hardcoding
  format ids in the client renderer.
- Let the client keep control of animation, responsive layout, interaction, and
  visual polish.
- Keep generic templates reusable across formats.
- Make fallback behavior clear when the client does not support a requested
  component/template.

## Non-goals

- Do not send executable JavaScript from the server.
- Do not make server-rendered HTML the only result contract.
- Do not remove the existing static verification renderer in one step.
- Do not require every format to have bespoke rendering.

## Proposal

Introduce a **result render contract**: a small, whitelisted component/template
model that sits alongside or gradually replaces the current ad hoc
`score_grid`, `ranked`, and `match_summary` sections.

The server still returns JSON. The difference is that the JSON says:

- which registered client component/template to use;
- which props configure it;
- which named slots the server fills with data nodes;
- which rows/cells use reusable presentation hints.

The client has a registry of approved render components. A server response can
only reference ids that exist in that registry.

Conceptually:

```text
format score()
  -> strategy result
  -> result render contract
  -> client component registry
  -> animated/responsive UI
```

## Layer 1: visual descriptors inside `score_grid`

For score grids, replace format-shaped cell marks such as `win2` and `win5`
with general rendering descriptors.

Also let the server choose the **score grid component**. A normal format can use
the default scorecard table, while a format with a genuinely unusual per-hole
view can request a different registered grid component.

```ts
interface ScoreGridSection {
  kind: "score_grid";
  componentId?: "default-score-grid" | string;
  props?: Record<string, unknown>;
  title: TitleSpec;
  subjectBallIds: string[];
  holes: HoleRef[];
  rows: GridRow[];
  totals: Array<{ label: string; value: number | null }>;
}
```

`componentId` is optional for backwards compatibility. Missing means
`default-score-grid`.

Examples:

- `default-score-grid` — normal golf scorecard rows and totals.
- `compact-match-grid` — a match-focused grid with side colors and standing.
- `category-matrix-grid` — a dense Umbrella-style category matrix.
- `wolf-rotation-grid` — a per-hole role/partner/points grid, if a future Wolf
  format needs one.

The important boundary is that a component id selects a **registered client
renderer**, not arbitrary code from the server.

Current shape:

```ts
interface GridCell {
  playHoleId: string;
  value: number | null;
  display?: string;
  mark?: "win" | "win2" | "win5";
  team?: "a" | "b";
}
```

Proposed shape:

```ts
type Tone = "neutral" | "side_a" | "side_b" | "success" | "warning" | "danger";

interface GridCell {
  playHoleId: string;
  value: number | null;
  display: string;
  tone?: Tone;
  title?: string;
  marker?: CellMarker;
}

interface CellMarker {
  template: "ring" | "double_ring" | "diamond" | "badge" | "dot";
  tone?: Tone;
  label?: string;
  value?: string;
}
```

Then a Taliban down-team eagle does not emit:

```ts
{ mark: "win5" }
```

It emits:

```ts
{
  display: "3",
  tone: "side_a",
  marker: {
    template: "diamond",
    tone: "side_a",
    label: "Down-team eagle, +5"
  }
}
```

The server chooses from a reusable visual vocabulary. The client still decides
how a diamond marker is drawn on mobile, desktop, or print.

### Row descriptors

Rows should also carry render hints, so the server can express intent without
the client inferring it from row kind or format id.

```ts
interface GridRow {
  id: string;
  label: LabelSpec;
  kind: "par" | "si" | "score" | "points" | "status" | "category" | "free";
  aggregate: "sum" | "last" | "none";
  tone?: Tone;
  cellTemplate?: "plain" | "score" | "marked_score" | "status_pill" | "category_marker";
  emphasis?: boolean;
  cells: GridCell[];
}

type LabelSpec =
  | { text: string }
  | { ballId: string; suffix?: string }
  | { ballIds: string[]; joiner: string; suffix?: string };
```

This moves rendering hints into the row/cell data, where they belong, rather
than encoding them as special cases in a format-aware renderer.

### Custom grid component data

Most grid components should consume the shared `holes`, `rows`, and `totals`
shape. If a component needs additional data, put it under namespaced `props` or
under explicitly typed node payloads, not as loose format-specific fields mixed
into every cell.

For example:

```ts
{
  kind: "score_grid",
  componentId: "compact-match-grid",
  props: {
    sides: {
      sideA: { ballIds: ["alice", "bob"], tone: "side_a" },
      sideB: { ballIds: ["carol", "dan"], tone: "side_b" }
    },
    standingRowId: "standing"
  },
  holes: [...],
  rows: [...]
}
```

If a format truly cannot fit the shared row model, use `kind: "component"`
instead of pretending it is a score grid.

## Layer 2: component sections with named slots

Some result views are more than a table. A match summary, category matrix, Wolf
role timeline, or betting-game settlement may need a purpose-built client
component.

Add a generic component section:

```ts
interface ComponentSection {
  kind: "component";
  componentId: string;
  props?: Record<string, unknown>;
  slots: Record<string, RenderNode[]>;
}
```

The client owns a registry:

```ts
const resultComponents = {
  "two-side-match-summary": TwoSideMatchSummary,
  "score-grid": ScoreGrid,
  "ranked-table": RankedTable,
  "category-matrix": CategoryMatrix,
};
```

The server may reference only registered component ids.

Example match summary:

```ts
{
  kind: "component",
  componentId: "two-side-match-summary",
  props: {
    leader: "side_a",
    magnitude: 6,
    status: "final"
  },
  slots: {
    left: [
      { kind: "ball_names", ballIds: ["ball-alice", "ball-bob"], joiner: " & " }
    ],
    center: [
      { kind: "text", role: "standing", text: "6 UP" },
      { kind: "text", role: "status", text: "Final" }
    ],
    right: [
      { kind: "ball_names", ballIds: ["ball-carol", "ball-dan"], joiner: " & " }
    ]
  }
}
```

The client component can animate the lead, arrange the layout differently on
mobile, and apply theme colors. The server controls the semantic content and
component choice, but not executable behavior.

## Render nodes

Named slots need a small node vocabulary. Start deliberately small:

```ts
type RenderNode =
  | TextNode
  | BallNamesNode
  | ValueNode
  | BadgeNode
  | MiniGridNode;

interface TextNode {
  kind: "text";
  text: string;
  role?: "title" | "subtitle" | "standing" | "status" | "note";
  tone?: Tone;
}

interface BallNamesNode {
  kind: "ball_names";
  ballIds: string[];
  joiner: string;
  tone?: Tone;
}

interface ValueNode {
  kind: "value";
  label?: string;
  value: string | number | null;
  tone?: Tone;
}

interface BadgeNode {
  kind: "badge";
  text: string;
  tone?: Tone;
}

interface MiniGridNode {
  kind: "mini_grid";
  columns: string[];
  rows: Array<{ label: string; values: string[]; tone?: Tone }>;
}
```

This keeps slots expressive without turning the server response into HTML.

## Template responsibility

### Server responsibilities

- Choose the result component/template id.
- Fill props and slots.
- Emit row and cell descriptors.
- Continue owning all scoring and result semantics.
- Never send arbitrary HTML, CSS, or JavaScript.

### Client responsibilities

- Maintain the component registry.
- Render registered components.
- Resolve ball ids to display names.
- Implement animation, responsive layout, theming, and accessibility.
- Render visible diagnostics for unsupported component ids or node kinds.

## Fallback behavior

Every component section should have one of two fallback paths:

1. A generic fallback section:

```ts
{
  kind: "component",
  componentId: "two-side-match-summary",
  fallback: { kind: "match_summary", ... },
  props: ...,
  slots: ...
}
```

2. Or a visible unsupported-component diagnostic:

```text
Unsupported result component: two-side-match-summary
```

For production mobile, prefer fallback sections for common result types. For
verification pages, a loud diagnostic is acceptable and often better than
silently dropping content.

## Migration plan

### Step 1: add descriptor types

Add new render descriptor types next to `result-sections.ts` without changing
existing output.

- `Tone`
- `CellMarker`
- `LabelSpec`
- `ComponentSection`
- `RenderNode`

### Step 2: replace Taliban-shaped marks

Replace `mark: "win" | "win2" | "win5"` with `marker.template`.

Mapping:

- `win` -> `{ template: "ring" }`
- `win2` -> `{ template: "double_ring" }`
- `win5` -> `{ template: "diamond" }`

Keep backwards compatibility in the client renderer for one slice if needed.

### Step 3: make match summary component-driven

Add `componentId: "two-side-match-summary"` output for match summaries. Keep
the old `match_summary` section as fallback until both mobile and static
renderers support the component section.

### Step 4: introduce a result component registry on the client

Move section rendering from a hardcoded switch into a registry:

```ts
const sectionRenderers = {
  ranked: renderRanked,
  score_grid: renderScoreGrid,
  component: renderComponentSection,
};

const componentRenderers = {
  "two-side-match-summary": renderTwoSideMatchSummary,
  "score-grid": renderScoreGridComponent,
};
```

This is still generic. It does not branch on format id.

Add a nested score-grid component registry at the same time:

```ts
const scoreGridRenderers = {
  "default-score-grid": renderDefaultScoreGrid,
  "compact-match-grid": renderCompactMatchGrid,
  "category-matrix-grid": renderCategoryMatrixGrid,
};
```

`score_grid.componentId` selects from this registry. Unknown grid component ids
fall back to `default-score-grid` only when the section declares that fallback;
otherwise render a visible diagnostic.

### Step 5: align static rendering

The static verification renderer should consume the same component sections.
For components that are highly interactive in mobile, static rendering may use a
plain non-animated implementation of the same component id.

### Step 6: evaluate richer format views

After the component registry exists, trial one truly format-shaped view:

- Taliban richer match panel; or
- Umbrella category matrix; or
- Wolf role/order timeline.

Use that trial to decide how much of the contract belongs in reusable generic
components versus one-off format render adapters.

## Example: Taliban under the proposed contract

The Taliban scoring strategy still computes the same result. The result builder
would emit less Taliban-flavored generic data.

Score grid cells:

```ts
{
  playHoleId: "hole-4",
  value: 3,
  display: "3",
  tone: "side_a",
  marker: {
    template: "diamond",
    tone: "side_a",
    label: "Down-team eagle, +5"
  }
}
```

Match summary:

```ts
{
  kind: "component",
  componentId: "two-side-match-summary",
  props: {
    leader: "side_a",
    magnitude: 6,
    thru: 18,
    finished: true
  },
  slots: {
    left: [{ kind: "ball_names", ballIds: ["alice", "bob"], joiner: " & ", tone: "side_a" }],
    center: [
      { kind: "text", role: "standing", text: "6 UP" },
      { kind: "text", role: "status", text: "Final" }
    ],
    right: [{ kind: "ball_names", ballIds: ["carol", "dan"], joiner: " & ", tone: "side_b" }]
  }
}
```

No client code needs to know that this came from Taliban. It only knows how to
render a two-side match summary and marked score cells.

## Pros

- Removes format-shaped enum values from generic result types.
- Keeps the client free of format-id conditionals.
- Allows richer visuals and animations through registered components.
- Keeps the server response semantic and testable.
- Lets static verification and mobile rendering share one contract.
- Gives formats a controlled way to ask for special presentation.
- Preserves the core rule: server scores, client presents.

## Cons

- More contract surface area than today's three section kinds.
- Requires careful versioning and fallback behavior.
- The server result builder becomes partly presentation-aware.
- The client needs a component registry and diagnostics.
- Static and mobile renderers must both support the same component ids, or
  intentionally declare unsupported ids.
- Too many component ids could become a disguised format-specific renderer
  registry if not governed.

## Open decisions

1. Should component sections replace `ranked`, `score_grid`, and
   `match_summary`, or only extend them?
2. Should `componentId` live on every section, or only on `kind: "component"`?
3. Should render descriptors be produced by the existing `result-builder`, or by
   per-format render strategies registered alongside the scoring plugin?
4. How strict should the client be when a component id is unknown: fallback,
   diagnostic, or hard error?
5. Should `FormatDescriptor.clientAdapterId` remain for interaction-heavy
   score-entry/setup adapters only, while result rendering uses the component
   registry?

## Recommended direction

Keep `RoundResult` as the canonical result contract, but evolve it from a
small set of hardcoded section kinds into a **typed render contract**:

- generic row/cell descriptors for score grids;
- server-selected score grid components for custom per-hole layouts;
- whitelisted component sections for richer result displays;
- named slots filled by server-provided render nodes;
- client-side component registry for visuals, animation, and layout.

This gives Tapscore more rendering flexibility without moving scoring into the
client and without making server-emitted HTML the only source of truth.
