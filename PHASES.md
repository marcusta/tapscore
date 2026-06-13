# tapscore phase plan

Authoritative rebuild plan. Each phase ends at a hand-test gate. New sessions pick up any phase by reading this file, `AGENTS.md`, and the spec section noted on the phase.

## How to resume in a new session

1. Read `AGENTS.md`.
2. Read `REWRITE_DOMAIN_SPEC.md` sections listed on the target phase.
3. Run `bun run check:server && bun run check:client && bun run check:test && bun test` — confirm prior phase still green.
4. `git log --oneline -10` — confirm last commit matches the phase-complete marker.
5. Start the phase. Stay inside its scope. Do not pull work forward from later phases.

When a phase finishes: commit with `phase N complete: <one-liner>`, update this file's status, stop for hand-test.

## Verification via HTML render (standing rule)

Every phase's gate includes an **HTML render** that shows the new entities and their computed views on a single static page, written to `tmp/` under the existing `scripts/render-all.ts` pipeline. The render is the primary hand-verification surface — tests prove the code runs, the render proves the *numbers are right* and the *shapes make sense to a human*.

What "include in the render" means in practice:
- **Data on the page.** Every new field the phase introduces — snapshots, wrapper-level metadata, computed totals, points, standings — must appear. If it's not on the page, the phase isn't verifiable.
- **Arithmetic, not just results.** When a value is computed (WHS handicap, points from a template, tour standings aggregation), show the computation inline (`"14 × 124/113 + (69.5 − 71) = 13.86 → 14"`), not only the output.
- **Real-world fidelity.** Match the shape of a real scorecard / leaderboard / standings page (OUT/IN/TOT, thru-N, position ties, projected vs official). User's mental model is the golf-industry norm.
- **Pre-made seeds cover the new ground.** Extend `scripts/seeds/` so the user can trigger a representative scenario with `bun run seed <name>` without hand-scripting. At minimum: one seed per new entity or leaderboard shape the phase adds.
- **Index page stays honest.** `tmp/index.html` (list of all rounds / competitions / tours, generated alongside) must surface the new wrapper type so it's discoverable.

The render is not cosmetic polish. A phase that passes all tests but can't be inspected by eye is not complete.

---

## Phase 0 — Scaffold ✅

**Spec:** none (infra only).

Backend-only skeleton mirroring `apps/starter`. Framework consumed via `file:../mackans-client-fw/core`. Pinned `hono@4.11.9`, `kysely@0.27.6`, `kysely-bun-sqlite@0.3.2`, `@sinclair/typebox@0.34.48` to match framework's installed versions.

Shipped:
- `package.json`, `tsconfig.json`, `tsconfig.server.json`, `tsconfig.test.json`
- `server/main.ts` composition root, `server/db/schema.ts`, `server/db/migrations/001_create_players.ts`, `server/db/seeds/players.ts`
- `server/services/index.ts`, `server/services/player.service.ts` (+ tests)
- `server/testing/db.ts`, `server/routes.test.ts`
- `AGENTS.md` + `CLAUDE.md` pointer
- scripts: `dev:server` (:3030), `check:server/client/test` (tsgo), `test`, `test:server`, `test:affected`

**Deferred to Phase 1 (not skipped — acknowledged):**
- First custom API descriptor (`server/api/*.api.ts`)
- `generate` script and first generated client (`src/api/*.gen.ts`)
- Route test that exercises the descriptor → codegen → typed client round-trip

Phase 1 picks these up as its first act, before any domain work.

---

## Phase 1 — Foundation ✅

**Spec:** §2 (Club, Course, Tee, Player, Handicap), §8 (Authorization — roles only stubbed here), §14 items 2, 4, 5.

### 1a. Close the protocol gap (first)

- Create `server/api/players.api.ts` exposing a minimal endpoint (e.g. `me` returning the current player). Auth via `requireAuth()`.
- Add `"generate": "bun ../mackans-client-fw/core/generate-api.ts"` to `package.json`.
- Run `bun run generate`; commit `src/api/players.gen.ts`.
- Create `src/api.ts` wiring `createPlayersClient('/api')`.
- Add a `routes.test.ts` case hitting the descriptor through the Hono app.

Gate: generate round-trip proven end-to-end before touching domain.

### 1b. Extend `players`

Migration adds: `display_name` (text, not null), `nickname` (text, nullable), `avatar_url` (text, nullable), `home_club_id` (FK, nullable), `handicap_index` (real, nullable).

`player.service.ts` output type widens. Update tests.

### 1c. `clubs`

- Migration: `id`, `name`, `location` (text, nullable), `logo_url` (text, nullable), `created_at`.
- `club.service.ts` with full CRUD (read + create + update + remove). Unique on name.
- Descriptor, generated client, tests.

### 1d. `courses` + `course_holes`

