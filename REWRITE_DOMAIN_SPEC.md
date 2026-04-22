# Rewrite Domain Spec

Unified domain model for a next-generation golf platform. Captures learnings from the current `golf-serie` codebase and addresses the coupling between tour, series, and ad-hoc play by collapsing them into one composition of shared primitives.

---

## 1. Goals and Core Insight

### Problem with current architecture

Tour, series, and ad-hoc play evolved as near-independent mini-applications. Adding a feature to one does not cheaply reach the others. Score entry, leaderboards, finalization, and standings have diverged. Simulator play, self-organised groups, and category-based tee assignment were bolted on.

### Core insight

The scoring primitive is **Round**: a set of players, on a course, on a date, producing scorecards. A Round knows nothing about tours, series, or points.

Two thin context wrappers put a Round in a context:

- **FriendlyRound** — ad-hoc, low-friction, guest-allowed
- **CompetitionRound** — part of a formal Competition, possibly one of many

A **Competition** aggregates one or more CompetitionRounds and sits inside a **Tour** or **Series** (or stands alone).

Model Round once. Scoring engine, score entry UI, leaderboard logic, handicap posting — all target Round. They work for friendly and competition play without conditionals. The coupling problem disappears because features live on the primitive, not on the wrappers.

### The layering

```
Round                              (pure primitive — scorecards live here)
  │
  ├── FriendlyRound                (ad-hoc context)
  │
  └── CompetitionRound             (competition context, 1..N per Competition)
                │
                Competition        (aggregator — format config, finalization, cut rules)
                       │
                       ├── Tour       (individuals + fixed small partnerships)
                       ├── Series     (fixed teams)
                       └── standalone (no wrapper)
```

---

## 2. Primitive Entities

### Club

Organisation owning courses. Players declare a home club and may belong to several. Mostly metadata (name, logo, location).

### Course

Belongs to a club. Has up to 18 holes (with support for 9-hole rounds). Each hole has:

- Number
- Par
- Stroke index (difficulty order)

Course has many **tees**.

### Tee (per course)

- Colour / name
- Per-hole length
- Optional per-tee stroke index override (if the tee reorders hole difficulty)
- Per-gender rating: `(gender) → (course_rating, slope, par, total_length)`

Gender-keyed ratings are required. A single rating per tee cannot model mixed-gender fields correctly.

### Player

Identity and profile:

- Auth credentials, display name, nickname, avatar
- Current handicap index
- Home club, other club memberships
- Role grants (see Authorization)
- Relations to various results/competitions/tours/series/etc and other players (friends)

**Handicap history**: versioned records of the player's index, each with source (manual / calculated / import) and effective date. Not just "latest value" — the history matters for audit and backdated scoring.

### Handicap — three distinct concepts

Never conflate:

| Term | Definition | Lives on |
|------|------------|----------|
| **Handicap index** | WHS number, player-level | `Player` (current) + `handicap_history` |
| **Course handicap** | `index × slope / 113 + (CR − Par)`, per tee + gender | Computed, snapshotted on scorecard |
| **Playing handicap** | course handicap × format allowance (e.g. 95% stroke, 50% foursomes) | Computed, snapshotted on participant |

### Playing Format

Data-driven, not hardcoded. Two orthogonal axes:

- **Scoring mode**: stroke-play, stableford, match-play, skins, custom
- **Team shape**: individual, better-ball, scramble, foursomes / alternate-shot, greensome, custom

Plus:

- Allowance percentage (applied to course handicap → playing handicap)
- Output levels: player, group, field — the format declares which it produces
- Tiebreaker rules

**Implementation**: each format is a strategy with a common interface. Computes leaderboard, points, and per-hole status from scorecards. New format = new strategy. No schema change.

---

## 3. Round (the core)

A Round is **one course, one date, one set of scorecards for the whole field**. It is context-free: it does not know if it is friendly or part of a competition.

### Round fields

- Course
- Date
- Round type: `full_18 | front_9 | back_9 | custom_holes`
- Venue type: `outdoor | indoor`
- Start list mode: `structured | fixed_slots | open_window`
- Window start / end (for `fixed_slots` or `open_window`)
- Self-organize flag
- Format slots — one or more (see below)
- Status: `not_started | active | complete`

### Format slots on Round

A Round has one or more format slots. A format slot declares:

- Playing format (scoring mode + team shape + allowance)
- Optional scope (e.g. "only players in category A", "only the first four participants")

Single-format round: one slot covering everyone. Multi-format round (series-style): 2 singles slots + 2 alternate-shot slots, each covering different participants.

### Scoring unit — ball (per Round)

A **ball** is the atomic scoring unit: one stream of strokes per hole. One producer = own-ball, 2+ producers = team-ball. Scorecards are rendered from balls, not from a separate participant entity. See §17 for the full ball/strategy model; the summary here is:

- Strokes per hole: `int | null (no-result) | 0 (pickup)` — stored as append-only `score_event` keyed by `ball_id`
- Per-producer snapshots live on `ball_players`: tee, course rating, slope, par, handicap index, course handicap (mixed-tee rounds have distinct per-producer rows)
- Per-slot snapshot lives on `slot_balls`: `playing_handicap_snapshot` (ball CH × format allowance)
- Derived via format strategy: gross, net, points, per-hole match-play status
- Manual-entry override: out / in / total without per-hole detail (for importing old results or incomplete entry)

### Producer (per Round)

A **producer** is a player (or guest) occupying a scoring slot on one or more balls within a Round. "Participant" as a standalone entity is superseded by §17's ball/producer model; producers are represented by rows in `ball_players` (with XOR `player_id | guest_player_id`), which carry the per-round snapshots listed above. Admin-level flags (`is_locked`, `is_dq`, admin notes) move to the ball or slot_ball level where they're actually scoped.

### Start List (per Round)

First-class concept. The structural plan of who-plays-when-where.

Three modes (property of the Round):

| Mode | Slots | Group formation | Tee/time assignment |
|------|-------|-----------------|---------------------|
| `structured` | Admin-built | Admin | Admin |
| `fixed_slots` | Admin-built | Players self-join a slot | Fixed by slot |
| `open_window` | None | Players create groups | Group picks start time within window |

Status progression per player (non-structured modes):

```
looking_for_group → registered → playing → finished | withdrawn
```

Structured mode skips directly to `registered` on admin assignment.

### Tee Time / Playing Group (per Round)

Slot within a Round's start list.

- Start time
- Start hole (1 or 10 for outdoor shotgun)
- Capacity (typically 2–4 players)
- Optional hitting bay (indoor)
- Contains participants

**Outdoor** slot semantics: tee time + start hole, ~8–12 min apart.
**Indoor** slot semantics: hitting bay × time window, bay occupied for 60–90 min. Overlapping bay bookings, not overlapping tee times.

