# Player statistics — conditioned stats, captured in the score-entry flow

Status: **draft proposal** (2026-07-28).

Related:

- [ADR-0003: Balls are subjects](../adr/0003-balls-as-subjects.md) — per-player
  attribution inside team balls (`source_player_id`)
- `server/domain/formats/plugin.ts` — `MetadataInput` / `MetadataApplies`, the
  existing per-hole metadata vocabulary (Umbrella GIR/fairway)
- `src/round/score-entry.component.ts` — the existing post-score metadata step
  this feature extends

## Context

Tapscore records scores; it records nothing about *how* the score happened.
The classic self-tracked stats (putts per round, fairways as a bare
percentage) are mostly noise because they are **unconditioned**: putt count
depends on approach quality, scrambling percentage depends on how hard the
short-game shots were. A stat is only diagnostic when the outcome is recorded
together with the situation it arose from.

This proposal adds a small closed set of **stat modules**, each pairing one
cheap situation tag with one outcome tag, captured in the same post-score step
Umbrella already uses for GIR/fairway. The result is a discretized
approximation of strokes-gained — buckets instead of laser distances — at a
cost of 0–4 taps per hole.

## Principles

- **Conditioned or not at all.** Every stat pairs outcome with situation.
  No bare putt counts, no bare scrambling percentage.
- **Tap budget is sacred.** Prompts are conditional (no fairway question on a
  par 3, no short-game question when the green was hit in regulation). The
  moment stats entry slows score entry, on-course users abandon it.
- **Binary judgments only.** Any subjective tag (short-game difficulty) has
  exactly two values, answerable by a marker in one second without debate.
- **Stats are player data, not format data.** Format metadata (Umbrella's
  GIR) feeds game scoring; stats feed a player's longitudinal record. Same UI
  step, two declarers, two persistence channels — deduplicated in the UI when
  they overlap.
- **Round-independent.** Capture works identically in friendly and
  competition rounds (all-behaviors-in-all-parts). Configuration lives on the
  player profile, not on the round.
- **Scorer enters stats.** Whoever holds the round's write credential enters
  stats for the ball, same trust model as scores.
- **No stats for guests.** Configuration lives on the profile; guests have no
  profile, so nothing is ever prompted or stored for them. Not a special case
  — an absence.
- **Queryable end to end.** Projection lands in typed columns keyed
  `(player, round, play_hole)`; aggregates are SQL over those columns,
  finishing as views. Profile pages never parse event JSON.

## 1. Stat modules

Five modules. Each is independently enable-able per player, except the noted
dependency. All enums are closed vocabularies, stored as TEXT with CHECK
constraints.

### 1.1 `tee` — driving

Asked on par 4/5 only (`appliesWhen: { minPar: 4 }`).

| tag | values | meaning |
|---|---|---|
| `tee_result` | `fairway` \| `in_play` \| `trouble` | `in_play` = missed fairway but the next shot is a normal one. `trouble` = next shot compromised (blocked, hack-out, hazard). |

Derived: fairway%, in-play% (fairway + in_play), trouble rate, and — joined
with the scorecard — average score from each tee state.

### 1.2 `putting` — first-putt length + putt count

Asked on every hole where the player putted.

| tag | values |
|---|---|
| `first_putt` | `inside_2m` \| `2_to_6m` \| `over_6m` |
| `putts` | `0` \| `1` \| `2` \| `3+` (stepper; `0` = holed from off the green) |

The bucket is what rescues putt count: make% inside 2 m, make% 2–6 m, and
3-putt rate from 6 m+ are all meaningful because the starting length is known.
This is discretized strokes-gained putting.

### 1.3 `short_game` — scrambling, conditioned on difficulty

Asked only when GIR was missed (see §1.4 — the GIR flag gates this prompt).
**Requires `putting`**: the short-game *outcome* is not a separate question —
it IS the `first_putt` bucket of the subsequent putt. Chip-to-inside-2m% falls
out of `first_putt` conditioned on a missed green.

| tag | values | meaning |
|---|---|---|
| `short_game_difficulty` | `standard` \| `hard` | `hard` = short-sided, bad lie, or bunker. Everything else is `standard`. |

Derived: up-and-down% per difficulty class (difficulty + first_putt + putts),
chip-to-inside-2m% per difficulty class. The difficulty split is the entire
point — it removes the skew where easy chips inflate the stat.

### 1.4 `approach` — green in regulation

Asked on every hole.

| tag | values |
|---|---|
| `gir` | boolean |

With `putting` enabled, approach quality is the *distribution* of
`first_putt` buckets on GIR holes — hitting greens from 8 m constantly is not
good iron play, and the buckets expose that. GIR alone (module enabled,
putting off) still yields plain GIR% and gates the short-game prompt.

### 1.5 `penalties` + `recovery`

