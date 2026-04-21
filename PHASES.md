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
