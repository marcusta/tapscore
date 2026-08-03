# Tapscore Manage — implementation plan

Spec: [manage-ui.md](manage-ui.md). Read it first; this file only says who
builds what, in which order.

## Working model

- Each task below is scoped for one **implementation sub-agent**; every task
  has a paired **review sub-agent** with its own focus list. Implementers and
  reviewers are always different agents; the main session arbitrates disputes
  and lands the result.
- Implementers read `AGENTS.md`, the spec, and the referenced framework docs
  before writing code. Reviewers verify against the spec section named in
  their task, not against the implementer's summary.
- Every task ends green on `bun run check:client`, `bun run check:server`,
  and `bun run test` (or the affected subset), with the verification steps
  listed in the task run and reported honestly.
- Tasks within a milestone marked ∥ can run in parallel. Route-table and
  script wiring conflicts are resolved by the main session at merge time.

## Milestone 0 — Foundation (serial: T0 → T1 → T2, then T3)

### T0 — Build plumbing and serving
Two-line change philosophy: after this task, an empty manage app builds,
deploys and serves; nothing visible changes for players.
- `manage/` dir with `index.html` + minimal `main.ts` ("Tapscore Manage"
  placeholder), `vite.manage.config.ts` per spec §2.1 (base, outDir
  `public/manage`, optimizeDeps, proxy).
- `package.json`: `build` becomes player-then-manage (§2.1 build-order trap);
  `dev:manage` script for a manage dev server on its own port.
- `server/main.ts`: `/manage/*` fallback to `public/manage/index.html`
  registered before the existing catch-all.
- tsconfig wiring so `check:client` covers `manage/`.
- `manage/api-base.ts` + `manage/api.ts` per spec §2.2 (base-path trap).
- Build and commit `public/` including `public/manage/`.
- **Verify:** dev server serves both apps; built server serves
  `/manage/` deep links and `/` player routes; player bundle byte-identical
  aside from build metadata.

**T0-R (review):** build-order trap actually handled (run `bun run build`
twice, confirm `public/manage` survives); fallback ordering vs the player
catch-all; API base resolves to `/tapscore/api` under the prod base and
`/api` in dev; no player-app behavior change.

### T1 — Shared theme tokens
- Extract Tapscore tokens from `src/theme.ts` into the shared module (spec
  §2.4). Pure refactor for the player app: its theme exports keep identical
  names and values.
- Manage theme entry composing the shared tokens + denser spacing scale +
  table style tokens. Both color schemes.
- **Verify:** player app visual spot-check both themes (create round →
  scorecard → settings); grep confirms no orphaned token literals.

**T1-R:** zero-diff guarantee on the player theme (compare emitted CSS custom
properties before/after); bridge call still made once; new manage tokens
follow the accent/action/danger vocabulary split; ADR-005 ordering in any new
css.

### T2 — Shell, navigation, authorization
- Manage shell per spec §3.1: sidebar ↔ drawer responsive nav, section
  registry with Courses as sole entry, breadcrumbs, router with deep-linkable
  routes, loading/failure states.
- Roles bootstrap on boot (`/api/me/roles`), permission-denied screen per
  spec §2.3. Reuse the AdminService pattern (caller-scoped roles are safe to
  fetch for anyone; management payloads only fetched inside gated screens).
- **Verify:** signed-out, role-less, and course_admin flows in the browser;
  drawer at mobile width; both themes.

**T2-R:** gate-vs-presentation boundary (no admin fetch before the role
check; 403 still handled if roles change mid-session); responsive shell at
both widths; design-guidelines conformance (words over symbols, control
choices); route structure extensible for future sections.

### T3 — Shared responsive table + form primitives
- The table/list component (columns wide, stacked cards narrow), inline-edit
  row pattern, confirm-destructive pattern, and the editing-grid container
  (horizontal scroll within its own box) per spec §2.5.
- Component tests for the collapse behavior and edit-state transitions.
- **Verify:** storybook-style fixture page or component tests; both widths.

**T3-R:** touch-target sizes preserved at density; recipe-first CSS; API of
the primitives generic enough for competitions later (no course-specific
leakage); tests actually exercise narrow mode.

## Milestone 1 — Course management (after M0; T4 ∥ T5; then T6 ∥ T7 ∥ T8)

### T4 — Clubs (spec §3.2)
List + search, create, inline edit, delete with confirm. Delete-blocked
messaging consumes the T9 guard errors (until T9 lands, surface the server
error as-is).

**T4-R:** search is client-side and stays responsive with the full club list;
form validation states; error surfaces on every write; both widths/themes.

### T5 — Courses on the club page (spec §3.3)
Course list with readiness badge (`/courses/validate`), create, edit
name/hole-count, delete with confirm.

**T5-R:** hole-count edit follows service semantics (no client-side hole
fabrication); badge states match the validation payload (`ok` vs error vs
warning); navigation from list → course detail.

### T6 — Holes editor (spec §3.4)
Par/SI grid with per-row saves, live front/back/total summaries, validation
panel presenting `/courses/validate` issues.

**T6-R:** per-hole API used correctly (no phantom batch endpoint); optimistic
vs confirmed state on row save; validation re-fetched after edits; grid
scroll containment on narrow screens.

### T7 — Tees editor (spec §3.5)
Tee list, create/edit/delete, per-hole length grid with SI override, ratings
per gender including the explicit unrated-gender state.

**T7-R:** the unrated-gender state is a real state (not zero-filled); update
payload shape matches `UpdateTeeInput` (lengths + ratings together);
colour presented worded per design guidelines; delete-blocked path when a
role mapping exists.

### T8 — Tee-role matrix (spec §3.6) — the headline feature
Role × gender matrix from the catalog endpoint, rated-tees-only options,
explicit clear, ⓘ popover with live resolution ("Club / Men resolves to →").
Supersession: player-app account-menu entry now links to the manage URL;
`src/course-setup/` deleted; player `public/` rebuilt.

**T8-R:** catalog-driven rows (a fourth role appears without code change);
eligibility mirrors the server rule but the server remains the authority
(409/400 handled); supersession complete — no dead route, no dangling
imports, account-menu link correct in prod base path.

## Milestone 2 — Hardening and closure (T9 can start with M1)

### T9 — Delete-reference guards, server (spec §3.7) ∥ with M1
Guards in Club/Course/Tee remove paths with reference-naming errors; route
tests beside `course-management.routes.test.ts`.

**T9-R:** guard queries cover all reference kinds listed in the spec; error
copy names the actual blocker; no behavior change for unreferenced deletes;
tests fail without the guards.

### T10 — Integration pass and deploy artifact
Empty states, cross-links, breadcrumb correctness, request-failure retry
paths; full QA walk (both themes, both widths: clubs → course → holes → tees
→ roles); rebuild and commit `public/` + `public/manage/`.

**T10-R (final review, wider lens):** walk the spec top-to-bottom as a
checklist; confirm deferred items (§3.8) did not creep in; confirm the
committed `public/` matches source (`bun run build` produces no diff).

## Sequencing summary

```
T0 ─ T1 ─ T2 ─┬─ T3 ─┬─ T4 ∥ T5 ─┬─ T6 ∥ T7 ∥ T8 ─ T10
              │      │           │
              └──────┴─ T9 ──────┘        (T9 parallel to M1)
```

Milestone gates: after M0, owner eyeballs the shell (feel check — "is this
Tapscore?") before M1 effort is spent. After T8, owner walks the tee-role
flow before T10 closes.
