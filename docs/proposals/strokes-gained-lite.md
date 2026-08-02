# Strokes-gained-lite — bucketed stroke attribution from quick-tap capture

Status: draft v2 (2026-08-02). Successor to the strokes-lost waterfall in
[player-stats-presentation.md](player-stats-presentation.md) §2; builds on the
wave-3 cross-tabs of [player-stats-v2.md](player-stats-v2.md). v2 revises v1
after external review: the missed-green identity was off by one stroke (the
chip was charged twice), the baseline was inconsistent (par vs expected), the
rollups could not actually compute the approach term, and the claims were
stronger than the capture supports. All four are fixed below; the review's
framing is adopted — this is **bucketed attribution under stated
assumptions**, not exact strokes gained.

Owner direction (2026-08-02): strokes gained is the ideal metric; the only
objection is input burden. Input here is unchanged — not one new tap.

## 0. The observation this rests on

The capture chain already observes a coarse state sequence per hole:

```
par → tee_result (par 4/5) → gir → first_putt bucket   (green hit)
                                 → difficulty → chip outcome (green missed)
→ putts → penalties
```

The key insight (owner): **`tee_result` is doing double duty — it is the tee
shot's outcome AND the next shot's lie.** Fairway = clean lie; in play =
hittable non-fairway; trouble = recovery lies. So an expected-strokes table
over these states is really lie-conditioned — the lie half of what real SG
conditions on — and the approach term inherits lie adjustment automatically: a
green missed from trouble charges less than one missed from the fairway. The
severity being self-assessed is a strength: the player's tap sorts a
clean-faced fairway bunker from a plugged lie better than any course-polygon
inference. Known limits: on par 5 only the second shot's lie is observed; the
par-3 tee shot is the one perfect-lie approach and runs off `E_HOLE[3]`.

## 1. Tables (`SG_TABLES_V1`, frozen and versioned)

| Table | States | Count | Status |
|---|---|---|---|
| `E_HOLE` | par 3 / 4 / 5 | 3 | new |
| `E_AFTER_TEE` | par {4,5} × {fairway, in_play, trouble} | 6 | new |
| `EXPECTED_PUTTS_V1` | 5 first-putt buckets | 5 | shipped |
| `CHIP_EXPECTED_PUTTS_V2` + outcome pair | standard / hard | 4 | shipped |

**The decomposition's total is `Σ (score − E_HOLE[par])`, not score − par.**
The terms telescope against expected score (proof in §2); measuring them
against par would leave the amateur-baseline-vs-par offset stranded in a fake
remainder even under perfect capture. Vs-par stays the language of the Results
card; the waterfall's total becomes "vs expected" (its personal-baseline
display mode already reads this way).

## 2. The attribution cohort, terms, and identities

### 2.1 One cohort, or the sum is a lie

All five terms are computed over the **same set of holes** — the
*attribution cohort*: holes where every state the hole's branch needs was
recorded. Mixing cohorts (each term over whatever holes it happens to have)
makes the "remainder" the difference between overlapping samples, not a
coverage measure. So:

- A hole is **attributable** when it has a real score (not a pickup), `gir`,
  a coherent putt count, `tee_result` on par 4/5, and its branch's exact
  vocabulary:
  - **GIR, non-holed** — one of the five FINE first-putt buckets (legacy
    coarse buckets are NOT accepted here: they cannot price the five-state
    putting table) plus the putt count.
  - **GIR, holed** (holed approach, ace) — `putts = 0` and no bucket. This is
    coherent data and the branch's best outcome; its arrival value is 0
    expected putts. Excluding it would bias approach by dropping exactly its
    triumphs.
  - **Miss, non-holed** — `short_game_difficulty` plus an outcome
    classifiable as inside/outside 2 m (fine buckets, AND legacy coarse
    buckets, which map cleanly: `inside_2m` → inside, `2_to_6m`/`over_6m` →
    outside — accepted deliberately, not by SQL accident) plus the putt
    count.
  - **Miss, holed** (chip-in) — `short_game_difficulty`, `putts = 0`, no
    bucket.
  Penalties follow the §3 rule (the one documented default).
- The waterfall computes all five terms over attributable holes only, and
  shows the coverage plainly: "41 of 51 holes attributed". Non-attributable
  holes contribute to nothing — skipped, never defaulted (Postel).