### Venue and Bay (optional, for indoor)

- **Venue**: named facility (name, location)
- **Bay**: named hitting bay belonging to a venue

Needed if the product supports simulator booking across multiple rounds. Less critical for outdoor.

---

## 4. Context Wrappers

### FriendlyRound

A Round configured for low-friction, ad-hoc play. A FriendlyRound is a 1:1 extension of a Round with friendly-specific metadata.

- `round_id` (FK, 1:1)
- Creator (any player)
- Share token (link-based join)
- Guest players allowed (name + handicap + gender without user account)
- Minimal-auth entry
- Post-to-handicap flag (does this round post to WHS handicap history?)
- Not part of any tour or series

Leaderboard of a FriendlyRound is the Round's leaderboard — same engine, different audience.

A FriendlyRound can be **promoted** to a single-round Competition later if an admin decides to formalise it.

### CompetitionRound

A Round that is part of a formal Competition. 1:1 extension of a Round with competition-specific metadata.

- `round_id` (FK, 1:1)
- `competition_id` (FK)
- `round_number` (1, 2, 3, … within the competition)
- Cut-eligible flag (does this round count for cut calculation?)
- Post-cut flag (is this round played only by participants who made the cut?)

A CompetitionRound **inherits defaults from its Competition**: format slots, category/tee mapping, start list mode. Overrides are allowed per round (e.g. Friday better-ball, Saturday singles).

---

## 5. Competition

An aggregator of one or more CompetitionRounds, plus competition-wide configuration and finalization state.

### Competition fields

- 1..N CompetitionRounds
- Default format slot config (inherited by each round unless overridden)
- Default start list mode (same)
- Categories with per-competition tee assignment
- Point template (required if inside a Tour or Series; optional for standalone)
- Cut rules (see below)
- Lifecycle: `draft → setup → active → finalized` with `is_results_final` and `results_finalized_at`
- Belongs to: Tour, Series, or standalone
- Admins (per-competition grant)

Single-round competitions have one CompetitionRound; UI can collapse the layer visually when `round_count == 1`.

### Cut

Between rounds, a cut can trim the field.

```
cut_rule (per competition):
  - after_round: int            (e.g. 2 = cut after round 2)
  - cut_type: top_n | top_percent | within_strokes | custom
  - cut_value: int
```

Participant snapshots `cut_after_round` flag once the cut is applied. Cut participants do not play further CompetitionRounds.

### Competition Result

Finalization snapshot. Immutable once written.

- Per participant per scoring type (`gross | net`)
- Position, points, totals, tiebreakers
- Aggregated across all CompetitionRounds
- Separate rows for gross and net allows publishing both leaderboards independently

### Point Template

Reusable scoring table (position → points). Can be tour-scoped or global. Referenced by competition — do not hardcode.

Example:

```
1st → 10, 2nd → 8, 3rd → 6, 4th → 5, 5th → 4, ...
```

Also need a behaviour assigned if multiple participants share a common score (and we need to be able to add new behaviours). This behaviour is responsible for calculating tie breakers on same scores and assigning points (could be that multiple players on same result should have the same points assigned based on calculation or each gets distinct points).

### Category (per tour, inherited by competition)

Player classification, e.g. "Men 0–5 HCP", "Women", "Seniors". Has a `competition_category_tees` mapping per competition: "this competition: Category A plays white, Category B plays red."

### Enrollment (per tour)

Membership record.

- Optional `player_id` (enrollments by email-only for invited guests are valid)
- Lifecycle: `pending → requested → active` (or `rejected`)
- Category assignment
- Playing handicap snapshot at enrollment

---

## 6. Organisational Wrappers

All wrap `Competition`. Each is a way to group competitions plus standings.

### Tour

Individuals or fixed small partnerships (the partnership is the "participant" across competitions). Characteristics:

- Player-level standings
- Point template
- Categories
- Documents (rules, schedule, announcements)
- Admins (per-tour grant)
- Enrollments with lifecycle

**Standings dimensions**:
- Gross and net (independent rankings)
- **Projected** (includes live / non-finalized competitions) vs **official** (only finalized)

### Series

Fixed teams (Ryder-Cup shape, league-shape).

- Many teams via junction (team-to-series is many-to-many)
- Team-level standings
- Each competition can have multiple format slots, results aggregate across them
- Team lineup per format slot per round is editable (the free-form goal — data-driven, not hardcoded)

"League" is not a separate concept — series already covers it. Keep "series" naming.

### Standalone Competition

A competition that belongs to neither tour nor series. Same everything else. No standings follow-on.

### Free-form Event

User's red-vs-blue use case. A series with:

- 2 (or N) teams
- Multiple competitions with arbitrary format-slot mixes
- Editable team lineup per format slot per round

No code changes required if the format strategy system is pluggable and team lineups are editable data.

---

## 7. Documents and Content

### Document

Markdown / rich content. Scoped to tour or series.

- Type (rules, schedule, announcement, custom)
- One designated as landing (home-page content for the tour/series)
- Versioned

### Media (future consideration)

Photos / video per round. Not currently modelled. Worth a placeholder in the schema.

---

## 8. Authorization

Granular, scoped to entity. Not just global admin/player.

| Role | Scope | Grants |
|------|-------|--------|
| `SUPER_ADMIN` | Global | Everything |
| `series_admin` | Per series | Manage teams, competitions, finalize results |
| `tour_admin` | Per tour | Enrollments, categories, competitions, finalize |
| `competition_admin` | Per competition | Score correction, finalize |
| `friendly_round_owner` | Per friendly round | Manage scorecards, invite guests |
| `player` | Self | Play, view, enroll |

Plus an `owner_id` on competitions and friendly rounds for the creator.

Role grants are records in a junction table, not fields on user. A player can be `tour_admin` of tour A and a regular player in tour B.

---

## 9. Snapshotting (critical cross-cutting concern)

Things that must be snapshotted at time of play, not looked up later. Canonical storage is per §17; fields listed here for the snapshotting concern:

- Course identity → `rounds.course_name_snapshot`
- Per-hole course data → `round_course_holes` (hole_no, par, base_stroke_index)
- Per-tee-per-hole data → `round_tee_holes` (length, stroke_index_override)
- Per-producer tee + rating + slope + par + handicap index + course handicap → `ball_players` (one row per producer per ball; mixed-tee rounds carry distinct snapshots per producer)
- Category → `ball_players.category_snapshot`
- Ball course handicap → `balls.course_handicap_snapshot` (immutable after ball creation)
- Slot playing handicap (ball CH × allowance) → `slot_balls.playing_handicap_snapshot`
- Display name at time of play → `ball_players.display_name_snapshot` (audit-grade rendering even after soft-delete/rename)

