# Balls are subjects; formats rank a chosen set of balls

Status: **accepted, building** (Phase 2.6e dogfood, 2026-06-17). Supersedes the
**UI** of ADR-0002 (the per-format "Scores" dropdown) and keeps its **engine**
work (`scoresAnyBall`, the relaxed ball-mode check, ball-based handicap).

## Context

Dogfood feedback: a team game (scramble/greensomes/foursomes) is a **ball
formation**, not a scoring format, and it belongs **before** the formats step.
Players should have no allowance control — just their course handicap. The
create flow had teams + a single allowance buried inside each format card, which
is the wrong model.

## Decision — the model

- **A ball is the subject of scoring.** Every player is implicitly an own-ball
  (their course handicap). A **team** is also a ball. Balls are not materialised
  server-side until a format actually uses them.
- **Players step**: name · index · gender · tee → **course handicap** (from
  index/CR/slope/gender/tee). No allowance here.
- **Teams step (new, optional)**: a "Create teams" button below Players, above
  Formats — click once per team. Each team card: a formation (scramble /
  greensomes / foursomes), its members, and an **allowance % per member** into
  the team ball.
- **Formats step**: each format selects a **set of balls** — any mix of
  individual players and teams. Match = 2 balls; Stableford = N; Köpenhamnare =
  2 teams + 1 individual; etc. A player may appear both as an own-ball and in a
  team (allowed, not forbidden).
- **Allowance is two layers**:
  1. **Formation** — an own-ball uses the player's CH; a team ball's CH =
     `round(Σ memberCH × memberAllowance%)`.
  2. **Format** (deferred — layer 2) — an optional per-ball allowance inside a
     format for net/gross/scratch/balancing. Net + gross already come from one
     format's metrics, so this is a follow-up, not in the core build.

## How it maps to the engine (mostly exists)

- Own-ball + team ball-creation strategies already produce the ball pool.
- A slot's `ballSelector.strategyDefIds` already selects a subset of balls, and
  ADR-0002's `scoresAnyBall` lets a format score a mix of own + team balls.
- The two allowance layers already exist structurally: ball-creation sets the
  ball CH (formation); the slot allowance is layer 2 (format).

### New engine piece

A **per-producer** allowance derivation: `ball_CH = round(Σ memberCH × pct)`
keyed by producer (today's `by_rank` is rank-keyed, `weighted` is position-
keyed; neither is per-member-explicit). Add a `per_producer_pct`
`BallDerivationConfig` variant + a team ball-creation strategy that applies it.
The formation type (scramble/greensomes/foursomes) presets the member
percentages (scramble 2p → 35/15, greensomes → 60/40, foursomes → 50/50) and the
user overrides them.

## Draft shape (new)

```
{
  ...course/route/producers,
  teams?: [{ id, label, formation, members: [{ producerDefId, allowancePct }] }],
  formats: [{ formatId, subjects: [{ kind:'player', producerDefId } | { kind:'team', teamId }], formatConfig? }],
}
```

Per-format `teams` / `allowanceConfig` / `producerDefIds` are removed from the
client's vocabulary (allowance returns in layer 2). Old drafts without `subjects`
keep working: a format with no `subjects` scores every own-ball (back-compat).

## Builder

Two-pass over a single round-level ball pool:
1. Materialise the balls a format actually references — own-balls for referenced
   players (coalesced), one team ball per referenced team (per-producer
   derivation).
2. Each format slot's `ballSelector` points at exactly its referenced balls.

A team referenced by no format creates no ball. The compiler validates each
format's subject set against its ball requirement (match needs 2, etc.).

## UI

Players step loses the allowance column. A "Create teams" repeater sits between
Players and Formats (formation select + member rows with allowance %). Each
format card loses its team editor + allowance and gains a **subject picker** (a
checklist of players + teams). Reuses the keyed-row + `mountSelect`/`bound`
helpers.

## Refinements (2026-06-25, create-teams dogfood)

Re-deriving the model from the create-teams step surfaced three sharpenings.
None change the decision; they generalise and clarify it.

