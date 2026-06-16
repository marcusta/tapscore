# tapscore phase plan

Authoritative rebuild plan. Each phase ends at a hand-test gate. New sessions pick up any phase by reading this file, `AGENTS.md`, and the spec section noted on the phase.

## How to resume in a new session

1. Read `AGENTS.md`.
2. Read `REWRITE_DOMAIN_SPEC.md` sections listed on the target phase.
3. Run `bun run check:server && bun run check:client && bun run check:test && bun test` — confirm prior phase still green.
4. `git log --oneline -10` — confirm last commit matches the phase-complete marker.
5. Start the phase. Stay inside its scope. Do not pull work forward from later phases.

When implementation finishes: run automated gates and generate the verification artifact. For visible work, set `AWAITING VISUAL VERIFY`, give the user one clickable link plus focused expected-value checks, and stop. After explicit approval, mark complete and commit the completion record as `phase N complete: <one-liner>`.

## Verification via HTML render (standing rule)

Every phase's gate includes an **HTML render** that shows the new entities and their computed views on a single static page, written to `tmp/` under the existing `scripts/render-all.ts` pipeline. The render is the primary hand-verification surface — tests prove the code runs, the render proves the *numbers are right* and the *shapes make sense to a human*.

**Verification-surface decision:** until the final mobile migration, the generated static pages are the authoritative human-verification UI. The current mobile web client is itself incomplete/broken and must not be used as evidence that a server/domain/static-render slice is correct. Mobile is repaired and migrated only after the server contracts, static renderer, route model, formats, and typed events are stable.

**Human visual gate workflow:**

1. For every slice that changes visible data, arithmetic, scoring, setup shape, or result shape, the agent runs the canonical seed/render workflow and generates a focused page or index under `tmp/`.
2. The agent's final response gives the user one primary clickable Markdown link with an absolute local path, for example `[Open Slice 2b verification](/Users/marcust/dev/github/tapscore/tmp/formats/slice-2b-verify.html)`.
3. **The verification page MUST be self-contained and auditable — this is the default, not an upgrade.** It embeds the *actual rendered content* (the real per-hole grids, footnotes, computed totals, leaderboards — produced by the real render pipeline) inline, in ONE file, so the user verifies the arithmetic by eye and never has to trust the agent's prose. Hard rules learned the hard way:
   - **No links to sibling files.** The user opens the page in a sandboxed preview panel that serves only that single file, so links to `round-*.html` resolve to blank pages. Inline the bodies of the relevant rendered pages into the verification page itself (strip the `<html>/<head>` wrapper, share one `<style>` block). Do not hand-write a high-level "summary" page whose numbers the user cannot check — that is worthless for verification.
   - **Generate it with a small reproducible script** (e.g. `scripts/render-<slice>-verify.ts`) that rebuilds the canonical fixture DB and selects the required rounds by **stable format signature**, never by the random round id of a prior render (ids change every render). Commit the script with the slice. Mention the regenerate command in the completion record.
   - **A green expected-value callout precedes each embedded fixture**, naming the exact section + expected total/status/arithmetic, so the user reads the claim and immediately sees the real grid under it to confirm.
4. Do not ask the user to run commands, start a server, copy a path, or search the output directory. The agent prepares the artifact; the user only clicks and inspects it in the browser.
5. Every visual handoff includes a concise **What to verify** brief, normally 2–5 items. Each item names the exact page/section, the behavior or arithmetic that changed, and the expected visible result. Call out the riskiest regression explicitly. Do not tell the user to inspect every page after every slice.
6. Separate the review scope into **Required checks** and, only when useful, **Optional regression spot-checks**. A full-catalog sweep is reserved for phase/final acceptance gates or a change with genuinely broad rendering impact.
7. A visually meaningful slice moves to `AWAITING VISUAL VERIFY` after automated checks and rendering pass. It becomes `COMPLETE` only after the user explicitly confirms the focused checks. Implementation may be committed before confirmation, followed by a small ledger/completion commit after approval.
8. Pure internal slices with no meaningful visual consequence may say `visual gate: not applicable` and complete on automated gates, but this must be explicit in their completion record.

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

Strategy inputs are per-producer and tee-aware. The current physical-hole SI lookup remains during 2.6b; Slice 3c moves scoring to occurrence-aware resolution: `(play_hole_id, producer tee)` override, then the played occurrence's frozen base SI.

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

### 2.6b-final — Registered format plugins + canonical static verification

Do this before 2.6c adds more formats. The ball model and new strategy contract are sound, but format identity and behaviour currently span two scoring engines, duplicated decomposition tables, a hardcoded client catalog, and format-specific render dispatch. Adding more formats before collapsing those paths would multiply the migration cost.

**Sequencing decision:** this section completes the server plugin model and generic static verification surface. Mobile implementation is intentionally deferred to **2.6e**, after 2.6c and 2.6d. The mobile client is not a verification dependency for any earlier slice.

**Target:** a format is a source-level plugin. In production code, adding a normal format means adding one self-contained server module and one central registration entry. A format may later register one client adapter when its setup, score-entry, or results presentation cannot use the generic mobile surfaces. No compiler, leaderboard, persistence, API schema, or static renderer switch is edited for an individual format.

**2.6b acceptance test:** delete a format's module and registration entry. Every server/static production trace of the format disappears. Restore them and the format appears in the catalog, can create a valid round, scores through the canonical engine, ranks correctly, and renders through the generic static pages. The full mobile deletion proof runs in 2.6e.

#### Execution ledger

This section is the canonical cross-session handoff for 2.6b-final. Update it before ending every implementation session.

Status values: `NOT STARTED` → `IN PROGRESS` → `AWAITING VISUAL VERIFY` → `COMPLETE` (or `BLOCKED`).

**Resume here:** **Phase 2.6d-final is COMPLETE** (commit `3c534e3` on `main`; verify page user-approved 2026-06-16) — core engine integrity + ADR closure landed on `main` (history fast-forwarded so main now carries the whole 2.6b→2.6e-M1 stack). **Next: resume 2.6e — mobile client (FriendlyRound-first, no-login on-course app); M1 server slice already landed.** E1 plugin-owned ball plans + real `validateConfig`; E2a per-tee occurrence SI reaches scoring; E2b `score_events.seq` total order (migration 030); E2c cross-round ownership trigger; E3 `slots.ordinal` opaque slot ids (migration 031); E4 generic correction/format-action endpoints (returning **structured diagnostics** for bad domain input) + allowance-only fast path. Gate green: **470 pass / 0 fail**, all three typechecks, **20** fixtures numerically identical, architecture ratchet extended + green. **Action: review `tmp/formats/slice-2.6d-final-verify.html` and approve, then commit `phase 2.6d-final complete: engine integrity + ADR closure`.** Only then may 2.6e resume. Full ledger in the `### 2.6d-final` section. Prior: **Phase 2.6d-bis was COMPLETE** — non-flat (split CH-band) allowance rulesets landed on branch `phase-2.6d-bis-allowance` (off `phase-2.6d-corrections`). `FormatAllowanceConfig` grew a `split` variant (per-CH-band percentages; `flat` stays default, additive — no migration); the shared derivation path is now `deriveAllowance` (dispatches flat/split, all 12 formats route through it); the compiler's `validateAllowanceConfig` rejects malformed split tables as structured diagnostics (`allowance_pct_out_of_range`, `allowance_band_bounds_invalid`, `allowance_band_no_catch_all`); `formatAllowanceLabel` gives renderers/leaderboard a split-aware label. Review feedback folded in: better-ball Stableford now emits per-producer own-ball results so the team card shows each player's Given/Gross/Points + Team points (= best of the two per hole) — data-driven via `hasPoints`, so umbrella/taliban cards are untouched. Fixture `split-allowance-better-ball-round` (signature `full_18|stableford:better_ball:split[9:100,*:75]`) proves per-ball PH 5/9/11/14 within one slot and that the high-CH partner's extra strokes win holes (Ivar&Jonas 40, Klas&Lukas 39). Gate green: **433 pass**, all typechecks, **20** format fixtures (19 flat numerically identical + 1 split), architecture ratchet green; visual gate `tmp/formats/slice-2.6d-bis-verify.html` user-approved 2026-06-14 (regenerate `bun scripts/render-slice-2.6d-bis-verify.ts`). **Next: 2.6d-final — Core engine integrity and ADR closure.** Mobile work in 2.6e remains blocked until that gate is complete. Per-language format-name i18n remains a deferred TODO folded into 2.6e M2. Prior: **Phase 2.6d COMPLETE for its original service/visual slice**, with the review-discovered contract and integrity gaps explicitly carried into 2.6d-final below. Prior: Phase 2.6c COMPLETE (commit `7650f24` + ledger `5456e98`).

**Phase 2.6d-final is COMPLETE** (commit `3c534e3` on `main`; ledger below). 2.6e (mobile client) is now unblocked. The canonical static fixtures (`seed:formats` + `render:formats` + `check:format-fixtures`, 20 rounds) remain the expected-result oracle.

Slice 5 — what landed (all on `slice-5-catalog-planner`):

- **`GET /formats`** (`server/api/formats.api.ts`, mounted in `main.ts` + the route test) returns the registered serializable `FormatDescriptor[]` straight from `formatCatalog()`; authenticated. Proof: `server/api/formats.routes.test.ts`.
- **`planSetup` per built-in** (`server/domain/formats/builtins.ts`): the throwing stubs are real. Derived from each descriptor's OWN ball requirement (no format-id table) — `ballMode:'team'`→`alt_shot_pair`/`avg` composed from teams; own-ball + `requiresSlotTeamGrouping`→shared `own_ball_per_player` + slot team grouping; plain own-ball→shared own-ball, no grouping. Missing teams are NOT an error here (the compiler surfaces `missing_composition`/`missing_team_grouping`). Proof: `builtins.planSetup.test.ts`.
- **Pure `RoundDefinitionBuilder` + `RoundSetupDraft`** (`server/domain/round-setup/{builder,draft}.ts`): a format-agnostic draft (no selectors / strategy ids / def-ids) → canonical `RoundDefinitionInput`. Calls each plugin's `planSetup`, COALESCES ball strategies via the ball-creation registry's `allowsProducerSetDedupe()` (OwnBallPerPlayer→one shared `strat-N`; pair strategies never coalesce), emits server-owned `ballSelector` (strategy def-ids + producer def-ids for a subset) + team grouping, stamps `strat-N`/`slot-N`. Builder-level problems (no formats, unknown format, off-roster producer) return structured `{code,message,path}` diagnostics; the rest defer to the compiler. Proof: `round-setup/builder.test.ts` (incl. the gate: stableford+better-ball+foursomes → 1 own-ball + 1 pair; compiles to 4 own + 2 pair across 3 slots).
- **Pure route compiler extracted** (`server/domain/compiler/route-compiler.ts`): `compileRoute()` owns itinerary + SI + policy + sections resolution. `normalize()` now calls it for the route part (then resolves producer-dependent playing groups) and re-exports `conventionalRouteHandicapPolicy`/`defaultRouteSections` from there. Behaviour-preserving — all compiler/itinerary tests + 13 fixtures unchanged.
- **Course route templates** (migration `026_create_course_route_templates`, schema `CourseRouteTemplatesTable`, `server/domain/course-route-template.ts`, `course-route-template.service.ts`, `api/course-route-templates.api.ts` mounted): named per-course route authoring docs validated through the SAME `compileRoute`. `resolveForRound()` resolves + FREEZES the template into explicit play-hole inputs (`parOverride`/`baseStrokeIndexOverride`) so later edits never rewrite history. Invalid routes return structured diagnostics (`RouteTemplateValidationError` → API `{ok:false,diagnostics}`). Authorization: requireAuth only (admin enforcement deferred to the authorization phase, same as clubs/courses). Proof: `course-route-template.service.test.ts`.
- **`createFromDraft`** (`round.service.ts`, `POST /rounds/from-draft`): mobile-facing. Resolves `route.templateId` (freeze), builds, compiles, persists; returns `{ok:true,round} | {ok:false,diagnostics}` (no 500 for ordinary invalid setup). `create()` (direct `RoundDefinition`) stays the internal/admin path via the shared private `compileAndPersist`. `resolveRouteTemplate` dep wired in the composition root. Proof: `round-from-draft.test.ts` + `api/round-setup.routes.test.ts`.

**Deferred / not in Slice 5 scope:** reference-resolution failures (course/tee/player not found) still throw rather than returning per-field diagnostics; finer template/round authorization; difficulty-SI *import* from a named external source (the draft just declares mode + sourceLabel + ranks). Slice 3c/4 deferrals below are unchanged.

Slice 4 — what landed:

- **Full requirement enforcement** in `server/domain/compiler/compile.ts` `compileSlot` + new `validateTeamGrouping`: ball mode (`ball_mode_violation`), topology (`unsupported_topology` — only `static` compiles; scheduled/dynamic are valid forward declarations reserved for 2.6d), team count (`team_count_below_min`/`above_max`), team size (`team_size_below_min`/`above_max`), disjointness (`overlapping_teams`, producer- AND ball-level), coverage (`ball_not_in_any_team`), selector references (`unknown_selector_strategy`/`unknown_selector_producer`), and format-config schema (each `plugin.validateConfig()` diagnostic surfaced at compile time). Existing `producer_count_violation` + `slot_ball_count_*` retained. `topology` field added to `FormatBallRequirement`.
- **Hole-segment schedules** validated by new pure `server/domain/compiler/hole-segments.ts` (`readHoleSegments` + `validateHoleSegments`): `invalid_segment_range`, `segment_range_out_of_bounds`, `segment_overlap` (gated by `allowSegmentOverlap`), `segment_unknown_ball`, `duplicate_segment_id`, plus `ambiguous_hole_coordinate` when a schedule is present but the descriptor declares no `holeCoordinate`. `HoleCoordinate` (`played_ordinal`|`canonical_ordinal`|`course_hole_number`) + `holeCoordinate`/`allowSegmentOverlap` added to `FormatRequirements`. No built-in carries a schedule; test plugins prove every path.
- **Requirement-based auto-selection:** `selectBallsForSlot`'s no-selector branch now filters by `ballMatchesRequirement` (ballMode + producerCount), never blindly all balls. Canonical fixtures always pass explicit selectors → output unchanged.
- **`deriveSlotBalls` one-for-one:** `derived_ball_unknown`/`_duplicate`/`_missing`. All new diagnostics carry stable `code` + slot-scoped `path`; a slot short-circuits before derive/row-emission when any `slots[<id>]` diagnostic exists (no half-persist).
- **Proof:** `server/domain/compiler/compile-validation.test.ts` (17 rejection-path tests). Not a visual-gate slice.
- **NOT in Slice 4 scope (still deferred):** scheduled/dynamic topology *materialisation* (Wolf/Sixes, 2.6d — Slice 4 only rejects them at compile time); the 3c-deferred items below (orphaned-events surfacing, per-occurrence-per-tee SI, the legacy bridge).