- There is **no residual component.** The five terms sum *exactly* to
  `Σ (score − E_HOLE)` over the cohort, by construction (§2.3).

### 2.2 Terms — uniform shots-to-arrival construction

Per attributable hole, with `S` = strokes, `U` = putts, `X` = penalty strokes,
one tee stroke on par 4/5, and **one modeled short-game stroke** on a green
miss (§3 assumption 2):

| Term | Formula (per hole) |
|---|---|
| Tee (par 4/5) | `1 + E_AFTER_TEE[par, result] − E_HOLE[par]` |
| Approach, green hit | `A + E_arrival − E_ref`, where `A = S − U − X − teeStroke`, `E_arrival` = `EXPECTED_PUTTS[bucket]` (non-holed) or **0** (holed approach / ace — no bucket exists, the ball is in), and `E_ref` = `E_AFTER_TEE[par, result]` (par 4/5) or `E_HOLE[3]` (par 3) |
| Approach, green missed | `A + (1 + CHIP_EXPECTED_PUTTS[difficulty]) − E_ref`, where `A = S − U − X − teeStroke − C` and `C = COALESCE(short_game_strokes, 1)` (v1 of this doc subtracted nothing, double-charging the chip; the first v2 subtracted a flat 1, which broke the telescope by `C − 1` whenever a real count exceeded it — both approach AND short game must use the same effective `C`) |
| Short game (miss only) | `(C − 1) + E_outcome − CHIP_EXPECTED_PUTTS[difficulty]` where `C = COALESCE(short_game_strokes, 1)` — algebraically `C + E_out − (1 + E_chip)`: the sequence took `C` strokes where the baseline prices one chip plus its putts. With `C = 1` (all legacy holes) this IS the shipped term; extra chips charge SHORT GAME, not approach — a duffed chip is short-game damage. Holed: `(C − 1) − CHIP_EXPECTED_PUTTS[difficulty]` |
| Putting | unchanged: `U − E_outcome` |
| Penalties | `X` |

The par-3 branch uses the same shots-to-arrival construction as par 4/5 (only
`E_ref` and the absent tee term differ) — v1's hard-coded `1 + …` broke on a
duffed tee ball.

### 2.3 The four identities (each verified by summing the column)

Sign convention: positive = strokes lost (open question 1).

- **Par 4/5, GIR**: `[1 + E_at − E_h] + [(S−U−X−1) + E_b − E_at] + [U − E_b] + X = S − E_h` ✓
- **Par 4/5, miss**: `[1 + E_at − E_h] + [(S−U−X−1−C) + 1 + E_c − E_at] + [(C−1) + E_o − E_c] + [U − E_o] + X = S − E_h` ✓ for every `C ≥ 1` (holed chip: `E_o = 0, U = 0`, same telescope; `C = 1` is the legacy/modeled case)
- **Par 3, GIR**: `[(S−U−X) + E_b − E_h3] + [U − E_b] + X = S − E_h3` ✓
  (holed sub-case, e.g. an ace: `E_b = 0, U = 0` — same telescope; the
  par-4/5 holed approach is the GIR identity with `E_b = 0`)
- **Par 3, miss / chip-in**: `[(S−U−X−C) + 1 + E_c − E_h3] + [(C−1) + E_o − E_c] + [U − E_o] + X = S − E_h3` ✓

These identities are the twin math module's core test fixture: four synthetic
holes, one per case, each asserted to telescope exactly, plus the §3 stress
cases asserted to misattribute *where the assumption says they will*.

## 3. Stated assumptions (what "bucketed attribution" means)

The identities are exact over the *recorded* values; where capture is coarser
than reality, the slack lands in the approach term, deliberately and
documentedly:

1. **`putts = 3` means 3.** A four-putt's extra stroke is charged to approach
   (top-coded stepper, stat-prompts). Rare; accepted.