Reason: handicap indices change, tees get re-rated, categories get edited, players get renamed or soft-deleted. Retroactive recalculation breaks finalized rounds. This is the root cause of several bugs in the current codebase.

Finalization snapshot: `competition_results` table. Written on `is_results_final = true`, immutable thereafter.

---

## 10. Four Distinct Computed Views

Easy to confuse, must be kept separate:

| View | Scope | Source | Mutability |
|------|-------|--------|------------|
| **Round leaderboard** | Per Round | Live, computed from scorecards | Updates in real-time |
| **Competition leaderboard** | Per Competition | Aggregated across its CompetitionRounds | Live |
| **Results** | Per Competition | Finalization snapshot | Immutable once finalized |
| **Standings** | Per Tour / Series | Aggregated across Competitions | Live for projected, frozen for official |

Each has its own query path. They share the Round primitive but serve different audiences.

---

## 11. Mobile-first Data Architecture

Round data must work for many concurrent users on phones, on flaky golf-course WiFi and cellular, with minimal battery drain and bandwidth. The schema and sync model are designed around this from day one.

### Event-log scorecard

Scorecards are **append-only score events** plus a materialised view. The per-hole strokes array is derived, not source of truth.

```
score_event (append-only)
  id, round_id, participant_id, hole, strokes | null,
  event_type: score_entered | score_cleared | score_confirmed | manual_override,
  recorded_by (player_id),
  recorded_at (server timestamp),
  client_event_id (UNIQUE per round — idempotency key)

scorecard (materialised view, rebuilt from latest event per hole)
  participant_id, round_id, hole → strokes, recorded_by, recorded_at
```

Benefits:

- Tiny payloads (~40 bytes per score entry)
- Idempotent writes — client retries safely with `client_event_id`
- Conflict-safe (last-writer-wins per hole, or propose/confirm if stricter semantics needed)
- Audit trail built-in — every score change has who and when
- Replay is trivial: "send me your event log for round X" reproduces exact state

### Versioned state cursor

Every Round has a monotonic event counter.

```
round:
  latest_event_id          (denormalised for cursor efficiency)
  scorecard_version        (bumped on every event — optional)
```

All reads and subscriptions use the cursor:

- Initial load: client receives snapshot + `cursor`
- Live updates: server pushes events where `event_id > cursor`
- Reconnect: client sends `last_seen_cursor`, server fills the gap
- No "am I up to date?" ambiguity

### Push transport, not poll

| Channel | Use when |
|---------|----------|
| WebSocket | Primary — push score events and leaderboard deltas |
| Server-Sent Events | Fallback when WS blocked (corporate firewalls, some club networks) |
| Long-poll with cursor | Last resort for very degraded connectivity |
| Full-refresh polling | **Never** — battery and bandwidth killer |

Heartbeat interval 30–60 s, not aggressive. Disconnect when app backgrounded; reconnect on foreground with cursor.

### Subscription granularity

Partition subscriptions by Round to keep payloads targeted.

| Subscription | Receives |
|--------------|----------|
| Round leaderboard | Aggregated position/total deltas for all groups in the Round |
| Playing group | Raw score events for your tee time (detailed marker UX) |
| Competition leaderboard | Aggregated deltas across all CompetitionRounds in the Competition |

A phone on the leaderboard view only subscribes to the leaderboard channel (lightweight). A phone actively entering scores subscribes to the group channel too.

### Offline-first

Golf courses have dead zones. Design for it.

- Client maintains a **local queue** of pending score events.
- Score entry is **optimistic** — UI updates immediately, queue entry created.
- On reconnect: flush queue with idempotency keys; server applies in order and dedupes.
- Conflict resolution is per `(participant, hole)` — last-writer-wins by `recorded_at`, or propose/confirm UI for stricter cases.
- Disconnected clients can **recompute their own leaderboard locally** from the event log — stale for other groups, correct for their own.

### Pre-compute on server, not on client

Rule: if a view requires multiple joins, pre-compute and push deltas. Mobile CPU and battery are worse than server CPU.

| Data | How it reaches the phone |
|------|--------------------------|
| Score events | Pushed from server (authoritative, tiny) |
| Scorecard state | Snapshot on load, events after |
| Round leaderboard delta | Pre-computed on server, pushed |
| Competition leaderboard delta | Pre-computed on server, pushed |
| Standings | Request/reply — rarely changes live, not streamed |

### Coalescing and backpressure

If four players in a group finish hole 7 within two seconds, coalesce into a single leaderboard delta before pushing. Do not emit four separate updates. Sliding window on the server: e.g. 500 ms debounce per Round leaderboard channel.

### Battery and bandwidth specifics

- Score events are tiny; no compression needed
- `Content-Encoding: gzip` on initial snapshot only
- Avoid avatar fetches on leaderboard view — use initials or CDN-cached thumbnails with aggressive cache headers
- Do not keep radio hot in background; rely on push (APNs/FCM) for critical notifications, not WebSocket keep-alive

### Authentication on mobile

- Long-lived session tokens, silent refresh on foreground-return
- FriendlyRound share tokens: guest stays authenticated for the life of the round without a password flow
- Token refresh must be resilient to offline: cached token valid until expiry even with no network

### Schema implications summary

Additions to Round:

- `score_event` table (append-only, primary source of truth for scores)
- `scorecard` as materialised view (triggered rebuild on insert) — for fast reads
- `round.latest_event_id` and optional `round.scorecard_version` — cursor support
- `client_event_id` uniqueness constraint per round — idempotency

The existing `participants.score[18]` array (if carried over from the current codebase) becomes derived, not source of truth.

### Trade-offs

- Slightly more storage (events are tiny, volume manageable — ~72 per player per round)
- Materialised view adds trigger complexity on the backend
- Offline sync adds real client complexity — unavoidable if the UX bar is "works on the course"
- Worth it for real-time leaderboards, audit for free, replayability, and battery-friendly mobile

---

## 12. Audit

Admin actions on scores and finalization require who/when records:

- `admin_modified_by`, `admin_modified_at`, `admin_notes` on participant
- Finalization event log (who finalized, when, with what values)
- Cut event log (who applied the cut, when, which participants were cut)
- Handicap history (source, effective date, who entered)

Not optional for a production system.

---

## 13. Manual and Import Flows

The current codebase has `manual_score_out`, `manual_score_in`, `manual_score_total`, and `manual_entry_format`. Keep this as a first-class capability:

- Admin can enter 9+9+total without per-hole detail
- Used for importing historical results and for admin correction
- Format strategy handles missing per-hole data gracefully

---

## 14. Surprising / Non-obvious Rules (collected from codebase)