1. **A team is `{ size, composition, members[], allowancePct[] }`, size 2–6.**
   The original three named formations (scramble / greensomes / foursomes) were
   the only shapes listed, with fixed presets. Generalise: a team is N players
   (N = 2..6, occasionally more), each with an explicit allowance %. The named
   formations become *presets* over this, not the only shapes.

2. **`composition` is scoring-irrelevant metadata.** To the engine, every
   single-ball composition (individual, scramble, greensomes, foursomes) is the
   same thing: N producers collapse into one scorecard, individual being N=1.
   How the ball was *played* on the course (alternate shot vs pick-best) yields
   no extra data. So `composition` exists for exactly two non-scoring reasons —
   **display** (show "Greensome" on the card) and **template key** (which
   allowance preset to prefill). Nothing in scoring may branch on it. The real
   functional split is single-ball (one score, identity) vs multi-ball
   (fourball / betterball / "taliban" → the format aggregates X scores); only
   multi-ball formats give the format layer anything to decide.

3. **`custom` is a first-class composition, not a fallback.** Presets prefill
   `allowancePct[]`; a group may instead pick `custom` and hand-set every % from
   the start. Templates are a UI convenience over a free model, never the only
   path. The formation preset map (scramble 2p → 35/15, greensomes → 60/40,
   foursomes → 50/50) is one such convenience among `composition` values.

Net model, three levels: **player → ball (formation) → format (aggregation)**.
Formation owns who-collapses-into-one-scorecard + the resulting ball CH; format
owns how a *set* of ball scores becomes a result. `composition` is a label on
the formation layer, invisible to scoring.

## Refinements (2026-06-26) — recursive teams + side formats

Setting up a multi-ball format by hand surfaced that **single-ball vs multi-ball
is a property of the TEAM, not the format** — and that teams **nest**.

- **A team declares its `kind`:**
  - `single_ball` — members (players) merge into ONE `team_ball` (per-member
    allowance % → merged CH); a "composition" (scramble/greensome/foursome/custom).
  - `multi_ball` — members each yield a SEPARATE ball, bound as one **side**. A
    side's member may be a *player* (own ball) **or a single-ball team** (its
    merged ball). Teams nest one level: e.g. two two-man scramble teams form a
    side, two such sides play better-ball.
- **A format is intrinsically a *ball format* or a *side format*** — not a
  per-team toggle. Ball formats (stroke / stableford / umbrella / match /
  köpenhamnare, `scoresAnyBall`) rank/compare balls; a team subject is a merged
  ball. Side formats (the four better-ball plugins, `requiresSlotTeamGrouping`)
  aggregate within each side and compare sides; their subjects are `multi_ball`
  teams. The team's kind decides ball count; the format only decides grouping.
- **`slot.teamGrouping` is now DERIVED, not authored.** The builder, given a side
  format's side subjects, materialises each side's member balls and emits
  `slot.teamGrouping` from the sides. The compiler resolves balls into sides by
  **producer set** (a ball joins the side whose producer set ⊇ its producers), so
  a nested scramble `team_ball {p1,p2}` lands wholly in its side with no compiler
  or scoring change. The four side formats gain `scoresAnyBall` so a side's ball
  may be a merged team ball (skips the per-ball own/team producer-count check;
  `slot.teamGrouping` + `slotBallCount` still validate).

This retires the per-format team editor entirely: ONE Teams step authors both
single-ball compositions and multi-ball sides; every format references them via
`subjects`. Net model holds — `player → ball (formation) → format (aggregation)` —
with *ball formation* now recursive (a side is balls-of-balls).

## Consequences

One coherent "subjects" model replaces format-bound teams: scramble + match,
two-teams-plus-an-individual stableford, etc. all fall out. Keeps the ADR-0001
invariants (formats self-contained; ball-creation a separate registry; client
never reasons about selectors — it sends balls, the builder owns strategy ids).
The ADR-0002 `scoresAnyBall` engine work is reused; its per-format dropdown UI is
removed.
