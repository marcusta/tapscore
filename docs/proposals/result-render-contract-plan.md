# Result render contract — phased implementation plan

Status: **draft plan**

Companion to [result-render-contract.md](./result-render-contract.md). That document
argues *what* the contract should be; this one is *how* we get there without a
big-bang rewrite, and records the design decisions reached in review.

## Decisions that override the proposal

The original proposal hedged on several points. These are now settled:

1. **Ship Layer 1; defer Layer 2.** Layer 1 is row/cell vocabulary +
   `score_grid.componentId` + a client `scoreGridRegistry`. It solves the
   current leak and gives formats a controlled score-grid escape hatch. Layer 2
   is arbitrary `kind: "component"` sections for genuinely non-grid structures;
   it is built only when a real format needs that structure, and is validated on
   that real case rather than guessed up front.
2. **The vocabulary is presentation-domain only — never golf-domain.** Allowed:
   abstract visual forms (`ring`, `double_ring`, `diamond`, `dot`, `badge`),
   `tone`, emphasis. Banned: golf words (`birdie`, `bogey`, `albatross`,
   `win5`). Golf meaning rides as a *choice of existing token + a label string*,
   or via a shared opt-in helper (below). "Albatross" never appears in the wire
   contract.
3. **Golf meaning lives in an opt-in shared helper, not the contract.** A
   `scoreToParMarker(strokes, par)`-style helper concentrates golf knowledge in
   one reusable place and *emits presentation tokens*. Formats opt in for house
   consistency; the vocabulary stays golf-free.
4. **The vocabulary grows centrally and rarely.** It grows only for a genuinely
   new *visual form* no existing shape expresses — not per golf concept (those
   map onto existing forms) and never per format. Additions are one-place edits
   guarded by an exhaustive `switch` with a `never` default.