- `courses`: `id`, `club_id` (FK cascade), `name`, `hole_count` (integer: 9 or 18), `created_at`.
- `course_holes`: `course_id` (FK cascade), `hole_number`, `par`, `stroke_index`, primary key `(course_id, hole_number)`.
- `course.service.ts` owns the course table; holes accessed through it (single-table-per-service rule — holes are an inseparable part of a course, treat as the course's internal structure, not a standalone entity).
- Read returns `Course { id, clubId, name, holeCount, holes: Hole[] }`.

### 1e. `tees` + `tee_ratings`

- `tees`: `id`, `course_id` (FK cascade), `name`, `colour` (text, nullable), `created_at`.
- `tee_hole_lengths`: `tee_id` (FK cascade), `hole_number`, `length_m` (integer), `stroke_index_override` (integer, nullable). PK `(tee_id, hole_number)`.
- `tee_ratings`: `tee_id` (FK cascade), `gender` (text, `'M' | 'F'`), `course_rating` (real), `slope` (integer), `par` (integer), `total_length_m` (integer). PK `(tee_id, gender)`.
- `tee.service.ts` returns `Tee { id, courseId, name, colour, holeLengths: {hole: number, lengthM: number, strokeIndexOverride: number|null}[], ratings: {gender, courseRating, slope, par, totalLengthM}[] }`.

### 1f. `guest_players`

- Migration: `id`, `display_name`, `gender` (text), `handicap_index` (real, nullable), `created_at`.
- `guest_player.service.ts`: create, list, findById. No auth.
- Purpose: FriendlyRound participants without an account (Phase 3 will reference).

### 1g. `handicap_history`

- Append-only: `id`, `player_id` (FK), `handicap_index` (real), `source` (text: `'manual' | 'calculated' | 'import'`), `effective_date` (text), `entered_by_player_id` (FK, nullable), `created_at`.
- `handicap.service.ts`: `record(playerId, index, source, effectiveDate)`, `latestFor(playerId)`, `historyFor(playerId)`.
- `player.service.ts.register()` and the update path stay unchanged; handicap changes flow through `handicap.service.record()`.

### 1h. WHS calculator

- Pure TS utility: `courseHandicap(index, slope, courseRating, par)` → integer.
- Location: `server/domain/handicap.ts` (start a `domain/` folder for pure functions — no DB, no framework).
- Unit tests cover gender swaps and standard WHS examples.

### 1i. Role grants (stub)

- `role_grants`: `id`, `player_id` (FK), `role` (text: `'super_admin' | 'series_admin' | 'tour_admin' | 'competition_admin' | 'friendly_round_owner'`), `scope_type` (text, nullable), `scope_id` (text, nullable), `granted_at`.
- `role.service.ts`: `grant`, `revoke`, `listForPlayer`, `hasRole(playerId, role, scopeType?, scopeId?)`.
- No enforcement middleware yet — that arrives in Phase 4 (competition admin) and Phase 6/7 (tour/series admin). Stubbed early so later phases can query without a schema change.

### Gate

- `bun test`, all checks green.
- Manual: curl the descriptors for each entity; see types flow through generated clients.
- Commit: `phase 1 complete: foundation entities`.

---

## Phase 2 — Round primitive ✅

**Spec:** §3 (Round), §11 (event-log scorecard), §9 (snapshotting).

Tables:
- `rounds` — course_id, date, round_type, venue_type, start_list_mode, window_start, window_end, self_organize, status, latest_event_id.
- `participants` — round_id, team label, category_snapshot, tee_id_snapshot, handicap_index_snapshot, course_handicap_snapshot, playing_handicap_snapshot, is_locked, is_dq, admin_modified_by, admin_modified_at, admin_notes.
- `participant_players` junction — participant_id, player_id (nullable), guest_player_id (nullable), CHECK exactly one populated.
- `tee_times` — round_id, start_time, start_hole, capacity, hitting_bay (nullable).
- `round_format_slots` — round_id, slot_index, scoring_mode, team_shape, allowance_pct, scope_config (json, nullable).
- `score_events` — append-only: id, round_id, participant_id, hole, strokes (nullable), event_type, recorded_by_player_id, recorded_at, client_event_id. UNIQUE `(round_id, client_event_id)`.
- `scorecards` — materialised view, rebuilt from latest event per `(participant_id, hole)`. Kept as a table with trigger maintenance.

Services:
- `round.service.ts`
- `participant.service.ts`
- `score-event.service.ts` (append + idempotent replay from `client_event_id`)
- `scorecard.service.ts` (read + trigger-driven rebuild)

Domain:
- `format.ts` — strategy interface. First concrete: stroke-play × individual.
- `leaderboard.ts` — round-level leaderboard computation given scorecards + format slots.

Gate: create a round with 4 participants, push score events through descriptors, see leaderboard update, replay is deterministic. Commit `phase 2 complete: round primitive`.

---

## Phase 2.5 — Strategy stress test

**Spec:** §3 (format slots), §14 items 6, 7.

Goal: stress-test the format strategy interface across enough real scoring modes and team shapes that the shape won't buckle when Phase 3+ piles on wrappers. If the interface needs reshape, reshape here — a bent interface propagated through FriendlyRound/CompetitionRound is expensive to fix later.

Formats to deliver in 2.5 (each is its own sub-step with a gate: regen + checks + tests green + render refreshed and eyeballed before moving on):

- **Stableford × individual** — per-hole stableford points from par + strokes given. Pickup = 0 points that hole but total stays valid. Registers a new scoring mode (`stableford`) and a new scoring type (`points`, ranked high-to-low).
- **Match-play × individual** — pair-level format. Per-hole win/loss/halved status based on net scores. Output is pair-level (`"3 & 2"`, `"2 UP thru 14"`, `"AS"`), not participant-level.
- **Köpenhamnare × individual (3-player)** — Swedish stroke-play points game. Exactly 3 participants share 6 points per hole based on net ranking: 4 / 2 / 0 when all three differ; 4 / 1 / 1 when best is alone and the other two tie; 3 / 3 / 0 when two tie for best and one is worst; 2 / 2 / 2 when all three are equal. Running point total across holes. Two handicap modes, selectable per slot: (a) standard — each player gets their normal playing handicap, strokes distributed by SI; (b) delta-from-min — the two higher-handicap players get `(their_ph − min_ph)` strokes, the lowest-PH player plays at 0, strokes distributed by SI. First format that needs format-specific slot config beyond allowance (see below).
- **Stableford × better-ball** — 2-player teams, team points per hole = best of the pair's individual stableford points. Requires per-player event sourcing (see schema change below).
- **Stroke-play × foursomes (alternate-shot)** — 2-player teams play one ball → one scorecard per participant, no per-player sourcing needed. Allowance (typically 50%) lives in `round_format_slots.allowance_pct`; strategy is oblivious.
- **Taliban × better-ball** — 2v2 match-play variant. Per-hole comparison: first compare better-ball of each pair; if halved, compare worse-ball (best worse-ball wins); if still halved, hole is halved (0 points). Normal win = 1 point. Win on a gross birdie = 2 points. Win on a gross eagle by the pair currently *down* in the match = 5 points. Running match state across holes (so being 1 down and winning gives AS, winning with gross eagle while down gives you 4 up). Requires per-player event sourcing.
- **Umbrella × 4-ball (2v2)** — each hole has 5 accomplishment categories, each worth N points where N = hole number: (1) low individual gross in the foursome, (2) low 2-ball team total, (3) Player A GIR, (4) Player B GIR, (5) any team member gross birdie. If one team sweeps all 5 categories on a hole → points double ("umbrella"). Running point total across holes. Requires per-player event sourcing AND a supplemental per-hole data channel (at minimum GIR flag; see Open decisions).

### Schema changes this phase lands

1. **Per-player event sourcing (migration 013).** `score_events.source_player_id` (nullable FK → `players.id`, alternatively `guest_player_id`) and mirrored on `scorecards`. Individual formats leave it null. Team formats that need per-player data (better-ball, Taliban, Umbrella) populate it on every event. Trigger regenerates the scorecard preserving source.
   - Rationale: `participant_id` identifies the team; `source_player_id` identifies which player in the team took the stroke. This is the cleanest migration — alternatives (phantom per-player participants, JSON blob) have worse downstream cost.
   - Forward-only. Existing rows get null (individual formats only).

2. **Supplemental per-hole data (migration 014, Umbrella prerequisite).** Open decision — pick one before implementing Umbrella:
   - **(a)** `score_events.metadata` (JSON, nullable). Flexible, untyped, format reads what it needs. Easiest.
   - **(b)** Typed nullable columns: `reached_gir` (integer 0/1), `putts` (integer). Typed but schema bloats as formats demand more fields.
   - **(c)** Parallel `hole_shot_detail` table keyed by `(round_id, participant_id, hole, source_player_id)` with format-agnostic fields. Most normalised; most plumbing.

   Default to (a) unless a strong reason surfaces. Document choice in `score-event.service.ts` module comment and the implementer can switch if (a) proves fragile.

3. **Format-specific slot config (no migration — reuse `round_format_slots.scope_config`).** `scope_config` already exists as a nullable JSON blob, originally earmarked for participant scoping (`{participantIds: [...]}`). Widen its documented use to a two-key structure: `{ scope?: ..., config?: ... }`. Format strategies read `slot.scopeConfig?.config` for their own options — Köpenhamnare's `handicapMode: "standard" | "delta_from_min"`, Umbrella's `birdieRule: "gross" | "net"`, any future per-slot knob. Multi-slot routing reads `slot.scopeConfig?.scope`. One field, two concerns, JSON keeps them separable. Update the `FormatSlot` type in `round.service.ts` and note the shape in its doc comment.

### Interface reshape expectation

The current `FormatStrategy.compute(oneParticipant) → ParticipantResult` shape won't accommodate match-play (pair-level), Köpenhamnare (three-way per-hole ranking), Taliban (running pair state + cross-pair per-hole comparison), or Umbrella (all four players' hole data compared simultaneously for each of 5 categories). Probable reshape: `compute(slotInput) → SlotResult`, where `slotInput` carries every participant in the slot with per-hole data and the strategy internally decides whether to iterate per-participant, per-pair, per-trio, or per-hole-across-all. Simple formats (stroke-play, stableford individual, foursomes) internally loop per-participant and behave as today. Complex formats (match-play, Köpenhamnare, Taliban, Umbrella) run their full slot-level logic.

Reshape at step 2.5b (match-play) when the pressure first surfaces; Köpenhamnare at 2.5c validates the new shape on a non-pair multi-participant topology before schema migrations land. Taliban and Umbrella then pile on against the new shape and prove it. If the new shape cracks on any of them, reshape again — now, not in Phase 3.

### Sub-steps (commit gate at each)