| tag | values | asked when |
|---|---|---|
| `penalties` | integer ≥ 0 (stepper, default 0) | every hole (one tap only when non-zero) |
| `recovery_ok` | boolean | only when `tee_result = trouble` |

`recovery_ok` = did the recovery shot put the player back in a normal
position in one stroke. Derived: penalties per round, recovery%, and the
trouble→score cost (average score on trouble holes with vs without a
successful recovery). `recovery` requires `tee` (its trigger).

### Worst-case tap count

Par 4, missed green, trouble off the tee, one penalty:
`tee_result` + `recovery_ok` + `gir` + `short_game_difficulty` +
`first_putt` + `putts` + `penalties` = 7 inputs — the pathological hole.
Typical hole with everything enabled: 3–4. Modules exist precisely so a
player can run penalties-only at 0–1 taps.

## 2. Capture UX

Extends the existing post-score metadata step in
`score-entry.component.ts` — the same slot where Umbrella's GIR/fairway
toggles appear after strokes are committed.

- The step's contents are the **union over ball members**: format-declared
  `MetadataInput`s (unchanged, per ball/slot) plus stats prompts for each
  ball member who is a registered player with the module enabled. Guests and
  stats-off players contribute nothing.
- Stats prompts reuse the `MetadataApplies` predicate vocabulary (`minPar`
  etc.) so the par-conditional logic stays declarative and out of the client,
  and add one new conditioning dimension: **answer-dependent visibility**
  (`short_game_difficulty` appears only when `gir` is answered false;
  `recovery_ok` only when `tee_result` is `trouble`). This is a stats-layer
  concept; format metadata stays flat.
