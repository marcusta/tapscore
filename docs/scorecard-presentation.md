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
src/round/result-render.ts        SlotResultView → HTML strings
src/round/leaderboard.component.ts  hosts the HTML + owns ALL the CSS
```

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
| Client renderer (grid/ranked/match sections → HTML) | `src/round/result-render.ts` |
| All scorecard/leaderboard CSS incl. marker colors | `src/round/leaderboard.component.ts` |

## Scorecard cards (`SlotResultView.cards`)

Each card is a `ScoreGridSection`: rows (`par`/`si`/`given`/`gross`/`net`/
`points`/`status`/`category`) of hole-keyed `GridCell`s, grouped client-side
into the round's frozen route sections (OUT/IN/TOT), rendered as stacked
9-hole blocks.

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

`scoreToParMarker({strokes, par, holeInOne?})` is the house score-to-par
classifier:

| Score vs par | Template | Rendered as (Gamebook idiom) |
|---|---|---|
| Hole-in-one / albatross (−3+) | `diamond` | yellow filled circle |
| Eagle (−2) | `double_ring` | orange filled circle |
| Birdie (−1) | `ring` | red filled circle |
| Par | *(none)* | plain number |
| Bogey (+1) | `square` | light-blue filled square |
| Double (+2) | `double_square` | dark-blue filled square |
| Triple+ | `box_badge` | dark-blue filled square |

The visual style (filled circles under par / filled squares over par, white
number) lives ONLY in `.lb-mark--*` CSS in `leaderboard.component.ts`. Server
sends the abstract template; changing the look is a CSS-only edit.

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

## Adding a new format's presentation

1. Write `score()` (pure; no presentation) + a presenter composed from the
   helpers (`parSiRows`, `ballScoreRows`, `pointsRow`, `matchNetRow`,
   `rankedSections`, …). See `stableford-individual.presenter.ts` /
   `match-play.presenter.ts` for shape.
2. Register in `builtins.ts` with metrics + optional
   `scoreGridComponentId`.
3. Only invent a new marker template / grid component when no existing form
   expresses it — one central edit in `result-vocabulary.ts` + the client
   registry, guarded by `assertNever`.

## Regression & verification

- Golden presenter fixtures: `server/domain/strategies/__snapshots__/result-views/*.json`,
  checked by `result-view-invariance.test.ts`. Regenerate deliberately:
  `UPDATE_SNAPSHOTS=1 bun test server/domain/strategies/result-view-invariance.test.ts`.
- `bun run render:formats` renders the canonical fixture rounds to
  `tmp/formats/` for eyeballing; `bun run check:format-fixtures` verifies the
  fixture DB.
- Client is a committed build artifact: after any `src/` change run
  `bun run build` and commit `public/`.
