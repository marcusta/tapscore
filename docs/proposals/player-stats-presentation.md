# Player stats presentation

Status: draft proposal (2026-07-30). Companion to
[player-stats.md](player-stats.md), which ends at the queryable views — this is
the presentation slice (§9 step 5 there).

## 0. What we have to work with

Per hole (one-member registered balls, modules on): `tee_result`
(fairway/in_play/trouble, par 4+), `recovery_ok` (given trouble), `gir`,
`short_game_difficulty` (standard/hard, given GIR miss), `first_putt`
(5 buckets: <1m, 1–2m, 2–4m, 4–8m, >8m), `putts` (0–3+), `penalties`.
Joined per hole: par, ordinal, course hole number; length available in
`round_play_tee_holes` but unused so far. Per round: date, course, name,
`round_type`, `venue_type`.

`GET /players/me/stats` already returns totals + **per-round** measure rows
(`StatMeasures`, ~58 counts). That per-round grain is the pivot everything
below builds on: the server keeps returning counts, and every window
(last 5/10/20, custom filter) is a client-side **sum of per-round rows**
followed by client-side rate math. No new aggregation endpoint per filter.

## 1. Principles

1. **Counts on the server, rates on the client** (unchanged from
   player-stats.md §4.3). Windows, percentages, and expected-putts math are
   pure client modules with Swift/TS twins, like `stat-prompts`.
2. **NULL is "not recorded", never "no".** Every rate shows its denominator
   ("11 of 14 holes recorded"). A rate with denominator < 5 renders as the
   raw fraction, not a percentage — no "100% fairways" from one hole.
3. **Module-gated.** A panel renders only if its module has data in the
   window. Disabled modules disappear; they don't show zeros.
4. Self-only, matching the read API. Comparisons are vs *your own* history,
   not other players (widening is additive later).
5. **Coherent denominators.** All putting ratios use the v2 (`*Resolved`)
   families; never mix v2 numerators over coarse denominators (the
   legacy-bucket asymmetry in `toMeasures()` makes those ratios exceed 1 on
   pre-044 data).

## 2. The hero metric: strokes-lost decomposition ("Where did it go?")

The single most useful thing the data supports, and the closest we get to
strokes gained without shot coordinates: split a round's score vs par into
attributable buckets and show it as a waterfall.

Per round:

