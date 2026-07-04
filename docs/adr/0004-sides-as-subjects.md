# Sides are subjects; any ball format ranks a side via a synthesized virtual ball

Status: **implemented** (Phase 2.7 scale-up, 2026-07-05). Extends ADR-0002
(composition/scoring decoupling) and ADR-0003 (balls as subjects; recursive
teams). Server core + tests + canonical fixture shipped; the create-flow
subject picker for ball formats is a follow-up.

## Context

ADR-0003 split teams into `single_ball` (members merge into ONE ball) and
`multi_ball` (a **side**: members each play their own entered ball). Sides
were only consumable by the four *side formats* (`requiresSlotTeamGrouping`:
the better-ball family); a ball-ranking format offered a side subject refused
with `ball_format_rejects_side_subject`.

Dogfood want: *three 2-player better-ball teams ranked by köpenhamnare* —
per hole, the three team-best nets split the 6 points. The rejected design
was a `kopenhamnare_better_ball` format variant. Per the north star (**any
format × any composition, composed as data — never a new format per
combination**): "the result from each better-ball team becomes a result that
feeds into the Köpenhamnare. The Köpenhamnare just works as normal upon the 3
results it is fed."

What was already in place: sides exist as draft teams; the builder derives
`slot.teamGrouping` from side subjects; every member ball carries its own
allowance-applied PH; `strokesGivenMapForBall` gives each member's per-hole
strokes; formats consume score events keyed by `(ballId, playHoleId)`.

## Decision

A multi-ball team is a valid **subject** for any ball-ranking format. The
engine synthesizes the side's **virtual per-hole score stream** — best net
among the side's balls that hole — and feeds it to the *unchanged* format as
one ordinary subject among N. Formats are never edited for this; the
architecture ratchet now fails any format module that references the
aggregation seam.

### Locked design decisions

- **Synthesis seam = materialisation** (`round-materializer.ts` →
  `side-aggregation.ts`). The compiler persists ordinary rows (member
  `slot_balls` + `slot_ball_teams` grouping); at scoring time the
  materializer replaces the grouping with one **virtual slot-ball per side**
  plus synthesized `ScoreEvent`s, so `plugin.score()` sees N plain subjects.
  Nothing virtual is ever persisted — score entry stays exactly member-owned
  own balls, and the Score view never shows a phantom team ball.
- **Virtual subject shape**: PH = 0, CH = 0; its per-hole "gross" IS the
  aggregated best **net** (each member's net from their own PH/SI
  strokes-given). Net == value flows through unchanged format math, and the
  team row displays one honest number.
- **Virtual ids are content-addressed**:
  `hashId('tapscore:virtual_side_ball:v1', slotDefId, teamLabel)` — both
  parts stable across recompiles, so corrections keep the subject identity
  (member score events were never re-keyed in the first place).
- **Aggregation is slot DATA**: `sideAggregation: { type: 'best_net' }` on
  `SlotDefinition`, alongside the derived `teamGrouping`. Room for future
  `sum`/`worst` variants as new *values*; only `best_net` is implemented and
  anything else throws at the seam.
- **Aggregation semantics (best_net)**: best (lowest) net per hole; a
  member's no-score hole excludes them; **pickup (0) counts as no-score** for
  best-of; ALL members no-score on an engaged hole → a `null` event (no
  result that hole); a hole no member has touched → no event (not engaged).
- **Value-encoding floor**: the score-event vocabulary reserves `0` for
  pickup, so a side's best net ≤ 0 (net eagle-plus by a high-handicap member
  on a max-stroked hole; edge-of-real-play) is floored to **1**, the best
  representable value — never awards an unearned point. Pinned by a unit
  test; lifting it means a richer event vocabulary, not a format change.
- **Mixed subject lists work**: uncovered balls (individual subjects) pass
  through beside the virtual sides (2 sides + 1 individual köpenhamnare).
  A producer may NOT be both an individual subject and a side member in the
  same slot (`side_member_also_individual_subject`): the shared own-ball
  strategy mints one ball per producer, and one ball cannot be both.