1. **Projected vs actual standings** — tours compute two rankings: live (includes non-finalized competitions) and official (only finalized). Display both.
2. **Gender in handicap calculation** — non-negotiable. Course tees have gender-specific ratings. Playing handicap differs by gender.
3. **Participant vs player distinction** — participant is a slot, player is a person. Many-to-many via junction.
4. **Stroke index can override per tee** — most courses share one stroke index, but some tees reorder hole difficulty. Schema must allow override.
5. **Enrollment without player link** — invited guests can be enrolled by email+name, player account created later.
6. **Scoring type dimension on results** — results row is keyed by `(participant, scoring_type)`, so gross and net have separate position and points.
7. **No-result vs pickup** — `null` means did not play the hole, `0` means picked up (penalty in stableford, max in net). Different semantics.
8. **Round is context-free** — a CompetitionRound and a FriendlyRound share the same Round engine. Same scoring code, same leaderboard code, same start-list code.
9. **Handicap posting** — any Round can post to WHS handicap history, regardless of whether it is friendly or competitive. Decided per-round via a flag.

---

## 15. What This Buys Us

Adding a new playing format:

1. Implement a new format strategy (one file).
2. Register it.

It shows up in:

- Score entry (strategy declares what inputs it needs)
- Round leaderboard (strategy computes ranking)
- Competition leaderboard (aggregates across CompetitionRounds)
- Standings (tour/series aggregate generic results)
- Friendly and competitive play — all of them

Same for start-list modes: new mode enum + one strategy for slot/group semantics. Works everywhere because start lists live on Round.

Same for organisational wrappers: they are thin aggregation layers over competitions. Adding a new wrapper type is rare and well-scoped.

Multi-round competitions, cuts, mixed-format series rounds, ad-hoc self-organising weekend games, indoor simulator leagues — all compositions of the same primitive, not separate features.

The coupling problem disappears because features live on the Round primitive, not on the wrappers.

---

## 16. Open Questions

To resolve before or during implementation:

1. **Venue / Bay** as first-class entities or strings on round? Depends on whether simulator booking (across rounds and competitions) becomes a use case.
2. **Media** (photos / video) — placeholder now, or defer entirely?
3. **Handicap calculation engine** — reuse existing WHS implementation or wrap a library? Current codebase has one worth porting.
4. **Real-time updates** — push (websockets) or poll? Affects leaderboard architecture.
5. **Offline score entry** — expected for outdoor play on poor cell coverage. Design-in from day one or defer?
6. **Notifications** — in-app, email, push? Not modelled here; out of scope for the core domain but needs a touchpoint.
7. **Team composition for free-form events** — data model for "who plays in this format slot of this round" within a series. Sketch needed.
8. **FriendlyRound → Competition promotion** — supported operation, or out of scope? If supported: does the Round keep its ID and gain a CompetitionRound wrapper, or is it copied?
9. **FriendlyRound inside a Tour** — allowed? Probably not (tours are competitive), but some products let social rounds count toward loose standings. Decide.
10. **Schema choice** — 1:1 extension tables (FriendlyRound, CompetitionRound) vs single Round table with discriminator + nullable columns. Preference: extension tables for decoupling at schema level.

---

## 17. Round Context and Format Strategies

Extends sections 3 (Round), 9 (Snapshotting), and 11 (Event log) with the concrete model for how a format strategy gets everything it needs — and nothing it doesn't — from the round. Supersedes the earlier `participants` / `participant_players` / `slot_teams` sketch: **the atomic scoring unit is a ball, not a participant.**

### Guiding principle

A Round is a **self-contained, frozen snapshot** of all data needed to score and render it. A format strategy is a **pure function** over that snapshot, the slot's ball set (with pre-derived PH per ball), and the event log:

```
strategy.score(roundContext, slotBalls, events) → { result }
```

No DB lookups mid-calculation. No hidden inputs. Re-running on the same inputs always produces the same output. Course rating changes, handicap index changes, tee re-ratings — none of these touch historical rounds. The strategy does not know or care who the players are, how PH was derived, or whether a ball is shared by one player or four. Identity and derivation are upstream concerns.

### The ball: atomic unit of scoring

A **ball** is what gets scored: one stroke count per hole, optional metadata (GIR, FIR, putts). Produced by one or more players — 1 = own-ball, 2+ = team-ball (alt-shot, scramble, greensomes). Every scoring event in the round targets a ball.

```
round_ball_strategies
  id, round_id, strategy_id,                   -- e.g. 'own_ball_per_player', 'alt_shot_pair'
  strategy_def_id,                             -- stable id from RoundDefinition.ballStrategies[].id
  derivation_config JSON,                      -- BallDerivationConfig (scramble ranks, greensomes weights)
  composition JSON                             -- pairings / teams (null for own-ball)

balls
  id, round_id,
  round_ball_strategy_id (FK),                 -- which instance produced this ball (canonical identity)
  label?,
  course_handicap_snapshot,                    -- ball_CH (derivation output)
  per_producer_ch JSON?                        -- audit surface for team balls

ball_players                                   -- guest support preserved via XOR
  ball_id,
  producer_def_id,                             -- stable id from RoundDefinition.producers[].id;
                                               -- survives recompile so corrections can find this row
  player_id? | guest_player_id?,               -- XOR, matches legacy participant_players_xor_check
  display_name_snapshot,                       -- "played as" for audit-grade rendering
  handicap_index_snapshot,                     -- raw WHS index at round start
  category_snapshot,                           -- category assignment feeding tee/CH derivation
  gender_snapshot,                             -- drives gender-split tee ratings
  tee_id (FK, live),                           -- per-producer tee (mixed-tee rounds: women red / men yellow)
  tee_name_snapshot,
  course_rating_snapshot,
  slope_snapshot,
  tee_par_snapshot,
  course_handicap_snapshot                     -- per-producer CH (before team-ball derivation)
```

Two identity surfaces per registered-player producer: live `player_id` FK (navigation, dashboard, "current name") and `display_name_snapshot` (what renders on the historical scorecard). UI picks per surface. Guest players are round-scoped; their snapshot lives on the `guest_players` row they point to.

**Per-producer tee snapshots are required** — §2 allows per-category tee assignment, so a single round routinely has men on one tee and women on another. Team-ball derivation combines per-producer CHs, each computed from that producer's own tee rating.

Ball identity is **`(round_id, round_ball_strategy_id, producer_set)`** — strategy instance is part of the key. Producer-set-only dedupe is an optimization the strategy opts into (`allowsProducerSetDedupe`): `OwnBallPerPlayer` says yes (one P1 own-ball, reused across slots); team strategies say no (two `AltShotPair` instances with the same pair mean two different balls).

### Round context: course + holes snapshots

Course identity stays live; scoring data frozen in two normalised tables.

