# Player stats v2 — richer presentation, scoring stats, and directional capture

Status: draft proposal (2026-08-01). Companion to [player-stats.md](player-stats.md)
(capture, shipped) and [player-stats-presentation.md](player-stats-presentation.md)
(presentation, shipped). Motivated by a comparison against Golf GameBook's stats
screens and a review of what our own measure set already supports but never
draws.

All principles from player-stats-presentation.md §1 stand unchanged: counts on
the server / rates on the client, NULL is never "no", module-gated panels,
self-only reads, coherent denominators, `MIN_RATE_DENOMINATOR` guards. Nothing
here is strokes gained, GPS, or shot-by-shot — the quick-tap capture model is a
constraint, not a limitation to fix (see §5).

The work splits into three tiers by cost:

- **§1 Presentation improvements** — existing data, existing measures. Client
  work only.
- **§2 New stats without new capture** — from client-only math up to one
  additive view migration in the 046/047 style. No new taps.
- **§3 New capture** — three small vocabulary additions (miss directions,
  bunker) and what each unlocks. One optional tap or one segment option each.

## 1. Presentation improvements (no new data, no new columns)

### 1.1 Difficulty-adjusted short-game waterfall

The strokes-lost waterfall erases the standard/hard split before the math:
`strokesLost()` sums `scrambleInside2m{Standard,Hard}` etc. and applies one
flat baseline (`CHIP_EXPECTED_PUTTS_V1 = 1.85`). A player facing mostly hard
lies is judged against a fringe-chip expectation, reads worse than they are,
and "Practice priorities" can point at chipping when the leak is the approach
shots that created those lies.

Fix: difficulty-specific constant tables, versioned and frozen like the v1
tables — `CHIP_EXPECTED_PUTTS_V2 = { standard, hard }` and a matching
outcome-expectation pair. The measure set already carries every count split by
difficulty, so this is pure client math in the twinned modules
(`stat-measures.ts` / `StatMeasuresMath.swift`). Constants tuned once against
owner history + published amateur short-game tables, then frozen (same
procedure as `EXPECTED_PUTTS_V1`).

### 1.2 Absolute scoring deltas under the tee split

The Off-the-tee card shows the fairway/in-play/trouble split bar and the
differential trouble tax. GameBook's framing — the absolute "result with
fairway hit +0.08 / with miss +0.25" — is more immediately legible than a
differential. Add the per-tee-result avg-vs-par figures
(`strokesVsPar{Fairway,InPlay,Trouble} / holesScored{…}`) as small annotations
under the split bar. Measures already served; `strokesVsParByTee` already
computes them; the card just doesn't draw them.

### 1.3 Draw what is served but invisible

- **Raw first-putt distribution** (`firstPutt{5 buckets}`) — summed on every
  window, drawn nowhere. Show it in the Putting card next to the
  GIR-conditioned twin the Approach card already has; the difference between
  the two distributions *is* the short-game proximity story told from the
  putting side.
- **Penalty coverage** — `penaltiesRecorded` is served and never shown;
  `penaltiesPerRound` divides by round count, so a player who records
  penalties on half their holes sees an understated figure with no cue. Add
  the standard "recorded on N holes" denominator line every other rate has.
- **Chip-ins split by difficulty** — `scrambleHoled{Standard,Hard}` exists;
  the card shows only the combined count. A holed hard chip is a different
  (better) fact.

### 1.4 Difficulty-aware insight lines

`scramble_streak` fires on combined attempts. "4 straight up-and-downs from
hard spots" is a much stronger line than four easy ones, and the split is
already in the measures. Extend the closed insight-id set (new ids, not
changed semantics for existing ones, so history reads stably):
`hard_scramble_streak`, and make `scramble_streak` wording difficulty-blind
only when the streak is mixed.

## 2. New stats, no new capture

### 2.1 Client-only (zero server work)

