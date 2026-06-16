# Ball composition is decoupled from scoring

Status: **implemented** (Phase 2.6e dogfood, 2026-06-17). MVP = scramble/
greensomes/foursomes × {match, stableford, stroke}. One design change during
build: team balls keep the **first-producer SI** convention already shared with
foursomes/greensomes (not course SI) — changing it would have altered those
formats' existing scoring; revisit if a true team-SI rule is wanted.

## Context

A round is two concerns the engine already separates internally but the create
flow bundles per format:

1. **Composition** — how players form *balls*: own-ball (one per player) or a
   team composition (scramble / greensomes / foursomes → one team ball with a
   combined playing handicap).
2. **Scoring** — how those balls are ranked: stroke, match, stableford, …

Today each format plugin owns both. Own-ball formats and self-contained team
formats work, but you cannot say *"score the scramble teams with match play /
stableford"* — the scramble teams are a ball pool no other format can target.

What is already in place (this de-risks the change):

- The compiler resolves a slot's `ballSelector.strategyDefIds` to **any** ball
  pool, including team balls (`compile.ts` `selectBallsForSlot`).
- A scramble team ball already carries a by-rank combined playing handicap
  (per-player course handicap → per-player allowance weight → summed; the
  standard scramble allowance, e.g. 35%·low + 15%·high for a pair).
- Stroke and stableford score via `strokesGivenMapForBall` — the **ball's** PH,
  not per-producer — so their scoring core is already ball-agnostic.

What blocks it:

- Scoring formats' `ballRequirement` is hard-wired to own-balls
  (`ballMode 'own'`, exactly one producer) and the compiler rejects a
  multi-producer team ball.
- Match play assumes one producer per ball (`resolveSingleProducer`).
- The draft / builder / UI have no way to point a scoring slot at a
  composition's pool.

## Decision

Make composition vs scoring explicit in the draft: a scoring format may either
create its own pool (today's behaviour) or **reference an existing
composition** and score its balls. Scoring formats opt into being usable over a
team ball; the engine reuses the team ball's existing playing handicap.

### Locked design decisions

- **Team playing handicap**: reuse the composition ball's existing by-rank PH
  (per-player CH → allowance → summed). No handicap change — the number is
  already computed by the ball-creation strategy.
- **Per-hole stroke allocation for team balls**: the **course (base) stroke
  index**, not a single player's tee SI (a team has no single tee). Own-ball
  formats keep per-producer tee SI.
- **Opt-in**: only formats that declare a `scoresAnyBall` capability offer the
  composition target. Stroke, match, stableford opt in; umbrella / köpenhamnare
  do **not** (per-player category games are meaningless on one team ball).
- **Allowance**: a scoring-over-composition slot **inherits** the team ball's
  PH; it shows no separate allowance control.
- **Reference** by a stable composition **label**, not array index.

### Per-layer plan

1. **Draft** (`DraftFormatSelection`): add `ballsFrom?: { ref: string }`. Set ⇒
   scoring-only slot (mutually exclusive with its own `teams`).
2. **Formats**: add `scoresAnyBall` to the descriptor for stroke / match /
   stableford; relax their `ballRequirement` to accept the composition's balls.
   Generalise match play to use the ball PH + course SI (mirror
   `strokesGivenMapForBall`); add a ball-level course-SI variant of
   `strokesGivenMapForBall` for team balls. Stroke + stableford need no scoring
   change beyond the requirement relaxation.
3. **Builder**: when a selection has `ballsFrom`, skip its ball planning and set
   its slot's `ballSelector.strategyDefIds` to the referenced composition slot's
   `selectedStrategyDefIds` (builder already emits deterministic `strat-N` ids).
4. **Compiler**: no new ball resolution. Add validation — `ballsFrom` must name a
   real composition that produced ≥1 ball, and the scoring format must declare
   `scoresAnyBall`; otherwise a structured diagnostic at `formats[i].ballsFrom`.
5. **UI** (`SetupService` + create flow): each scoring-format slot gains a
   **"Scores"** target — "Each player" (own balls, default) or "‹Composition›
   teams". Picking a composition hides that slot's team editor (inherits the
   composition's teams) and its allowance control.

### MVP

Scramble / greensomes / foursomes composition × {match, stableford, stroke}
over it. Gate oracle: a *scramble + match-play-over-scramble* round compiles,
scores the two team balls head-to-head, and the result matches a hand oracle;
plus stableford-over-scramble totals. Broaden scoring modes later.

### Risks

- Relaxing `ballRequirement` could let nonsensical combos compile → gated by the
  `scoresAnyBall` opt-in.
- The "Scores" target introduces an inter-slot dependency (ordering + validation
  in the builder and UI).
- Result rendering already names balls by id → live names, so a team-scored
  card/leaderboard labels the team correctly with no renderer change.

## Consequences

Composable: every team-shape × opted-in scoring-mode falls out of one
mechanism instead of a combinatorial set of bundled plugins. Preserves the
ADR-0001 invariant — formats stay self-contained; composition stays a separate
ball-creation registry; the client never reasons about selectors.