```
rounds
  id, course_id (FK, live), played_at,
  course_name_snapshot                         -- for audit-grade rendering; live FK for navigation

round_course_holes
  (round_id, hole_no, par, base_stroke_index)  -- course-level hole data, frozen

round_tee_holes
  (round_id, tee_id, hole_no,
   length_m, stroke_index_override?)           -- per-tee hole data; SI override wins when present
```

Scoring routines that need effective SI: look up via the producer's `ball_players.tee_id` → `round_tee_holes.stroke_index_override`, else fall back to `round_course_holes.base_stroke_index`. Lengths are always per-tee.

No singular `rounds.tee_rating_snapshot` / `rounds.slope_snapshot` / `rounds.tee_par_snapshot` — those are per-producer on `ball_players`.

### Two strategy layers: ball creation and format

Two distinct strategies, separated by concern.

**BallCreationStrategy** (round-level). Produces balls from players and composition. Owns **derivation** — how producer indices/CHs combine into the ball's base CH. Knows nothing about scoring.

**FormatStrategy** (slot-level). Given pre-created balls with derived CH, applies **allowance** to get PH, then scores. Knows nothing about how balls were formed.

```
ball creation produces: ball_CH = derive(perProducerCH, derivationConfig)    -- each producer's CH computed from their own tee
format applies:         ball_PH = round(ball_CH × allowancePct / 100)
```

A round declares one or more BallCreationStrategy instances (persisted in `round_ball_strategies`). Their outputs union into the round's ball pool. Each slot references a format + subset of balls from the pool + its allowance config + (optional) own-ball team grouping.

### Slots reference balls, not players

```
slots
  id, round_id,
  slot_def_id,                                 -- stable id from RoundDefinition.slots[].id
  scoring_mode, team_shape,
  allowance_config,                            -- FormatAllowanceConfig (allowance only, no derivation)
  ball_mode                                    -- 'own' | 'team' — derivable from strategy; stored for UI/query convenience

slot_balls
  (slot_id, ball_id,
   playing_handicap_snapshot)                  -- only slot-specific value; ball_CH stays on `balls` (no duplication)

slot_ball_teams                                -- only for own-ball team formats (better-ball, taliban)
  (slot_id, team_label, ball_id)               -- groups balls into teams at slot level
```

`slot_balls` no longer duplicates `course_handicap_snapshot` — read it from `balls` via join. CH is per-ball (immutable after ball creation); only PH varies per slot because only the allowance varies per slot. Ball CH is never patched directly: a `setup_correction_event` (see below) targets the RoundDefinition input (e.g. producer tee or handicap index), the compiler re-runs, and the recomputed CH lands on `balls` — all slots observing that ball pick up the new value via join.

### What gets snapshotted vs what stays live

| Data | Treatment | Where |
|------|-----------|-------|
| Course identity (name, slug) | **Live FK** + frozen name snapshot | `rounds.course_id` + `rounds.course_name_snapshot` |
| Hole par + base SI | Frozen per round | `round_course_holes` |
| Per-tee hole length + SI override | Frozen per round × tee | `round_tee_holes` |
| Per-producer tee + rating + slope + par | Frozen per producer | `ball_players.*_snapshot` |
| Per-producer handicap index | Frozen per producer | `ball_players.handicap_index_snapshot` |
| Per-producer category | Frozen per producer | `ball_players.category_snapshot` |
| Per-producer CH (pre-derivation) | Frozen per producer | `ball_players.course_handicap_snapshot` |
| RoundDefinition (source of truth for compiler) | Versioned per compile | `round_definitions` |
| Ball derivation config + composition | Frozen per strategy instance | `round_ball_strategies` |
| Ball CH | Frozen per ball | `balls.course_handicap_snapshot` |
| Per-producer CH for team balls | Audit JSON | `balls.per_producer_ch` |
| Format allowance config | Frozen per slot | `slots.allowance_config` |
| Ball PH | Frozen per (slot × ball) | `slot_balls.playing_handicap_snapshot` |
| Slot team groupings (better-ball, taliban) | Frozen per slot | `slot_ball_teams` |
| Player identity (name, email, avatar) | **Live FK** for navigation + frozen `display_name_snapshot` for audit rendering | `ball_players.player_id` + `ball_players.display_name_snapshot` |
| Guest player identity | Frozen | `guest_players` row |

**Soft-delete** on `players` (`deleted_at`). Dashboard queries filter soft-deleted out. Rendering falls back to `display_name_snapshot` (always populated at round creation) so historical scorecards never show "Deleted player" — they show what the player was called when they played. Live `player_id` still works for navigation when the player is active.

Hard-delete (GDPR) nulls PII on `players`, keeps tombstone row so FKs survive. Snapshots on `ball_players` are unaffected by the policy the reviewer flagged: registered-player rendering becomes **live for current surfaces, frozen for historical surfaces** — by design, same as guest rendering.

### Storage split — by data shape

- **Flat, frozen scalars** → columns on the owning row (snapshots on `ball_players`, CH on `balls`).
- **Row-oriented, aggregated** → normalised table. `round_course_holes` + `round_tee_holes` so cross-round aggregates like "hardest hole on course X" stay pure SQL.
- **Polymorphic / discriminated-union** → JSON blob. `BallDerivationConfig` + `composition` on `round_ball_strategies`, `FormatAllowanceConfig` on `slots`. Normalising unions would require polymorphic tables.

Live FKs sit alongside snapshots so "all rounds at Linköpings" and "all rounds by player X" stay trivial queries.

### Config shapes (split by concern)

Two Typebox-validated unions, one per strategy layer.

```ts
// Lives on ball creation strategy instance (round-level).
// Determines ball_CH from producer CHs.
type BallDerivationConfig =
  | { type: 'single' }                                          // 1-producer — use that player's CH
  | { type: 'avg' }                                             // foursomes — avg of producer indices, apply tee rating once
  | { type: 'sum_of_ch' }                                       // four-ball combined (variant rulesets)
  | { type: 'weighted'; lowPct: number; highPct: number }       // greensomes — 0.6 × low + 0.4 × high
  | { type: 'by_rank'; chPcts: number[] }                       // scramble — CHs sorted low→high, ball_CH = Σ(CH[i] × chPcts[i] / 100)

// Lives on slot (per format).
// Determines ball_PH from ball_CH.
type FormatAllowanceConfig =
  | { type: 'flat'; pct: number }                               // uniform allowance applied to every ball in the slot
```

Match-play PH normalisation (subtract lowest PH in match from everyone) stays in scoring code — orthogonal to allowance, not encoded here.

### Worked examples