- **2.5a.** Move `stroke-play × individual` under `server/domain/formats/`, re-export from `format.ts`. Add `stableford × individual`. Unit tests + render seed `stableford-round`.
- **2.5b.** Add `match-play × individual`. Reshape `FormatStrategy` interface as needed (document the new shape in `format.ts` module comment). Add a pair-level result type on `Leaderboard` (not a fake participant row). Render: scorecard gets `Status` row (`1UP`/`AS`/`2DN`); leaderboard section shows pair results (`Alice d. Bob, 3 & 2`) instead of a strokes table. Seed `match-play-round`.
- **2.5c.** Add `köpenhamnare × individual`. Widen `FormatSlot.scopeConfig` to `{scope?, config?}` and have the strategy read `config.handicapMode`. Strategy runs per-hole three-way ranking on net scores, distributes 6 points with the tie-handling rules (4-2-0 / 4-1-1 / 3-3-0 / 2-2-2). Implement both handicap modes (`standard` and `delta_from_min`); render surfaces which mode is active and shows the effective playing handicap per player alongside the snapshot. Seed `kopenhamnare-round` — 18 holes with at least one hole per tie topology (sole best, two-way tie for best, three-way tie) and exercises both handicap modes across two seeded rounds if the easier path is one seed per mode.
- **2.5d.** Migration 013 — `source_player_id` on `score_events` + `scorecards` + trigger. `score-event.service.ts` accepts and persists it; `scorecard.service.ts` exposes it on `ScorecardHole`. Existing tests untouched (null source for individual).
- **2.5e.** Add `stableford × better-ball`. Strategy reads per-player net per hole from the scorecard, picks team best. Render: scorecard shows both players' per-hole rows above the team Points row. Seed `better-ball-round`.
- **2.5f.** Add `stroke-play × foursomes`. Structurally a 2-player participant playing one ball, so the strategy is stroke-play but the participant has 2 player links. Render: card header lists both players. Seed `foursomes-round`.
- **2.5g.** Add `Taliban × better-ball` (scoring mode `taliban`). Strategy runs pair-vs-pair hole-by-hole with running match state, applying the birdie/eagle/down-team multipliers. Render: per-hole shows gross birdie/eagle badges, pair-level row shows running score, leaderboard shows pair points. Seed `taliban-round` — include at least one hole where eagle-while-down triggers +5, one where gross birdie wins, one halved on better-ball but decided on worse-ball.
- **2.5h.** Migration 014 — supplemental per-hole data channel (default: `score_events.metadata` JSON). `score-event.service.ts` accepts metadata; `ScorecardHole` exposes it. Add `umbrella × 4-ball`. Strategy computes 5 categories per hole × hole-number multiplier, detects sweep, applies double. Render: scorecard gets a category matrix per hole (LG / LT / GIR-A / GIR-B / BIRD) with sweep badge, leaderboard is cumulative team points. Seed `umbrella-round` — at least one umbrella (sweep) hole; one hole with split categories; one with net-vs-gross birdie ambiguity (document the chosen rule via `config.birdieRule`).
- **2.5i.** Multi-slot round. Update `leaderboard.service` to read `slot.scopeConfig?.scope` (`{participantIds: [...]}`) and route each participant to the matching slot (replaces the "every participant in slot 0" stub). Seed `multi-slot-series-round` — 2 singles + 2 foursomes, or mix with Taliban pairs / a Köpenhamnare trio if it illustrates scope well.
- **2.5j.** Render polish: `tmp/index.html` columns legibly summarise multi-slot (`stableford×individual@95% + stroke_play×foursomes@50%`), each per-participant card declares its slot + allowance (`slot #0 · stableford × individual · 95%`), inline arithmetic (stableford per hole, match-play hole status, Köpenhamnare point distribution per hole, Taliban multipliers, Umbrella category matrix with sweep math) present everywhere numbers are computed.
- **2.5k.** Interface review. Re-read `format.ts` top-to-bottom. Can you describe adding `skins × better-ball` in one sentence without opening the existing strategies? If yes, the interface passed. If no, reshape now. Update the module comment to reflect the final shape. If the shape differs from what this PHASES.md section describes, update this section too.

### HTML render expectations (applies across all sub-steps)

