# Where your doubles come from — cause breakdown for double bogey or worse

Owner question (2026-08-13): a double or worse usually has one manufacturing
defect — a penalty, a bad tee shot, a duplicated short-game shot, a three-putt,
or a duffed full swing. The capture vocabulary already records enough to name
that defect on most holes. This proposal adds a per-hole cause classifier and
surfaces it as a block on the scoring panel: *where your doubles mainly come
from*.

No new capture key. Views only, plus one pure client function. The shape is
migration 062's: derive everything from columns the projection already has.

## 1. The classifier

One cause per double+ hole, assigned by a priority CASE. The order is
**specificity of evidence**, strongest first: each bucket is checked only after
every bucket above it has declined, so a later bucket implicitly means "and
nothing more directly explains the strokes". A trouble tee shot whose recovery
succeeded, followed by a three-putt, is a three-putt double — the tee shot was
paid for.

Computed in the 043 `hole` CTE as one per-hole column:

```sql
CASE
    WHEN strokes IS NULL OR strokes < par + 2 THEN NULL   -- not a double+
    WHEN COALESCE(penalties, 0) >= 1          THEN 'penalty'
    WHEN recovery_ok = 0                      THEN 'failed_recovery'
    WHEN gir = 0 AND COALESCE(short_game_strokes, 1) > 1
                                              THEN 'multi_chip'
    WHEN putting_coherent = 1 AND putts >= 3  THEN 'three_putt'
    WHEN tee_result = 'trouble'               THEN 'trouble_tee'
    WHEN gir IS NOT NULL
     AND putting_coherent = 1 AND putts IS NOT NULL
     AND (par <= 3 OR tee_result IS NOT NULL)
     AND (gir = 1 OR short_game_difficulty IS NOT NULL)
                                              THEN 'full_swing'
    ELSE 'unattributed'
END AS dbl_cause
```

Reading the buckets:

- **`penalty`** — any recorded penalty stroke. Fires on partial info: a hole
  with `penalties = 2` and nothing else recorded is still a penalty double.
  Penalty modelling follows the documented exception (strokes-gained-lite §3):
  an untouched prompt is zero, never a blocker.
- **`failed_recovery`** — `recovery_ok = 0`. Only ever asked after a trouble
  tee shot, so the tee state rides along implicitly. This outranks the plain
  trouble bucket because it is the more specific fact: the double was
  manufactured by the punch-out that didn't come off.
- **`multi_chip`** — a missed green that took more than one shot to reach.
  `COALESCE(short_game_strokes, 1) > 1` — the same NULL-means-one convention as
  everywhere else, so this only fires when the stepper was actually counted up.
  A real double-chip hole where the stepper was never touched models as one
  chip and falls through; Postel, not a bug. Difficulty is a single value for
  the hole, so "which of the two chips was the hard one" is unknowable — the
  bucket does not try.
- **`three_putt`** — `putts >= 3` (the "3 or more" bucket; a 4-putt is
  indistinguishable and lands here, which is the right shelf for it anyway).
  Fires on hit greens too: GIR + 4 putts on a par 4 is a double and reads
  three_putt.
- **`trouble_tee`** — trouble off the tee with the recovery unrecorded or
  successful, and nothing later in the hole to blame. Par 3s can never land
  here (`tee_result` is not asked there — TEE_APPLIES).
- **`full_swing`** — the residual, and the only bucket that makes a *negative*
  claim ("nothing recorded explains it"), so it is the only one that demands
  coverage: a GIR answer, a coherent putt count, a tee answer on par 4/5, and a
  difficulty on a missed green. When all of that is recorded and none of the
  buckets above fired, the extra strokes can only have been full swings —
  duffs, tops, layup mistakes, the par-5 second that went forty meters. This is
  deliberately NOT the `attributable` flag from migration 054: that cohort also
  requires a fine `first_putt` bucket, which the classifier never consults, and
  requiring it would needlessly drop legacy holes into `unattributed`.
- **`unattributed`** — everything else: a double+ hole without enough recorded
  to say. Never dropped (Postel rule — a gap is a gap, not an exclusion), shown
  as its own row, and doubling as the nudge that more capture makes the page
  smarter.

## 2. View columns — migration 063, views only

Eleven new measure columns in the 043 base view, aggregated from `dbl_cause`.
Same mechanics as 062: drop the six-view stack top-down, re-create from the
exported builders; the columns reach v2/v3 through their `SELECT base.*`.
Forward-only, no `down`.

```
dbl_penalty            COUNT(dbl_cause = 'penalty')
dbl_failed_recovery    COUNT(dbl_cause = 'failed_recovery')
dbl_multi_chip         COUNT(dbl_cause = 'multi_chip')
dbl_three_putt         COUNT(dbl_cause = 'three_putt')
dbl_trouble_tee        COUNT(dbl_cause = 'trouble_tee')
dbl_full_swing         COUNT(dbl_cause = 'full_swing')
dbl_unattributed       COUNT(dbl_cause = 'unattributed')
```

**Partition invariant:** the seven sum to `double_bogey_plus`, identically —
every double+ hole lands in exactly one bucket, so the client can draw shares
that add to 100%. Denominator: `double_bogey_plus`, which already exists.

The penalty bucket gets a geography split, partitioning `dbl_penalty`:

