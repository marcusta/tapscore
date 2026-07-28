# Scorecard & result presentation — how it works

Terse map for changing scorecard rendering or adding a new scorecard type.
Deeper rationale: [proposals/result-render-contract.md](proposals/result-render-contract.md),
[proposals/server-result-presenters.md](proposals/server-result-presenters.md), ADR-0001..0004.

## Pipeline (one sentence)

The **server computes everything** (values, markers, tones, notes, idiom
strings); the **client renderer is data-driven and never branches on a format
id**.

```
FormatStrategy.score()            pure scoring → StrategyResult (BallResult/PairBallResult)
        ↓
plugin.renderResult(input)        presenter → SlotResultView { cards, leaderboard }
        ↓  (serialized; client types in src/api/friendly-rounds.gen.ts)
src/round/result-layout.ts        SlotResultView → platform-neutral LAYOUT tree
        ↓                         (column grouping, subtotals, TOT, pace, decorations)
src/round/result-render.ts        layout tree → product HTML strings
scripts/render/sections/result.ts layout tree → verification-oracle HTML
        ↓
src/round/leaderboard.component.ts  hosts the product HTML + owns ALL the CSS
```

Both emitters are THIN adapters over the one fold: a layout rule changes in
`result-layout.ts` and both (plus the N4 native renderer) follow.

Dispatch site: `server/services/leaderboard.service.ts` (`renderResult` call,
passes `effectiveSi` + `scoreGridComponentId`).

## Key files

| Concern | File |
|---|---|
| Format registry (all builtins, presenter per format) | `server/domain/formats/builtins.ts` |
| Plugin contract (`renderResult` required) | `server/domain/formats/plugin.ts` |
| Presenter helpers (par/SI/gross/net/points/match rows, ranking) | `server/domain/strategies/result-presenter-helpers.ts` |
| Closed presentation vocabulary (markers, tones, smart ctors) | `server/domain/strategies/result-vocabulary.ts` |
| Wire types (`SlotResultView`, `GridRow`, `GridCell`) | `server/domain/strategies/result-sections.ts` |
| Shared layout fold (grouping, subtotals, TOT, pace, decorations) | `src/round/result-layout.ts` |
| Client renderer (grid/ranked/match sections → HTML) | `src/round/result-render.ts` |
| Verification-oracle renderer (same fold, wide-table markup) | `scripts/render/sections/result.ts` |
| Marker → visual tokens (meaning, class, colours) | `src/round/marker-tokens.ts` |
| All other scorecard/leaderboard CSS | `src/round/leaderboard.component.ts` |

## Scorecard cards (`SlotResultView.cards`)

Each card is a `ScoreGridSection`: rows (`par`/`si`/`given`/`gross`/`net`/
`points`/`status`/`category`) of hole-keyed `GridCell`s. The shared fold
(`result-layout.ts`) groups them into the round's frozen route sections
(OUT/IN/TOT); the web renderer emits each group as its own stacked 9-hole
block, the oracle lays them side by side in one wide table with a TOT column.

A card picks its renderer via `resultDisplay.scoreGridComponentId` on the
format descriptor: `default-score-grid` (default), `compact-match-grid`,
`category-matrix-grid`. Registry: `scoreGridRegistry` in `result-render.ts`.
New grid layout = new component id (added centrally in the vocabulary +
registry), never a format-id branch.

## Cell decorations (markers)

Closed vocabulary in `result-vocabulary.ts`. **No golf words in template
names** — meaning rides in the marker `label` (tooltip/aria). Templates:
`ring`, `double_ring`, `diamond`, `dot`, `badge`, `box_badge`, `square`,
`double_square`, plus greppable `marker.custom(id)` escape.

`scoreToParMarker({strokes, par, holeInOne?})` in `result-vocabulary.ts` is the
house score-to-par classifier (birdie → `ring`, eagle → `double_ring`, +1 →
`square`, …). **Read the function** — it is the mapping; this page deliberately
does not restate it.

**Marker → visual is a token table, not a doc table.** `src/round/marker-tokens.ts`
holds one entry per marker id — meaning, CSS class, fill/shape, visual note —
and the `.lb-mark--*` rules in `leaderboard.component.ts` are EMITTED from it
(`markerFormCss()` / `markerTeamFillCss()`, pinned byte-for-byte by
`tests/round/marker-tokens.test.ts`). Restyling a marker or adding one is an
edit to that table; the server still sends only the abstract template and never
a colour. A new form is one edit in `result-vocabulary.ts` + `bun run generate`,
after which the token table stops compiling until it has a visual.