- Scorecard rows by format:
  - Stroke-play: Par, SI, Given, Gross, Net.
  - Stableford: + Points row.
  - Köpenhamnare: + per-hole Points row per player showing the 6-point distribution (`4 / 2 / 0`, `4 / 1 / 1`, etc.) with the tie topology annotated.
  - Match-play / Taliban: + Status row (hole result from this pair's perspective, e.g. `W+2` for Taliban birdie-win, `L` for loss, `AS` for half).
  - Umbrella: + category matrix row per hole (LG / LT / GIR-A / GIR-B / BIRD), with sweep badge when applicable.
- Per-participant card header declares slot index, format (`stableford × individual`), and allowance (`95%`). Köpenhamnare cards additionally declare `handicapMode` and the effective per-player playing handicap under that mode.
- Leaderboard:
  - Stroke-play/Stableford/Köpenhamnare/Umbrella: participant-level rows with total column for that scoring type.
  - Match-play/Taliban: pair-level section with result expressed in golf idiom (`Alice & Bob d. Carol & Dan, 3 & 2` for match; `Alice & Bob 7, Carol & Dan 4` for Taliban running points).
- Seeds (all idempotent): `stableford-round`, `match-play-round`, `kopenhamnare-round`, `better-ball-round`, `foursomes-round`, `taliban-round`, `umbrella-round`, `umbrella-individual-round`, `multi-slot-series-round`.
- Canonical fixture workflow: `bun run seed:formats` rebuilds a dedicated manual-fixture DB under `tmp/`; `bun run render:formats` re-seeds that DB and renders the complete manual fixture set deterministically into `tmp/formats/`.
- `tmp/index.html` format column surfaces multi-slot rounds legibly.

### Gate

- `bun run check:server && bun run check:client && bun run check:test && bun test` green.
- `bun run render:all`, open every rendered page, eyeball each format's card against a hand-drawn scorecard. Confirm: (1) each format reads like a real one for its kind, (2) match-play and Taliban expressed in golf idiom, (3) Köpenhamnare's 6 points always sum per hole and the tie topology matches the distribution, (4) Umbrella sweep visibly doubles, (5) multi-slot scope routes participants correctly, (6) inline arithmetic present for stableford points, match-play hole status, Köpenhamnare point distribution, Taliban multipliers, Umbrella category counts.
- Hand-test: create each format type via the scenario builder + curl, push events, verify leaderboard updates, verify replay determinism on the multi-slot round.

**Mandatory stop + hand-test + review.** Commit `phase 2.5 complete: strategy coverage`.

---

## Phase 2.6 — Round context, balls, and allowance config

**Spec:** §17 (Round Context and Format Strategies) — rewritten around **ball as atomic scoring unit**. Also revisits §3 (Round), §9 (Snapshotting), §11 (Event log).

### Why this phase exists

Phase 2.5 proved strategies work but exposed four structural gaps:

1. Per-format handicap rules (foursomes avg-index, greensomes weighted pair, scramble by-rank, four-ball per-player 85%) can't be expressed by flat `allowance_pct: number`. The foursomes avg-index fix lives in `scripts/scenario.ts` as seed glue, not in the API.
2. Hole-level scoring data (par, stroke index, length) is not snapshotted per round. A course rerating would silently rewrite history.
3. A multi-format round (same 4 players, 7 formats — stableford, umbrella, taliban, gross, singles match, köpenhamnare, better-ball) needs one event log feeding many strategies. Current participant-centric model can't express this cleanly.
4. The `participants` / `participant_players` model conflates "who plays" with "what gets scored." In alt-shot, scramble, greensomes the scored thing is a team-ball — one stroke per hole shared by N producers. Model should name that directly.

FriendlyRound (Phase 3) shares the Round engine — cleaning the contract now, not after.

### The model in one paragraph

A **ball** is the atomic scoring unit (1-producer = own-ball, 2+ producers = alt-shot / greensomes / scramble team-ball). Every score event targets a ball. A **slot** declares format + `allowance_config` + which balls it scores, with per-slot derived CH/PH per ball in `slot_balls`. Strategy = pure function over `(roundContext, slotBalls, events)`. Identity lives on live FKs (`ball_players.player_id` | `guest_player_id`, XOR). Scoring data frozen as snapshots. See §17 for full details including `allowance_config` shape, two-stage strategy contract (`deriveSlotBalls` + `score`), and the 4-player / 6-ball worked example.

### Migration strategy

The `participants` / `participant_players` / (draft) `slot_teams` tables collapse into `balls` / `ball_players` / `slot_balls`. This is a big migration — doing it in one slice would violate the phase discipline, so it splits as below. Each slice has own commit + hand-test gate. No partial states across sessions.

Split into four slices.

### 2.6a — Course/hole snapshot tables, soft-delete

Pure snapshot plumbing; no ball/participant refactor, no tee/rating snapshots yet (those are per-producer and land on `ball_players` in 2.6b).

- Migration: new `round_course_holes` table (`round_id`, `hole_number`, `par`, `base_stroke_index`) — 18 rows per round, course-level snapshot of `course_holes`. Written at migration time for rounds that exist; live write path lands in 2.6b.
- Migration: new `round_tee_holes` table (`round_id`, `tee_id`, `hole_number`, `length_m`, `stroke_index_override?`) — per-tee hole data (length always per-tee; SI override when the tee reorders difficulty). One row per tee-in-use per hole.
- Migration: `rounds` gains `course_name_snapshot` (frozen course identity for audit-grade rendering alongside the live `course_id` FK).
- Migration: `players.deleted_at` (soft-delete column, nullable datetime).
- Backfill from existing `rounds` + `courses` + `course_holes` + `tees` + `tee_hole_lengths` (existing per-tee length table). Extracted into `server/db/backfill/round-snapshots.ts` so a dev util can replay it post-seed for hand-verification without needing an old-schema fixture.
- Live FKs (`course_id`, `tee_id`, `home_club_id`) stay — snapshots sit alongside.
- Codegen via `bun run generate` (note: pre-existing breakage in the mackans codegen — non-blocking for 2.6a).
- **No behaviour change, no live write hooks.** Strategies still read live course/tee data. Rounds created between 2.6a and 2.6b have no snapshot rows — live capture moves to the RoundCompiler in 2.6b.
- Column-name note: existing tables use `hole_number`; the new tables follow suit so future joins line up. Spec prose earlier used `hole_no` casually — implementation follows codebase convention.

**Explicitly not in this slice (per reviewer feedback on mixed-tee reality):**
- No singular `rounds.tee_rating_snapshot` / `rounds.slope_snapshot` / `rounds.tee_par_snapshot`. Tee/rating is per-producer — lands on `ball_players` in 2.6b alongside the balls refactor.
- No live snapshot write hooks on round creation / participant add. RoundCompiler in 2.6b becomes the write boundary.

**HTML render expectations:**
- Round page header shows `course_name_snapshot` alongside the live course name when populated (diff visibility during transition); empty-state message when absent.
- `round_course_holes` snapshot visible as a small table (hole / par / base SI) when populated; explicit "no snapshot yet" copy otherwise, pointing at the dev backfill util.
- `round_tee_holes` snapshot visible per tee-in-use (tee / hole / length / SI override when present) when populated; empty-state copy otherwise.

**Hand-verification workflow (dev only, no prod data yet):**
1. `bun run reset:dev` → boot dev server (applies migrations; snapshot tables empty).
2. `bun run seed <names>` — create rounds on fresh schema.
3. `bun scripts/backfill-round-snapshots.ts` — simulates migration-time backfill against seeded rounds. Use `--reseed` to wipe-and-rewrite.
4. Render round pages — snapshot tables populated, empty-state copy gone.

**Gate:**
- Backfilled rounds render `course_name_snapshot`, `round_course_holes`, `round_tee_holes` correctly.
- Rounds created on fresh schema without backfill allowed to show no snapshot rows — live capture is a 2.6b responsibility.
- Existing seeds render identical scoring output to pre-phase (only expected markup diff: the three new snapshot surfaces).
- `bun run check:*` + `bun test` green.
- Commit: `phase 2.6a complete: course + hole snapshots, soft-delete`.

### 2.6b — Balls, per-producer tee snapshots, RoundCompiler, two strategy layers

The structural heart. Largest slice — if execution sprawls, split further mid-session and adjust this file.

**Schema migrations:**
- New `round_definitions` (`round_id`, `version`, `definition_json`, `compiled_at`, `compiled_by`, `superseded_by?`, `source_kind` (`initial` | `setup_correction` | `allowance_override`), `source_event_id?`). Versioned source-of-truth document written by the compiler on every compile. v1 is admin input; each `setup_correction_event` AND each `allowance_override_event` produces a new version row — single definition chain, no split between "base definition" and "overrides".
- New `round_ball_strategies` (`id`, `round_id`, `strategy_id`, `strategy_def_id`, `derivation_config` JSON, `composition` JSON). `strategy_def_id` is the stable id from `RoundDefinition.ballStrategies[].id` and survives recompile.
- New `balls` (`id`, `round_id`, `round_ball_strategy_id` FK, `label?`, `course_handicap_snapshot` (ball_CH), `per_producer_ch` JSON). Ball identity is `(round_id, round_ball_strategy_id, producer_set)`; producer-set dedupe is a strategy-declared optimization, not canonical identity.
- New `ball_players` (`ball_id`, `producer_def_id`, `player_id?`, `guest_player_id?` XOR; `display_name_snapshot`, `handicap_index_snapshot`, `category_snapshot`, `gender_snapshot`, `tee_id` FK (live), `tee_name_snapshot`, `course_rating_snapshot`, `slope_snapshot`, `tee_par_snapshot`, `course_handicap_snapshot`). `producer_def_id` is the stable id from `RoundDefinition.producers[].id`. **Per-producer tee + category + CH snapshots live here — not on `rounds`** — so mixed-tee/mixed-category rounds replay correctly.
- New `slots` (`id`, `round_id`, `slot_def_id`, `scoring_mode`, `team_shape`, `allowance_config` JSON, `ball_mode`). `slot_def_id` is the stable id from `RoundDefinition.slots[].id`. Replaces/extends existing `round_format_slots`.
- New `slot_balls` (`slot_id`, `ball_id`, `playing_handicap_snapshot`). **No duplicated `course_handicap_snapshot`** — read from `balls` via join.
- New `slot_ball_teams` (`slot_id`, `team_label`, `ball_id`) — for own-ball team formats (better-ball, taliban 2v2 grouping).
- Existing `round_format_slots` migrates into new `slots` table with `allowance_config` JSON (Typebox-validated `FormatAllowanceConfig`) replacing `allowance_pct`.
- Collapse `participants` + `participant_players` into `balls` + `ball_players` + `slot_balls`. Lossless backfill — every existing seed must replay identically.

**Mapping existing seeds during migration:**
- Singles slot with `allowance_pct: N` → declare `OwnBallPerPlayer(single)` on the round, slot gets `FormatAllowanceConfig: flat(N)`.
- Foursomes seed → declare `AltShotPair(avg)` with pairings from existing participant teams, slot gets `flat(50)`.
- Per-producer tee snapshots backfilled from the pre-phase participant's tee (if modelled) or the round's tee (pre-mixed-tee seeds).
- Document the mapping in migration comments.

**Strategy contracts (per §17):**

```ts
interface BallCreationStrategy {
  id: string
  compositionRequirement(): { requiresTeams: boolean; teamSize?: { min: number; max: number } }
  allowsProducerSetDedupe(): boolean                  // OwnBallPerPlayer→true, team strategies→false
  create(input: {
    producers: { playerRef, handicapIndex, gender?, tee: TeeSnapshot, teeHoles: RoundTeeHoleSnapshot[] }[]
    composition?, courseHoles: RoundCourseHoleSnapshot[], derivationConfig
  }): { balls: { producerPlayerRefIds, label?, courseHandicapSnapshot, perProducerCh }[] }
}

interface FormatStrategy {
  id: string
  ballRequirement(): { producerCount: { min, max }; ballMode: 'own'|'team'|'any'; requiresSlotTeamGrouping?: boolean }
  deriveSlotBalls(balls, allowanceConfig): { ballId, playingHandicapSnapshot }[]   // allowance only, no derivation
  score(roundContext, slotBalls, slotTeamGroupings?, events): StrategyResult       // events include typed corrections/rulings
}
```

Strategy inputs are per-producer (tee-aware). SI resolution in scoring: producer's `tee_id` → `round_tee_holes.stroke_index_override`, else `round_course_holes.base_stroke_index`.

**Concrete strategies in this slice (minimum to cover existing seeds):**
- Ball creation: `OwnBallPerPlayer` (single derivation, `allowsProducerSetDedupe=true`), `AltShotPair` (avg derivation, `allowsProducerSetDedupe=false`).
- Format: migrate `stroke-play-individual`, `stroke-play-foursomes`, `stableford`, `match-play`, `köpenhamnare`, `taliban` (2v2 own-ball variant), `umbrella`, `better-ball`. `deriveSlotBalls` only applies allowance; derivation moves to ball creation.
- The `avgTeamIndex` logic leaves `scripts/scenario.ts` and lives in `AltShotPair.create`.

**RoundCompiler (new, single persistence boundary per §17):**
- Implement `RoundCompiler.compile(RoundDefinition) → Either<Diagnostics, CompiledRound>` + `persist(CompiledRound)`.
- Admin input shape = `RoundDefinition` (declarative: producers with per-producer tees + categories + stable def-ids, ball strategies list with def-ids, slot list with def-ids + format + allowance + optional team grouping). **Every node carries a stable def-id** that survives recompile.
- Pipeline inside compile: (1) validate shape, assign def-ids on first compile; (2) snapshot course/tees/holes into `round_course_holes` + `round_tee_holes` + per-producer `ball_players` snapshots (tee + category + CH); (3) run each ball-creation strategy; (4) dedupe where `allowsProducerSetDedupe=true`; (5) validate each slot against `format.ballRequirement()` — structured diagnostics, never half-persisted; (6) `format.deriveSlotBalls` per slot; (7) atomic persist — **including a new `round_definitions` version row** alongside outputs.
- **Deterministic output ids:** `balls.id = hash(round_id, strategy_def_id, sorted(producer_def_ids))`, `slots.id = hash(round_id, slot_def_id)`, `round_ball_strategies.id = hash(round_id, strategy_def_id)`. Content-addressed so recompile regenerates identical ids for unchanged subjects — append-only events (`score_event.ball_id`, `allowance_override_event.slot_def_id`, `ruling_event.target_id`, `metadata_event.ball_id`) remain valid.
- **Recompile (setup correction or allowance override):** (1) compile new RoundDefinition; (2) diff outputs by deterministic id — unchanged rows no-op, changed rows upsert, new rows insert, removed rows delete; (3) insert new `round_definitions` version with `source_kind` + `source_event_id`. Allowance-override fast-path: when the diff shows only `slots[slot_def_id].allowanceConfig` changed, skip ball re-derivation and run `format.deriveSlotBalls` on that slot only.
- **Orphaned events:** events referencing a removed id are retained in the log (append-only preserved) and surfaced as an `orphaned_events_after_correction` diagnostic on the new `round_definitions` version. Admin resolves (accept correction as-is vs re-enter affected events).
- All services that previously wrote participants/slots directly now route through the compiler. `ParticipantService` deprecated → replaced by the compiler + `BallService` / `SlotBallService` as dumb recorders of compiler output.

**Event log (per §17 — typed, not generic):**
- `score_event` and `metadata_event` switch subject from participant to `ball_id`. Schema migration rewrites existing events.
- `metadata_event` gains optional XOR pair `producer_player_id` | `producer_guest_player_id` for per-producer metadata types (GIR/FIR/putts in team-ball contexts), matching the XOR identity pattern on `ball_players`. Both null for ball-level metadata; exactly one set for per-producer — supports guest producers losslessly.
- Replace the earlier single `override_event` with three typed events:
  - `setup_correction_event` — pre-finalization fix on `RoundDefinition` inputs only (producer tee, producer handicap index, producer category, ball composition, slot declaration, ball-strategy config). Never targets derived outputs. Mutates stored definition; compiler re-runs; outputs recomputed.
  - `allowance_override_event` — slot-level allowance change post-setup, keyed by `slot_def_id`. Folds into the `round_definitions` chain (new version, narrow diff); compiler fast-paths `format.deriveSlotBalls` only.
  - `ruling_event` — post-play competitive ruling (DQ, penalty strokes, hole adjudication). Read by strategy during `score()`, no re-derivation.

**HTML render expectations:**
- Round page shows declared ball creation strategies ("Ball creation: OwnBallPerPlayer + AltShotPair (P1+P2 vs P3+P4 avg-index)") with derivation arithmetic per team ball.
- Per-producer snapshot table: producer → tee + rating + slope + par + handicap_index + CH, visibly showing mixed-tee derivation when relevant.
- Slot header: format allowance ("Individual stableford, 95%"; "Foursomes alt-shot, 50%").
- Per-ball line: `ball_CH` (from ball creation) × format allowance = `ball_PH` — both stages visible, joined from `balls` + `slot_balls`.
- Ball producers listed per ball row: `display_name_snapshot` (audit) + live player link (navigation) when available.

### 2.6b-final — Registered format plugins + mobile client migration

Do this before 2.6c adds more formats. The ball model and new strategy contract are sound, but format identity and behaviour currently span two scoring engines, duplicated decomposition tables, a hardcoded client catalog, and format-specific render dispatch. Adding more formats before collapsing those paths would multiply the migration cost.

**Target:** a format is a source-level plugin. In production code, adding a normal format means adding one self-contained server module and one central registration entry. A format may also register one client adapter when its setup, score-entry, or results presentation cannot use the generic mobile surfaces. No compiler, leaderboard, persistence, API schema, generic client, or renderer switch is edited for an individual format.

**Acceptance test:** delete a format's module and registration entry. Every production trace of the format disappears. Restore them and the format appears in the catalog, can create a valid round, scores through the canonical engine, ranks correctly, and renders through either the generic client or its declared client adapter.

#### Execution ledger

This section is the canonical cross-session handoff for 2.6b-final. Update it before ending every implementation session.

Status values: `NOT STARTED` → `IN PROGRESS` → `BLOCKED` or `COMPLETE`.

**Resume here:** start **Slice 2b** — move the `scripts/render/*` pipeline onto the canonical `StrategyResult` + registered descriptor so it stops importing `server/domain/format.ts` / legacy scoring helpers and stops format-id dispatch (`isBallTaliban` etc). The leaderboard now scores through plugins (Slice 2a) and adapts back to the legacy `Leaderboard` shape in `server/domain/leaderboard-engine.ts` (`adaptSlotBallResults` remaps `team:<label>` → representative ball id; `mapWinner` maps pair winners) — 2b deletes that adapter glue by defining structured serializable result sections the static renderer consumes generically. Render currently still consumes the adapted legacy shape via `leaderboardService.forRound()` (`scripts/render/collect.ts`).

| Slice | Status | Commit | Resume note |
|---|---|---|---|
| Preflight — row-order fix | COMPLETE | `92872a6` | Preserves compiler insertion order for team balls |
| 1 — Extension contract | COMPLETE | `1ad9c0b` | Plugin contract + canonical registry + canary + arch ratchet; no production path changed |
| 2a — Canonical scoring | COMPLETE | `2016997` | Leaderboard scores through registered plugins; `leaderboard-engine.ts` materialises + adapts to legacy shape; `directionByType` gone |
| 2b — Static rendering | NOT STARTED | — | Render onto canonical StrategyResult; delete the `team:<label>`/winner adapter glue in `leaderboard-engine.ts` |
| 2c — Legacy deletion | NOT STARTED | — | Waits on Slice 2b |
| 3 — Slot persistence | NOT STARTED | — | Waits on Slice 2c |
| 4 — Compiler validation | NOT STARTED | — | Waits on Slice 3 |
| 5 — Catalog + planner | NOT STARTED | — | Waits on Slice 4 |
| 6 — Mobile wizard | NOT STARTED | — | Waits on Slice 5 |
| 7 — Mobile score entry | NOT STARTED | — | Waits on Slice 6 |
| 8 — Mobile results | NOT STARTED | — | Waits on Slice 7 |
| 9 — Deletion proof | NOT STARTED | — | Final acceptance slice |

Session update rules:

1. Set exactly one slice to `IN PROGRESS` while work is active.
2. Check an item only after its implementation and focused verification pass.
3. Mark the gate checkbox only after every item in the slice is checked.
4. Mark a slice `COMPLETE` only when its gate passes; record the commit hash.
5. Rewrite **Resume here** with the precise next file/test/problem before stopping.
6. Record blockers in the table's Resume note; do not hide partial work behind `COMPLETE`.

#### Plugin contract

Replace the current strategy-only registration with one authoritative server registration:

```ts
registerFormat({
  descriptor: {
    id: 'skins_better_ball',
    label: 'Better-ball skins',
    description: 'Each hole is worth one carried skin',
    scoringMode: 'skins',
    teamShape: 'better_ball',
    requirements: { /* balls, teams, counts, score-entry capabilities */ },
    defaults: { allowanceConfig: { type: 'flat', pct: 85 } },
    metrics: [{ id: 'skins', label: 'Skins', direction: 'high' }],
    clientAdapterId: null,
  },
  planSetup,
  validateConfig,
  deriveSlotBalls,
  score,
})
```

- `descriptor` is serializable and drives the server catalog plus generic mobile UI.
- `planSetup` translates a UI-level format selection into ball-creation needs, slot selection, team grouping, defaults, and format config. It does not persist.
- `validateConfig`, `deriveSlotBalls`, and `score` are pure server behaviour.
- `metrics` owns label + ranking direction; leaderboard code never guesses from a string.
- `clientAdapterId` is absent for generic formats. A specialised adapter is registered once in the client composition root and may contribute setup controls, score-entry controls, or results rendering.
- Duplicate format ids and missing declared client adapters fail loudly in tests/startup.
- Ball-creation strategies remain a separate registry because they are reusable across formats. A format's setup plan references them without reimplementing derivation.

Suggested locality:

```text
server/domain/formats/<format-id>/plugin.ts
server/domain/formats/<format-id>/plugin.test.ts
src/formats/<format-id>.adapter.ts       # optional
server/domain/formats/index.ts           # server registrations only
src/formats/index.ts                     # exceptional client adapters only
```

#### Slice 1 — Lock the extension contract with tests

- [x] Introduce `FormatPlugin`, `FormatDescriptor`, `FormatMetric`, setup-plan, and optional client-adapter contracts. → `server/domain/formats/plugin.ts` (`clientAdapterId` on the descriptor; the client-side adapter registry itself lands in Slice 6).
- [x] Add registry contract tests: unique ids, descriptor validity, metric validity, config validation, and deterministic listing. → `plugin.test.ts`.
- [x] Add a test-only canary plugin that uses a previously unknown format id and high-wins metric. Prove it registers, appears in the catalog, plans setup, compiles, scores, and ranks without editing infrastructure maps. → `_canary.testkit.ts` + `canary.test.ts` (full chain via the existing `compile()` + a throwaway materialiser).
- [x] Add an architecture test that forbids a second **format** registry and catches format-id decomposition tables outside the canonical registry. Explicitly allow the separate `strategies/ball-creation/` registry: it is a different seam whose adapters are reusable across formats and own derivation rather than scoring. → `architecture.test.ts` (shrinking allowlist; ball-creation registry not flagged).

- [x] **Gate:** contract tests red first, then green; no production scoring path changed yet. → all checks + `bun test` (409) green; only 5 new files added.

**Completion record:** commit `1ad9c0b` · verification `check:server/check:client/check:test + bun test all green (409 pass)` · handoff `Slice 2a — generalise the canary materialiser into the leaderboard; resolve plugins from the format registry`

#### Slice 2a — One canonical scoring engine

- [x] Make leaderboard materialisation build the new `RoundContext`, ordered `SlotBall[]`, team groupings, format config, and strategy events from compiler tables + the event log. → `server/domain/leaderboard-engine.ts` `materializeRound` (generalises `_canary.testkit.ts::materializeSlot`); `leaderboard.service.ts` reads `slots`/`slot_balls`/`slot_ball_teams`/`balls`/`ball_players` (rowid order) + replays `score_events` → `StrategyEvent[]`.
- [x] Resolve the registered plugin by `format_id` and call its `score()` implementation. The compiler and runtime must cross the same plugin interface. → `scoreRound(..., findFormatPlugin)`; built-ins registered as plugins in `server/domain/formats/builtins.ts` + `index.ts`.
- [x] Carry `formatId` and `slotDefId` through `StrategyResult`; do not recover identity from slot array position. → `format_id` recovered from the latest `round_definitions` JSON keyed by stable `slot_def_id`; `MaterializedSlot` carries `slotDefId`/`formatId`. `slotIndex` is only a presentation key (parsed from the def-id, not array position).
- [x] Move ranking direction into registered metrics and remove `directionByType`. → direction comes from `descriptor.metrics`; `leaderboard.ts` gutted to types-only; ratchet allowlist entry removed.
- [x] Migrate every existing built-in to this path and prove numeric parity. Keep the legacy engine temporarily for the static render pipeline only; no production service may call it after this slice. → all 10 built-ins are plugins; the engine adapts each `StrategyResult` back to the legacy `Leaderboard` shape (`adaptSlotBallResults` + `mapWinner`); no production service calls `findFormat`/`computeLeaderboard`; `seed:formats` + `render:formats` + `check:format-fixtures` still green.

- [x] **Gate:** service/API tests prove every built-in scores through the registered plugin; production services have exactly one scoring registry. Canonical fixture HTML may still use legacy result types until 2b. → `leaderboard.service.plugins.test.ts` scores all 10 built-ins through the service + proves a cleared registry fails loud (resolves from the ONE canonical registry); existing `leaderboard.service.test.ts` (13 cases) all green through the plugin path.

**Completion record:** commit `2016997` · verification `check:server/check:client/check:test + bun test all green (414 pass); seed:formats + render:formats + check:format-fixtures green` · handoff `Slice 2b — move scripts/render onto canonical StrategyResult; delete the leaderboard-engine adapter glue`

#### Slice 2b — Generic static fixture rendering

- [ ] Move the `scripts/render/*` pipeline onto the canonical `StrategyResult` and registered descriptor. It must not import `server/domain/format.ts`, legacy scoring helpers, or identify formats with switches such as `isBallTaliban`.
- [ ] Define structured, serializable result sections sufficient for the static verification pages: ranked metrics, ball hole tables, match/team comparisons, category matrices, derivation/allowance arithmetic, and strategy annotations.
- [ ] Make the static renderer generic over those sections. Format-specific arithmetic and golf idiom originate in the plugin's structured result, not in a parallel scoring implementation inside the renderer.
- [ ] Treat static HTML rendering as a first-class consumer of the plugin contract. It does not get a separate per-format registry or adapter mechanism; otherwise the acceptance test would merely move format coupling from the mobile client into `scripts/`.
- [ ] Preserve the standing hand-verification quality: match-play status, Taliban multipliers, Köpenhamnare topology, Umbrella categories, and handicap arithmetic must remain visible.

- [ ] **Gate:** `bun run seed:formats` + `bun run render:formats` produce complete pages from canonical plugin results only, with no legacy format imports or format-id dispatch in `scripts/render/`.

**Completion record:** commit `—` · verification `—` · handoff `—`

#### Slice 2c — Delete the legacy engine

- [ ] Delete `server/domain/format.ts`, `server/domain/formats/*`, their duplicate tests, and obsolete format-specific files under `scripts/render/scorecards/`.
- [ ] Move genuinely format-agnostic hole/course/result types into canonical modules rather than retaining the legacy file as a type barrel.
- [ ] Run the deletion test on one built-in: remove its plugin module + central registration and prove server build, generic fixture renderer, and generic mobile surfaces contain no residual import, switch branch, label, or scoring rule for it.

- [ ] **Gate:** repository search finds one format registry, one scoring implementation per format, and no format-specific static render dispatch.

**Completion record:** commit `—` · verification `—` · handoff `—`

#### Slice 3 — Canonical slot persistence and read model

- [ ] Add generic `format_id` and `format_config` columns to `slots`. No format-specific columns or tables.
- [ ] Read rounds and slots from `slots` / `slot_balls`, not `round_format_slots`.
- [ ] Return `formatId`, `slotDefId`, `allowanceConfig`, `formatConfig`, and `ballMode` in the Round read model.
- [ ] Remove both `FORMAT_ID_DECOMPOSITION` maps and stop reconstructing format identity from `(scoring_mode, team_shape)`.
- [ ] Keep `scoring_mode` and `team_shape` only as registry-derived query metadata if they remain useful; they are not lookup keys.
- [ ] Retire `round_format_slots` after fixture/backfill parity proves no read or write path depends on it.

- [ ] **Gate:** an unknown registered canary id round-trips through persistence without becoming `custom × custom`.

**Completion record:** commit `—` · verification `—` · handoff `—`

#### Slice 4 — Deepen compiler validation

- [ ] Make the compiler enforce the full registered requirement: producer count, slot ball count, ball mode, team count, team size, disjointness, coverage, selector references, and format-config schema.
- [ ] Implement requirement-based auto-selection when `ballSelector` is omitted; never default blindly to every ball in a mixed own-ball/team-ball round.
- [ ] Validate `deriveSlotBalls()` output is one-for-one with the selected balls and contains no unknown/duplicate ids.
- [ ] Return structured diagnostics with stable codes and paths. Plugin implementations may retain defensive checks, but invalid setup must normally stop at compile time.

- [ ] **Gate:** malformed 3+1 teams, overlapping teams, incompatible ball modes, unknown selector ids, and invalid config all fail before persistence.

**Completion record:** commit `—` · verification `—` · handoff `—`

#### Slice 5 — Catalog + server-side round setup planner

- [ ] Add authenticated `GET /formats` exposing registered serializable descriptors.
- [ ] Add a UI-level `RoundSetupDraft`: course/date, producers/tees, selected format ids, team assignments, allowance overrides, and format-specific config.
- [ ] Add a pure `RoundDefinitionBuilder` that asks each selected plugin's `planSetup` for its slot/ball needs, coalesces reusable ball-creation strategies, and emits the canonical `RoundDefinition`.
- [ ] The mobile API creates from `RoundSetupDraft`; direct `RoundDefinition` creation remains an internal/admin/testing interface.
- [ ] Return compiler diagnostics in a structured response the mobile wizard can attach to the relevant format/team/player control.

This keeps ball-strategy ids, derivation config, selectors, and dedupe rules out of the mobile client. The server remains the authority on what a format needs.

- [ ] **Gate:** mixed selections such as stableford + better-ball + foursomes produce one own-ball strategy plus the required pair-ball strategy without client conditionals.

**Completion record:** commit `—` · verification `—` · handoff `—`

#### Slice 6 — Migrate the mobile round wizard

- [ ] Replace `src/formats.ts`, `pairBall`, `needsTeams`, and client-side `RoundDefinition` construction with a `FormatCatalogService` backed by `GET /formats`.
- [ ] Render labels, descriptions, allowance defaults, participant bounds, and grouping requirements from descriptors.
- [ ] Replace the fixed A/B team editor with a generic team assignment editor driven by declared team count/size. Keep the touch-first mobile interaction.
- [ ] Generic setup controls cover common scalar/choice config. A plugin with unusual setup UI uses its optional client adapter.
- [ ] Submit `RoundSetupDraft`; display structured planner/compiler diagnostics inline.
- [ ] Round list and slot labels use `formatId` + catalog descriptor, with a robust id fallback for historical/unavailable plugins.

- [ ] **Gate:** create and reopen individual, own-ball team, team-ball, and multi-slot rounds entirely through the mobile UI.

**Completion record:** commit `—` · verification `—` · handoff `—`

#### Slice 7 — Migrate mobile score entry

- [ ] Treat the round's ball pool as the entry surface: one stroke entry per unique ball/hole, regardless of how many slots consume it.
- [ ] Group or label own-balls and team-balls clearly when a round contains both; never duplicate entry controls per format slot.
- [ ] Stop attaching producer source ids to ordinary own-ball score events after the canonical engine migration. Producer-specific metadata remains explicit metadata, not duplicated score rows.
- [ ] Add score-entry capabilities to the descriptor. Generic controls handle strokes plus simple boolean/number metadata; specialised interactions use the optional client adapter.
- [ ] Preserve optimistic entry and `client_event_id` idempotency. Isolate event transport in the score feature service so Phase 2.6d can replace embedded metadata with typed metadata events without rewriting components.

- [ ] **Gate:** the kitchen-sink topology can enter four own-balls plus two team-balls once each per hole, and every slot updates from that shared log.

**Completion record:** commit `—` · verification `—` · handoff `—`

#### Slice 8 — Migrate mobile results

- [ ] Replace the global `byScoringType + pairResults` presentation contract with ordered per-slot result views carrying `slotDefId`, `formatId`, descriptor label, and sections.
- [ ] Generic sections cover ranked metrics and match/team-vs-team summaries. A plugin may emit a typed custom payload only when generic sections cannot express its golf idiom.
- [ ] Build tabs from slots, not scalar metric buckets. This fixes pair-only match-play, which currently has no tab when it emits no scalar totals.
- [ ] The server ranks using each registered metric's direction. The client displays rankings; it never interprets scoring-type strings.
- [ ] Register specialised client results adapters only for formats whose presentation genuinely differs; unknown adapters fall back to a structured diagnostic view rather than hiding results.

- [ ] **Gate:** stroke-play, stableford, individual match-play, better-ball match-play, Köpenhamnare, Taliban, and Umbrella all render correctly on mobile; pair-only slots are visible.

**Completion record:** commit `—` · verification `—` · handoff `—`

#### Slice 9 — Deletion and extension proof

- [ ] Delete legacy client catalog/label maps, legacy scoring modules, decomposition maps, and format-specific generic render switches made obsolete by adapters.
- [ ] Keep canonical fixture workflow: `bun run seed:formats`, then `bun run render:formats` from the rebuilt fixture DB.
- [ ] Add client tests for catalog-driven setup, team validation, mixed topology, generic result sections, pair-only results, and missing-adapter fallback.
- [ ] Hand-test the mobile web app at narrow and wide viewport sizes for round creation → score entry → results.
- [ ] Perform the acceptance test with the canary plugin. Production infrastructure files must remain untouched beyond central registration; tests/fixture registration are expected proof, not runtime coupling.

**Final 2.6b gate:**
- [ ] `bun run check:server`, `check:client`, `check:test`, `bun test`, and format fixture checks green.
- [ ] All existing format outputs remain numerically identical.
- [ ] One canonical server registry; zero format decomposition maps.
- [ ] Generic formats require no client code.
- [ ] Special formats require at most one colocated client adapter + one client registration entry.
- [ ] Mobile wizard, score entry, and results consume plugin-driven contracts end-to-end.
- [ ] Commit: `phase 2.6b complete: registered format plugins + mobile client`.

**Completion record:** commit `—` · verification `—` · handoff `—`

### 2.6c — New ball-creation & format coverage + kitchen-sink multi-slot seed

Exercise the new shape on formats flat `allowance_pct` couldn't express, plus prove the multi-slot multi-ball model works end-to-end.

**New ball creation strategies:**
- `GreensomesPair` with `weighted(lowPct, highPct)` derivation.
- `ScrambleTeam` with `by_rank(chPcts[])` derivation — supports both 2-player `[35,15]` and 4-player `[25,20,15,10]` via composition.
- `ModifiedAltShotPair` — emits both own-balls AND alt-shot team-balls in one pass (kitchen-sink needs this so one round covers individual formats + alt-shot simultaneously).

**New format strategies:**
- `greensomes` (team-ball, 2..2).
- `scramble` (team-ball, 2..2 or 4..4).
- Four-ball better-ball already migrated in 2.6b as a format; seed with per-ball 85% allowance here.

**Seeds:**
- `greensomes-weighted-round` — uses `GreensomesPair(0.6, 0.4)` + `greensomes` format + `flat(100)`.
- `scramble-4-by-rank-round` — `ScrambleTeam(by_rank([25,20,15,10]))` + `scramble` format.
- `scramble-2-by-rank-round` — `ScrambleTeam(by_rank([35,15]))` + `scramble` format.
- `fourball-85-round` — `OwnBallPerPlayer` + `better-ball` format + `flat(85)` + 2v2 slot grouping.
- **Kitchen-sink:** `multi-format-extreme-round` — 4 players, ball creation strategies `[OwnBallPerPlayer(single), ModifiedAltShotPair(avg, pairings=[(P1,P2),(P3,P4)])]` produces 6 balls (4 own + 2 alt-shot). 7 slots: stableford (`flat(95)`), umbrella (`flat(100)`), taliban (2v2, `flat(90)`), individual gross (`flat(100)`), alt-shot match (`flat(100)`), köpenhamnare between 3 of 4 (`flat(100)`), better-ball (2v2, `flat(85)`). Proves one event log drives many strategies with per-slot PH correctness.
- **Mixed-tee:** `mixed-tee-round` — 2 men on yellow, 2 women on red, foursomes (1 mixed-tee pair + 1 same-tee pair). Each producer's CH derives from their own tee's rating/slope/par. Alt-shot team CH combines per-producer CHs from different tees. Proves per-producer tee snapshots work end-to-end (not just stored).

**Strategy tests per new shape (ball creation derivation + format scoring), including mixed-tee derivation test.**

**HTML render expectations:**
- Each new seed renders a full scorecard with inline arithmetic for the new derivation (greensomes weighted formula; scramble ranked order with per-player CH × pct).
- `multi-format-extreme-round` page:
  - Top: round-level ball creation strategy declarations with per-team-ball derivation arithmetic visible.
  - Middle: one events table per ball (6 columns, 18 rows) — the shared event log.
  - Bottom: 7 slot sections, each showing its ball subset + allowance line + `ball_PH` × hole strokes → result.
- Same 4 own-balls feed 5 of the 7 slots with different PHs per slot, visibly demonstrating the split.

**Gate:** new seeds + kitchen-sink render correct arithmetic; `bun test` includes new ball-creation + format + multi-slot tests. Commit `phase 2.6c complete: new strategies + multi-slot kitchen sink`.

### 2.6d — Typed corrections, soft-delete read path, player dashboard

Per §17, corrections are typed — three distinct events instead of one generic override bus.

- `setup_correction_event` — pre-finalization fix on `RoundDefinition` inputs only (wrong tee, wrong handicap index, wrong category, wrong ball composition, wrong slot declaration, wrong ball-strategy config). Targets: `producer_tee` | `producer_handicap_index` | `producer_category` | `ball_composition` | `slot_declaration` | `ball_strategy_config`. `target_ref` uses **stable def-ids only** (`producer_def_id`, `strategy_def_id`, `slot_def_id`), never compiler-output row ids. Derived outputs (`balls`, `slot_balls`, `slot_ball_teams`, ball CH, ball PH) are never targeted directly — the event mutates the latest `round_definitions` version into a new version, the compiler re-runs, and all downstream outputs are recomputed. Old + new input values retained in the event; the full definition chain is retained in `round_definitions`.
- `allowance_override_event` — slot-level allowance change post-setup, keyed by `slot_def_id` (stable). Writes a new `round_definitions` version with `source_kind='allowance_override'`; compiler diff recognises the narrow change and fast-paths `format.deriveSlotBalls` on that slot only. Ball CH untouched. Survives subsequent `setup_correction_event` recompiles because it lives in the definition chain, not a separate overlay.
- `ruling_event` — post-play competitive ruling (DQ, penalty strokes, hole adjudication, WD). Target: `ball_hole` | `ball_total` | `slot_ball_result`. Strategy reads during `score()` and applies as scoring-layer adjustment; no re-derivation.
- Read path honours `players.deleted_at`: dashboard queries filter soft-deleted out; historical scorecard rendering uses `ball_players.display_name_snapshot` (always populated), so deleted-player rounds still render with the played-as name. Live player navigation links only appear when the player is active.
- Player dashboard query + render: per §17 dashboard query, joining via `ball_players.player_id`.
- Hard-delete (GDPR): nulls PII on `players` row, keeps `id` + `deleted_at` tombstone for FK integrity; snapshot columns on `ball_players` unaffected.

**HTML render expectations:**
- Dashboard seed: `player-dashboard-listing` renders a player's round history (own-ball and team-ball rounds, with per-slot PH and finishing position per slot).
- Soft-delete seed: `soft-deleted-player-round` — historical round whose one producer is soft-deleted; render shows `display_name_snapshot` intact, no live link.
- Setup correction seed: `setup-correction-round` — round with a `setup_correction_event` changing a producer's tee (wrong tee assigned initially); render shows original CH derivation, correction event with reason, post-correction CH derivation, and downstream slot_balls all updated.
- Allowance override seed: `allowance-override-round` — slot's allowance changed post-setup (e.g. club decided 95% → 90% stableford after scores were entered); render shows original slot_balls PHs, override event, new `round_definitions` version (`source_kind='allowance_override'`), re-derived slot_balls, scoring recomputed.
- Override-then-correction seed: `allowance-override-then-setup-correction-round` — allowance override applied first, then a later `setup_correction_event` changes a producer's tee; render shows the override is preserved through the full recompile (final PHs reflect both the tee correction AND the earlier allowance override, proving single-source-of-truth reconciliation).
- Ruling seed: `ruling-applied-round` — round with a `ruling_event` adding +2 penalty strokes on a specific ball/hole; render shows raw strokes, ruling event, final adjusted total.

**Gate:** dashboard, soft-delete, all three typed correction flows render correctly by eye. Commit `phase 2.6d complete: typed corrections + soft-delete + dashboard`.

---

## Phase 3 — FriendlyRound

**Spec:** §4 (FriendlyRound).

- `friendly_rounds` 1:1 extension of `rounds`: round_id (FK unique), creator_player_id, share_token (unique), post_to_handicap (boolean).
- Share-token join flow: guest creates a `guest_player`, joins via token, reads scoped to the round.
- WHS posting: if `post_to_handicap`, a completed round writes to `handicap_history` via `handicap.service`.
- FriendlyRound leaderboard = Round leaderboard. No new engine.

**HTML render expectations:**
- Round page header shows the FriendlyRound wrapper metadata: creator, share token, `post_to_handicap` flag.
- If the round is completed and `post_to_handicap` is true, the post-round section shows the WHS entries that would/did get written to `handicap_history` per participant, with the arithmetic.
- Index page distinguishes friendly rounds from plain rounds (badge / column).
- Seed: `friendly-round-with-posting` — creator + guest join via share token, round completes, handicap history row appears.

**Mandatory stop + hand-test + review.** Commit `phase 3 complete: friendly round`.

---

## Phases 4–10 (high-level, planned in detail after Phase 3 review)

- **4. CompetitionRound + Competition** — 1:1 extension wrapping Round; Competition aggregates 1..N CompetitionRounds; default format slots, categories, cut rules, finalization snapshot.
- **5. PointTemplate + Category + Enrollment** — reusable point tables, per-tour categories with competition_category_tees mapping, enrollment lifecycle.
- **6. Tour** — individuals + fixed partnerships; player-level standings; tour documents.
- **7. Series** — fixed teams; team-level standings; team-to-series many-to-many; editable per-format-slot lineup.
- **8. Standings** — the four computed views (round leaderboard, competition leaderboard, competition results, tour/series standings) kept strictly separate; projected vs official.
- **9. Real-time** — added to `@basics/core` (framework change): WebSocket transport, cursor, client event queue, coalescing. Tapscore is the first consumer.
- **10. Documents, finalization audit, admin tooling, manual-import flow** — final production polish.

Plan each in detail at the start of its own session by expanding the corresponding section here. Each expansion **must** include an HTML render plan per the standing rule above — what the new wrapper / view / computation looks like on screen, and which seed(s) exercise it. Sketch the section contents (course/competition meta → participants → scorecards → leaderboard → standings → events / audit) so a future you knows what to render before starting the implementation.