| Format | Ball creation strategy | `BallDerivationConfig` | `FormatAllowanceConfig` | Slot-level grouping |
|---|---|---|---|---|
| Individual stroke, 100% | `OwnBallPerPlayer` | `single` | `flat(100)` | — |
| Individual stableford, 95% | `OwnBallPerPlayer` | `single` | `flat(95)` | — |
| Foursomes (alt-shot), 50% | `AltShotPair` | `avg` | `flat(50)` | — |
| Greensomes, 0.6/0.4 | `GreensomesPair` | `weighted(0.6, 0.4)` | `flat(100)` | — |
| Four-ball better-ball, 85% per ball, 2v2 | `OwnBallPerPlayer` | `single` | `flat(85)` | 2v2 pairing |
| **Taliban (2v2 better-ball variant)**, 90% per ball | `OwnBallPerPlayer` | `single` | `flat(90)` | 2v2 pairing |
| Scramble 4 by-rank | `ScrambleTeam` | `by_rank([25,20,15,10])` | `flat(100)` | — |
| Scramble 2 by-rank | `ScrambleTeam` | `by_rank([35,15])` | `flat(100)` | — |
| Match play singles | `OwnBallPerPlayer` | `single` | `flat(100)` | — |

Note: the `OwnBallPerPlayer` ball strategy executes **once** per round, producing the own-ball set shared across every format slot that needs own-balls (stableford, better-ball, taliban, match play, köpenhamnare, etc.). Team-ball strategies (`AltShotPair`, `GreensomesPair`, `ScrambleTeam`) produce their distinct balls alongside.

### Strategy contracts

Two interfaces. Each has one job. Inputs are per-producer (tee-aware), not round-singular.

```ts
interface BallCreationStrategy {
  id: string                                    // 'own_ball_per_player' | 'alt_shot_pair' | 'greensomes_pair'
                                                // | 'scramble_team' | 'modified_alt_shot_pair'

  // Declares the composition input it needs (e.g. pairings for alt-shot).
  compositionRequirement(): {
    requiresTeams: boolean
    teamSize?: { min: number; max: number }     // e.g. alt-shot: 2..2, scramble-4: 4..4
  }

  // If true, the compiler may dedupe balls across strategy instances when producer-set matches.
  // OwnBallPerPlayer → true (P1's own-ball exists once no matter how many slots reference it).
  // Team strategies → false (two AltShotPair instances with the same pair are two different balls).
  allowsProducerSetDedupe(): boolean

  // Produces balls with derived ball_CH. Pure — no DB access.
  // Each producer carries their own tee snapshot (mixed-tee rounds).
  create(input: {
    producers: {
      playerRef: PlayerRef
      handicapIndex: number
      gender?: 'M' | 'F'
      tee: TeeSnapshot                          // per-producer
      teeHoles: RoundTeeHoleSnapshot[]          // per-producer, 18 rows for that tee
    }[]
    composition?: { teams: { label: string; playerRefIds: string[] }[] }
    courseHoles: RoundCourseHoleSnapshot[]      // par + base SI, course-level
    derivationConfig: BallDerivationConfig
  }): {
    balls: {
      producerPlayerRefIds: string[]
      label?: string
      courseHandicapSnapshot: number            // ball_CH — derived from per-producer CHs
      perProducerCh: { playerRefId: string; ch: number }[]  // audit; always emitted
    }[]
  }
}

interface FormatStrategy {
  id: string                                    // 'stableford' | 'stroke_play' | 'match_play'
                                                // | 'better_ball' | 'taliban' | 'kopenhamnare' | 'umbrella' | …

  // Declares what ball shape this format can consume.
  ballRequirement(): {
    producerCount: { min: number; max: number } // 1..1 for own-ball, 2..2 for foursomes, 4..4 for scramble-4
    ballMode: 'own' | 'team' | 'any'
    requiresSlotTeamGrouping?: boolean          // true for better-ball / taliban
  }

  // Applies allowance to derived ball_CH → ball_PH. Pure.
  deriveSlotBalls(input: {
    balls: { ballId: string; courseHandicapSnapshot: number }[]
    allowanceConfig: FormatAllowanceConfig
  }): { ballId: string; playingHandicapSnapshot: number }[]

  // Scoring. Pure over frozen inputs. Does not touch players, indices, allowance.
  // Reads effective SI per (ball, producer, hole) via roundContext: producer's tee override
  // (round_tee_holes.stroke_index_override) falls back to base (round_course_holes.base_stroke_index).
  score(input: {
    roundContext: RoundContext                  // course holes + per-tee holes + per-producer tee snapshots
    slotBalls: SlotBall[]                       // derivation output, frozen
    slotTeamGroupings?: { teamLabel: string; ballIds: string[] }[]
    events: (ScoreEvent | MetadataEvent | SetupCorrectionEvent | AllowanceOverrideEvent | RulingEvent)[]
  }): StrategyResult

  // Optional: owns rendering, or delegates to shared render-lib.
  render?(result: StrategyResult): RenderedOutput
}
```

### Compatibility matrix (validated by the compiler)

| FormatStrategy | `ballRequirement().producerCount` | `ballMode` | `requiresSlotTeamGrouping` |
|---|---|---|---|
| Individual stableford / stroke / gross / umbrella | 1..1 | own | false |
| Match play singles | 1..1 | own | false |
| Köpenhamnare | 1..1 | own | false |
| Better-ball | 1..1 | own | true (2v2) |
| Taliban (2v2 better-ball variant) | 1..1 | own | true (2v2) |
| Foursomes / greensomes / alt-shot match | 2..2 | team | false |
| Scramble-2 | 2..2 | team | false |
| Scramble-4 | 4..4 | team | false |

### Round compiler and `RoundDefinition`

Admin input never writes `balls` / `ball_players` / `slot_balls` directly. The **compiler** is the single boundary: `RoundDefinition → validate → compile → persist`. All invariants, dedupe rules, compatibility checks, and human-readable diagnostics live here.

`RoundDefinition` is a persisted, versioned document — not just an in-memory DTO. Every compile writes the exact definition that produced the current outputs, so a later `setup_correction_event` has an authoritative source to mutate. Reconstructing a definition from normalized output tables is **not** supported; the definition is the source of truth.

Every node in `RoundDefinition` carries a **stable def-id** assigned at definition time. These ids survive recompile and are threaded into output tables as FKs (`ball_players.producer_def_id`, `round_ball_strategies.strategy_def_id`, `slots.slot_def_id`). Corrections target def-ids, never compiler-output row ids.