```
dbl_penalty_tee        … AND penalty_source = 'tee'
dbl_penalty_approach   … AND penalty_source = 'approach'
dbl_penalty_short      … AND penalty_source = 'short_or_green'
dbl_penalty_unknown    … AND penalty_source IS NULL
```

These answer the follow-up the headline row invites ("penalty doubles — off
the tee or into the green?") without a second capture pass. One source per
hole, so a two-penalty hole collapses to its primary — acceptable for "mainly
comes from", already the recorded semantics.

All counts-and-sums, never rates, numerator beside its denominator — the
standing convention. The totals layer sums all eleven.

## 3. Server

`player-stats.service.ts` maps the eleven columns 1:1 into
`PlayerStatMeasureColumns` / the measures payload, exactly like the 062 batch.
Typebox schemas extend accordingly; `bun run generate` refreshes the clients.
No new endpoint: career/window measures ride the existing
`GET /players/me/stats`, and the per-hole rows for the round story already ride
`GET /players/me/rounds/:roundId/stats`.

## 4. Client

### 4.1 Measures — `src/round/stat-measures.ts`

- Eleven fields on `StatMeasures`, zero-init, added in `combine`.
- `DOUBLE_CAUSES` const in display order: `penalty`, `failedRecovery`,
  `multiChip`, `threePutt`, `troubleTee`, `fullSwing`, `unattributed`.
- `doubleCauseRows(m): { id, count, share: Rate }[]` — each share over
  `m.doubleBogeyPlus`.
- **`classifyDoubleCause(hole): DoubleCause | null`** — the same CASE as §1 as
  one pure TS function over a `PlayerRoundHoleStats` row. This is the single
  client implementation; the round story consumes it. Two implementations of
  one classifier (SQL + TS) is a real risk — §6 pins them together with a
  fixture matrix.

### 4.2 Scoring panel block — `src/stats/stats-panel-blocks.ts`

"**Where your doubles come from**" — a bar block under "Holes by score",
above bounce-back. Same shape as `resultsHistogram`: one row per cause, share
of `double_bogey_plus`, share-only value cell. All seven rows always render
when the block renders (a zero row is information, and the block must not
change height as the window changes); the block itself is gated on
`double_bogey_plus > 0` — zero doubles in the window means there is nothing to
explain and no block.

Row titles (words, not jargon — design-guidelines ruling):

| id | title |
|---|---|
| penalty | Penalty |
| failedRecovery | Failed recovery |
| multiChip | More than one chip |
| threePutt | Three putts |
| troubleTee | Trouble off the tee |
| fullSwing | Long game |
| unattributed | Not enough recorded |

"Long game" is the residual's reader-facing name: strokes lost to full swings
between tee and green. The ⓘ card owns the precise definition.

### 4.3 Info card — `src/stats/panel-info-cards.ts`

The block's "How this works" sheet states, in this order: one cause per hole;
the priority order and why (a later row means "and nothing above it applies");
the denominator (holes at double bogey or worse in the window); that "Long
game" is claimed only on fully recorded holes; that "Not enough recorded"
holes are counted, never dropped, and shrink as more is recorded. Penalty row
detail: the tee / approach / around-the-green split, with the one-source-per-
hole caveat.

### 4.4 Round story — `src/stats/round-story.component.ts`

Each double+ hole in the story gets its cause word as a worded annotation
(never an emoji), from `classifyDoubleCause` over the already-served per-hole
rows. No new request.

## 5. iOS

Same follow-up slice pattern as every stats wave: the measure columns arrive
via the generated client for free; the Swift stats presentation adds the same
block with the same copy, and the Swift round story mirrors the per-hole tag.
Web ships first, iOS follows once the block's reading is settled.

## 6. Tests

- **Partition property:** seeded rounds where the seven columns must sum to
  `double_bogey_plus`, and the four `dbl_penalty_*` to `dbl_penalty`,
  including pickup (NULL strokes) and unrecorded holes.
- **Classifier matrix:** one seeded hole per bucket plus the tricky
  co-occurrences — penalty + three-putt (→ penalty), trouble + recovery-ok +
  three-putt (→ three_putt), multi-chip + three-putt (→ multi_chip), GIR +
  putts 3 double (→ three_putt), par-3 double with no short-game data
  (→ unattributed), fully recorded clean double (→ full_swing).
- **SQL/TS cross-check:** run `classifyDoubleCause` over the same matrix's
  per-hole rows and assert it agrees with the view's bucket, hole by hole.
  This is the guard that keeps the two implementations one classifier.

## 7. Out of scope / known limits

- No secondary "contributing causes" counts (a hole with trouble AND a
  three-putt counts once). Cheap to add later as a parallel non-partitioning
  family (`dbl_with_*`) if the primary view proves too coarse.
- Par-3 tee shots remain invisible (no `tee_result` there); a par-3 double can
  only read penalty, multi-chip, three-putt, full_swing, or unattributed.
  Arguably correct — the par-3 tee shot *is* the approach and GIR covers it.
- `putts` caps at "3 or more"; a 4-putt reads as a three-putt double.
- No per-chip difficulty on multi-chip holes; no approach proximity; no
  which-shot-lost-distance on par 5s. All would need new capture keys and are
  explicitly not proposed.