- **Putting** = actual putts − Σ expected putts over first-putt buckets
  (coherent holes only). Expected-putts baseline per bucket is a versioned
  constant table in the shared vocabulary, amateur-calibrated
  (roughly: <1m ≈ 1.05, 1–2m ≈ 1.45, 2–4m ≈ 1.85, 4–8m ≈ 2.10, >8m ≈ 2.40 —
  exact values tuned once, then frozen per version so history doesn't shift).
- **Penalties** = penalty count (each penalty ≈ 1 stroke lost, directly).
- **Short game** = on GIR-miss holes with short-game data: failed scrambles
  beyond baseline scramble rate, valued at the putting-adjusted residual
  (i.e. a missed up-and-down where the chip finished >8m charges short game,
  not putting).
- **Long game (tee + approach)** = residual: (score − par) − putting −
  penalties − short game.

Two display modes:

- **Fixed baseline** — the constant table above. Comparable across time.
- **Personal baseline** (the more motivating one) — expected values computed
  from the player's own selected window (e.g. last 20). The waterfall then
  reads "vs your normal game": *"today you putted 2.3 strokes better than
  your usual"*. Sidesteps all arguments about whose baseline is right.

This powers both the round-end story and the dashboard's "what to practice"
ranking (§4.3).

## 3. Metric catalog

Grouped by config module so panels mirror what the player opted into.
Everything below is computable from existing measures unless marked **NEW**.

### Off the tee (par 4/5 only)

- Fairway % / in-play % / trouble % (`fairwayHits` etc. / `teeRecorded`).
- **Trouble tax**: avg strokes vs par on trouble holes minus fairway holes
  (`strokesVsParTrouble/holesScoredTrouble` −
  `strokesVsParFairway/holesScoredFairway`). Rendered as *"a trouble tee
  shot costs you +1.3 vs a fairway"* and, over the window, *"trouble cost
  you ~2.1 strokes per round"*.
- Recovery %: `recoverySuccesses/recoveryAttempts` — when you do find
  trouble, how often you escape without further damage.
- Penalties per round.

### Approach

- GIR %.
- **GIR by tee result** — fairway → GIR% vs in-play → GIR% vs trouble → GIR%.
  Shows what drive quality buys the approach. **NEW cross-tab columns**
  (`gir_recorded_fairway`, `gir_hits_fairway`, … ×3).
- **Proximity proxy: first-putt distance on GIR holes** — the distribution of
  `first_putt` where `gir=1` is an approach-quality metric (how close do you
  hit it when you hit the green?). **NEW cross-tab columns**
  (`gir_first_putt_inside_1m` … ×5). The scramble twin
  (`scrambleFirstPutt*`) already exists.
- Birdie conversion: `birdiesOnGir/girHits`.

### Putting

- **Make % by distance** — the distance ladder: `onePutt*/firstPutt*Resolved`
  per bucket, each bar drawn against the baseline make% for that bucket, so
  "good from 2–4m, weak lag" is visible at a glance.
- **Putting strokes gained-lite** — §2 putting term, per round and as a
  trend line.
- 3-putt % and 3-putts from >8m (lag-putting flag).
- Putts per GIR hole (needs GIR × putts join — cheap **NEW** column
  `putts_total_gir` + `putts_recorded_gir`; putts-per-round alone is polluted
  by chip-ins and missed greens).

### Short game

- Scramble % overall + the standard/hard split (own difficulty rating makes
  the split honest: hard-scramble % is a different skill than standard).
- **Chip proximity**: `scrambleInside2m* / scrambleAttempts*` — how often the
  chip/pitch leaves a makeable putt. This is the *leading* indicator; scramble
  % is the lagging one. Show both: *"you get it inside 2m on 38% of chips;
  when you do, you convert 71%"*.
- Short-game strokes-lost term (§2).

### Scoring (always on — needs only the scorecard)

- Avg vs par split by par 3/4/5.
- Double-bogey+ per round (blow-up avoidance — for most amateurs the fastest
  scoring lever).
- Bounce-back % (`bounceBackSuccesses/bounceBackOpportunities`).

## 4. Surfaces

### 4.1 Round-end story (iOS first)

When the last score + stats step is done, insert a **round story card**
before/atop the results screen:

1. Score headline (already exists in results).
2. The §2 waterfall vs personal baseline: four signed bars.
3. **Two or three generated insight lines**, chosen by ranking the round's
   deltas vs the player's window: *"Best putting round in your last 10"*,
   *"3 penalties — that's 2 over your usual"*, *"You scrambled 4 of 5"*.
   Template-based, deterministic, from the same shared vocabulary module —
   no free text, no LLM.
4. Tap → the full per-round stats view (§4.2).

Requires nothing beyond the summary read + the new per-round view; the
"vs your last N" baseline comes from the already-fetched per-round rows.

### 4.2 Per-round stats view (any round, not just fresh ones)

Entry: round list row → round detail, plus the round-end card. Two layers:

- **Hole strip**: 18 (or N) cells, colored by score vs par, each carrying
  compact glyphs — fairway/in-play/trouble dot, GIR ring, putt count digit,
  penalty flag. One glance shows *where* the round happened.
  Tap a cell → that hole's full stat line.
- **Panels**: the §3 catalog scoped to one round (rates degrade to raw
  fractions at n-of-18 sample sizes per principle 2), plus the waterfall.

Needs the **NEW authed per-hole read** (§5.2) — hole-level rows exist today
only behind the share token and without par/ordinal context.

### 4.3 Stats dashboard (profile → "Statistics")

The aggregate home. Top of screen: **window picker** — presets
`Last 5 · Last 10 · Last 20 · This year · All`, plus **custom filter** sheet:
date range, course, indoor/outdoor, round type, and explicit round
include/exclude checklist. All client-side over the fetched per-round rows
(hence the metadata additions in §5.1).

Content, in order:

1. **Practice priorities** — the §2 decomposition averaged over the window,
   sorted by strokes lost: *"Over your last 10: putting −1.8/round, tee
   −1.2, short game −0.4, penalties −0.9"*. This is the answer to "what
   should I work on", which is the entire point of the feature.
2. **Trend row** — sparklines per module headline (fairway %, GIR %,
   SG-putting-lite, scramble %) across the window's rounds, so direction is
   visible, not just level.
3. **Module cards** — one card per enabled module, headline rate + the §3
   drill-downs behind a tap (distance ladder, GIR-by-tee, trouble tax…).
4. **Round list within window** — each round's date/course/score + its
   waterfall mini-bar; tap → §4.2.

### 4.4 Web

Same three surfaces with the same shared math module; web ships after iOS
proves the layouts (mirrors how capture rolled out). The generated
`api.playerStats.myStats` client is already wired on both.

## 5. Server work required

Deliberately small — the counts-server/rates-client split keeps almost all of
this slice in the clients.

### 5.1 Extend the summary read

`GET /players/me/stats` gains optional query params: `limit` + `cursor`
(newest-first, the fix already noted in the service), and per-round metadata
additions to `PlayerRoundStats`: `courseId`, `roundType`, `venueType`,
`name`, `holeCount`. Filtering itself stays client-side; the server just
stops returning an unbounded payload. Push the player predicate into a
parameterized query rather than filtering outside the views (the 043 header
note) while touching this.

### 5.2 New: authed per-round hole detail

`GET /players/me/rounds/:roundId/stats` → hole-level rows **with context**:
`{ordinal, courseHoleNumber, par, lengthM?, score?, stats: PlayerHoleStats}`.
Self-only (subject = caller), 404 if the caller has no stats in that round.
This is the missing read for §4.2; it also serves the round-end story
without threading the share token through.

### 5.3 New view columns (one migration, additive)

- GIR-by-tee cross-tab: `gir_recorded_{fairway,in_play,trouble}`,
  `gir_hits_{…}` (6).
- GIR first-putt distribution: `gir_first_putt_{5 buckets}` +
  `gir_first_putt_recorded` (6).
- Putts on GIR holes: `putts_recorded_gir`, `putts_total_gir` (2).
- Putts totals per v2 bucket (for exact expected-putts math):
  `putts_total_{5 buckets}_resolved` (5).

All plain counts, same coherence rules (`putting_coherent`, v2 buckets only),
`toMeasures()` extended, aggregate worked-example tests extended in
`player-stats-aggregates.test.ts`.

### 5.4 Shared vocabulary additions (client twins, pure)

`stat-measures.ts` / `StatMeasuresMath.swift`: rate helpers with denominator
guards, window summation over per-round rows, expected-putts table
(versioned), waterfall decomposition, insight-line ranking. Pure, zero-IO,
property-tested like `stat-prompts`.

## 6. Phasing

1. **Server slice**: §5.1 params + metadata, §5.2 hole-detail endpoint,
   §5.3 columns + tests, regenerate clients.
2. **Shared math**: §5.4 twins with worked-example tests (same numbers as the
   server aggregate tests, extended with rates/waterfall).
3. **iOS dashboard** (§4.3) — presets first, custom filter sheet second.
4. **iOS per-round view + round-end story** (§4.2, §4.1).
5. **Web** parity.

Order rationale: the dashboard needs only the summary read and proves the
math module; the per-round view waits on the new endpoint anyway; the
round-end story is a composition of both.

## 7. Out of scope (this slice)

- Cross-player comparison / stats leaderboards (self-only stands).
- Hole-length-based segmentation (data exists; needs player→tee join; later).
- Competition-round stat capture routes.
- Materialized aggregates — revisit only if §5.1's parameterized query isn't
  enough at real DB sizes.
- Any server-side rate computation.

## 8. Open questions

1. Expected-putts baseline values — tune once against what data? (Option:
   seed from the owner's own history + published amateur tables, freeze as v1.)
2. Round story placement — its own screen before results, or a card at the
   top of results?
3. Does "This year" belong in presets, or is date-range custom enough?
4. Minimum-denominator threshold (proposal: 5) — per-panel or global?