```ts
type RoundDefinition = {
  courseId: string
  playedAt: string
  producers: {
    id: string                                  // stable def-id → ball_players.producer_def_id
    playerRef: PlayerRef                        // { kind: 'player' | 'guest', id }
    handicapIndex: number
    gender?: 'M' | 'F'
    teeId: string                               // per-producer
    category?: string                           // drives tee/CH; snapshotted on ball_players
  }[]
  ballStrategies: {
    id: string                                  // stable def-id → round_ball_strategies.strategy_def_id
    strategyId: string                          // 'own_ball_per_player' | …
    derivationConfig: BallDerivationConfig
    composition?: { teams: { label: string; producerDefIds: string[] }[] }
  }[]
  slots: {
    id: string                                  // stable def-id → slots.slot_def_id
    formatId: string
    allowanceConfig: FormatAllowanceConfig
    ballSelector: { strategyDefIds?: string[]; producerDefIds?: string[] } // default: auto-match via ballRequirement
    teamGrouping?: { teams: { label: string; producerDefIds: string[] }[] }
  }[]
}

// Persisted alongside outputs. One row per compile; version chain preserves history.
round_definitions
  round_id, version,
  definition_json,                              -- full RoundDefinition at this version
  compiled_at, compiled_by,
  superseded_by?,                               -- next version
  source_kind,                                  -- 'initial' | 'setup_correction' | 'allowance_override'
  source_event_id?                              -- setup_correction_event.id or allowance_override_event.id
                                                -- (null for v1, the initial admin input)

interface RoundCompiler {
  compile(def: RoundDefinition): RoundCompileResult    // Either<Diagnostics, CompiledRound>
  persist(compiled: CompiledRound): Promise<RoundId>   // transactional write of all tables
}
```

Pipeline inside `compile`:

```
1. Validate definition shape; assign missing def-ids (first compile only).
2. Snapshot course/tees/holes:
   → rounds.course_name_snapshot, round_course_holes, round_tee_holes
   → per-producer tee + category snapshots prepared for ball_players rows
3. Run each BallCreationStrategy.create(producers, composition, derivationConfig, courseHoles)
   → candidate balls with per-producer CH; each ball tagged with strategy_def_id
4. Dedupe across strategy instances where allowsProducerSetDedupe() is true
5. Validate each slot against format.ballRequirement() — reject with diagnostics if mismatched
6. For each slot, run format.deriveSlotBalls(balls, allowanceConfig) → slot_balls rows
7. Persist atomically:
   → round_definitions (new version row with the exact input that produced these outputs)
   → rounds, round_course_holes, round_tee_holes, round_ball_strategies,
     balls, ball_players (with producer_def_id), slots (with slot_def_id),
     slot_balls, slot_ball_teams.
```

### Stable runtime ids across recompile

Compiler outputs **must** use deterministic content-addressed ids so that append-only events keep pointing at the right subject after a recompile:

```
balls.id       = hash(round_id, round_ball_strategy.strategy_def_id, sorted(producer_def_ids))
slots.id       = hash(round_id, slot_def_id)
slot_balls.(slot_id, ball_id)                                    -- deterministic from the above
round_ball_strategies.id = hash(round_id, strategy_def_id)
```

Because these ids are a pure function of stable def-ids + producer-def-id set, a recompile regenerates identical ids for any entity whose defining inputs are unchanged. Events (`score_event.ball_id`, `allowance_override_event.slot_def_id`, `ruling_event.target_id`, `metadata_event.ball_id`) remain valid without rewrite.

**Recompile semantics** (after a `setup_correction_event` or `allowance_override_event`):

1. Compile the new `RoundDefinition` version → new `CompiledRound`.
2. Diff new outputs vs current outputs by deterministic id:
   - **Unchanged rows** (same id, same content): no-op.
   - **Changed rows** (same id, different content — e.g. producer tee corrected, CH recomputed): upsert in place. All referring events stay valid.
   - **New rows** (id not in current): insert.
   - **Removed rows** (id in current, not in new — e.g. a producer was dropped, collapsing a ball): delete. Any events referencing a removed id are **not silently discarded** — they're retained in the event log (append-only is preserved) and surfaced as a diagnostic (`orphaned_events_after_correction`) on the new `round_definitions` version. Admin decides whether the correction is correct or whether the events need re-entry against a surviving ball.
3. Insert a new `round_definitions` row pointing at the triggering event.

This keeps the event log append-only, preserves all prior score events across corrections where the subject still exists, and makes destructive corrections auditable rather than silent.

