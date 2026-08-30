# Exact first-putt metres, the fifth green state, and short game on GIR holes

Owner feature request (2026-08-30): record how far the first putt actually was,
in metres, instead of only the interval. Two round-observed gaps rode along:
a chip that produces a GIR (par 5, greenside in two) is invisible to the
short-game stats, and a green hit over regulation (nailed 120 m third on a
par 4) forces nonsensical miss-direction and chip prompts.

All three are capture-vocabulary changes to the same green sequence, so they
ship as one migration and one pure-model change. Input burden stays at the
standing ruling: not one new mandatory tap.

## 1. Exact metres: refine-on-tap

`first_putt` keeps its five bucket chips, one tap, unchanged. Tapping a bucket
reveals a second chip row scoped to that bucket. The second tap is optional and
records the exact metre; skipping it costs nothing and keeps today's behavior.

Closed vocabulary, each bucket owning its upper edge:

| Bucket | Refine chips |
| --- | --- |
| `< 1m` | 0.3, 0.5, 0.8 |
| `1–2m` | 1, 1.5, 2 |
| `2–4m` | 2.5, 3, 3.5, 4 |
| `4–8m` | 5, 6, 7, 8 |
| `> 8m` | 10, 12, 14, 16, 20+ |

Half-metres to 4, whole metres to 8, coarse steps beyond, matching how a
paced-off putt is actually estimated. "20+" stores 20 and sums as 20. The row
carries no leading label. New key `first_putt_m`; a metre value always belongs
to the selected bucket, and changing or clearing the bucket clears it
(contradicted semantics). Legacy coarse buckets get no refine row.

Rejected input shapes: a number field or scroll picker (breaks the per-hole
tap-count exception in docs/design-guidelines.md §1), a flat metre chip row
(does not fit the 375 px plate), a slider (imprecise under a walking thumb).

## 2. The fifth green state

`green_miss_dir` relabels to **Approach** and gains `hit_late` ("On green")
after long/short/left/right: the first green attempt hit, over regulation.
Selecting it contradicts both short-game keys. `gir` stays a derived 0/1;
the derivation cannot distinguish missed-then-chipped from hit-late, which is
exactly why the player supplies this state.

## 3. Short game on GIR holes

`short_game_difficulty` / `short_game_strokes` were contradicted on `gir = 1`.
They become available but collapsed behind an **Add short game** disclosure
row; one tap expands them in the rare case, one quiet line otherwise. The
server default flips with it: unrecorded `short_game_strokes` still counts as
1 on missed-green holes (legacy), but as 0 on GIR and hit-late holes.

## 4. Stats unlocked

Counts and sums on the server, rates on the client, coherent denominators,
Postel throughout: a bucket-only hole is fully valid everywhere, exact metres
are a refinement cohort with its own recorded count.

- **Proximity on GIR** — average first-putt metres on greens hit. The headline;
  the owner asked for exactly this ("total distans till hålet vid greenträff").
- **First putt meters made** — sum of holed first-putt metres over one-putt
  holes. `< 1m` one-putts without metres credit a flat 0.5 (owner ruling);
  outer-bucket one-putts without metres stay out and surface as coverage.
- **Make curve by distance** — one-putt rate and average putts per metre value,
  long-format cross-tab per round (053 pattern).
- **Green attempts hit** — GIR plus hit-late: ball-striking accuracy separated
  from position. Scramble cohorts stop counting hit-late holes as fake misses.
- **Chip on GIR / up and down for birdie** — GIR holes with a recorded chip,
  and the par-5 one-putt split.
- **Strokes-gained putting v2** — `EXPECTED_PUTTS_V2` interpolated at the metre
  vocabulary from the frozen v1 bucket anchors; v1 stays frozen.

## 5. Rejected for now: approach-miss magnitude

The owner also floated capturing how many metres offline/long a missed
approach was. Parked deliberately: it is a new capture axis on every missed
green, colliding with the no-added-burden ruling far harder than an optional
refine tap, and on greens hit the first-putt metres already are the miss
magnitude. If it returns it gets its own proposal with its own tap-cost
argument.