- **Metadata formats refuse sides**: a format consuming per-ball metadata
  (umbrella's GIR) has no defined metadata aggregation across a side —
  builder diagnostic `format_metadata_rejects_side_subject` (compiler mirror:
  `side_aggregation_metadata_format`). `ball_format_rejects_side_subject` is
  retired; this is the only remaining refusal.
- **Subject order** follows the slot-ball order contract: a side sits at its
  first member ball's position; individuals keep their seats. (Match play
  over two sides pairs the two virtual subjects in that order.)
- **Rulings** target real balls/producers; virtual subjects are not ruling
  targets (a member DQ etc. flows into the synthesis via the member's
  events/result as usual scoring-layer work — out of scope here).

### Per-layer

1. **Draft/builder** (`round-setup/builder.ts` pass 3): a ball format's
   `subjects` may include `multi_ball` teams. The builder emits the member
   own-balls (nested single-ball teams → their merged ball, one level, as in
   ADR-0003), derives `slot.teamGrouping` from the sides, and stamps
   `sideAggregation: { type: 'best_net' }`. Side formats are untouched (their
   branch consumes the grouping directly, no marker).
2. **Compiler** (`compiler/compile.ts`): generic, data-driven validation —
   `sideAggregation` on a side format / metadata format / without a grouping
   are structured diagnostics; team-grouping **coverage** is relaxed for
   aggregated slots (an uncovered ball is an individual subject); the
   format's `slotBallCount` contract is checked against **effective
   subjects** (one per side + each uncovered ball), so köpenhamnare's
   exactly-3 holds for 3 sides over 6 balls.
3. **Materialisation** (`round-materializer.ts` + `side-aggregation.ts`):
   described above. Synthesized events join the round's event stream; virtual
   ids are slot-scoped so other slots can't see them.
4. **Results** (`leaderboard.service.ts` + `result-sections.ts`): the
   presenter output is untouched; the slot's `SlotResultView` gains optional
   `subjectLabels: { ballId, label, memberBallIds }[]` so a generic consumer
   resolves a virtual id to the side's team label (it names no persisted
   ball). Static renderer overlays it per slot; the mobile client overlay is
   part of the follow-up. Pace chips apply automatically (unchanged
   stableford metric ⇒ side entries carry `paceDelta`). The side's card is
   the aggregated **team row only** (CH 0 / PH 0 facts); folding member rows
   into the card via the better-ball presenter helpers is a possible later
   nicety, deliberately not done — it would put aggregation awareness into
   presenters.
5. **Ratchet** (`formats/architecture.test.ts`): format modules under
   `strategies/formats/` may not mention `sideAggregation`, import
   `side-aggregation`, or hand-roll a `best_net` branch — the guard against a
   future `<format>_better_ball` per composition.

### Proof obligations (shipped as tests)

- **Gate**: 3 two-player sides × unchanged `kopenhamnare_individual`,
  hand-computed 6-point splits over team-best nets, incl. pickup/DNP holes
  and an all-excluded undecided hole.
- **Equivalence**: stableford over two 2-player sides produces numerically
  identical team totals to `stableford_better_ball` on the same scores (real
  handicaps; DNP + pickup + all-pickup edge holes). Max-of-member-points ==
  points-of-best-net because stableford points are monotone in net; the one
  visible difference is an all-pickup hole (better-ball: 0 points, engaged;
  synthesis: undecided) — totals are identical either way.
- Mixed subjects, metadata refusal, individual∩side refusal, recompile
  stability (correction → same virtual ids, events still valid), synthesis
  unit semantics (floor, exclusion, ordering, id stability).
- Canonical fixture `kopenhamnare-sides-round` (front 9, CH 0 field, sides
  "Sida 1..3"): signature `front_9|kopenhamnare:individual:100` added; the 14
  existing signatures unchanged; rendered output matches the oracle (5/1/0).

## Consequences

Any-format × any-composition closes another axis: better-ball teams feed
stableford, stroke, match, or köpenhamnare with ZERO new formats, and future
formats get sides for free. The synthesis lives at one seam; formats stay
self-contained (ADR-0001), composition stays data (ADR-0002/0003). Costs:
virtual ids introduce one sanctioned exception to "every ballIds entry names
a persisted ball" (carried explicitly via `subjectLabels`), and the value
floor documents a representational limit of the score-event vocabulary.