Validation errors are structured: a rejected definition returns a list of diagnostics (which slot, which constraint, what's missing), never a half-persisted round.

### Event log (extends section 11)

Ball is the only score subject. Metadata gains optional producer attribution. Corrections are **typed, not a generic override bus**.

```
score_event              { round_id, ball_id, hole, strokes | null,
                           client_event_id (unique per round), recorded_by, recorded_at }

metadata_event           { round_id, ball_id, hole,
                           producer_player_id?,         -- XOR pair with producer_guest_player_id,
                           producer_guest_player_id?,   -- both null for ball-level metadata;
                                                        -- exactly one set for per-producer types
                                                        -- (gir/fir/putts in team-ball contexts,
                                                        -- including guest producers)
                           type: 'gir' | 'fir' | 'putts' | 'penalty' | ...,
                           value,
                           client_event_id, recorded_by, recorded_at }

setup_correction_event   { round_id,
                           -- Targets ONLY RoundDefinition-owned inputs. Compiler outputs
                           -- (balls, slot_balls, slot_ball_teams, ball_CH, etc.) are derived
                           -- and never targeted directly — they are recomputed when an input
                           -- changes.
                           target: 'producer_tee'            -- which tee a producer plays from
                                 | 'producer_handicap_index' -- the index used for CH derivation
                                 | 'producer_category'       -- category assignment feeding tee/CH
                                 | 'ball_composition'        -- add/remove/swap producers on a ball
                                 | 'slot_declaration'        -- slot's format + allowance + team grouping
                                 | 'ball_strategy_config',   -- ball creation strategy / derivation config
                           target_ref,                  -- ALL refs use stable RoundDefinition def-ids,
                                                        -- never compiler-output row ids. Shape by target:
                                                        -- producer_tee|producer_handicap_index|producer_category:
                                                        --   { producer_def_id }
                                                        -- ball_composition:
                                                        --   { strategy_def_id, team_label? }
                                                        -- slot_declaration:
                                                        --   { slot_def_id }
                                                        -- ball_strategy_config:
                                                        --   { strategy_def_id }
                           old_value, new_value, reason,
                           recorded_by, recorded_at }
                         -- Pre-finalization fix on RoundDefinition. Stored definition is
                         -- mutated; compiler re-runs from the changed input forward;
                         -- downstream outputs are recomputed, never touched directly.

allowance_override_event { round_id, slot_def_id,            -- stable def-id, not slot row id
                           old_config, new_config, reason,
                           recorded_by, recorded_at }
                         -- Folds into the RoundDefinition chain: writes a NEW round_definitions
                         -- version with only slots[slot_def_id].allowanceConfig changed,
                         -- source_kind='allowance_override' and source_event_id set. The
                         -- compiler diffs the new version;
                         -- when the only change is allowanceConfig on one slot, it fast-paths to
                         -- format.deriveSlotBalls on that slot, skipping ball re-derivation.
                         -- Single source of truth: RoundDefinition chain holds current effective
                         -- allowance; no split reconciliation against a separate override layer.

ruling_event             { round_id,
                           target: 'ball_hole' | 'ball_total' | 'slot_ball_result',
                           target_id,
                           kind: 'dq' | 'penalty_strokes' | 'hole_adjudication' | 'wd',
                           value,                       -- e.g. { strokes: +2 } or { disqualified: true }
                           reason, recorded_by, recorded_at }
                         -- Competitive ruling applied at scoring layer, does not re-derive.
```

Replay semantics:
- Later `score_event` wins per `(ball_id, hole)`.
- `setup_correction_event` mutates the stored `RoundDefinition` at the targeted input, then the compiler re-runs from that input forward — affected `balls` / `slot_balls` / `ball_players` / `slot_ball_teams` are recomputed as outputs. The event log retains both old and new input values; derived outputs are never written to directly.
- `allowance_override_event` writes a new `round_definitions` version (with only `slots[i].allowanceConfig` changed); compiler's diff recognises the narrow change and fast-paths `format.deriveSlotBalls` on the affected slot — ball CH untouched, all other slots untouched. After a later `setup_correction_event` triggers a full recompile, the allowance override is **preserved** because it lives in the definition chain, not a separate overlay.
- `ruling_event` is read by the format strategy during `score()` and applied as a scoring-layer adjustment. No re-derivation.

Three typed events, each with distinct semantics, preserve the composable model instead of becoming a generic mutation bus.

### Multi-format, multi-ball in one round

Covers the realistic extreme: 4 players in one group playing modified alt-shot (2 pairs, 2 team-balls finished per hole) AND all four playing own balls (4 own-balls per hole), across many format slots.

Balls declared per round:
```
B_P1, B_P2, B_P3, B_P4          -- own-balls, 1 producer each
B_pairA (P1, P2)                 -- alt-shot team-ball
B_pairB (P3, P4)                 -- alt-shot team-ball
```

Ball creation strategies declared on the round:
```
OwnBallPerPlayer(single)                       → B_P1, B_P2, B_P3, B_P4
AltShotPair(avg, pairings=[(P1,P2),(P3,P4)])   → B_pairA, B_pairB
```

Slots (partial):
| Slot | Format | Balls referenced | Slot grouping | Allowance |
|---|---|---|---|---|
| Alt-shot match (Pair A vs Pair B) | match-play | `B_pairA`, `B_pairB` | — | `flat(100)` |
| Individual stableford | stableford | `B_P1..B_P4` | — | `flat(95)` |
| Taliban (2v2 better-ball variant) | taliban | `B_P1..B_P4` | 2v2 (P1+P2 vs P3+P4) | `flat(90)` |
| Better-ball (pairs) | better-ball | `B_P1..B_P4` | 2v2 (same) | `flat(85)` |
| Köpenhamnare (P1,P2,P3) | köpenhamnare | `B_P1, B_P2, B_P3` | — | `flat(100)` |
| Individual gross | stroke-play | `B_P1..B_P4` | — | `flat(100)` |
| Umbrella | umbrella | `B_P1..B_P4` | — | `flat(100)` |

All seven slots consume the same events log (one `score_event` per ball per hole). No slot re-derives anything; they read their pre-computed `slot_balls` rows. Own-ball PH varies per slot (95% stableford vs 85% better-ball vs 90% taliban, all off the same `B_Pn.courseHandicapSnapshot`). Team-ball PH (`B_pairA`, `B_pairB`) comes from the foursomes avg-index derivation applied once at ball creation, then 100% match-play allowance.

### Player dashboard (guest-aware)

```sql
SELECT r.*
FROM rounds r
JOIN balls b ON b.round_id = r.id
JOIN ball_players bp ON bp.ball_id = b.id
WHERE bp.player_id = :playerId
  AND NOT EXISTS (SELECT 1 FROM players x WHERE x.id = bp.player_id AND x.deleted_at IS NOT NULL)
```

Works for solo and team rounds — a shared team-ball surfaces for each producer. Guest players (no `players.id`; `ball_players.guest_player_id` populated instead) correctly do not appear in any registered player's dashboard. If a guest later claims their rounds by creating an account, a one-time migration flips `ball_players` rows from `guest_player_id` to `player_id`.

### Open questions (specific to this section)

1. **Rendering ownership** — strategy produces structured result; render-lib formats. Settled unless round context can't carry what render-lib needs.
2. **Club house rules** — out of `FormatAllowanceConfig`. Admin sets explicit slot allowance; no implicit inheritance.
3. **Migration path** — `participants` + `participant_players` → `balls` + `ball_players` + `round_ball_strategies` + `slot_balls` + `slot_ball_teams` + `round_definitions` + `slots` (with def-ids). `allowance_pct` numeric → (a) explicit ball-creation-strategy per slot's existing team-shape and (b) `FormatAllowanceConfig` JSON on slot. Backfill must synthesize a v1 `round_definitions` row per existing round by reverse-engineering a declarative definition from the legacy participant shape (documented, lossy only where legacy data was already missing). Big one-shot migration.
4. **Mixed own-ball + team-ball physics** — structurally supported (kitchen-sink example). Score-entry UX (per-player vs per-team prompts per slot `ball_mode`) is a separate design task in the phase that ships the UI.
5. **Cross-round producer identity for guests** — a guest who later creates an account: one-time migration flips `ball_players.guest_player_id` → `player_id` for their historical rounds. `display_name_snapshot` stays frozen on each row (played as Anna G. vs current name Anna Gustafsson). Belongs in the guest-promotion phase, not here.

---

## 18. Naming Decisions

- **Round** is the core primitive. Context-free. All scoring logic targets Round.
- **FriendlyRound** wraps a Round for ad-hoc / casual play.
- **CompetitionRound** wraps a Round for formal competition play. One Competition has 1..N CompetitionRounds.
- **Competition** aggregates CompetitionRounds plus competition-wide config (format defaults, categories, point template, finalization, cut rules).
- **Tour** (individuals + fixed small partnerships) and **Series** (fixed teams) wrap Competition. Both keep their names — they are distinct shapes.
- **Do not introduce** "league" as a separate concept — it collapses into series.
- An individual player's 18 holes of play are represented by their **scorecard** within a Round, not called a "round" at that level to avoid ambiguity.
- Match-play brackets use **stage** for sub-phases, not "round", to avoid clashing with the Round entity.

---

*End of spec.*