5. **Closed core + a named Layer-1 escape hatch.** Closed string-literal unions
   for the known vocabulary; the Layer-1 escape is explicit and detectable —
   `marker.custom(id, label)` for a one-off visual and `score_grid.componentId`
   for a different registered grid renderer. No `| string` widening of closed
   fields (an invisible escape you can't grep is a leak, not a valve).
6. **Layer 2 payloads are typed when introduced, not pre-scaffolded.** If a later
   format proves it needs arbitrary `kind: "component"` sections, payloads are a
   discriminated union keyed by `componentId`, defined in the server result
   schema, regenerated through `bun run generate` into `src/api/*.gen.ts`, and
   consumed by a typed client registry. The dispatcher may have one contained
   assertion; component implementations must not cast from `unknown`.
7. **Dispatch is polymorphic — no `if (format)`, anywhere.** Client:
   `sectionRegistry[section.kind]` for existing section kinds and
   `scoreGridRegistry[score_grid.componentId]` for grids, each with a null-object
   fallback/diagnostic. Server: each plugin's `renderResult()` override,
   defaulting to today's shared data-driven builder. The only `switch` permitted
   is the exhaustive one over the *closed* presentation vocabulary inside a
   single leaf component; open extension points (formats, score-grid components,
   future arbitrary components) are always registry/virtual dispatch.

## Agent-discoverability requirement

Code is mostly agent-written, so the vocabulary must be discoverable and
hard to get wrong:

- **Smart constructors are the API.** Formats emit sections via
  `result-vocabulary.ts` constructors (`marker.diamond(...)`, `cell.score(...)`),
  not hand-written literals. Autocomplete is the menu; invalid combos don't
  compile.
- **Closed unions carry per-member "use-when" JSDoc** — the type is the source
  of truth.
- **One pointer in AGENTS.md** routes to the module; no `/docs` page restates the
  token list (two lists drift).

## Git strategy

Trunk-based, commit straight to `main` — no PRs, no feature branches. Every
phase, and every per-format slice in Phase 4, is a small self-contained commit
(or short commit sequence) that is shippable on its own. The Phase-2 back-compat
shim and the Phase-3 verification flag keep `main` releasable throughout, so
work-in-progress never lands `main` in a broken state.

## Verification vocabulary

When this plan says **snapshot**, it means the repo's deterministic render
workflow, not an invented test harness:

```bash
bun run check:format-fixtures
bun run render:formats
```

`render:formats` rebuilds the canonical fixture DB and writes deterministic HTML
under `tmp/formats/`. Rendering gates should compare the affected generated
HTML, and visual handoff pages should embed the relevant real rendered output
per the standing `PHASES.md` verification rules.

Because `RoundResult` crosses the API boundary and flows through generated
clients, any phase that changes result-section types must also run:

```bash
bun run generate
bun run check:server
bun run check:client
```

If a phase is meant to move no wire/output shape, its gate must say that
`bun run generate` produces no generated diff.

## Agent capability grading

Capability is graded by how much architectural judgment, cross-layer reasoning,
and visual/product taste the phase requires from the implementing agent.

| Phase | Capability | Why |
| --- | --- | --- |
| Phase 0 — Vocabulary + contract types | **Medium** | Mostly additive types and constructors, but requires discipline to keep the vocabulary presentation-only, generated clients unchanged, and discoverability strong. |
| Phase 1 — Registry dispatch | **Medium** | Mechanical client refactor with real regression risk. The agent must preserve exact rendering while introducing registries and diagnostics without format-id branching. |
| Phase 2 — Move Taliban marks | **Medium-High** | Crosses server result building, generated API types, and client/static renderers. The scoring should not change, but the agent must keep the compatibility shim short-lived and prove `win5` is gone everywhere. |
| Phase 3 — Reference grid components | **High** | Requires product judgment. The agent must separate product vs verification chrome, preserve audit data, design reusable grid components, and keep Taliban/Umbrella equal-or-better visually. |
| Phase 4 — Remaining format slices | **High** | Each slice needs format-specific judgment: decide whether existing grid components fit, whether a new grid renderer is justified, and prevent one format's shape from leaking into the shared contract. |
| Phase 5 — Layer 2, if triggered | **High** | This is architectural work: discriminated generated payloads, typed registries, static/mobile alignment, fallback semantics, and strict containment of arbitrary component sections. |

Interpretation:

- **Low** would be local mechanical work with little design risk. None of these
  phases are truly low because the result contract crosses server, generated
  clients, mobile rendering, and static verification.
- **Medium** is safe for an agent that can follow existing patterns and run the
  gates carefully.
- **High** needs an agent that can make architectural tradeoffs, inspect visual
  output, and push back when a format wants to smuggle one-off semantics into the
  shared model.

---

## Phase 0 — Vocabulary + contract types (no pixels move)

**Goal:** the agent-discoverable, presentation-only vocabulary exists; nothing
emits it yet.

- `result-vocabulary.ts`: closed unions (`Tone`, marker `template`, row `kind`,
  `cellTemplate`) + smart constructors + the named visual escape
  (`marker.custom`).
- New descriptor types added beside `result-sections.ts` (added, not wired).
- Add `score_grid.componentId?: ScoreGridComponentId` to the descriptor types,
  but do not emit it yet. Missing means `default-score-grid`.
- Decide: is score-to-par its own presentation descriptor or just a marker
  choice? Either way it is presentation-mapped, never a golf keyword.
- Exhaustive `never`-default stub in the renderer.
- AGENTS.md pointer line.

**Gate:** constructors unit-tested; `bun run generate` produces no generated
diff; `bun run check:server && bun run check:client`; server JSON output and
`bun run render:formats` HTML are byte-identical to today.

## Phase 1 — Registry dispatch (no pixels move)

**Goal:** replace the ternary section dispatch in `src/round/result-render.ts`
with section renderer registry lookup + null-object fallback +
unsupported-section diagnostic. Introduce `scoreGridRegistry` with only
`default-score-grid` registered, and route `score_grid` sections through
`scoreGridRegistry[section.componentId ?? "default-score-grid"]`. No format-id
branches.

**Gate:** `bun run generate` produces no generated diff; checks green;
`check:format-fixtures` + `render:formats`; generated HTML unchanged.

## Phase 2 — Move Taliban marks onto the vocabulary

**Goal:** prove the vocabulary on the format that defined the leak. Taliban's
builder emits `tone` / `marker.diamond(...)` instead of `mark: "win5"`. Keep a
`win/win2/win5` back-compat shim for one slice in the client renderer so `main`
stays releasable while generated clients catch up.

**Gate:** `bun run generate`; checks green; `check:format-fixtures` +
`render:formats`; Taliban screen visually unchanged; `win5` gone from shared
server result types and generated `src/api/*.gen.ts`.

## Phase 3 — Promote the two reference formats into shared grid components

**Goal:** turn the worked-through Taliban + Umbrella(4-ball) views into named
shared score-grid components on the Layer-1 contract. Examples:
`combined-score-grid`, `compact-match-grid`, `category-matrix-grid`,
`ranked-table`/standing where applicable. These are still `score_grid` sections
selected by `score_grid.componentId`, not arbitrary `kind: "component"` sections.

- **Strip debug chrome to a verification flag:** `slot #0 · … · CH 0 · PH 0`,
  `gross = 14 net = 14`, the `POINTS BREAKDOWN` dumps, the running-totals
  explainer. Audit data stays in `RoundResult`; renderers accept
  `mode: "product" | "verification"` and decide which chrome to show. The
  product path is clean; the verification path keeps auditability.
- Add the optional `scoreToParMarker`-style shared helper if house-consistent
  birdie/eagle/etc. visuals are wanted.

**Gate:** both reference formats render via named score-grid components,
equal-or-better; debug chrome gone from the product view but preserved in
verification render mode; checks green; `check:format-fixtures` +
`render:formats` artifact diff limited to the intended product/verification
presentation changes.

## Phase 4 — Migrate the remaining formats, one at a time (variable cost)

**Goal:** each of Stableford, Stroke, Match, Stableford-BB, Match-BB,
Split-sixes, Umbrella(individual) becomes its own shippable slice. Per format, a
**authoring-time decision** (expressed as *which `componentId` it emits* — never
a runtime conditional):

- **Fits the shared payload** (differs only in tones/rows/markers/labels) → point
  the builder at a shared score-grid component + `ranked`, iterate the data.
- **Needs a different grid layout but still per-hole/table-shaped** → emit a new
  `score_grid.componentId`, with a co-located grid renderer registered in
  `scoreGridRegistry` (ADR-0001 clean-delete). Isolated to that one format by
  construction.
- **Needs a genuinely non-grid structure** → stop and write the Layer-2 slice
  first. Do not smuggle arbitrary payloads into Layer 1.

This phase has **no fixed size.** Getting Taliban and Umbrella(4-ball) right took
many iterations; expect several formats to need their own component. The
architecture's job is not to make that small — it's to keep each such case
*isolated and non-breaking*. If the estimate is wrong, the cost shows up as "more
Phase-4 slices," never as a contract change or a regression in another format.

**Gate (per format):** that format looks good and ships; checks green;
`check:format-fixtures` + `render:formats`; all previously-migrated formats'
rendered HTML unchanged except intentional shared-component improvements.

## Phase 5 — Formalize Layer 2 (only if Phase 4 demanded a new structure)

**Goal:** if real bespoke components appeared, lock the section escape — commit
arbitrary `kind: "component"` sections with discriminated, generated payloads
keyed by `componentId`; formalize fallback rules; and align the static
verification renderer to the same `componentId`s.

- Payload contracts live in the server result schema and flow through
  `bun run generate` into `src/api/*.gen.ts`.
- The client component registry is typed by `componentId`; one contained
  dispatcher assertion is allowed, but leaf components receive their real
  payload type.
- Add a type-level test proving every registered component receives the payload
  associated with its `componentId`.

**Gate:** static + mobile consume one contract; unknown ids fall back or
diagnose, never silently drop; `bun run generate`; checks green;
`check:format-fixtures` + `render:formats`.

---

## Risk note

Phases 0–3 are the leverage bet and are mostly mechanical: fix the shared
structure once and most rough screens improve together, because much of the
roughness is shared chrome (per-player sprawl, debug subtitles, breakdown dumps),
not format logic. Phase 4 is the genuine unknown. The plan contains that unknown
rather than denying it: a divergent format first gets its own registered
score-grid renderer; only a truly non-grid shape triggers Layer 2.
