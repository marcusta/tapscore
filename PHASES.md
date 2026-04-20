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

Add scoring modes: stableford, match-play. Add team shapes: better-ball, foursomes (alternate-shot).

Exercise multi-format-slot round (2 singles + 2 alternate-shot, different participant scopes). Confirm strategy interface composes without conditional branches on wrapper type.

**HTML render expectations:**
- Scorecard shows the new rows each format needs (Stableford points per hole + total; match-play hole status like `1UP / AS / 2DN`).
- Per-participant card declares which slot they scored under (`slot #0 stableford × individual`, `slot #1 stroke_play × foursomes`) and the allowance.
- Leaderboard adds a `points` column (stableford) ranked high-to-low, and match-play results expressed as holes up / holes remaining per pair.
- Seeds: `stableford-round`, `match-play-round`, `multi-slot-series-round` (2 singles + 2 alternate-shot) — each renders cleanly and the numbers reconcile against a hand-drawn scorecard.

**Mandatory stop + hand-test + review.** If the strategy interface needs reshape, reshape it here, not after Phase 3 piles on FriendlyRound and CompetitionRound. Commit `phase 2.5 complete: strategy coverage`.

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