Slice 3c (live runtime state):

- **Events + scorecards:** migration `025` flips `score_events` + `scorecards` onto `play_hole_id` (FK→`round_play_holes(id)`, `ON DELETE RESTRICT`), backfilled from `round_play_holes.course_hole_number`; trigger + `scorecards_identity_unique` rekeyed to `(ball_id, play_hole_id, source_key)`; `(round_id, client_event_id)` idempotency unchanged. `ScoreEventService.append` takes `playHoleId`; API + generated client regenerated. `round.service.remove()` now deletes a round's `score_events` + its balls' `scorecards` BEFORE the round (the RESTRICT FK to `round_play_holes` would otherwise trip on the cascade).
- **Central allocation:** `strokesReceivedForStrokeIndex(playingHandicap, occurrenceStrokeIndex, allocationCycleSize)` in `server/domain/handicap.ts` is the SINGLE allocator — cycle-driven (never itinerary length), handles plus handicaps (give-back on highest SI) and PH > one cycle. No format reimplements it.
- **RoundContext:** one factory `server/domain/strategies/round-context.ts` (`createRoundContext`) builds occurrences + per-ball group rotation (`playedOrderForBall` / `playedOrdinalFor`) + `occurrenceLabel` (`3 (1st)`/`3 (2nd)`) + occurrence-keyed SI/par. Reused by `round-materializer.ts`, the strategy testkit, and the canary testkit. Fed from `round.playHoles`/`round.playingGroups` in `leaderboard.service.buildInput` (no new queries). `RoundContext` keeps a physical-hole reference API (`courseHoles`/`parFor`/`effectiveStrokeIndex`) for declared-coordinate rules.
- **Strategies + results:** `_shared` keys scores/metadata/strokes-given on `playHoleId`. Order-insensitive formats iterate `roundContext.playHoles` (canonical); match-play + better-ball-match iterate `playedOrderForBall`. Every result row carries `HoleIdentity` (playHoleId + courseHoleNumber + canonicalOrdinal + playedOrdinal + occurrenceLabel); `GridCell`/`HoleRef` carry `playHoleId`; the result-builder keys cells by `playHoleId`. `RoundResult` gained `routeSections` + `posting` (eligibility/reason).
- **round_type retired:** `leaderboard.service` scores over `round.playHoles` (no `courseHolesForRound`/`playedSet`); the renderer segments OUT/IN/TOT by `routeSections` and adds a route-summary section. `round_type` survives only as a `normalize` default-itinerary preset + display labels. Per-producer CH is still frozen in `resolveProducers` BEFORE ball creation.
- **Gate proof:** `server/services/itinerary-scoring.test.ts` (repeated-hole no-collision, sparse subset, 1..10,1..8 wrap, plus handicap, PH>cycle) + `server/domain/strategies/round-context.test.ts` (shotgun rotation, occurrence labels). 336 tests, all typechecks green, 13 canonical fixtures numerically identical. Visual: `scripts/render-slice-3c-verify.ts` → `tmp/formats/slice-3c-verify.html`.
- **Still deferred (NOT done in 3c):** `orphaned_events_after_correction` surfacing remains a stub in `persist.ts` (events now key on `play_hole_id`, so removing an occurrence with events would trip the RESTRICT FK rather than orphan-and-diagnose — wire this when setup-correction recompile lands, 2.6d). Per-occurrence per-tee SI overrides are structurally supported by `createRoundContext` but the live path always uses the occurrence base SI (`round_tee_holes` still backfill-only). `round_format_slots` + `createLegacy` + migration 019 + `tee_times` table + `synthesize-legacy.ts` remain the deprecated legacy bridge (physical drop deferred to the legacy-schema slice).

**Next:** start **Slice 5 — Catalog + server-side round setup planner** (branch off `slice-4-compiler-validation` once it merges, or off `main`). See the Slice 5 task list below. The `planSetup` stubs in `server/domain/formats/builtins.ts` (currently `throw`) land for real here.

| Slice | Status | Commit | Resume note |
|---|---|---|---|
| Preflight — row-order fix | COMPLETE | `92872a6` | Preserves compiler insertion order for team balls |
| 1 — Extension contract | COMPLETE | `1ad9c0b` | Plugin contract + canonical registry + canary + arch ratchet; no production path changed |
| 2a — Canonical scoring | COMPLETE | `2016997` | Leaderboard scores through registered plugins; `leaderboard-engine.ts` materialises + adapts to legacy shape; `directionByType` gone |
| 2b preflight — Köpenhamnare parity | COMPLETE | `6f447f7` | Rollup standings normalised to gap above last; per-hole 6-point distribution unchanged |
| 2b preflight — 3-player shared-log fixture | COMPLETE | `bb2a90e` | Stableford + Köpenhamnare + match play share one event log in canonical fixtures |
| 2b — Static rendering | COMPLETE | d43fec7 | Render consumes `resultForRound()` → serializable sections; gates green, 13 fixtures rendered; focused checks approved. Legacy `leaderboard-engine.ts` adapter + `forRound()` retained for API/mobile, removed in 2c |
| 2c — Legacy deletion | COMPLETE | d92a59a | Deleted domain/format.ts + domain/leaderboard.ts + 10 legacy strategy files + scoreRound adapter; materialiser → round-materializer.ts; forRound() retired, leaderboards API now serves RoundResult, mobile results stubbed (2.6e) |
| 3a — Slot persistence | COMPLETE | `c005633` | `slots` canonical (mig 021 format_id/format_config); compiler on plugin registry, registry-derived mode/shape; read model off `slots`; both FORMAT_ID_DECOMPOSITION maps gone + ratchet tightened; canary round-trips. round_format_slots table + createLegacy/backfill kept as deprecated bridge (physical drop deferred) |
| 3b — Hole itinerary persistence | COMPLETE | `6ce0945` | Migrations 022/023/024 (round_play_holes + round_play_tee_holes + playing_groups + backfill); RoundDefinitionInput→normalize→ResolvedRoundDefinition (resolved-v1); compiler builds itinerary + exhaustive/exclusive group membership; persist diff-upserts (reorder preserves ids); read model exposes playHoles/routeSi/policy/sections/playingGroups; tee_times live path retired (table kept as backfill source). 319 pass, all typechecks green; visual gate approved |
| 3c — Itinerary scoring migration | COMPLETE | `0fd1e92` | Migration 025 flips score_events/scorecards onto play_hole_id (trigger + unique index rekeyed, backfilled); central `strokesReceivedForStrokeIndex` allocator (cycle-driven, plus + PH>cycle); `createRoundContext` factory (occurrences + shotgun rotation + occurrence labels); all 10 built-ins iterate occurrences; result rows carry play-hole identity; round_type retired from scoring/render; renderer segments by routeSections. 336 tests pass, all typechecks green, 13 fixtures numerically identical; visual gate `tmp/formats/slice-3c-verify.html` (8 route scenarios) user-approved |
| 4 — Compiler validation | COMPLETE | `028c490` | All items + gate green on branch `slice-4-compiler-validation`; 353 pass (+17), 13 fixtures identical |
| 5 — Catalog + planner | COMPLETE | `2ed77ba` | On branch `slice-5-catalog-planner` (off slice 4). All items + gate green (376 pass, +23; 13 fixtures numerically identical). Visual gate `tmp/formats/slice-5-verify.html` (4 scenarios: mixed-format coalescing, producer subset, named template, custom difficulty-SI) user-approved 2026-06-13 |
| 6 — Static deletion proof | COMPLETE | `b8295ed` | CLOSES 2.6b. Deleted the parallel FormatStrategy registry seam (format-strategy.ts registry fns + strategies/formats/index.ts barrel + every `registerBuiltInFormatStrategies` call + `pluginAsFormatStrategy` bridge); ONE canonical registry remains. Architecture ratchet tightened to terminal state (1 registrar, 0 decomposition maps, new no-format-id-dispatch-under-scripts/render guard — all proven to bite via negative control). Canary acceptance reworked onto the plugin path. Automated gate green: 376 pass, all typechecks, 13 fixtures numerically identical. Visual gate `tmp/formats/slice-6-verify.html` user-approved 2026-06-14. Also this session: Köpenhamnare display label renamed → "Split sixes" (English; id `kopenhamnare_individual` unchanged); per-language format-name i18n recorded as a deferred TODO (see 2.6e block) |
| 2.6e — Mobile repair + migration | DEFERRED | — | Starts only after 2.6c and 2.6d are complete |

Session update rules:

1. Set exactly one slice to `IN PROGRESS` while work is active.
2. Check an item only after its implementation and focused verification pass.
3. Mark the gate checkbox only after every item in the slice is checked.
4. Mark a slice `COMPLETE` only when its gate passes; record the commit hash.
5. Rewrite **Resume here** with the precise next file/test/problem before stopping.
6. Record blockers in the table's Resume note; do not hide partial work behind `COMPLETE`.
7. For a visually meaningful slice, set `AWAITING VISUAL VERIFY`, render the artifact, and give the user one clickable absolute link plus a focused 2–5 item `What to verify` brief. Mark `COMPLETE` only after explicit human approval.

Visual-gate map for 2.6b-final:

| Slice | Human visual review | Focus |
|---|---|---|
| 2b — Static rendering | Required | New generic ranked/match sections; `multi-format-3p-round`; one complex category format; one pair-only format |
| 2c — Legacy deletion | Not normally required | Automated/static regression only; output should be unchanged |
| 3a — Slot persistence | Not normally required | Automated round-trip regression; no intended visible change |
| 3b — Itinerary persistence | Required | Route summary, repeated occurrence identity, group starts, SI provenance/policy |
| 3c — Itinerary scoring | Required | Repeated-hole scoring, custom SI stroke allocation, shotgun played order, route-derived totals |
| 4 — Compiler validation | Not normally required | Structured diagnostic tests; render only if diagnostics gain a user-facing page |
| 5 — Catalog + planner | Required | Focused static setup-plan page showing descriptor → draft → compiled definition for mixed formats/routes |
| 6 — Static deletion proof | Required milestone | Agent selects the small high-risk subset; full catalog remains available but is not automatically assigned to the user |

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
- **Stateful format actions are a reserved plugin capability, implemented in 2.6d.** Formats such as Wolf need append-only in-round decisions (rotating Wolf, partner selection, Lone Wolf declaration) that are neither strokes, metadata, setup corrections, nor rulings. The plugin contract may therefore declare action descriptors/schemas and consume replayed actions during `score()`. The generic persistence envelope, idempotent append API, replay rules, and mobile adapter transport land with the typed event work in 2.6d — not as Wolf-specific schema and not during the current renderer migration.

#### Format pressure survey (2026-06-13)