Where markers get attached:

- `ballScoreRows` (presenter helper) auto-attaches `scoreToParMarker` to
  **Gross** (vs par) and **Net** (vs par, `holeInOne: false`) cells for every
  format that uses it (stroke play, stableford, köpenhamnare, …). A hole
  result's own `marker` (set by a `score()`) overrides the gross default.
- `matchNetRow` honours `MatchPresenterOptions.scoreMarkers`:
  `'standard'` = house markers on every net; `'bonus-only'` (taliban) = no
  score-quality marks, only pills on hole-wins + ring/double-ring when a solo
  birdie/eagle bonus was actually paid.
- Per-cell `team: 'a'|'b'` → team-color pill; team + marker → marker shape
  filled in team color with halo (`.lb-mark-fill--a/b`).

## Leaderboard sections (`SlotResultView.leaderboard`)

Two kinds, dispatched by `section.kind` in `sectionRegistry`
(`result-render.ts`); a registry miss renders a visible diagnostic, never
hides results.

- `ranked` — one table per `FormatMetric` (declared on the plugin descriptor
  with `direction: 'high'|'low'` and optional `pace`). Built by
  `rankedSections`/`rankEntries` in the helpers: ties share position; when a
  metric declares a pace baseline the board sorts by `paceDelta` (worse-is-
  positive display, golf convention) with total as tiebreak, and grows a Pace
  column.
- `match_summary` — `matchPanel` per pair (leader, magnitude, thru, final).

## Card ↔ leaderboard attachment (Gamebook boards)

A board that wants a scorecard folded INTO its ranked row asks the shared fold,
never the format id:

```ts
attachmentFor(cards, rankedEntries) // → per card: {kind:'attached', entryIndex} | {kind:'standalone'}
```

The rule is STRUCTURAL: a card whose `subjectBallIds` are exactly one entry's
`ballIds` **as a set**, unambiguously in both directions (one such entry, one
such card), attaches to that row. Everything else — subjectless card, partial
overlap, two cards on one subject, two entries on one subject — stays
standalone. Ambiguity is never guessed.

`subjectBallIds` is emitted by every presenter (the builder knows the subject);
synthetic `team:<label>` ids are resolved to member balls first, and an
aggregated side's virtual subject id (ADR-0004) is a legitimate subject.
`server/domain/strategies/result-view-invariance.test.ts` pins that invariant
across every fixture round. Same helper, same cases, in
`src/round/result-layout.ts` and `ios/TapScore/Domain/ResultLayout.swift`.

FUTURE SEAM (not built): a format plugin may later declare
`presentation: 'attached' | 'standalone'` on a card — absent = the structural
rule. It plugs in on `ScoreGridSection` and is honoured at the top of
`attachmentFor`.

## Adding a new format's presentation

1. Write `score()` (pure; no presentation) + a presenter composed from the
   helpers (`parSiRows`, `ballScoreRows`, `pointsRow`, `matchNetRow`,
   `rankedSections`, …). See `stableford-individual.presenter.ts` /
   `match-play.presenter.ts` for shape.
2. Register in `builtins.ts` with metrics + optional
   `scoreGridComponentId`.
3. Only invent a new marker template / grid component when no existing form
   expresses it — one central edit in `result-vocabulary.ts` + the client
   registry (`marker-tokens.ts` for markers, `scoreGridRegistry` for grids),
   guarded by `assertNever` / an exhaustive `Record`.

## Regression & verification

- Golden presenter fixtures: `server/domain/strategies/__snapshots__/result-views/*.json`,
  checked by `result-view-invariance.test.ts`. Regenerate deliberately:
  `UPDATE_SNAPSHOTS=1 bun test server/domain/strategies/result-view-invariance.test.ts`.
- `bun run render:formats` renders the canonical fixture rounds to
  `tmp/formats/` for eyeballing; `bun run check:format-fixtures` verifies the
  fixture DB.
- Client is a committed build artifact: after any `src/` change run
  `bun run build` and commit `public/`.