- **Hard-chip share ("short-siding rate")** —
  `scrambleAttemptsHard / (scrambleAttemptsStandard + scrambleAttemptsHard)`.
  When you miss a green, how often do you leave yourself a hard chip? This is
  the course-management stat hiding in the difficulty capture — our
  simple-input analog of Shot Pattern's "short-sided approaches" — and it
  connects the Approach card to the Short-game card: a rising hard share means
  the misses are getting worse even when GIR% is flat. Surface on the Approach
  card (it is a property of the approach miss, not of the chipping) plus a
  trend candidate, plus an insight id (`short_siding_spike`).
- **Putts after missed green** —
  `(puttsTotal − puttsTotalGir) / (puttsRecorded − puttsRecordedGir)`.
  Pairs with the already-shown putts-per-GIR-hole; the gap between the two is
  the short-game contribution seen from the green.
- **Results headline figures** — rounds played, average score, best round
  (window and all-time), average vs par. Every per-round row already carries
  `strokesTotal`, `parTotal`, `holesScored`, `holeCount`, `date`; the client
  can compute all four today. Average score and best are only meaningful at
  a fixed hole count — compute over `holesScored = holeCount = 18` rounds and
  say so ("over your N complete 18-hole rounds"); vs-par figures cover
  everything. This is the single most visible gap vs GameBook's Resultat
  card, and it needs no schema work at all.

### 2.2 One additive view migration (046/047 style)

All plain counts, same coherence rules, `toMeasures()` + `ZERO_MEASURES` +
`addMeasures` extended, worked-example tests extended in
`player-stats-aggregates.test.ts`. Grouped by what they unlock:

**Score-type histogram** (scorecard only, works for every player, stats
modules or not):

- `holes_eagle_or_better`, `holes_birdie`, `holes_par`, `holes_bogey`
  (`doubleBogeyPlus` already exists as the fifth bucket).
- Unlocks the eagle→worse distribution bar — the most instantly legible visual
  on GameBook's Resultat screen — and per-round birdie counts for a personal
  records row ("most birdies in a round").

**Scoring conditioned on GIR** ("cost of a missed green"):

- `strokes_vs_par_gir_hit` (over `girHolesScored`, which exists) and the
  missed twin `holes_scored_gir_miss`, `strokes_vs_par_gir_miss`.
- Unlocks GameBook's "−0.18 with green hit / +0.71 with miss" pair — the same
  two-sample sentence pattern as the trouble tax, on the Approach card.

**GIR by par**:

- `gir_recorded_par{3,4,5}`, `gir_hits_par{3,4,5}`.
- Unlocks the per-par GIR bars — and, more interestingly, the par-3 tee
  story: capture deliberately skips `tee_result` on par 3 (`TEE_APPLIES`),
  but par-3 GIR *is* the tee shot. One cross-tab backfills the par-3 gap in
  the Off-the-tee narrative for free.

**Putt-count distribution and putts by par**:

- `holes_one_putt`, `holes_two_putt` (zero-putt = chip-ins and `threePutts`
  already exist; the four together are the donut), `putts_recorded_par{3,4,5}`,
  `putts_total_par{3,4,5}`.
- Unlocks the 1-putt/2-putt/3-putt distribution, putts per hole, and putts by
  par — GameBook's whole Puttar card. All from the existing `putts` key.

**Penalty geography**:

- `holes_with_penalty` (count of holes where `penalties > 0`),
  `holes_scored_penalty`, `strokes_vs_par_penalty`.