Pressure-tested against [GOLF+ games for friends](https://blog.golfplusvr.com/golf-games-to-play-with-friends/), [Golf GameBook Irish Rumble](https://support.golfgamebook.com/hc/en-us/articles/360002291314-Irish-Rumble), and [Wikipedia's variations of golf](https://en.wikipedia.org/wiki/Variations_of_golf). The one-plugin direction still holds, but the contract must cover these capabilities before claiming broad format extensibility:

| Capability | Formats exposing it | Architectural response |
|---|---|---|
| Played order, distinct from printed hole number | Irish Rumble in a shotgun start, Wolf rotation, carried skins | The Round persists an ordered play-hole itinerary; each playing group may rotate it from any start entry. Scoring receives both stable play-hole identity and group-relative played ordinal. |
| Hole-segment schedules | Irish Rumble 1/2/3/all counting scores, Nassau front/back/overall, Patsome format changes, Sixes partner rotations | Keep a plugin-validated schedule in `formatConfig`; each segment declares whether it addresses played ordinals or course hole numbers. Expose generic range/segment setup controls and structured segment results. |
| Static, scheduled, and dynamic team topology | Fixed four-ball, Sixes/Round Robin, Wolf | Declare topology mode in requirements. Compile static/scheduled assignments; replay dynamic assignments from format actions. |
| Ordered decisions within a hole | Wolf partner choice, scramble selected shot, Chapman/greensomes ball choice, Bingo Bango Bongo first/closest/first-out | Format actions carry stable ordering and subject references within a hole; the plugin validates the state transition. Do not add one table per game. |
| Variable counting/contributing scores | Best ball, Low Ball/High Ball, Bowmaker, Irish Rumble | Structured results identify which scores contributed, rather than returning only the final team number. |
| Awards, carryovers, possession, and transfers | Dots/Garbage, Skins, Snake, Nines, Acey Deucey, Sandies/Barkies/Arnies | Result sections support category awards, carry pools, state/possession, and abstract point/unit transfers. Money settlement stays outside the scoring core. |
| Repeatable/configurable rules | Modified Stableford point tables, Dots achievement catalogs, Texas scramble minimum drives | Descriptor config schemas and the setup planner support repeatable tables/lists, with a client adapter only when generic controls are insufficient. |
| Multiple games over the same play | Nassau or side games layered over stroke/match play | Model them as independent slots consuming the same balls/events. Reuse internal scoring helpers, but do not create runtime plugin nesting or another registry. |

**Round routing decision:** `round_play_holes` is the source of truth for which holes count and in what canonical order. Each row has a stable `play_hole_def_id`/runtime id, ordinal, course hole number, and frozen occurrence-level par/SI; repeated course holes are valid (for example a 10-hole course routed as `1..10,1..8`). Occurrence values default from the physical hole but can differ on a later loop when the route's scorecard requires it. A playing group references any itinerary entry as its start and receives a rotated played order. Hole-scoped events target the stable play-hole id, never raw course hole number. `full_18`, `front_9`, and `back_9` become setup presets that generate an itinerary; arbitrary ordered subsets are equally valid. This supports conventional starts, full shotgun starts, wrapped rounds, start-anywhere/end-anywhere routes, repeated partial loops, and selected subsets with one model.

**Fidelity boundary:** a score-only scramble can remain one team ball with one hole total. Enforcing shot-selection rules (Florida exclusion, Texas minimum drives, Chapman/greensomes choice) requires ordered format actions. That is still plugin-owned state, not a universal shot-tracking schema. A full shot-by-shot model is deferred until a product requirement needs lie, club, distance, or every attempted shot beyond format decisions.

Suggested locality:

```text
server/domain/formats/<format-id>/plugin.ts
server/domain/formats/<format-id>/plugin.test.ts
src/formats/<format-id>.adapter.ts       # optional
server/domain/formats/index.ts           # server registrations only
src/formats/index.ts                     # exceptional client adapters only
```

#### Slice 1 — Lock the extension contract with tests

- [x] Introduce `FormatPlugin`, `FormatDescriptor`, `FormatMetric`, setup-plan, and optional client-adapter contracts. → `server/domain/formats/plugin.ts` (`clientAdapterId` on the descriptor; the client-side adapter registry itself lands in 2.6e).
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

#### Slice 2b preflight — Hand-test corrections and coverage fixture

- [x] Correct Köpenhamnare rollups to the established match-style convention: subtract the lowest decided cumulative total so last place is 0 and the others show their gap above last. Preserve raw per-hole 6-point distributions and null totals for players with no decided hole. → `6f447f7`.
- [x] Add `multi-format-3p-round` to the canonical manual-format fixtures. Three own-balls and one shared score-event log feed Stableford, Köpenhamnare, and individual match play; the odd third match-play ball remains explicitly unpaired. → `bb2a90e`.
- [x] Rebuild and render the dedicated fixture database after both commits. → 13 rounds under `tmp/formats/`; `check:format-fixtures` green.

- [x] **Gate:** focused Köpenhamnare tests, all type checks, full suite, and canonical fixture workflow are green. → `check:server`, `check:client`, `check:test`; `bun test` 415 pass / 0 fail; `seed:formats`, `render:formats`, `check:format-fixtures` green on 2026-06-13.

**Completion record:** commits `6f447f7`, `bb2a90e` · verification `415 tests + 13 canonical fixture rounds green` · handoff `Slice 2b result contract: metricless descriptors + ordered serializable sections, then generic ranked/match rendering against multi-format-3p-round`

#### Slice 2b — Generic static fixture rendering

- [x] Move the `scripts/render/*` pipeline onto the canonical `StrategyResult` and registered descriptor. It must not import `server/domain/format.ts`, legacy scoring helpers, or identify formats with switches such as `isBallTaliban`. → render consumes `leaderboardService.resultForRound()` → `RoundResult` sections; `domain/format.ts` / `domain/leaderboard.ts` imports and all `isBall*` / `scoringMode===` classifiers removed from `scripts/render/`. Slot labels come from the descriptor catalog (`formatCatalog()`), not a switch.
- [x] Amend the result contract so ranked metrics are optional rather than forcing a nominal metric onto pair/state-only games. → `assertValidDescriptor` accepts `metrics: []`; match-play + match-play-better-ball + taliban now declare zero metrics and render a match-summary section with no ranked column.
- [x] Define structured, serializable result sections. → `server/domain/strategies/result-sections.ts`: `ScoreGridSection` (covers individual / pair / team-aggregate / category cards), `RankedSection`, `MatchSummarySection`, assembled by the pure `result-builder.ts`. Covers every current fixture (ranked metrics, ball hole tables, match/team comparisons, category/award matrices via per-hole notes, derivation/allowance + strategy annotations). Forward-looking kinds with no current fixture (segment summaries, contributing-score traces as a distinct section, carry pools, state/possession, abstract point transfers) are intentionally deferred to the slice that first exercises them — the union is additive.
- [x] Make hole-addressed section rows structurally ready for stable `playHoleId`. → grid columns are a `HoleRef` struct (`{ holeNumber }`), extensible without changing row identity; documented in `result-sections.ts`.
- [x] Make the static renderer generic over those sections. → `scripts/render/sections/result.ts` lays out grids/ranked/match with zero format knowledge; all arithmetic + golf idiom originate in `result-builder.ts` (domain), the only presentation arithmetic being `given = gross − net` and normalised running, both data-gated.
- [x] Treat static HTML rendering as a first-class consumer of the plugin contract. → no per-format render registry or adapter; the renderer reads descriptors + sections only.
- [x] Preserve the standing hand-verification quality. → match-play `Status`/`Match` rows, Taliban standalone summary + `W+n` badges, Köpenhamnare 6-point topology footnotes, Umbrella category math + sweep ☂ + normalised running, and per-hole handicap (Given/Net) all remain visible (verified in rendered pages).

- [x] **Gate:** `bun run seed:formats` + `bun run render:formats` produce complete pages from canonical plugin results only, with no legacy format imports or format-id dispatch in `scripts/render/`. → 13 rounds rendered; `check:server/client/test` + `bun test` (414) + `check:format-fixtures` green; repository grep over `scripts/render/` finds no `domain/format`/`domain/leaderboard` import and no format-id dispatch.
- [x] **Human visual gate:** focused Slice 2b page generated at `tmp/formats/slice-2b-verify.html` via `bun scripts/render-slice-2b-verify.ts` — SELF-CONTAINED: it embeds the three required rounds' actual rendered scorecards + leaderboards inline (every per-hole grid auditable by eye, no external links), each preceded by an expected-value callout. Status set to `AWAITING VISUAL VERIFY`. Required checks: shared-log slot separation on `multi-format-3p-round` (Stableford 37/31/23, Köpenhamnare 35/22/0, match Alice d. Bob 7 & 5), pair-only `match-play-round` (match-summary only, no ranked metric; Alice d. Bob 3 & 2), and `umbrella-round` 4-ball category/running (Carol & Dan 70 / Alice & Bob 0, sweep ☂). Awaiting human confirmation.

**Completion record:** commit `d43fec7` · verification `check:server/client/test + bun test (414 pass) + seed:formats/render:formats/check:format-fixtures (13 rounds) green; no legacy format imports or format-id dispatch in scripts/render/` · visual verification `tmp/formats/slice-2b-verify.html (self-contained, real embedded scorecards) — three focused checks approved by user 2026-06-13` · handoff `Slice 2c deletes the legacy engine (domain/format.ts, server/domain/formats/* strategies) + the leaderboard-engine adapter + forRound()`

#### Slice 2c — Delete the legacy engine

- [x] Delete `server/domain/format.ts`, `server/domain/formats/*`, their duplicate tests, and obsolete format-specific files under `scripts/render/scorecards/`. → Deleted `domain/format.ts`, `domain/leaderboard.ts`, the 10 legacy strategy files + their `_*-scoring.ts`/`_match-play-handicap.ts` helpers + duplicate tests under `server/domain/formats/`. Gutted the `scoreRound`→`Leaderboard` adapter (`adaptSlotBallResults`/`mapWinner`/`rankEntries`) out of `leaderboard-engine.ts`, renamed the surviving canonical materialiser to `server/domain/round-materializer.ts`. `scripts/render/scorecards/` no longer exists (retired in 2b). Kept the canonical plugin registry (`formats/plugin.ts`/`builtins.ts`/`index.ts`/`_canary.testkit.ts` + tests) and all of `strategies/*`.
- [x] Move genuinely format-agnostic hole/course/result types into canonical modules rather than retaining the legacy file as a type barrel. → `CourseHole` moved to `server/domain/round-holes.ts`; the result shapes already lived in `strategies/types.ts` + `strategies/result-sections.ts`. No legacy type barrel remains.
- [x] Run the deletion test on one built-in: remove its plugin module + central registration and prove server build and generic fixture renderer contain no residual import, switch branch, label, or scoring rule for it. Mobile proof is deferred to 2.6e. → Removed `taliban_better_ball` (strategy module + both registrations). `check:server` compiled; `scripts/render/` had zero residual import/switch/label/scoring-rule (only a prose comment); the only infra references left were the `FORMAT_ID_DECOMPOSITION`/legacy-synth maps in `compile.ts`/`synthesize-legacy.ts` already ratchet-tracked for Slice 3. Restored.

- [x] **Gate:** repository search finds one format registry, one scoring implementation per format, and no format-specific static render dispatch. → One format catalog registry (`formats/plugin.ts`; the compiler-facing `strategies/format-strategy.ts` is the reusable strategy seam, not a second catalog — folded onto the plugin registry in Slice 3). One scoring implementation per format (legacy duplicates gone). No legacy-module imports anywhere; `scripts/render/` carries no format-id dispatch. `forRound()` + the legacy `Leaderboard` shape retired — the leaderboards API now serves canonical `RoundResult`; mobile results reduced to a compile-only placeholder (rebuilt in 2.6e M4). Architecture ratchet (3 tests) green.

**Completion record:** commit `d92a59a` · verification `check:server/client/test + bun test (309 pass) + seed:formats/render:formats/check:format-fixtures (13 rounds) green; one-format deletion test on taliban_better_ball clean for renderer + scoring engine` · handoff `Slice 3a — add generic format_id/format_config to slots, read from slots/slot_balls, remove both FORMAT_ID_DECOMPOSITION maps`

#### Route and stroke-index invariants

- A `course_hole` is the physical hole. A `round_play_hole` is one occurrence of that hole in this Round. All score-like events use the occurrence identity.
- The Round owns one ordered itinerary shared by the field. Playing groups may start at different itinerary entries, but they play the same entries in rotated order. Different subsets require different Rounds.
- Each occurrence freezes `par`, `base_stroke_index`, and per-tee length/SI. Defaults come from the physical-hole snapshots; route overrides never mutate the Course.
- Store SI provenance on the Round definition/compiled itinerary: `official` (copied unchanged), `difficulty` (generated/imported from a named difficulty source and then frozen), or `custom` (manual). Persist the resolved numbers, not merely the generation mode.
- Freeze a route handicap policy alongside the itinerary: allocation cycle size, how producer course handicap is obtained for this route (`official_route` | `full_course_casual` | `prorated_casual` | `explicit`), and posting eligibility/reason. Formats consume the resulting frozen CH/PH and occurrence SI; they do not invent route-handicap math.
- A repeated physical hole has a separate stable `play_hole_def_id`, score-event key, par, SI, and tee data on each visit.
- SI controls stroke allocation only. It does not silently change course handicap, playing handicap, rating, slope, or WHS eligibility. Route-specific handicap calculation/posting is an explicit policy decision with a visible diagnostic.
- Validate occurrence SI as positive integers within the frozen allocation cycle and require uniqueness when the selected allocation policy expects a ranked sequence. Sparse official subsets may retain gaps (for example SI 2, 7, 13 with cycle 18). Do not infer the cycle from itinerary length; policy decides whether an arbitrary route is competitive, casual-only, or WHS-postable.
- Generic formats use occurrence par/SI and group-relative played ordinal from `RoundContext`; they never index course arrays by raw hole number. A format that intentionally uses physical hole number declares that coordinate in its config.

#### Slice 3a — Canonical slot persistence and read model

- [x] Add generic `format_id` and `format_config` columns to `slots`. No format-specific columns or tables. → migration `021_slots_format_columns.ts` (backfilled from latest `round_definitions` per `slot_def_id`); typed on `SlotsTable`.
- [x] Read rounds and slots from `slots` / `slot_balls`, not `round_format_slots`. → `RoundService.slotsFor` reads `slots`; `ballsForRound` already reads `slot_balls`/`slots`. No canonical read touches `round_format_slots`.
- [x] Return `formatId`, `slotDefId`, `allowanceConfig`, `formatConfig`, and `ballMode` in the Round read model. → new `FormatSlot` read shape (+ registry-derived `scoringMode`/`teamShape`/`allowancePct` retained for render/index consumers).
- [x] Remove both `FORMAT_ID_DECOMPOSITION` maps and stop reconstructing format identity from `(scoring_mode, team_shape)`. → deleted from `compile.ts` + `round.service.ts`; both dropped from the architecture-ratchet allowlist. (The `synthesize-legacy.ts` reverse map survives as the frozen *legacy-data* migration bridge — it reads genuinely pre-3a `round_format_slots` rows that have no `format_id`; documented, not in the live canonical path.)
- [x] Keep `scoring_mode` and `team_shape` only as registry-derived query metadata if they remain useful; they are not lookup keys. → compiler copies them from `plugin.descriptor`; never used as a lookup key.
- [~] Retire `round_format_slots` after fixture/backfill parity proves no read or write path depends on it. → retired from ALL canonical reads/writes. Physical table DROP **deferred** to the later legacy-schema slice (the backfill — migration 019 + `synthesize-legacy.ts` + `backfill/round-definitions.ts` — and `createLegacy` still legitimately depend on it, per task-6 guard and the documented `createLegacy` retirement schedule).

- [x] **Gate:** an unknown registered canary id round-trips through persistence without becoming `custom × custom`; no itinerary/event behaviour changes in this slice. → `round.service.test.ts` "an unknown registered (canary) format id round-trips…"; `format_id` persists verbatim, `scoring_mode`='canary_points'. No score-event/itinerary code touched.

**Completion record:** commit `c005633` · verification `check:server/client/test + bun test (306 pass) + seed:formats/render:formats/check:format-fixtures (13 rounds) green; architecture ratchet tightened (compile.ts + round.service.ts removed from decomposition allowlist)` · visual gate `not applicable — no intended visible change (visual-gate map: not normally required)` · handoff `Slice 3b — round_play_holes itinerary + playing_groups persistence`

#### Slice 3b — Hole itinerary and playing-group persistence

- [x] Add `round_play_holes` with stable `play_hole_def_id`, deterministic runtime id, canonical ordinal, course hole number, and frozen occurrence-level par/base SI. Add per-occurrence tee snapshots for effective length/SI. Allow any non-empty ordered itinerary and repeated course holes; default from the physical-hole snapshots and validate explicit route overrides. → migration `022`; `round_play_tee_holes` uses a durable `tee_ref` snapshot key (survives tee deletion). `normalize` defaults conventional routes from `round_type`; explicit overrides validated.
- [x] Promote the current `tee_times` rows into explicit `playing_groups` (preserving start time/capacity/bay), add ball membership, and replace raw `start_hole` with `start_play_hole_id`. Remove the 1-or-10 constraint: any itinerary entry is a valid normal or shotgun start. → migration `023`; live `TeeTimeService` + `/tee-times` API retired (table kept as backfill source only); `start_play_hole_id` composite same-round FK; `UNIQUE(ball_id)` so a ball lives in one group.
- [x] Put itinerary entries and playing groups in the versioned `RoundDefinition` with stable def-ids. Group setup assigns producers; the compiler derives ball membership and rejects any team ball whose producers cross playing groups. → `RoundDefinitionInput`→`normalize`→`ResolvedRoundDefinition` (`resolved-v1`); compiler enforces exhaustive + exclusive producer/ball membership (`producer_not_in_any_group`, `producer_in_multiple_groups`, `team_ball_crosses_playing_groups`, `ball_not_assigned_to_group`).
- [x] Persist route/SI provenance (`official` | `difficulty` | `custom`), optional source label/version, and the fully resolved occurrence values in `round_definitions` and compiled rows. Historical scoring never reruns a difficulty algorithm. → provenance in the resolved `definition_json`; resolved par/SI in `round_play_holes` rows.
- [~] Persist the route handicap policy and allocation cycle in `RoundDefinition`. Non-standard routes require an explicit policy; the compiler freezes the resulting per-producer route CH before ball derivation and records posting eligibility/reason. → policy + allocation cycle + posting eligibility/reason persisted (resolved def); `missing_route_handicap_policy` on non-standard routes; posting eligibility gated on full-rated coverage (not automatic). **Per-producer route-CH freezing before ball derivation deferred to Slice 3c** (handicap-allocation centralisation lives there).
- [x] Give `round_play_holes` uniqueness/FK constraints for `(round_id, play_hole_def_id)` and `(round_id, ordinal)`; give per-occurrence tee rows and group starts same-round composite FKs so cross-round references cannot compile or persist. → `UNIQUE(round_id, play_hole_def_id)`, `UNIQUE(round_id, ordinal)`, `UNIQUE(round_id, id)` composite-FK target; `playing_groups (round_id, start_play_hole_id)` composite FK; compiler start-ref check.
- [x] Backfill every existing Round with a deterministic itinerary from its frozen holes and legacy `round_type`; map existing tee-time starts to the matching occurrence. → migration `024`; deterministic ids match the compiler; single-group rounds get ball membership, multi-group rounds leave it empty with an explicit migration diagnostic; historical `definition_json` not rewritten (legacy defs normalize-on-read; next recompile upgrades to `resolved-v1`).
- [~] Define itinerary recompile semantics: reorder preserves play-hole ids and events; adding creates new occurrences; removing retains affected events as `orphaned_events_after_correction`; changing par/SI updates the same occurrence and deterministically rescoring all consuming slots. → persist diff-upserts by content-addressed id (two-phase ordinal write so reorder never trips `UNIQUE(round_id, ordinal)`); add/remove tested. **Event-orphaning surfacing + rescoring consumers deferred to Slice 3c** (score events don't key on `play_hole_id` until then).
- [~] Reserve stable setup-correction target paths for itinerary entry add/remove/reorder, occurrence par/SI/tee override, SI provenance, playing-group membership, and group start. → recompile of these definition changes works through the existing diff-upsert path; explicit setup-correction target-path reservation + append/replay transport lands in 2.6d.
- [x] Extend the Round read model/API with ordered occurrence snapshots, route/SI provenance, route handicap policy, posting eligibility, route sections, playing groups, group-relative order, and start/end occurrences. Historical reads require no live Course/template lookup. → `Round.playHoles`/`routeSi`/`routeHandicapPolicy`/`routeSections`/`playingGroups` (each group carries rotated `playedOrder`, `groupRelativeOrder`, derived start/end occurrences); legacy defs normalize-on-read.

- [x] **Gate (automated):** schema/compiler tests persist official, difficulty-labelled, and custom-SI routes; invalid cross-round starts, duplicate ordinals, SI outside the allocation cycle, duplicate required SI ranks, missing non-standard route handicap policy, and team balls crossing playing groups fail atomically. → `normalize.test.ts`, `compile.test.ts`, `persist.test.ts`, `024_itinerary_backfill.test.ts`, `round.service.test.ts` (319 pass; all four typechecks green).

**Completion record:** commit `6ce0945` · verification `check:server/client/test + bun test (319 pass) + seed:formats/render:formats/check:format-fixtures (13 rounds) green; visual gate APPROVED by user — dedicated 3b verify page tmp/formats/slice-3b-verify.html (two-loop 1..9,1..9 route, odd/even per-visit SI, difficulty provenance, casual posting-ineligible policy, split group starts at occurrences #1 and #10)` · handoff `Slice 3c — migrate score events + scorecard key + strategies onto play_hole_id; centralise handicap allocation; freeze per-producer route CH; retire round_type as scoring authority`

#### Slice 3c — Event, scoring, and scorecard itinerary migration

- [x] Migrate existing hole-scoped score/metadata references from raw hole number to stable `play_hole_id`; define future ruling/action schemas against the same occurrence identity. Compatibility reads may expose course hole number, but persistence and idempotent event identity use the played-hole occurrence. — migration `025` flips `score_events`/`scorecards` onto `play_hole_id` (backfilled from `round_play_holes.course_hole_number`); `(round_id, client_event_id)` idempotency preserved.
- [x] Rebuild the scorecard materialisation/trigger key as `(ball_id, play_hole_id)` and backfill existing score/metadata rows transactionally. Update unique indexes, service inputs, API schemas, idempotent replay, clear/confirm flows, and conflict resolution together. — trigger + `scorecards_identity_unique` rekeyed; `ScoreEventService.append` takes `playHoleId`; API + generated client regenerated; `round.service.remove()` now deletes events/scorecards before the round (RESTRICT FK ordering).
- [x] Materialise `playHoles`, `courseHoleNumber`, canonical ordinal, and `playedOrdinalFor(ballId, playHoleId)` into scoring context. A group starting midway receives the itinerary rotated from its start entry. — single `createRoundContext` factory (`server/domain/strategies/round-context.ts`), fed from `round.playHoles`/`round.playingGroups`; reused by materializer + testkit + canary.
- [x] Change effective par/SI/length helpers to accept `playHoleId` plus ball/producer context. Update every built-in strategy and shared scoring helper to iterate itinerary occurrences rather than `courseHoles` or `1..18`; explicitly choose played ordinal versus physical hole coordinate for rule multipliers. — `_shared` keys on `playHoleId`; order-insensitive formats iterate canonical `playHoles`, match/better-ball iterate `playedOrderForBall`.
- [x] Centralise handicap-stroke allocation over `(playingHandicap, occurrenceStrokeIndex, allocationCycleSize)`, including plus handicaps and handicaps larger than one cycle. No format reimplements this arithmetic. — `strokesReceivedForStrokeIndex` in `handicap.ts` (10 unit tests; cycle denominator, never itinerary length).
- [x] Replace hole-number-only result fields with stable play-hole identity plus display metadata (`courseHoleNumber`, canonical ordinal, group-relative played ordinal, occurrence label). Generic renderers and clients must distinguish repeated visits such as `3 (1st)` and `3 (2nd)`. — `HoleIdentity` on every result row; `GridCell`/`HoleRef` carry `playHoleId` + `occurrenceLabel`; builder keys cells by `playHoleId`.
- [x] Make round completeness iterate the itinerary rather than assuming 9 or 18 course holes. Keep WHS-posting eligibility as a separate route policy so arbitrary subsets remain playable even when they are not postable. — leaderboard scores over `round.playHoles`; `RoundResult.posting` surfaces eligibility/reason separately.
- [x] Apply the frozen route handicap policy before ball creation/format allowance. WHS posting is allowed only through a policy that supplies valid rating/slope/par treatment; casual policies still score deterministically but completion returns a clear posting-ineligible reason. — per-producer CH already frozen in `resolveProducers` before ball creation; `RoundResult.posting` returns the policy's reason.
- [x] Retire `round_type` as scoring authority. It may survive temporarily as the setup preset used to create an itinerary, but no compiler, scorer, completion check, or client navigation branches on it. — removed `courseHolesForRound`/`playedSet` from the leaderboard path and `round_type` segmentation from the renderer; `round_type` only feeds `normalize`'s default itinerary + display labels.
- [x] Render the route and SI provenance on canonical fixture pages, including occurrence par/SI, group start/end, played order, repeated-hole labels, and custom overrides. OUT/IN/TOT segmentation derives from route sections/config rather than hardcoded physical holes 1–9/10–18. — render pipeline iterates occurrences, groups columns by `routeSections`, adds a route-summary section; new `scripts/render-slice-3c-verify.ts`.

- [x] **Gate:** all built-ins and event services pass on occurrence ids; fixtures prove a hole-5 shotgun start, a wrapped route, an arbitrary subset, a 10-hole course routed as `1..10,1..8`, a repeated hole with a different second-occurrence SI, a sparse cycle-18 subset, plus handicap, and PH greater than one cycle without score/result collisions. Existing canonical fixtures remain numerically identical. — `server/services/itinerary-scoring.test.ts` (5 end-to-end scenarios incl. repeated-hole/subset/wrap/plus/PH>cycle) + `server/domain/strategies/round-context.test.ts` (shotgun rotation + labels). 336 tests pass; 13 canonical fixtures numerically identical; all typechecks green.

**Completion record:** commit `0fd1e92` · verification `tmp/formats/slice-3c-verify.html` (8 route scenarios, user-approved) + `server/services/itinerary-scoring.test.ts` + `server/domain/strategies/round-context.test.ts` · handoff `—`

#### Slice 4 — Deepen compiler validation

- [x] Make the compiler enforce the full registered requirement: producer count, slot ball count, ball mode, topology mode (`static` | `scheduled` | `dynamic`), team count, team size, disjointness, coverage, selector references, and format-config schema. → `compile.ts` `compileSlot` + `validateTeamGrouping`: `ball_mode_violation`, `unsupported_topology` (only `static` compiles; scheduled/dynamic reserved for 2.6d), `team_count_below_min`/`above_max`, `team_size_below_min`/`above_max`, `overlapping_teams` (producer- AND ball-level), `ball_not_in_any_team` (coverage), `unknown_selector_strategy`/`unknown_selector_producer`, plus `plugin.validateConfig()` diagnostics surfaced at compile time. `producer_count_violation` + `slot_ball_count_*` retained. `topology` added to `FormatBallRequirement`.
- [x] Validate hole-segment schedules against the played sequence: ranges cover valid ordinals, do not overlap unless the plugin allows it, and scheduled team assignments reference known balls exactly as declared. → new `compiler/hole-segments.ts` (`readHoleSegments` + pure `validateHoleSegments`): `invalid_segment_range`, `segment_range_out_of_bounds` (ordinal vs `playHoleCount`, physical vs itinerary course-hole set), `segment_overlap` (gated by `allowSegmentOverlap`), `segment_unknown_ball`, `duplicate_segment_id`. No built-in carries a schedule; the canary-style test plugins exercise every path.
- [x] Require plugin configuration to declare whether hole-based rules address `played_ordinal`, `canonical_ordinal`, or `course_hole_number`; reject ambiguous schedules/multipliers rather than guessing. → `HoleCoordinate` + `requirements.holeCoordinate` on the descriptor; a schedule with no declared coordinate → `ambiguous_hole_coordinate`.
- [x] Implement requirement-based auto-selection when `ballSelector` is omitted; never default blindly to every ball in a mixed own-ball/team-ball round. → `selectBallsForSlot` no-selector branch filters by `ballMatchesRequirement` (ballMode + producerCount window). Test: a 4-own + 2-alt-shot round auto-selects the 4 own balls into the stableford slot and the 2 team balls into foursomes. (Canonical fixtures always pass explicit selectors, so output is unchanged.)
- [x] Validate `deriveSlotBalls()` output is one-for-one with the selected balls and contains no unknown/duplicate ids. → `derived_ball_unknown`, `derived_ball_duplicate`, `derived_ball_missing`.
- [x] Return structured diagnostics with stable codes and paths. Plugin implementations may retain defensive checks, but invalid setup must normally stop at compile time. → every new diagnostic carries a stable `code` + slot-scoped `path` (`slots[<id>]…`); all checks accumulate, the slot short-circuits before `deriveSlotBalls`/row emission when any `slots[<id>]` diagnostic exists, so nothing half-persists.

- [x] **Gate:** malformed 3+1 teams, overlapping teams, incompatible ball modes, unknown selector ids, and invalid config all fail before persistence. → `server/domain/compiler/compile-validation.test.ts` (17 tests, one per rejection path) — 3+1 → `team_size_*`, overlap → `overlapping_teams`, mode → `ball_mode_violation`, unknown selector → `unknown_selector_*`, bad config → plugin diagnostic. Existing canonical fixtures still compile + stay numerically identical (`check:format-fixtures` 13 rounds).

**Completion record:** commit `028c490` · verification `check:server/check:client/check:test + bun test (353 pass, +17) green; seed:formats/render:formats/check:format-fixtures (13 rounds, numerically identical) green` · handoff `Slice 5 — catalog (GET /formats) + server-side RoundSetupDraft/RoundDefinitionBuilder planner; the planSetup stubs in builtins.ts land for real here`

#### Slice 5 — Catalog + server-side round setup planner

- [x] Add authenticated `GET /formats` exposing registered serializable descriptors. → `server/api/formats.api.ts` (mounted; `formats.routes.test.ts`).
- [x] Add a UI-level `RoundSetupDraft`: course/date, producers/tees, selected format ids, team assignments, allowance overrides, and format-specific config. → `server/domain/round-setup/draft.ts` (Typebox + types).
- [x] Let `RoundSetupDraft` select a route preset or submit an explicit ordered hole itinerary. Include SI mode/provenance, allocation cycle, route handicap policy, occurrence overrides, route sections, and playing-group starts by play-hole def-id rather than unrestricted integer hole. → `DraftRoute` (preset via `roundType`, explicit `playHoles`+SI/policy/sections, groups by `startPlayHoleDefId`/`startOrdinal`).
- [x] Add named, reusable course-route templates as setup conveniences (`10 + first 8`, … `difficulty SI`). Creating a Round copies and freezes the fully resolved template into its `RoundDefinition`; later template edits never rewrite history. → `CourseRouteTemplateService.resolveForRound` freezes resolved occurrences into explicit play-hole inputs; `createFromDraft` copies them.
- [x] Persist templates in a course-owned `course_route_templates` table/document with stable id, unique course-local name, ordered occurrence definitions, route sections, SI source/config, allocation cycle, and route handicap policy. Validate through the same pure route compiler used by `RoundSetupDraft`. → migration `026`; `course-route-template.{service,test}.ts`; validates via the extracted `compileRoute`.
- [x] Keep route/SI generation server-owned. Official mode copies course values; custom mode validates submitted ranks; difficulty mode resolves from an explicitly named source. The mobile client never calculates or reorders SI itself. → `compileRoute` is the single SI authority; `difficulty` mode declared with `sourceLabel` (external *import* deferred).
- [x] Expose route templates and SI provenance through authenticated APIs. → `api/course-route-templates.api.ts` (mounted). Finer admin authorization deferred to the authorization phase (mirrors clubs/courses).
- [x] Add a pure `RoundDefinitionBuilder` that asks each selected plugin's `planSetup` for its slot/ball needs, coalesces reusable ball-creation strategies, and emits the canonical `RoundDefinition`. → `server/domain/round-setup/builder.ts` (`builder.test.ts`).
- [x] Let setup plans declare static teams … without format ids leaking into the builder. → builder resolves plugins by id only (no per-format branch); static team grouping + alt-shot composition flow through `planSetup`. Scheduled/dynamic topology stays a 2.6d compile-time rejection.
- [x] The mobile API creates from `RoundSetupDraft`; direct `RoundDefinition` creation remains an internal/admin/testing interface. → `POST /rounds/from-draft` (`createFromDraft`); `POST /rounds` (`create`) stays admin/testing.
- [x] Return compiler diagnostics in a structured response the mobile wizard can attach to the relevant format/team/player control. → `createFromDraft` returns `{ok:false,diagnostics}` (builder + compiler `{code,message,path}`); `round-from-draft.test.ts` + `round-setup.routes.test.ts`.

This keeps ball-strategy ids, derivation config, selectors, and dedupe rules out of the mobile client. The server remains the authority on what a format needs.

- [x] **Gate:** mixed selections such as stableford + better-ball + foursomes produce one own-ball strategy plus the required pair-ball strategy without client conditionals; named `10 + first 8` and custom difficulty-SI drafts compile without client-side route logic. → proven in `builder.test.ts` + `round-from-draft.test.ts`; visualised in `tmp/formats/slice-5-verify.html`.

- [x] **Human visual gate:** `tmp/formats/slice-5-verify.html` (`bun scripts/render-slice-5-verify.ts`) — 4 scenarios showing catalog → draft → server-built definition → compiled round. User-approved 2026-06-13.

**Completion record:** commit `2ed77ba` · verification `check:server/check:client/check:test + bun test (376 pass, +23) green; seed:formats/render:formats/check:format-fixtures (13 rounds, numerically identical) green` · visual gate `tmp/formats/slice-5-verify.html (4 scenarios) — user-approved 2026-06-13` · handoff `Slice 6 — static deletion + extension proof`

#### Slice 6 — Static deletion and extension proof

- [x] Delete legacy scoring modules, decomposition maps, and format-specific static-render switches made obsolete by the canonical plugin/result contracts. Mobile legacy maps remain until 2.6e. **Done:** the parallel `FormatStrategy` registry was the only remaining obsolete seam — deleted its registry fns (`registerFormatStrategy`/`findFormatStrategy`/`listFormatStrategies`/`clearFormatStrategies`) from `format-strategy.ts` (the contract *types* stay — widely imported), removed the `strategies/formats/index.ts` barrel, the `pluginAsFormatStrategy` bridge in `plugin.ts`, and every `registerBuiltInFormatStrategies()` call (main.ts, compiler-rounds.ts, scenario.ts, 3 verify scripts, 7 tests). 2c had already deleted format.ts/leaderboard.ts/10 strategy files/scoreRound; no decomposition maps or render switches remained server/static-side. `src/formats.ts` is client-only → deferred to 2.6e (stale `FORMAT_ID_DECOMPOSITION` comment reference scrubbed).
- [x] Keep the canonical fixture workflow: `bun run seed:formats`, then `bun run render:formats` from the rebuilt fixture DB. **13 rounds, numerically identical** (`check:format-fixtures ok`).
- [x] Perform the server/static acceptance test with the canary plugin. Production infrastructure files must remain untouched beyond central registration; test/fixture registration is expected proof, not runtime coupling. **Done:** `canary.test.ts` reworked to register the canary through the ONE plugin registry (`registerFormat` / `findFormatPlugin`) — register → catalog → planSetup → compile → score → rank with zero infra-map edits; `_canary.testkit.ts` untouched.
- [x] Repository search proves one canonical server registry, zero format decomposition maps, and no format-id dispatch under `scripts/render/`. **`architecture.test.ts` tightened to terminal state** (1 allowed registrar; empty decomposition allowlist; new guard scanning `scripts/render/` for any built-in format-id literal). All three guards proven to FAIL on injected violations (negative control), then PASS reverted.
- [x] Generate a stable static verification index covering every built-in, the canary/deletion proof, pair-only results, multi-format shared logs, and unusual arithmetic. **`scripts/render-slice-6-verify.ts` → `tmp/formats/slice-6-verify.html`**: live `formatCatalog()` panel (10 built-ins, canary ABSENT) + all 13 fixtures inlined by stable signature; 4 required checks (registry panel, multi-format-3p shared log, pair-only match play, umbrella-4-ball arithmetic), rest regression. Full sweep not warranted — diff is dead-code deletion, output byte-identical.

**Final 2.6b automated gate:**
- [x] `bun run check:server`, `check:client`, `check:test`, `bun test`, and canonical format fixture checks green. **376 pass, 0 fail; 13 fixtures present.**
- [x] All existing format outputs remain numerically identical unless an explicitly approved correction is recorded. **Identical — no corrections.**
- [x] One canonical server registry; zero server/static format decomposition maps or render switches. **Enforced by the tightened ratchet.**
- [x] Generic formats require one server plugin + central registration only. **Canary proves it end-to-end.**

- [x] **Human visual gate:** set the slice to `AWAITING VISUAL VERIFY` and provide the generated static index as a clickable link plus a focused checklist of the changed/high-risk fixtures and their expected values. The user is not expected to inspect every fixture unless the agent explains why this milestone requires a full sweep. **Index + focused 4-check list delivered; user-approved 2026-06-14.**
- [x] Commit completion record: `phase 2.6b complete: registered format plugins + canonical static verification`.

**Completion record:** commit `b8295ed` (+ this ledger commit) · automated verification `check:server/check:client/check:test + bun test (376 pass) green; seed:formats/render:formats/check:format-fixtures (13 rounds, numerically identical) green; architecture+canary acceptance 32 pass; ratchet negative-control verified` · visual verification link/approval `tmp/formats/slice-6-verify.html (regen: bun scripts/render-slice-6-verify.ts) — user-approved 2026-06-14` · handoff `2.6c`

### 2.6c — New ball-creation & format coverage + kitchen-sink multi-slot seed

**Status: COMPLETE** (2026-06-14, branch `phase-2.6c-new-formats` off `slice-6-static-deletion`). **Completion record:** commit `7650f24` (+ this ledger commit) · automated verification `check:server/client/test + bun test (400 pass, +24) green; seed:formats/render:formats/check:format-fixtures (19 rounds = 13 existing numerically identical + 6 new) green; architecture ratchet green (greensomes/scramble added to the renderer-guard list)` · visual verification `tmp/formats/slice-2.6c-verify.html (regen: bun scripts/render-slice-2.6c-verify.ts) — user-approved 2026-06-14` · handoff `2.6d`.

What landed: 3 ball-creation strategies (`greensomes_pair` weighted, `scramble_team` by-rank 2p `[35,15]`/4p `[25,20,15,10]`, `modified_alt_shot_pair` emitting own + alt balls in one pass), all in the separate ball-creation registry (ADR 0001); 2 formats (`greensomes`, `scramble`) wrapped as plugins in `builtins.ts`, ids added to the architecture ratchet renderer-guard list; 6 seeds (`greensomes-weighted-round`, `scramble-4-by-rank-round`, `scramble-2-by-rank-round` @90% so its signature differs from the 4-player @100%, `fourball-85-round`, `multi-format-extreme-round` kitchen-sink with 6 balls / 7 slots, `mixed-tee-round`); a `scripts/seed-authoring.ts` helper that authors `RoundDefinition`s directly (the new ball-creation strategies don't fit the participant-centric scenario builder, which infers strategy from `teamShape`). Kitchen-sink + mixed-tee use `modified_alt_shot_pair`; the kitchen-sink's umbrella/köpenhamnare slots take 3-of-4 own-ball subsets via `ballSelector.producerDefIds`, and its "alt-shot match" slot uses `stroke_play_foursomes` (no match-play-foursomes built-in exists; out of 2.6c scope).

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

**Gate:** new seeds + kitchen-sink render correct arithmetic; `bun test` includes new ball-creation + format + multi-slot tests. Set `AWAITING VISUAL VERIFY` and give one focused link. Required checks should emphasize the kitchen-sink shared event log, one non-flat team-ball derivation, and the mixed-tee CH arithmetic; other new pages are optional regression checks. Commit after approval: `phase 2.6c complete: new strategies + multi-slot kitchen sink`.

### 2.6d — Typed corrections, soft-delete read path, player dashboard

**Status: COMPLETE** (branch `phase-2.6d-corrections`, off `phase-2.6c-new-formats`; visual gate user-approved 2026-06-14).

**Completion record:**
- **Schema/migrations:** `027_create_correction_events.ts` (`setup_correction_events`, `allowance_override_events`, `ruling_events`) + `028_create_format_action_events.ts` (generic envelope). FK discipline: only `round_id` (CASCADE) + `recorded_by_player_id` (SET NULL); all domain refs are stable def-ids / content-addressed ids stored as TEXT — no recompile/delete-ordering fights. `players.deleted_at` already existed (migration 016). Setup-correction `target` enum extended with `play_hole` + `playing_group` (route-shaped inputs per this section's narrative).
- **Recompile plumbing:** `RoundService.latestDefinition` / `compileDefinition` (pure) / `recompileFromDefinition`; `definitionInputFromResolved` (domain) makes a persisted resolved def round-trip back through `compile()` without dropping occurrence par/SI overrides (asserted in `round-definition.test.ts`). `persistCompiledRound` already supported `source_kind` recompiles.
- **3 typed corrections** (`server/services/correction.service.ts`): setup-correction mutates the latest definition by stable def-id → new version, all downstream recomputed; allowance-override → new version `source_kind='allowance_override'`, **preserved through later full recompiles**; ruling → append-only, applied generically post-`score()` by `server/domain/strategies/rulings.ts` (penalty strokes / dq / wd; no format-id dispatch). Idempotent on `client_event_id`. (The allowance-only narrow recompile fast path and the generic correction HTTP endpoints landed in 2.6d-final.)
- **Stateful format-action service seam:** `FormatPlugin.actionTypes` + `validateAction` (optional), `ScoreInput.formatActions`, pure supersession replay (`server/domain/strategies/format-actions.ts`), `FormatActionService` append path (slot exists → format owns type → plugin validates payload → occurrence/supersession legality), materializer + leaderboard wiring. Proven end-to-end by the test-only `server/domain/formats/_stateful_canary.testkit.ts` (rotating captain + per-hole partner + ordered call) — registers, persists, replays, supersedes, scores with NO infrastructure edit. The generic HTTP endpoint (`POST /format-actions`) landed in 2.6d-final. Wolf/BBB deliberately NOT implemented.
- **Soft-delete + dashboard:** `PlayerService.softDelete`/`hardDelete` (GDPR: null PII, keep `id`+`deleted_at` tombstone, `username`→`deleted:<id>`) + `isActive`/`listActive`; `DashboardService.forPlayer` (§17 query via `ball_players.player_id`, per-slot PH + finishing position, soft-deleted excluded). Historical render uses `display_name_snapshot`.
- **Seeds + verify:** 8 seeds under `scripts/seeds/` (`setup-correction-round`, `allowance-override-round`, `allowance-override-then-setup-correction-round`, `ruling-applied-round`, `route-correction-round`, `soft-deleted-player-round`, `stateful-canary-round`, `player-dashboard-listing`) on a shared flat course (`scripts/seed-2.6d-support.ts`); built via `scripts/fixtures-2.6d.ts`, kept OUT of the `seed:formats` oracle (the 19 fixtures stay frozen). Verify page: `bun scripts/render-slice-2.6d-verify.ts` → `tmp/formats/slice-2.6d-verify.html` (real rendered scorecards + inline append-only audit tables + version chains; required checks: route/SI correction audit, stateful replay/supersession, deleted-player scorecard). `authorRound` gained `playByOccurrence` for repeated-hole itineraries.
- **Gate:** 422 pass / 0 fail, all three typechecks clean, 19 format fixtures numerically identical, architecture ratchet green, plugin deletion leaves zero format-specific persistence/API branch (grep-confirmed).

Per §17, corrections are typed — three distinct events instead of one generic override bus.

**Stateful format actions (generic plugin event seam):**

- Add append-only `format_action_events` keyed by `round_id`, stable `slot_def_id`, optional `play_hole_id`, stable sequence/ordinal within the played-hole occurrence, action type, schema version, optional subject ball/producer refs, JSON payload, actor, timestamp, and idempotent `client_event_id`.
- A registered format plugin optionally declares its action types and validates each payload. Persistence owns only the generic envelope; no Wolf/Taliban/etc. columns, tables, or switch statements.
- The append path verifies that the slot exists, its registered format owns the action type, the payload passes that plugin's schema, and the action is legal for the current round/play-hole state.
- Materialisation replays the slot's validated format actions into `FormatPlugin.score()` alongside score, metadata, and ruling events. Stable `slot_def_id` keeps actions attached across recompiles.
- Corrections remain append-only and auditable: an action may explicitly supersede a prior action according to plugin-declared replay rules; rows are never updated or deleted in place.
- **Delivered in 2.6d-final:** one generic format-action endpoint (`POST /format-actions`, `server/api/format-actions.api.ts`) returning structured diagnostics. Generic score entry remains unaware of individual action types.
- Add a stateful canary plugin/fixture proving rotating role + per-hole partner choice + an ordered in-hole decision can be persisted, replayed deterministically, corrected by supersession, and reflected in structured results without infrastructure edits. This proves the seam required by Wolf, scramble selection, and Bingo Bango Bongo without implementing those formats in 2.6d.

- `setup_correction_event` — pre-finalization fix on `RoundDefinition` inputs only (wrong tee, handicap index, category, ball composition, slot declaration, ball-strategy config, itinerary entry/order, occurrence par/SI/tee override, SI provenance, playing-group membership/start). Targets use **stable def-ids only** (`producer_def_id`, `strategy_def_id`, `slot_def_id`, `play_hole_def_id`, `playing_group_def_id`), never compiler-output row ids. Derived outputs (`balls`, `slot_balls`, `slot_ball_teams`, `round_play_holes`, ball CH, ball PH) are never targeted directly — the event mutates the latest `round_definitions` version into a new version, the compiler re-runs, and all downstream outputs are recomputed. Old + new input values retained in the event; the full definition chain is retained in `round_definitions`.
- `allowance_override_event` — slot-level allowance change post-setup, keyed by `slot_def_id` (stable). Writes a new `round_definitions` version with `source_kind='allowance_override'`. It survives subsequent `setup_correction_event` recompiles because it lives in the definition chain, not a separate overlay. **Delivered in 2.6d-final:** the narrow fast path re-derives only the affected slot's `format.deriveSlotBalls` (ball creation + ball CH + other slots untouched), persists a new version via `RoundService.appendDefinitionVersion` + a slot_balls PH diff, and falls back to full compile for broader setup corrections.
- `ruling_event` — post-play competitive ruling (DQ, penalty strokes, hole adjudication, WD). Target: `ball_play_hole` | `ball_total` | `slot_ball_result`; occurrence-scoped targets include `play_hole_id`. Strategy reads during `score()` and applies as a scoring-layer adjustment; no re-derivation.
- Read path honours `players.deleted_at`: dashboard queries filter soft-deleted out; historical scorecard rendering uses `ball_players.display_name_snapshot` (always populated), so deleted-player rounds still render with the played-as name. Live player navigation links only appear when the player is active.
- Player dashboard query + render: per §17 dashboard query, joining via `ball_players.player_id`.
- Hard-delete (GDPR): nulls PII on `players` row, keeps `id` + `deleted_at` tombstone for FK integrity; snapshot columns on `ball_players` unaffected.

**HTML render expectations:**
- Dashboard seed: `player-dashboard-listing` renders a player's round history (own-ball and team-ball rounds, with per-slot PH and finishing position per slot).
- Soft-delete seed: `soft-deleted-player-round` — historical round whose one producer is soft-deleted; render shows `display_name_snapshot` intact, no live link.
- Setup correction seed: `setup-correction-round` — round with a `setup_correction_event` changing a producer's tee (wrong tee assigned initially); render shows original CH derivation, correction event with reason, post-correction CH derivation, and downstream slot_balls all updated.
- Route correction seed: a custom itinerary whose second visit to a physical hole receives a corrected SI and whose group start is moved; render shows stable play-hole identity, retained score events, changed stroke allocation/order, and the append-only correction audit.
- Allowance override seed: `allowance-override-round` — slot's allowance changed post-setup (e.g. club decided 95% → 90% stableford after scores were entered); render shows original slot_balls PHs, override event, new `round_definitions` version (`source_kind='allowance_override'`), re-derived slot_balls, scoring recomputed.
- Override-then-correction seed: `allowance-override-then-setup-correction-round` — allowance override applied first, then a later `setup_correction_event` changes a producer's tee; render shows the override is preserved through the full recompile (final PHs reflect both the tee correction AND the earlier allowance override, proving single-source-of-truth reconciliation).
- Ruling seed: `ruling-applied-round` — round with a `ruling_event` adding +2 penalty strokes on a specific ball/play-hole occurrence; render shows raw strokes, ruling event, final adjusted total.
- Stateful format-action seed: a test-only registered canary with rotating role and per-hole partner selection; render shows the action history and resulting side/points calculation.

**Gate:** dashboard, soft-delete, all three typed correction flows, and the stateful format-action canary render correctly. Plugin deletion leaves no format-specific persistence/API branch. Set `AWAITING VISUAL VERIFY` and give one focused link. Required checks should normally be the route/SI correction audit, the stateful action replay/supersession, and one deleted-player historical scorecard; do not assign every dashboard/correction page. Commit after approval: `phase 2.6d complete: typed corrections + format actions + soft-delete + dashboard`.

### 2.6d-bis — Non-flat allowance rulesets

**Status: COMPLETE** (branch `phase-2.6d-bis-allowance`, off `phase-2.6d-corrections`; user-approved 2026-06-14). Automated gate green: **433 pass** (was 422 — +4 split-derivation, +6 allowance-config compiler diagnostics, +1 split label, strengthened better-ball contract), all three typechecks clean, **20** format fixtures (19 flat numerically identical + 1 new split), architecture ratchet green. `FormatAllowanceConfig` grew the `split` variant; shared `deriveAllowance` dispatches flat/split (all 12 formats route through it); `validateAllowanceConfig` rejects malformed split tables as structured diagnostics; `formatAllowanceLabel` is the split-aware render/leaderboard label. Review feedback folded in: better-ball Stableford emits per-producer own-ball results so the team card shows each player's Given/Gross/Points alongside Team points (= best of the two per hole) — data-driven via `hasPoints`, umbrella/taliban cards untouched. Visual gate `tmp/formats/slice-2.6d-bis-verify.html` user-approved (regenerate `bun scripts/render-slice-2.6d-bis-verify.ts`).

Stage-3 allowance (`slot.allowanceConfig` → per-ball PH) only has the `flat` variant today. This phase grows the `FormatAllowanceConfig` union to cover allowances that vary *within a single slot* — distinct from 2.6c, which grows ball-CH *derivation* (stage 2, combining participants), and from 2.6d's `allowance_override_event`, which only edits an existing flat allowance. Placed late (after corrections, before the mobile client) because no WHS built-in needs it — the demand is club-specific split/per-rank rules. The union is additive: no schema change, and `allowance_override_event` already proves allowance lives in the definition chain.

- Add non-flat `FormatAllowanceConfig` variant(s) — e.g. `split` (per-rank or per-CH-band percentages applied across a slot's balls) and/or explicit per-producer overrides. Discriminated by `type`; `flat` stays the default.
- Extend `deriveSlotBalls` (the shared `deriveFlat` path) so each format resolves PH per ball under the new shape. The slot still derives one PH per ball; only the percentage source changes.
- `RoundSetupDraft.formats[].allowanceConfig` already accepts any `FormatAllowanceConfig` — the wizard gains controls, the builder/compiler/route paths need no change.
- Compiler validation: reject malformed split tables (bad band bounds, percentages out of range, a producer/rank not covered) as structured diagnostics, mirroring the team-grouping validators.
- Seed + render a fixture exercising one non-flat allowance (e.g. a better-ball where low-CH and high-CH players take different percentages off the same shared own-balls), proving per-ball PH visibly differs within the slot.

**Gate:** new allowance variant scores correctly with visible per-ball PH arithmetic; `bun test` includes the variant + its compiler-rejection tests; existing flat-allowance fixtures stay numerically identical. Visual-gate per the standard slice protocol. Commit after approval: `phase 2.6d-bis complete: non-flat allowance rulesets`.

### 2.6d-final — Core engine integrity and ADR closure

**Status: COMPLETE** (commit `3c534e3`, verify page user-approved 2026-06-16). Added from the 2026-06-14 core-engine review. This is a mandatory stop before 2.6e: it closes confirmed correctness failures that the green general suite and 20 canonical fixtures do not currently exercise. Scope is server/domain/persistence/API only; do not begin mobile implementation here.

**What landed (awaiting visual approval of the verify page):**
- **E1** — `toPlugin`'s generic `ballMode:'team' → alt_shot_pair` rule is gone; each team builtin declares its own `ballPlan` (foursomes `alt_shot_pair`/avg, greensomes `greensomes_pair`/weighted 60-40, scramble `scramble_team`/by-rank by team size). Real `validateConfig` now lives on each `FormatStrategy` (Köpenhamnare `handicapMode`, Umbrella `birdieRule`) → compile-time `ConfigDiagnostic`, not a score-time throw. Tests: `server/services/round-from-draft-team.test.ts`.
- **E2a** — `LeaderboardService` threads the effective per-tee occurrence SI into `createRoundContext` (was hardcoded `null`); the displayed SI row is now per-ball for single-producer cards. Test: `server/services/leaderboard.mixed-tee-si.test.ts`.
- **E2b** — migration **030** adds `score_events.seq` (+ `scorecards.seq`); the scorecard trigger, replay, and latest-score reducer all key on `seq` (append order), never wall-clock `recorded_at`. Tests: `server/services/score-event-order.test.ts` (+ two pre-existing wall-clock tests updated to the new semantic).
- **E2c** — same-round ownership: service validation + a `BEFORE INSERT` trigger (migration 030) reject cross-round `ball_id`/`play_hole_id`. Test: `server/services/score-event-ownership.test.ts`.
- **E3** — migration **031** adds `slots.ordinal`; result path resolves slot order from it, `slot_def_id` is opaque (no `slot-<N>` parse). Test: `server/services/opaque-slot-ids.test.ts`.
- **E4** — generic `POST /corrections/{setup,allowance,ruling}` + `POST /format-actions` (`server/api/corrections.api.ts`, `format-actions.api.ts`, mounted in `main.ts`, typed client regenerated). Allowance-only **fast path** in `applyAllowanceOverride` (re-derives only the slot's `deriveSlotBalls` via `RoundService.appendDefinitionVersion` + a narrow `slot_balls` diff; ball creation untouched), proven by `server/services/allowance-fast-path.test.ts`. Route tests: `server/api/corrections.routes.test.ts`, `format-actions.routes.test.ts`.
- **E4 diagnostics hardening (review follow-up):** all three correction kinds return **structured** `{ ok:false, diagnostics:[{code,message,path}] }` for domain/user-input errors instead of exception-shaped 500s — `unknown_round` / `unknown_slot` (allowance), `unknown_producer`/`unknown_ball_strategy`/`unknown_slot`/`unknown_play_hole`/`unknown_playing_group`/`invalid_value` (setup, via a `CorrectionInputError` caught at the service boundary), and `unknown_target_ball`/`unknown_target_play_hole`/`invalid_target_id` (ruling, now on the same `{ok,...}` contract). Only true drift/infra (a definition slot with no persisted row) still throws → 500. Route tests assert the diagnostic `code` + `path`, not just the status.
- **Gate green:** **470 pass / 0 fail**; `check:server`/`check:client`/`check:test` clean; `seed:formats`+`render:formats`+`check:format-fixtures` = **20 rounds numerically identical** (no existing fixture exercised per-tee SI; seq/ordinal preserve historical results); architecture ratchet extended (forbids built-in ball plans / config validation / format-id switches in `round-setup/builder.ts` + `compiler/compile.ts`), canary deletion test green.
- **Verify page:** `tmp/formats/slice-2.6d-final-verify.html` (regenerate `bun scripts/render-slice-2.6d-final-verify.ts`) — E1 CH arithmetic, E2a mixed-tee SI, E2b seq replay, E3 opaque ids. **Review and approve, then commit `phase 2.6d-final complete: engine integrity + ADR closure`.**

**Target:** the canonical path from `RoundSetupDraft` through compilation, persistence, event append/replay, materialisation, and results is deterministic and internally consistent. ADR-0001 must hold end-to-end: each format registration owns its setup planning and configuration validation, while generic infrastructure remains format-unaware.

#### E1 — Plugin-owned setup and validation

- [ ] Replace the generic `ballMode:'team' -> alt_shot_pair/avg` setup rule with plugin-owned plans that express each built-in's actual ball-creation requirement. Greensomes must plan `greensomes_pair` with weighted configuration; Scramble must plan `scramble_team` with rank-based configuration for both supported 2-player and 4-player teams. Do not add format-id switches to the generic builder/compiler.
- [ ] Add draft-path regression tests that run Greensomes and 2-player/4-player Scramble through `RoundSetupDraft -> RoundDefinitionBuilder -> compile`, plus at least one `POST /rounds/from-draft` integration test. Assert the emitted strategy id/config, ball CH arithmetic, and successful scoring.
- [ ] Implement real `validateConfig` behavior in each registration that accepts custom format config. Invalid Köpenhamnare `handicapMode`, Umbrella `birdieRule`, and every other declared config field must produce stable compiler diagnostics rather than a scoring-time throw.
- [ ] Add a contract test: any configuration accepted by `compile()` must be consumable by that plugin's `score()` without configuration-shape exceptions. Keep defaulting and validation inside the plugin registration/module per ADR-0001.

#### E2 — Occurrence and score-event integrity

- [ ] Preserve each play-hole tee's effective SI override when `LeaderboardService` builds scoring input. Per-tee occurrence overrides must reach `createRoundContext`; never replace them with `null` or silently fall back to the physical-hole SI.
- [ ] Add a mixed-tee regression fixture where two balls use different SI orders on the same occurrences. Assert displayed SI, strokes-given cells, net score, and points all use the same per-tee effective SI. Include a repeated physical-hole occurrence so identity remains `play_hole_id`-based.
- [ ] Introduce one persisted total order for `score_events` that does not rely on wall-clock timestamps. The scorecard trigger/materializer, event replay, and latest-score reducer must use the same ordering rule, including timestamp ties and superseding edits.
- [ ] Add a regression test inserting multiple edits with identical `recorded_at` values and deliberately non-chronological UUIDs. Assert exact agreement between append order, materialized `scorecards`, replayed latest scores, and final results across repeated reads.
- [ ] Enforce same-round ownership for `score_events.round_id`, `ball_id`, and `play_hole_id`. Validate in the append transaction for structured diagnostics and back it with a database constraint or trigger so non-service writes cannot create cross-round scorecards.
- [ ] Add service and persistence tests proving every cross-round ball/play-hole combination is rejected atomically, while idempotent retry behavior remains unchanged.

#### E3 — Stable IDs stay opaque

- [ ] Remove result-path dependence on the `slot-<N>` naming convention. Resolve slot order from canonical definition/persisted ordering data; `slot_def_id` remains an opaque stable identifier everywhere outside authoring helpers.
- [ ] Add an end-to-end regression using ids such as `main-stableford` and `afternoon-match`: create, score, render results, apply a correction, and re-read without parsing the ids.

#### E4 — Finish the 2.6d engine contract

- [ ] Expose generic server API descriptors/routes for typed corrections and format actions, returning structured diagnostics and preserving `client_event_id` idempotency. The API envelope may dispatch by generic event kind/action type, but must contain no built-in format switch.
- [ ] Add descriptor/route tests for setup correction, allowance override, ruling, format-action append, supersession, invalid payload, wrong slot/round, and idempotent retry. Regenerate the typed client only as contract output; no mobile screens in this phase.
- [ ] Implement the documented allowance-only correction fast path: detect that only one slot's `allowanceConfig` changed, keep ball creation/CH untouched, run only that plugin's `deriveSlotBalls`, and persist the narrow diff. Fall back to full compile for every broader setup correction.
- [ ] Prove the fast path with instrumentation or a spy test that fails if ball-creation strategies or unrelated slots are re-derived. Assert deterministic ids and subsequent setup-correction reconciliation remain unchanged.
- [ ] Reconcile the 2.6d completion record with the delivered behavior after these tasks land; do not mark this phase complete while documentation describes an endpoint, optimization, or invariant absent from production code.

#### Gate

- [ ] All regression tests above fail against the reviewed baseline and pass after the fixes.
- [ ] `bun run check:server`, `bun run check:client`, `bun run check:test`, and `bun test` are green.
- [ ] Rebuild the dedicated fixture DB with `bun run seed:formats`, render from it with `bun run render:formats`, and pass `bun run check:format-fixtures`; all existing expected results remain numerically identical except an explicitly reviewed fixture that previously encoded incorrect behavior.
- [ ] Extend the architecture ratchet so built-in setup planning and config validation cannot migrate back into generic infrastructure. The canary deletion test remains green.
- [ ] Generate one self-contained verification page covering: Greensomes/Scramble draft-derived handicap arithmetic, mixed-tee SI allocation, equal-timestamp score replay consistency, and opaque slot ids. Set `AWAITING VISUAL VERIFY` and stop for explicit approval.

**Completion marker:** `phase 2.6d-final complete: engine integrity + ADR closure`. Only then may 2.6e begin.

### 2.6e — Mobile client: FriendlyRound-first, no-login on-course app (final 2.6 step)

Start only after 2.6b, 2.6c, 2.6d, 2.6d-bis, and **2.6d-final** are complete and visually approved through generated static pages. The canonical static fixtures remain the expected-result oracle throughout this phase.

**Design decision (2026-06-14):** the mobile client is rebuilt as a **zero-login, on-course app**, not a repair of the login-gated wizard. Anyone opens the landing page, creates a round, adds players by name + handicap index + gender, configures one or more format instances, shares a round link, and enters scores trust-based (anyone scores anyone, no identity attached to events). The explicit goal is to **dogfood the engine on real rounds and surface gaps before the identity/auth/standings phases pile complexity on top.**

This pulls the **FriendlyRound wrapper + share-token** — a subset of Phase 3 — forward: the round-creation front door *is* a FriendlyRound. WHS posting and account-bound features stay in Phase 3. Accounts/login become an **optional side door** (own handicap history, later tours/series) that never blocks round creation or scoring.

After 2.6d-final, the engine contracts the client rides on — RoundCompiler, `GET /formats`, `POST /rounds/from-draft` (with diagnostics), ball/play-hole score events, section-driven results, the `round_play_holes` route model, and generic correction/action endpoints — are treated as proven. 2.6e is overwhelmingly client work over those stable server contracts, plus one thin FriendlyRound server slice (M1).

**Agreed flow:**

```
Landing  →  [Create round]                       (no auth)
              ↓
Setup    →  pick course; route (≥ hole count + start hole; presets/shotgun available)
            add players: name · handicap index · M/F   (→ guest_players)
            per-player tee box  →  server derives course/playing handicap
              ↓
Formats  →  add 1..N format instances (slots)
            producers auto-deduced for individual formats;
            declared (team editor) for team formats; allowance per slot
              ↓
Share    →  round link (share_token) — anyone opens, reads, writes
              ↓
Score    →  trust-based: anyone sets any score on any hole for anyone
              ↓
Results  →  per-format result sections in the round
```

**Confirmed decisions (2026-06-14):**
- **No login on the critical path.** Login = side door; nothing auth-gated blocks create/score.
- **Players are `guest_players`**: name + handicap index + gender (M/F). Gender selects the tee rating `(tee_id, gender)`; server derives course/playing handicap from tee slope/CR.
- **Tee box is per player** (`ball_players.tee_id`), not per round.
- **Course + route selectable**: minimum = hole count + start hole. Richer routing (presets, repeated loops, ordered subsets, shotgun) is already supported by `round_play_holes` and surfaced as available, not required.
- **No identities for now**: the round link is the only credential. No creator/owner controls, no kick/lock. Accepted as a known gap — revisit when auth lands.

#### 2.6e execution ledger

| Slice | Status | Commit | Resume note |
|---|---|---|---|
| M1 — No-login shell + FriendlyRound primitive | NOT STARTED | — | `friendly_rounds` wrapper + share_token + no-auth round-scoped access; landing/create-round; login demoted to side door |
| M2 — Players-first setup (course/route + per-player tee + guest players) | COMPLETE | `7e57221` | No-auth `setup` API (`GET /setup/courses`, `/setup/tees/by-course`) unblocks the no-login picker; `/create` rewritten: course + route (Full 18 / Front 9 / Back 9 + non-1 start hole rotates to an explicit route) → players (name·index·M/F·per-player tee) with live derived CH (client `handicap.ts` mirrors server) → submit creates guests + POSTs friendly-rounds → lands in `/round?token=`. Default `stableford_individual` until M3. Dev seed gained a 2nd North tee (Red) for mixed-tee testing + the user's home course **Linköpings Golfklubb** (real scorecard: par 71, 5 rated tees Vit/Gul/Blå/Orange/Röd). Gate oracle `round-from-draft-m2-gate.test.ts` (4 tests): full-18, front-9, non-1 start, mixed tees+genders, CH = WHS. **480 pass**, 3 typechecks green; browser-verified end to end. |
| M3 — Catalog-driven formats (producers + allowances + multi-slot) | COMPLETE | `71bbbc1` (+`fa5f15c`,`427add4`,`07af24f`,`fd0fa2d`) | No-auth `GET /setup/formats` (mirrors the M2 setup reads; same serializable `formatCatalog()` as the auth-gated `GET /formats`) unblocks the no-login picker. New client `FormatCatalogService` (loads descriptors, classifies individual / own-ball-team-grouping / team-ball, derives team size/count). `/create` gained a catalog-driven **Formats** step: 1..N slot cards, format select from the catalog, per-slot allowance (flat + 2.6d-bis split bands), a generic per-player team-assignment editor for team formats (auto-assigned by declared team size), producers auto-deduced for individual formats. Submit builds the draft `formats[]` (formatId/teams/allowance only — never ball-strategy ids) → POSTs friendly-rounds; diagnostics at `formats[i]`, never a 500. Deleted `src/formats.ts` + the legacy auth wizard (`new-round.*`, `/new-round` route); `slot-labels` now reads the server catalog. Gate oracle `round-from-draft-m3-gate.test.ts` (9 tests through the no-login path): individual, own-ball-team, team-ball, multi-slot coalescing, greensomes_pair/weighted, scramble_team/by_rank [35,15] & [25,20,15,10], split allowance persistence, structured diagnostics. **490 pass**, 3 typechecks green, 20 format fixtures unchanged; browser-verified end to end (greensomes 2p + multi-slot stableford-split + 4-player scramble created, reopened by share token, catalog-driven labels). |
| M4 — Ball/play-hole score entry (trust-based) | COMPLETE | `40d7a3b` (+`89562fc`,`7ad44fc`) | No-auth, token-scoped score I/O on `FriendlyRoundService` (`ballsByToken`/`scorecardByToken`/`appendScoreByToken`) + three no-auth endpoints (`GET /friendly-rounds/balls`, `/scorecard`, `POST /friendly-rounds/score`). Identity-less events (`recordedByPlayerId: null`), idempotent on `clientEventId`, same-round ownership = the trust boundary (a token can't reach another round's ball). `/round?token=` gained a golf-serie-style on-course score grid (`ScoreEntryComponent`, ported to `@basics/core`): a swipeable hole-header carousel, per-player rows with running to-par + previous-hole score + a tappable score circle, and a fullscreen dark keypad (1-9 with par highlighted + birdie/par/bogey labels, 10+ stepper, Clear→no-result, Pick up→0) that auto-advances to the next unscored ball then the next hole. Own-ball + single-stream team balls = one entry each; optimistic entry + per-cell save/retry, repeated-hole occurrences are distinct keys, pickup (0) vs no-result (null) preserved. Gate oracle `round-from-draft-m4-gate.test.ts` (kitchen-sink multi-slot: one entry per ball feeds every consuming slot, canonical stableford totals, retry idempotent, repeated-hole occurrences) + `friendly-round-scoring.test.ts` (token read/write + cross-round rejection). **500 pass**, 3 typechecks, 20 fixtures unchanged; browser-verified (enter/persist/navigate/reload/pickup). |
| M5b — Format-dependent score metadata | COMPLETE | `110d54f` | Formats declare per-hole metadata inputs beyond strokes (umbrella GIR/fairway) on the descriptor; the generic keypad captures them. `ScoreEntryCapabilities` upgraded from flat `booleanMetadata`/`numberMetadata` string lists to structured `MetadataInput[]` `{ key, label, kind, appliesWhen }`, where `appliesWhen` is a serializable par/hole predicate (`minPar`/`maxPar`/`pars`/`holes`) the client evaluates — so "fairway only on par 4/5" is **declared, not coded client-side**. `umbrella_individual` declares `gir` + `fairway`(minPar 4); `umbrella_4_ball` declares `gir`. Metadata already rode on the score event's `metadata` blob (materializer explodes it into per-key `MetadataEvent`s; `latestMetadata` last-wins) and the token `POST /score` already accepted it — **no new endpoint**. Client keypad shows a toggle chip per applicable boolean input (GIR every hole, Fairway only par 4/5), seeded from stored state, committed with strokes as the COMPLETE snapshot (so the scorecard's latest blob stays authoritative and turning a toggle OFF persists). Strokes-only formats declare nothing → their keypad is unchanged. **508 pass** (+2), 3 typechecks, 20 fixtures unchanged; live end-to-end metadata round-trip verified. (Closes the M4 `[~]` "drive metadata controls from descriptor capabilities" item.) Follow-ups: `8dcf15f` fixed the entry flow (chips persist on tap + a Done button replaces auto-advance on metadata holes, so marking GIR/fairway after the stroke isn't lost); `5da44d0` normalized umbrella/köpenhamnare **totals** to the trailing player (the running row already was — the ranked + card totals now match it, min→0; `resultDisplay.runningTotals==='normalized'` gate extended to totals in `result-builder`). **509 pass**. |
| M5 — Section-driven results | COMPLETE | `3bb5755` | No-auth, token-scoped `resultByToken` on `FriendlyRoundService` (+ `leaderboardService` dep) → `GET /friendly-rounds/result` mirrors the canonical `LeaderboardService.resultForRound`; `bun run generate` added the `result()` client + section types. `/round?token=` gained a golf-serie-style **Score ↔ Leaderboard** bottom tab bar + an **orange hole-info bar** (Par/Hole/SI + prev/next) on the score tab; hole/group nav state lifted into `RoundViewService` so the carousel and the orange bar share one source of truth. New `LeaderboardComponent` renders a **quick per-format selector** (one pill per scored slot) over a generic section renderer (`result-render.ts`, ported from the static oracle `scripts/render/sections/result.ts`): ranked metrics, match-summary idiom, and the format-aware "full scorecard" cards (route OUT/IN/TOT grouping, footnotes, totals) — the client never interprets a scoring-mode string; an unknown section kind renders a visible diagnostic, never hides results. Server tests: `resultByToken` == direct `resultForRound`, unknown token → null. **506 pass**, 3 typechecks, 20 fixtures unchanged; browser-verified on a 6-slot kitchen-sink round (Stableford/Match play×2/Split sixes/Umbrella/Stroke play). |
| M6 — Dogfood + plugin deletion/extension proof | NOT STARTED | — | Final acceptance: real-round dogfood + full plugin deletion test across server + static + mobile |

**Slice — composition/scoring decoupling (dogfood-surfaced + BUILT 2026-06-17, `docs/adr/0002`):** score a team-composition's balls (scramble/greensomes/foursomes) with stroke/match/stableford — e.g. two scramble teams play match play. SERVER `59676e9`: `DraftFormatSelection` gained `id?`+`ballsFrom?:{ref}`; `scoresAnyBall` descriptor opt-in (stroke/match/stableford) makes the compiler skip the own/team producer-count + ball-mode checks; `strokesGivenForBallPH` generalizes per-ball handicap (match play drops `resolveSingleProducer`; team balls keep the first-producer SI convention, so stroke/stableford needed no scoring change); builder two-pass wires composition-scoring slots' `ballSelector` to the referenced composition's strategy (flat 100%, by-rank team CH carries through). UI `b8d2b6d`: a "Scores" target per scoresAnyBall slot (Each player vs a composition's teams), appears once a composition exists, hides that slot's team/allowance editors. Gate `round-from-draft-composition-scoring-gate.test.ts` + live no-login end-to-end (scramble + match[A 2 UP] + stableford[A 5/B 3] over the teams). **514 pass**, 3 typechecks, 20 fixtures unchanged. Deferred: a true team-SI rule (kept first-producer SI to not alter foursomes/greensomes); allowance override on the scoring slot; broader scoring modes.

**Deferred — format-name i18n (TODO, not scheduled):** the `FormatDescriptor` currently carries a single `label` string (one language). Köpenhamnare ships as English **"Split sixes"** with the Swedish original noted in code. We need per-language display names so the catalog/wizard/results can localize (Swedish "Köpenhamnare" ↔ English "Split sixes", and the same for other formats). Likely shape: replace `label: string` with a localized label set (e.g. `labels: { en: string; sv?: string; … }` or a message-key resolved by a client/locale catalog), keeping the stable `id` as the language-independent key. The serializable-descriptor + one-registry invariants already make this additive — no schema change, no behaviour lookup. Fold into 2.6e M3 (catalog-driven formats) or a small dedicated slice; until then a single English label is intentional.

#### M1 — No-login shell + FriendlyRound primitive

Server (thin, forward subset of Phase 3 — wrapper + token only, NO WHS posting):
- [ ] `friendly_rounds` table: `round_id` (FK unique), `share_token` (unique), `created_at`. `creator_player_id` nullable (no identities yet). 1:1 extension of `rounds`.
- [ ] `friendly-round.service.ts`: `create()` (no auth) → mints a round + share token; `findByToken(token)`; `findById`. FriendlyRound leaderboard = Round leaderboard (no new engine).
- [ ] No-auth, round-scoped access: reads + score-event writes for a round are reachable with only the share token (or open during dogfood — pick the simplest that doesn't gate the flow). Document the trust boundary in the service comment.
- [ ] Descriptor + generated client + route test.

Client:
- [ ] Landing page is **create-a-round**, reachable with no login. App shell, nav, theme intact.
- [ ] Demote login to an optional side door (own handicap history later); never on the create/score path.
- [ ] Surface the share link once a round exists. Opening a share link lands directly in the round (setup if unconfigured, score/results if configured).
- [ ] Start the local server/client processes for the user when visual review is needed; give one clickable localhost link. Never ask the user to run startup commands.

- [ ] **Gate:** create a round with no login, get a share link, open it in a fresh session and reach the round. Static pages remain the correctness oracle.

#### M2 — Players-first setup (course/route + per-player tee + guest players)

- [x] Course picker (real seeded courses) — via the no-auth `setup` API (`courses.api`/`tees.api` stay `requireAuth()`; the no-login flow reads through `GET /setup/courses` + `/setup/tees/by-course`). Halmstad/North + the user's home course Linköpings Golfklubb (real scorecard: par 71, real pars/SI, 5 rated tees) seeded.
- [x] Route editor — presets `full_18`/`front_9`/`back_9` + a start-hole select. A non-head start hole rotates the itinerary into an explicit route carrying an explicit (non-posting) handicap policy. Repeated loops / shotgun remain available via the explicit-route path, not surfaced as dedicated controls yet.
- [x] Players step: add each player with **name · handicap index · gender (M/F)** → `guest_players` (created on submit via the no-auth guest API). Gender selects the tee rating `(tee_id, gender)`.
- [x] **Per-player tee box** selection. CH derived from the chosen tee's slope/CR + index + gender and shown live with visible arithmetic (`index × slope/113 + (CR − par)`); client `src/create/handicap.ts` mirrors `server/domain/handicap.ts`, and the server re-derives authoritatively at compile.
- [x] Build a `RoundSetupDraft` from course/route/players/tees. Compiler/planner diagnostics surface at the offending control (path-tagged `producers[i]`) + a general banner; never a 500.

- [x] **Gate:** full-18, front-9, non-1 start hole, and mixed per-player tees + genders all create valid rounds; derived CH matches WHS. Proven by `server/services/round-from-draft-m2-gate.test.ts` (4 tests) and browser-verified end to end (Ann Yellow-M idx 8 → CH 9; Bea Red-F idx 20 → CH 21). _User-confirmed 2026-06-16._

#### M3 — Catalog-driven formats (producers + allowances + multi-slot)

- [x] Replace `src/formats.ts`, `pairBall`, `needsTeams`, and client-side `RoundDefinition` construction with a `FormatCatalogService` backed by `GET /formats`. → `src/create/format-catalog.service.ts` reads the no-auth `GET /setup/formats` (same `formatCatalog()`); `src/formats.ts` + the legacy auth wizard (`new-round.*`) deleted; `slot-labels` now resolves labels from the catalog service.
- [x] Render labels, descriptions, allowance defaults, producer/participant bounds, and grouping requirements from descriptors. → the Formats step renders the format select, description, and team editor bounds straight from the descriptor; `FormatCatalogService.classify()` derives the team size/count.
- [x] Producers **auto-deduced for individual formats** (producer = player). For team formats, a generic team-assignment editor driven by the declared team count/size replaces the fixed A/B editor. → individual formats omit `producerDefIds` (whole roster); team formats render a per-player team-bucket editor sized by the descriptor, auto-assigned by min team size on add/format-change.
- [x] Add 1..N format instances (slots); per-slot allowance config (flat + the 2.6d-bis split bands). Submit the full `RoundSetupDraft` → `POST /rounds/from-draft`; surface planner/compiler diagnostics at the relevant control. → slot cards add/remove; flat + split-band allowance editor per slot; submit builds `formats[]` and POSTs friendly-rounds; diagnostics shown inline at `formats[i]` + general banner. (Generic scalar/choice/table config + per-format client adapters remain for a later slice — no built-in needs one yet.)
- [x] Keep ball creation server-owned: the client submits format id, producers/teams, format config, and allowance only. It never chooses or reconstructs ball-strategy ids/configs; the registered format plugin's `planSetup` supplies those details. → the draft carries only `formatId`/`teams`/`allowanceConfig`; every strategy id (own_ball_per_player, alt_shot_pair, greensomes_pair, scramble_team) is chosen by the server's `planSetup`, asserted by the gate test.

- [x] **Gate:** create and reopen individual, own-ball team, team-ball, multi-slot, repeated-hole, custom-SI, and shotgun rounds. Explicitly create Greensomes, 2-player Scramble, and 4-player Scramble through `POST /rounds/from-draft`; verify the persisted definitions use the server-planned `greensomes_pair`/weighted and `scramble_team`/by-rank strategies and that displayed ball CH arithmetic matches the approved engine fixtures. → `server/services/round-from-draft-m3-gate.test.ts` (9 tests through the no-login `FriendlyRoundService.create` path) asserts the persisted `ballStrategies` use the server-planned strategy ids/derivation (greensomes_pair/weighted 60-40; scramble_team/by_rank [35,15] and [25,20,15,10]; coalesced own_ball_per_player across multi-slot) and that ball CH matches the approved fixtures (greensomes 12, scramble 6/10). Route variety (repeated-hole/custom-SI/shotgun) rides the M2 explicit-route path already proven by `round-from-draft-m2-gate.test.ts`. Browser-verified end to end. _User-confirmed 2026-06-16._

#### M4 — Ball and play-hole score entry (trust-based)

- [x] Treat the ball pool as the entry surface: one score per unique `ballId + playHoleId`, regardless of how many slots consume it. **Anyone with the share link can set any score for anyone** — no identity attached to events. → no-auth `appendScoreByToken` resolves token→round and writes via `scoreEventService.append` with `recordedByPlayerId: null`; the same-round ownership check is the trust boundary. The gate proves one entry per ball feeds every consuming slot.
- [x] Navigate each playing group in effective itinerary order; label the physical course hole and repeated occurrence clearly. → `/round?token=` hole-stepper walks `playingGroups[].playedOrder`; header shows `Hole {occurrenceLabel}` + `Par · SI`; group tabs appear only when >1 group.
- [x] Group own-balls and team-balls without duplicate entry controls. Stop attaching producer source ids to ordinary own-ball score events. → one strokes entry per ball (own-ball = 1 producer; single-stream team balls — foursomes/greensomes/scramble — show joined producer names, one entry); events carry no `sourcePlayerId` (the per-source multi-stream topology isn't produced by the M3 create flow's `planSetup`).
- [x] Drive generic strokes and simple metadata controls from descriptor capabilities. Format actions use the generic 2.6d append/replay endpoint through an optional adapter command interface. → strokes entry (incl. pickup 0 vs no-result empty) shipped in M4; **per-hole metadata controls landed in M5b** (`110d54f`): formats declare `requirements.scoreEntry.metadata` (`MetadataInput[]` with a serializable `appliesWhen` par/hole predicate) and the generic keypad renders toggle chips for them (umbrella GIR/fairway). The optional format-action **adapter command interface** remains deferred until a built-in needs an in-round action surface (the generic `format_action_events` append path already exists server-side; no M3-buildable format requires it yet).
- [x] Preserve optimistic entry, offline/error recovery, and `client_event_id` idempotency. Two visits to one physical hole must remain separate client state keys. → optimistic per-cell overlay with save/retry status; failed cell reuses its `clientEventId` so a retry dedupes; `$each` keyed by `ballId|playHoleId` so each occurrence is a distinct input.

- [x] **Gate:** the kitchen-sink topology enters every ball once per occurrence, updates every consuming slot, survives retry, and matches the canonical static result. → `server/services/round-from-draft-m4-gate.test.ts`: a 4-player stableford-individual + better-ball round shares the four own-balls across both slots; scoring each ball once per occurrence through the token path yields the canonical stableford totals in BOTH slots (individual [0,36,36,54]; teams [36,54]), 72 events with no per-slot duplication, byte-identical result on full replay, and two visits to one physical hole score independently. `friendly-round-scoring.test.ts` adds token read/write + cross-round-write rejection. _User-confirmed 2026-06-16._

#### M5 — Section-driven mobile results

- [x] Replace `byScoringType + pairResults` with ordered per-slot views carrying `slotDefId`, `formatId`, descriptor label, and canonical result sections. → `LeaderboardComponent` renders the token-scoped `RoundResult.slots`; a per-format selector flips between slots. The legacy `byScoringType+pairResults` path was already retired server-side (2c); the legacy `/results` + `/score` auth routes remain as dead stubs for M6 deletion (the new surface lives in `/round?token=`).
- [x] Generic views cover ranked metrics, matches, segments, contributors, awards, carry pools, state, and point/unit transfers. The client never interprets scoring-mode strings. → `src/round/result-render.ts` (ported from the static oracle `scripts/render/sections/result.ts`) lays out `RankedSection` + `MatchSummarySection` + `ScoreGridSection` generically; it branches only on `section.kind`, never on a format id. Browser-verified ranked (Stableford points), match-summary idiom (Match play "X vs. Y, 2 UP thru 3"), and format-aware scorecards.
- [x] Build navigation from slots, including pair/state-only slots with no scalar metric. Missing custom adapters fall back to a visible structured diagnostic instead of hiding results. → the format selector is built from `result.slots`; an unrecognised `section.kind` renders an `.lb-diag` structured diagnostic ("Unrenderable result section … — Results are not hidden") rather than vanishing.
- [x] Show route summary, SI provenance, repeated occurrences, and itinerary-derived totals/sections consistently with static pages. → score-grid cards group columns by the round's frozen `routeSections` (OUT/IN/TOT) and carry the server-built subtitle facts, per-hole footnotes, and totals — same machinery as the static renderer (the static fixtures remain the numeric oracle). The orange hole bar surfaces per-occurrence Par/Hole label/SI on the score tab.

- [x] **Gate:** selected high-risk mobile results match their approved static equivalents numerically and structurally. → the client renderer consumes the SAME canonical `RoundResult` the static oracle renders (server `resultByToken` == `resultForRound`, asserted in `friendly-round-scoring.test.ts`); browser-verified a 6-slot kitchen-sink round (Stableford / Match play ×2 / Split sixes / Umbrella / Stroke play) — ranked totals, match lines, and scorecard arithmetic match the canonical sections. _Awaiting user scenario confirmation._

#### M6 — Dogfood + plugin deletion/extension proof

- [ ] **Dogfood:** play a couple of real on-course rounds end to end (create → players → formats → share → score → results) with no login. Capture any engine gap surfaced (handicap edge cases, format behaviour, route handling) as notes against the relevant phase — this is the whole point of going FriendlyRound-first.
- [ ] Delete legacy client catalogs, labels, decomposition logic, and format switches made obsolete by descriptors/adapters.
- [ ] Add client tests for catalog-driven setup, team validation, mixed topology, repeated routes, generic sections, pair-only results, format actions, and missing-adapter fallback.
- [ ] Perform the full plugin deletion test across server + static + mobile: deleting the module and central registrations removes every production trace without editing generic infrastructure.
- [ ] Verify narrow and wide viewport flows, but give the user a focused review brief rather than every permutation.

**Final 2.6e gate:**

- [ ] All checks/tests and canonical fixture workflows are green.
- [ ] Static verification pages remain the approved arithmetic/result oracle.
- [ ] No-login flow works end to end: create → players → formats → share link → trust-based scoring → per-format results, with login never on the critical path.
- [ ] One canonical server registry; generic formats require no client code; special formats require at most one colocated adapter + one client registration.
- [ ] Agent starts the local app and gives one clickable browser link plus 2–5 required scenarios with exact expected outcomes. Full mobile browsing is not delegated to the user.
- [ ] User confirms the focused scenarios; commit `phase 2.6e complete: no-login friendly-round mobile client`.

---

## Phase 3 — FriendlyRound

**Spec:** §4 (FriendlyRound).

**Note (2026-06-14):** the `friendly_rounds` **wrapper + `share_token` + no-auth round-scoped access** were pulled forward into **2.6e M1** so the mobile client could ship as a no-login on-course app. Phase 3 now layers the **account-bound** parts on top: `creator_player_id` becoming meaningful, `post_to_handicap`, WHS posting + eligibility, and the authenticated guest-join. Reconcile the M1 table with this list (add `post_to_handicap`, populate `creator_player_id`) rather than recreating it.

- `friendly_rounds` 1:1 extension of `rounds`: round_id (FK unique), creator_player_id, share_token (unique), post_to_handicap (boolean). (Wrapper + token already exist from 2.6e M1.)
- Share-token join flow: guest creates a `guest_player`, joins via token, reads scoped to the round. (Open trust-based join exists from M1; this adds the account-aware path.)
- WHS posting: if `post_to_handicap`, a completed round writes to `handicap_history` via `handicap.service`.
- WHS posting first evaluates the frozen route policy. Standard eligible routes post normally; custom/repeated/subset routes without valid route rating/slope/par treatment complete and score normally but return a visible `route_not_whs_eligible` result instead of manufacturing a handicap record.
- FriendlyRound leaderboard = Round leaderboard. No new engine.

**HTML render expectations:**
- Round page header shows the FriendlyRound wrapper metadata: creator, share token, `post_to_handicap` flag.
- If the round is completed and `post_to_handicap` is true, the post-round section shows the WHS entries that would/did get written to `handicap_history` per participant, with the arithmetic.
- Index page distinguishes friendly rounds from plain rounds (badge / column).
- Seed: `friendly-round-with-posting` — creator + guest join via share token, standard eligible route completes, handicap history row appears.
- Seed: `friendly-custom-route-not-postable` — repeated/custom-SI route completes with results but no handicap history write; page shows the exact ineligibility reason.

**Mandatory stop + focused visual review.** Generate the FriendlyRound verification page, give one clickable link, and ask the user to check only wrapper identity/share behavior plus the contrast between eligible posting and `route_not_whs_eligible`. Commit after approval: `phase 3 complete: friendly round`.

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