2. **One short-game stroke per missed green — unless counted.** A
   duffed-then-chipped hole charges the extra chip to approach. This is
   already the shipped short-game model ("the first putt is the outcome of
   *the* short-game shot", player-stats.md §capture); the waterfall inherits
   it. **Wave 4's short-game stroke counter dissolves this assumption where
   present** (owner decision, 2026-08-02, from the Gamebook comparison): when
   a hole carries a recorded short-game stroke count `C`, the miss branch
   uses the effective `C` in BOTH terms — approach subtracts it, short game
   charges `(C − 1)` — or the telescope breaks by `C − 1` (§2.2). Legacy and
   counter-less holes are modeled-as-1 (`COALESCE(C, 1)`). The rollups
   therefore carry an effective short-game-stroke sum
   (`att_sg_strokes_effective = Σ COALESCE(C, 1)` over the miss cohort, per
   difficulty), not merely counted/modeled hole counts. An untouched
   prefilled control emits no event — player-stats-v2 §3.4c has the full
   persistence semantics and honest-denominator rules.
3. **Penalties are THE documented exception to "skipped, never defaulted":
   missing penalty capture is modeled as zero, and any hidden penalty is
   attributed to approach.** An untouched prompt emits no event, so requiring
   explicit zeroes would destroy historical coverage; and module
   configuration is live and player-level (no historical record), so no rule
   may refer to whether the module WAS on. One sentence, no module clause.
4. **A tee penalty distorts approach** by the re-hit stroke (stroke-and-
   distance leaves the replayed swing in `S` with no state marking it).
   `penalty_source` (wave 4) does NOT repair this arithmetic — source alone
   cannot distinguish a re-tee (extra swing in the score) from a drop
   (none); it labels the penalty bar's breakdown, nothing more. The leakage
   stands as a documented assumption either way.

Every claim in UI copy follows the honest framing: attribution, not
measurement. The method note (ⓘ) may say "strokes gained-style" once.

## 4. Aggregation and migration 054 (not small — sized honestly)

The approach term needs sums restricted to the attribution cohort, which
independent columns cannot reconstruct (the wave-3 SG-prep tee-by-par columns
are over ALL tee-recorded holes — right for rates, wrong for the cohort sum,
and insufficient for calibration too, which runs its own per-hole query, §6). Migration 054 is a full six-view drop/rebuild in
the 052/053 pattern, adding per-round cohort rollups, all from the
canonicalised CTE:

- cohort counts: `att_holes_par3_gir`, `att_holes_par3_miss`,
  `att_holes_par45_gir`, `att_holes_par45_miss` (4)
- cohort sums: `att_strokes`, `att_putts`, `att_penalties` (3)
- cohort tee cells: `att_{fairway,in_play,trouble}_par{4,5}` (6)
- cohort arrival states: `att_gir_first_putt_{5 buckets}` + **`att_gir_holed`**
  (the holed approach / ace — review finding; without it the branch's best
  outcomes fall out of the cohort) (6); `att_miss_{standard,hard}` (2);
  cohort chip outcomes `att_chip_{inside2m,outside2m,holed}_{standard,hard}`
  (6); effective short-game strokes `att_sg_strokes_effective_{standard,hard}`
  (Σ `COALESCE(short_game_strokes, 1)` — §3 assumption 2; 2)

Partition assertions ride in the aggregate tests:
`Σ att_gir_first_putt_* + att_gir_holed = att_holes_par3_gir +
att_holes_par45_gir`, and the miss twin.

≈ 29 columns, plus `StatMeasures`/`toMeasures`/`zeroMeasures`, regenerated
clients, and both math twins. Every term is then `Σ cohort-count × constant`
plus the three cohort sums — counts on the server, rates on the client,
unchanged.

## 5. Presentation

- **Practice priorities v2** — five terms (Tee, Approach, Short game,
  Putting, Penalties), same single card, worst-first, plus the coverage line
  ("41 of 51 holes attributed") and the "vs expected" total. The owner's
  tee/approach split lands here.
- **Module cards are NOT re-cohorted.** Fairway %, GIR by par, scramble % etc.
  keep their own maximal denominators — a rate wants every recorded hole; only
  the *summable decomposition* needs the common cohort. The two live side by
  side exactly as rates and the waterfall already do.
- **Round story / per-round view** — same five terms per round.
- **Baselines and insights normalize per attributed hole.** The shipped
  `baselineDeltas()` compares raw component totals; with variable coverage
  that flatters a six-attributed-hole round against eighteen-hole history.
  v3 rule: every cross-round comparison (personal baseline, the
  `component_best/worst_vs_baseline` insights, trend points) is computed
  **per 18 attributed holes**, and a round produces a delta only when it has
  at least 9 attributed holes (floor pinned in the shared vocabulary, twin
  to `MIN_RATE_DENOMINATOR`'s role). Raw totals remain what the waterfall
  bars show for the round itself.
- **Benchmark mode (v2)** — cohort-table swap ("vs 10-handicap"), zero new
  capture. After v1 settles.

## 6. Calibration (one coherent reference population)

**Whose expectation is it?** Frozen global constants seeded from one player's
history mean every player is measured against that player, however the label
reads. v1 owns this: the tables ship as the **"Tapscore reference baseline
v1"** — named in the ⓘ, seeded from the owner's history during the
owner-first beta — with the successor path an explicit product decision
(open question 7): per-player tables once a player has enough attributable
history, and/or a broader cohort baseline later. UI copy never says a bare
"vs expected"; the ⓘ says whose.

v1 tables are calibrated from **one cohort: the owner's own attributable
history**, via one committed script (`scripts/sg-calibrate.ts`). The script
runs its **own canonical per-hole query** (player_hole_stats × scorecards,
the same canonicalised strokes rule) — NOT the view aggregates: the wave-3
columns carry tee-result counts by par but no score sums per
`par × tee_result` cell, so aggregate views cannot express the calibration.
Details:

- `E_HOLE[par]` = mean score on attributable holes by par.
- `E_AFTER_TEE[par, result]` = mean `(score − 1)` on attributable par-4/5
  holes by tee result — i.e. strokes remaining after the tee shot, same
  population, same completeness rules.
- Published amateur tables are a **sanity check only**, never mixed in — a
  mixed-population table turns systematic offsets into fake component values.
- Sparse cells (notably trouble×par5) shrink toward the par-level mean with a
  stated minimum sample (proposal: 20 holes; below it, the cell inherits the
  shrunk value).
- The script's output is pasted into the frozen constants with version
  metadata (`SG_TABLES_V1`, calibration date, row counts per cell) and the
  exact query committed beside it. Recalibration is a new version, never a
  silent edit.
- Consistency requirement: `EXPECTED_PUTTS` / `CHIP_*` tables were seeded
  differently (owner history + amateur references). v1 accepts this seam —
  they price *within-phase* outcomes, and the identities hold for any table
  values — but the benchmark mode must swap ALL tables per cohort together.

## 7. Deliberately not doing

- Shot coordinates, club data, distance capture — the input boundary stands.
- Per-shot SG numbers; the resolution is the bucket chain, honestly labelled.
- Exact-SG claims in copy.

## 8. Phasing

1. Calibration script + `SG_TABLES_V1` frozen (owner reviews the values).
2. Migration 054 + regenerate (full rebuild chain, per §4).
3. Twin math — five terms + coverage + the four identities and stress cases;
   wave-1/2 waterfall assertions retired.
4. Both clients — priorities card v2, round story, per-round view.
5. Global polish pass (already planned) follows.

## 9. Decisions (resolved with the owner, 2026-08-02)

1. Sign: **positive = strokes lost stays** — the app already reads "what
   costs you most"; flipping would break established reading.
2. Coverage lives in the **ⓘ, with live contextual data** ("41 of your 51
   holes could be fully attributed…"). General ruling: cards stay clean;
   ⓘ everywhere helpful, always interpolating the reader's actual numbers,
   never static copy. Applies to capture prompts too (recovery_ok gets one).
3. Penalties: resolved as assumption 3 (the one documented default — missing
   capture models as zero, hidden penalties land in approach). Revisit only
   with wave-4 `penalty_source`.
4. **Plain words on cards** throughout; the ⓘ may say "a strokes
   gained-style method" once.
5. **v1 ships without waiting for wave 4** — bunker and penalty_source slot
   in as refinements when they land. Owner: get this into prod and usage
   fast; the software is in a closed friendly-user stage.
6. `recovery_ok` is the OUTCOME of the recovery stroke, not a post-tee state —
   using it to split `E_AFTER_TEE` would leak recovery skill into the tee
   term (review finding). If ever used, it defines a further *transition*
   (trouble → recovery outcome → arrival), i.e. a sixth term splitting
   approach on trouble holes. v2 at the earliest, samples permitting.
7. Baseline succession: **deferred deliberately** — the owner-seeded
   "Tapscore reference baseline v1" ships now (closed friendly-user stage);
   per-player or cohort baselines are revisited when the user base warrants
   them. The frozen table version is stamped in the constants so history
   re-reads stably whenever succession happens.