- **Overlap dedupe:** when a format declares a metadata input whose key
  matches a stats tag (Umbrella's `gir`), the UI renders **one** control and
  writes both channels — the score-event metadata blob for the format, the
  stat event for stats. Dual-write, single question. Key equality is the
  match rule; the stats vocabulary deliberately reuses the format keys
  (`gir`, `fairway`) where they mean the same thing.
- Skippable, always. Unanswered prompts store nothing (NULL, not false).
  A hole's stats can be entered or corrected later from the scorecard, same
  as scores.

### Per-player attribution in team balls

Stats are per player. They can only be captured where the hole's strokes have
per-player identity:

- Individual balls and per-player-slot team formats (better-ball, Umbrella,
  Taliban — anything using `source_player_id`): full capture.
- Shared-stroke balls (foursomes, scramble): the shots are not attributable
  to one player — **no stats prompts, v1**. Penalties could arguably be
  team-attributed later; out of scope now.

## 3. Configuration

One row per player who has ever enabled stats; no row = stats off. Guests can
never have a row (FK to `players`).

```ts
export interface PlayerStatsConfigTable {
    player_id: string;          // PK, FK players.id
    enabled: number;            // master switch — 0 preserves module choices
    tee: number;
    approach: number;
    putting: number;
    short_game: number;         // requires putting=1 (service-enforced)
    penalties: number;
    recovery: number;           // requires tee=1 (service-enforced)
    updated_at: string;
}
```

- Edited on the player's profile. Master toggle satisfies "completely turn
  off" without losing the module selection.
- Read **live** at prompt time: mid-round profile changes affect subsequent
  holes. No snapshot on the round — stats consistency within a round is not
  worth the freeze machinery.
- Module dependencies (`short_game → putting`, `recovery → tee`) are enforced
  in the service and mirrored as disabled states in the profile UI.

## 4. Data model — capture events + typed projection

Mirrors the app's score architecture: an append-only event table is the
source of truth; a typed projection table is what everything reads.

### 4.1 `stat_events` (append-only)

```ts
export interface StatEventsTable {
    id: string;
    round_id: string;
    play_hole_id: string;        // stable occurrence id, same as score_events
    player_id: string;           // FK players.id — never a guest
    seq: number;                 // global append-order + UNIQUE index, same discipline as score_events.seq (migration 030)
    key: StatKey;                // 'tee_result' | 'gir' | 'first_putt' | 'putts'
                                 // | 'short_game_difficulty' | 'penalties' | 'recovery_ok'
    value: string | null;        // enum text / '0'..'3+' / int as text; null = cleared
    recorded_by_player_id: string | null;
    recorded_at: Generated<string>;
    client_event_id: string;     // idempotency, same as score_events
}
```

Latest event per `(round_id, play_hole_id, player_id, key)` by `seq` wins;
`value = null` clears. Writes ride the round's share token — the same write
credential as scores, so whoever can score can enter stats. Friendly rounds
never lock, so stats stay editable after finish, exactly like scores.

### 4.2 `player_hole_stats` (projection)

Maintained by a DB trigger on `stat_events` insert (`AFTER INSERT … WHEN` no
newer seq exists for the key, `ON CONFLICT DO UPDATE`) — the same mechanism as
the `scorecards` projection trigger from migration 030, unbypassable and
keeping the read service write-free. One sparse row per
`(round_id, play_hole_id, player_id)`; every stat column nullable — NULL
means "not recorded", never "no".

```ts
export interface PlayerHoleStatsTable {
    round_id: string;
    play_hole_id: string;
    player_id: string;
    tee_result: 'fairway' | 'in_play' | 'trouble' | null;
    gir: number | null;                       // 0/1
    first_putt: 'inside_2m' | '2_to_6m' | 'over_6m' | null;
    putts: number | null;                     // 0..3 where 3 = "3+"
    short_game_difficulty: 'standard' | 'hard' | null;
    penalties: number | null;
    recovery_ok: number | null;               // 0/1
}
// PK (round_id, play_hole_id, player_id)
// CHECKs pin the enum vocabularies.
```

This is the queryable surface: every aggregate is a GROUP BY over typed
columns joined to `rounds` (date, course) and `round_play_holes` (par).

### 4.3 Views (end state)

Ship the projection first; add SQLite views once the aggregate shapes settle,
so profile queries stay one-liners:

- `v_player_round_stats` — per `(player, round)`: fairway%, in-play%, GIR%,
  putts by bucket, 3-putt count from `over_6m`, scrambling% split by
  difficulty, penalties, recovery%.
- `v_player_stat_totals` — career/rolling aggregates per player, the profile
  dashboard's source.

Views are additive and cheap to iterate; the spec deliberately does not
freeze their exact shape.

## 5. Derived stats — zero extra capture

From the projection joined with scorecards, no new input:

- Scoring average by par (3/4/5) and by tee state
- Double-bogey avoidance; bounce-back rate after a double+
- Birdie conversion on GIR holes
- Make% inside 2 m / 2–6 m; 3-putt rate from 6 m+
- Up-and-down% and chip-to-inside-2m%, each split standard vs hard
- Penalties per round; recovery%; cost of trouble (score delta vs fairway holes)

## 6. API surface (sketch)

- `GET/PUT /api/players/me/stats-config` — session-scoped profile config
  (`requireAuth()`, the `/players/me/*` convention).
- `POST /api/friendly-rounds/stat-events` — append, token-authorized, batched
  per hole commit (`Type.Array`, per-item `client_event_id` idempotency).
  Server rejects events for guests, for players not in the target ball, for
  players without the module enabled, and for shared-stroke balls.
- `GET /api/friendly-rounds/stats` — token-authorized flat
  `player_hole_stats` rows for the round, so the score-entry step can prefill
  and correct. (A separate endpoint, not a widening of `ScorecardHole`: the
  projection is keyed by player, scorecard holes by ball+source.)
- `GET /api/players/:id/stats` — aggregates (backed by the views). **Open
  question below on visibility.**
- Stat appends do **not** bump `rounds.latest_event_id` or the result cursor
  — they change no leaderboard. Prefill freshness rides the normal loads.

## 7. Out of scope (v1)

- Shared-stroke balls (foursomes/scramble) — no capture.
- Penalty source tagging (`tee/approach/short`) — v2 candidate, one more tap.
- Approach distance buckets from tee shots on par 3s as a separate iron stat.
- Any shot-by-shot tracking / true strokes gained — different product.
- Stats dashboards/visualisations — this spec ends at the queryable views;
  presentation is its own slice.

## 8. Open questions

1. **Visibility.** Reads are open by design elsewhere; are a player's stats
   public (anyone with the profile), friends-only, or self-only? Leaning
   self-only at first — it is personal performance data and nothing else in
   the app depends on reading it.
2. **Competition rounds.** Capture works there by construction, but should
   competition organizers be able to *require* or *suggest* modules
   (e.g. GIR for everyone)? Deferred — profile config rules alone in v1.
3. **`putts` vs `first_putt` consistency** — `putts = 0` (holed from off the
   green) with a `first_putt` value is contradictory. Service-level
   validation or trust the scorer? Leaning: validate the cheap
   contradictions, silently accept the rest. **v1 ships with NO server-side
   coherence validation** — each key is validated only against its own closed
   vocabulary, so incoherent combinations are storable and the §4.3 views must
   treat them as unrecorded rather than counting them.

## 9. Phasing

1. Schema + migrations: `player_stats_config`, `stat_events`,
   `player_hole_stats` + projection service and tests.
2. Config API + profile UI (module toggles, dependency enforcement).
3. Score-entry step extension: union of format metadata + stats prompts,
   answer-dependent visibility, GIR dedupe, batched append on hole commit.
4. Aggregate reads: views + `GET /api/players/:id/stats`.
5. (Separate slice) profile stats presentation.