- Unlocks "% of holes with a penalty" and the penalty tax ("a penalty hole
  costs you +2.3") — same sentence pattern as the trouble tax.

**Candidates, not yet committed** (data present in the per-hole rows; decide
when the above lands): front-9 vs back-9 vs-par split (ordinal is canonical,
so this is course-half, not play-order — fine for the fatigue question only
when start rotation is ignored deliberately), and hole-length segmentation
(`lengthM` is served per hole; still needs nothing server-side for the
per-round view, but window aggregation would need length-bucket columns —
already noted as deferred in player-stats-presentation.md §7).

### 2.3 New surfaces these enable

- **Results card** at the top of the dashboard (before Practice priorities):
  rounds / avg score / best / avg vs par headline row + the score-type
  histogram. Scorecard-only, so it renders for players with every module off —
  the first stats surface that works for a player who records nothing but
  scores, and therefore the natural on-ramp to enabling capture modules.
- **Personal records row** (home card or Results card footer): best round,
  most birdies in a round, best putting round (the insight id exists; give it
  a permanent home).

## 3. New capture, and what it buys

Six additions (three original — directions and bunker; three from the
2026-08-02 Gamebook discussion — penalty source, derived-GIR prefill, and the
short-game stroke counter). Each new key follows the shipped pattern end to
end: `ENUM_VALUES`, a `StatPrompt` in the twinned `stat-prompts` modules with
three-state visibility, `contradicted` clearing on the server, view columns,
and a vocabulary migration in the 044 style (old values readable forever,
never offered again). Capture cost is budgeted in §3.5: two optional one-tap
segments (directions), one segment option (bunker), one prefilled stepper on
missed greens (§3.4c), minus the tap derived GIR removes (§3.4b) — net flat
or better against today's worst case of 7 prompts. §3.4c exists explicitly to
sharpen strokes-gained-lite's arithmetic; the "no strokes gained" boundary in
§0 means no *input* heavier than quick taps, not no SG math.

### 3.1 Green-miss direction — `green_miss_dir`

- Values: `long | short | left | right`. Visible when `gir` is answered `0`;
  `contradicted` when gir becomes hit (same dependency shape as
  `short_game_difficulty`). Module: approach (no new config row — it rides
  the existing toggle; see §6 q3).
- Four values, not eight: a quick tap after a missed green can reliably say
  which side; long-left vs left is a judgment call that slows entry. The
  compass visual reads fine with four sectors.
- View columns: `green_miss_{long,short,left,right}` (+ recorded).
- **Unlocks:** the green-target compass (GameBook's most striking visual);
  miss-direction trend ("your miss is short — 39% — club up"); and crossed
  with `short_game_difficulty` (both live on the same hole row), the
  *directional* short-siding story: "misses left leave you a hard chip 70% of
  the time; misses long only 20%" — an aim adjustment, which is the cheapest
  stroke a mid-handicapper can buy.

### 3.2 Fairway-miss direction — `tee_miss_dir`

- Values: `left | right`. Visible when `tee_result` is answered `in_play` or
  `trouble`; `contradicted` when tee result becomes fairway or is cleared.
  Module: tee.
- This deliberately keeps our severity axis (`fairway / in_play / trouble`)
  and adds direction as an orthogonal second tap, rather than GameBook's
  direction-only fan. Crossed, we can draw their fan *with* severity shading —
  "miss left" that is playable vs "miss left" that is jail are different
  facts, and we are the only ones who would know.
- View columns: `tee_miss_{left,right}` (+ recorded), plus the severity cross
  `tee_trouble_{left,right}`.
- **Unlocks:** the fairway fan; two-way-miss detection (an insight id:
  `two_way_miss` when neither side is under ~35% — the classic "can't aim"
  flag); direction × recovery ("trouble left costs more than trouble right"
  — tree line vs open side, real course knowledge).

### 3.3 Bunker as a short-game lie — extend `short_game_difficulty`

- Vocabulary: `standard | hard | bunker` (one new option in the existing
  segment — zero new prompts). Migration precedent is exactly 044: CHECK
  widened, old rows untouched.
- Modeling call: bunker is a **lie class, not a difficulty modifier**. A
  plugged lie under the lip is real but is the same "judged hard by the
  player" call the standard/hard split already makes; splitting
  bunker×difficulty doubles the segment for a distinction the sample sizes
  will not support. One flat `bunker` value keeps entry one tap and the
  denominators usable. (Revisit only if sand-save samples ever get big enough
  to be worth splitting — §6 q2.)
- View columns: the existing scramble family gains a third difficulty leg:
  `scramble_attempts_bunker`, `scramble_successes_bunker`,
  `scramble_first_putt_bunker`, `scramble_inside_2m_bunker`,
  `scramble_holed_bunker`.
- **Unlocks:** sand save % (the one headline GameBook stat we cannot even
  approximate today), greenside-bunker frequency per round (how often you
  find sand — a proxy GameBook's "bunker shots per round" without shot-by-shot
  entry), and sand proximity (`inside 2m from sand`) — the leading indicator,
  same as the existing chip-proximity logic. The waterfall's short-game term
  gains a third expected-outcome column in the §1.1 constants table.

### 3.4 Penalty source tagging — `penalty_source`

Already flagged as the v2 candidate in player-stats.md §7. Values
`tee | approach | short_or_green`, visible when `penalties` ≥ 1, meaning the
**primary source** on the hole — one enum cannot represent two penalties from
different causes, and per-source counters are not worth their taps; a
multi-source hole records where the bigger damage was. Unlocks penalty
attribution in insights ("both penalties off the tee") and lets the
waterfall's penalty bar break down by cause without changing its total. What
it does NOT do: fix the SG replay-stroke leakage — source alone cannot tell a
re-tee (extra swing in the score) from a drop (none), so the replayed swing
still lands in the approach term either way (strokes-gained-lite §3
assumption 4). It labels; it does not repair arithmetic. Lowest priority of
the additions: the stroke count is already correct.

### 3.4b Derived GIR — prefill, not a schema change

(Added 2026-08-02, from the Gamebook comparison.) `GIR ⟺ (strokes − putts) ≤
par − 2`: penalties inflate strokes so penalty holes correctly fail; a holed
approach correctly reads GIR; a chip-in birdie correctly reads miss.

**Lifecycle (explicit, because the stored event carries no provenance):**

1. **Derivation fires at step completion, not at prompt render.** Prompt
   order is shot order and `gir` precedes `putts`, so the inputs do not exist
   when the gir control is drawn. Rule: if the step completes with `gir`
   untouched and score + putts present, the derived value materializes as an
   ordinary `gir` stat event. The gir control shows the pending derivation
   ("will fill from score") rather than sitting blank.
2. **Any manual interaction locks the value** for that entry session — a
   user-set gir is never overwritten by recomputation.
3. **Once persisted, gir is authoritative.** A later score or putt correction
   never silently recomputes it; when stored gir disagrees with the
   derivation, the entry UI re-surfaces the gir prompt flagged for
   confirmation. (No `gir_source` column in v1 — the suggest-on-disagreement
   rule makes provenance unnecessary; add provenance only if real usage shows
   stale-derivation churn.)

Caveats that keep the prompt in existence: derivation needs the putting
module (approach-only players still get asked); the `3+` putts top-code
derives a rare false miss (conservative); and "putts" must mean on-green
strokes (the standard convention). Net effect: one tap saved on every
approach-module hole.

### 3.4c Short-game stroke counter — `short_game_strokes`

(Added 2026-08-02, same discussion.) On a missed green, after the difficulty
answer: a stepper counting short-game strokes taken, **displayed prefilled to
1** (the modal value — usually a glance, not a tap; the tap freed by §3.4b
funds it). Unbounded upward like penalties.

**Persistence semantics (explicit — a visually prefilled control emits no
event when untouched, by the capture model's standing rule):** `null` means
**modeled as 1**; nothing is auto-materialized. Consequences, adopted
deliberately:

- `short_game_strokes_recorded` counts *touches*, not confirmations — never
  present it as "holes verified".
- Raw averages over recorded values are biased toward multi-chip holes;
  never ship that average. Per-round chip figures use the effective sum.
- The double-chip rate's denominator is ALL eligible missed-green holes, not
  recorded ones.
- Attribution sums the **effective count `COALESCE(C, 1)`**, labelled partly
  modeled (see strokes-gained-lite §3 assumption 2).

What it buys:

- **Exact through-green arithmetic** for strokes-gained-lite wherever a real
  count exists — and the extra strokes `(C − 1)` are charged to the SHORT
  GAME term, not approach, keeping the telescope exact (see
  [strokes-gained-lite.md](strokes-gained-lite.md) §2.2).
- **Disaster metrics** currently invisible, named honestly: double-chip rate,
  and with the §3.3 bunker lie class, the *multi-stroke short-game rate from
  a bunker start* and *extra short-game strokes on bunker-origin holes*. NOT
  "failed escapes" or exact bunker-shot totals: `bunker` + `C = 2` proves the
  sequence started in sand and took two strokes, not that the second stroke
  was in sand — exact escape tracking needs shot-level capture we are not
  doing.
- What we deliberately do NOT copy from Gamebook: up-and-down / sand-save as
  *inputs* (we derive both, more reliably) and a separate bunker-shot counter
  (lie class + this counter covers the honest cases at one control).

View columns: `short_game_strokes_recorded`, `short_game_strokes_effective`
(Σ `COALESCE(C, 1)` over eligible miss holes), the `{standard,hard,bunker}`
effective splits, and `holes_multi_chip` (recorded `C ≥ 2`).

### 3.5 Capture-cost guardrail

The direction prompts are the first capture whose value is *aggregate-only* —
a single hole's miss direction is nearly worthless, unlike a putt count. So
they must stay skippable-by-default in feel: no validation nudges, no
completeness meter penalty, and the prompt order puts them immediately after
their parent answer (`tee_result → tee_miss_dir`, `gir → green_miss_dir`) so
the thumb is already on the right region of the screen. If entry-time
telemetry (round duration, stats-step dwell) shows drag after shipping, the
directions are the first thing to demote behind a config sub-toggle.

The wave-4 tap budget after §3.4b/§3.4c nets out flat or better: derived GIR
removes a tap from every approach-module hole; the short-game counter adds a
prefilled glance on missed greens only; directions stay optional one-taps.

## 4. Suggested phasing

1. **Client-only batch** (§1 + §2.1): waterfall v2 constants, tee-split
   absolute deltas, raw first-putt distribution, penalty coverage line,
   chip-in split, hard-chip share, putts after missed green, Results headline
   figures. One PR per client, zero server changes, all twinned-math tested.
2. **Scorecard migration + Results card** (§2.2 histogram + §2.3): the
   score-type columns, then the Results card and records row. Biggest visible
   change; works for every player.
3. **Cross-tab migration** (§2.2 remainder): GIR-conditioned scoring, GIR by
   par, putt distribution/by-par, penalty geography — one migration, then the
   card additions that draw them.
4. **Capture v2** (§3.1–3.4c together — one vocabulary migration, one prompts
   change, one views change): directions + bunker + derived-GIR prefill +
   the short-game counter, then the compass and fan visuals. §3.4
   (penalty source) rides along or follows.

Order rationale: 1 and 2 are pure wins with no capture-model risk and prove
the new visuals; 4 is the only step that touches the entry flow, so it goes
last and alone, where its effect on entry time can be observed in isolation.

## 5. Deliberately not doing

- **Strokes gained / GPS / dispersion overlays** (Tangent, Shot Pattern
  territory) — requires shot coordinates; REWRITE_DOMAIN_SPEC.md's fidelity
  boundary stands.
- **Per-shot short-game detail beyond the §3.4c count** — which club, which
  stroke was in sand, per-shot lies: shot-by-shot entry in disguise. The
  hole-level count + lie class is the boundary. (An earlier revision of this
  list rejected "chips-per-hole counts" outright; §3.4c supersedes that — a
  single prefilled count earns its place, per-shot detail still does not.)
- **Club tracking** — same reason.
- **Server-side rates, cross-player stats** — unchanged from the shipped
  proposals.

## 6. Open questions

1. §1.1 / §3.3 constants: what standard/hard/bunker expected-putts values do
   we freeze as v2? (Same answer shape as v1: seed from owner history +
   published amateur tables, freeze, version.)
2. Is `bunker` flat (proposed) or does hard×bunker matter enough to revisit
   once samples exist?
3. Do the direction prompts ride the existing `tee`/`approach` module toggles
   (proposed — no config change) or get their own sub-toggles from day one?
4. Results card placement: top of the stats dashboard (proposed), the home
   card, or both?
5. Front-9/back-9 and length segmentation: commit into the §2.2 migration or
   hold for a later slice?
