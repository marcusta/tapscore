# Tapscore Manage — design and feature description

Status: proposal, agreed direction (2026-08-03)
Companion plan: [manage-ui-plan.md](manage-ui-plan.md)

## 1. What this is

A second web SPA — **Tapscore Manage** — for people who administer the golf
catalog and, later, competitions, tours and leagues. It is deliberately not
part of the player-facing SPA: different audience, different layout language,
different growth path. Course management is the first function; the shell is
designed so that further functions (competitions, tours, leagues, operations)
mount as new sections without re-architecture.

### Decisions already made

| Decision | Ruling |
|---|---|
| One SPA or many | **One management SPA.** Management functions cross-reference (a competition picks a course, a tour references competitions); per-function SPAs would duplicate shell, auth, theme and API clients and turn every cross-link into a page load. |
| Relationship to player SPA | Separate build, separate entry, same repo, same deploy, same origin. Never bundled together. |
| Framework | `@basics/core`, same as everything else. |
| Auth | Same session cookie — signed in to the player app means signed in here. Authorization is a separate question: without a relevant role grant the app shows a permission-denied screen, and every write is server-gated regardless. |
| Look and feel | Desktop-first but fully responsive, and unmistakably **Tapscore**: same brand tokens (brass accent, fairway-green actions, terracotta danger, radius, typography), light and dark. Density comes from spacing, not smaller touch targets. |
| URL | `https://…/tapscore/manage/`. `/admin` stays with the existing observer page in the player SPA. |

## 2. Architecture

### 2.1 Build and serving

- New top-level client dir `manage/` (sibling of `src/`): own `index.html`,
  `main.ts`, theme entry, routes, feature dirs. Mirrors the `src/` layout
  conventions (component + service per feature, DI singletons, slot-id rules).
- Own Vite config `vite.manage.config.ts`:
  - `base`: `/tapscore/manage/` in production, `/manage/` in dev.
  - `outDir`: `public/manage`.
  - Same `optimizeDeps.exclude: ['@basics/core']` and `/api` proxy as the
    player config.
- **Build-order trap:** the player build has `emptyOutDir: true` on `public/`,
  which wipes `public/manage`. The canonical build is one script that builds
  the player app first, then the manage app:
  `vite build && vite build -c vite.manage.config.ts`. Both outputs are
  committed (the deploy has no build step) — after any client change, rebuild
  and commit `public/` including `public/manage/`.
- Server (`server/main.ts`): register a `/manage/*` SPA fallback to
  `public/manage/index.html` **before** the existing catch-all fallback to
  `public/index.html`. The existing `serveStatic({ root: './public' })` already
  serves the hashed assets.

### 2.2 API access

- The manage app reuses the generated clients in `src/api/*.gen.ts` — they are
  plain typed wrappers and the single source of truth for API shapes. Do not
  generate a second copy.
- **Base-path trap:** `src/api-base.ts` derives the API root from Vite
  `BASE_URL`. Under the manage base that computes `/tapscore/manage/api`,
  which is wrong. The manage app gets its own `manage/api-base.ts` that strips
  the trailing `manage/` segment (prod → `/tapscore/api`, dev → `/api`), and
  its own thin `manage/api.ts` wiring the shared generated clients to it.
  Whether that means a parameterized base in the generated clients or a small
  wiring shim is an implementation detail — the invariant is: one set of
  generated clients, two base paths.

### 2.3 Authorization

- Gate on the server, present on the client — the standing rule.
- Server-side everything needed already exists: `CourseManagementAuthz`
  (`course_admin` or `super_admin`, unscoped) gates every club/course/tee/
  tee-role write; reads are open per the app's trust model.
- On boot the manage shell loads `GET /api/me/roles` (caller-scoped, safe for
  anyone). No `course_admin`/`super_admin` → full-screen permission-denied
  state with the grant hint (`bun run grant:role grant <username>
  super_admin`), same tone as the existing `/admin` denied state. Signed out →
  the framework auth flow, same as the player app.
- Future sections declare which grants unlock them; the shell shows only
  unlocked sections (presentation), while each API stays gated (the gate).

### 2.4 Theme sharing

- Extract the Tapscore token set out of `src/theme.ts` into a shared module
  (e.g. `src/theme-tokens.ts` or `shared/theme-tokens.ts`) consumed by both
  apps: palette (brass `accent`, fairway action tokens, terracotta `danger`),
  radius, typography, and the `bridgeLegacyControls` call. The player theme's
  public API must not change (zero visual diff — this is a pure extraction).
- The manage theme composes those tokens and adds management-only additions:
  a denser spacing scale and table styles. Vocabulary split stays as ruled:
  `accent` decorative, action tokens for buttons, `danger` for destructive.
- ADR-005 recipe-first ordering applies verbatim in all new css blocks.

### 2.5 Responsive strategy

Desktop-first layouts that degrade cleanly — no separate mobile design:

- **Shell:** persistent sidebar nav (sections + within-section nav) above the
  breakpoint; below it, a top bar with a drawer. One breakpoint, not three.
- **Tables:** the workhorse surface. One shared responsive table/list
  component: real columns wide, stacked cards narrow. Built once in M0 because
  clubs, courses, tees — and later competitions — all need it.
- **Forms:** single-column by default; side-by-side field pairs only above the
  breakpoint. Mobile needs no special casing.
- **Editing grids** (holes, tee lengths): horizontally scrollable within their
  own container on narrow screens — the page body never scrolls sideways.
- Touch targets keep player-app sizes everywhere. The real usage pattern
  includes a course admin fixing a tee value from a phone in the sim hall.

All controls follow [docs/design-guidelines.md](../design-guidelines.md):
chips only for ≤3–4 bounded options, dropdowns for longer lists, words over
symbols, worded annotations.

## 3. Feature spec — v1: Course management

The server API is already complete for all of this (clubs/courses/tees CRUD,
hole updates, tee-role set/clear, validation), gated by
`CourseManagementAuthz`. v1 is client work plus small server hardening
(§3.7).

### 3.0 Data model (existing — authoritative shapes in `server/db/schema.ts`)

- **Club** — name, location?, logo_url?; has courses.
- **Course** — club_id, name, hole_count; has `course_holes` (hole_number,
  par, stroke_index), tees, tee-role mappings, route templates. **v1 adds a
  GPS position** (§3.3a): nullable `latitude`/`longitude` columns, WGS84
  decimal degrees.
- **Tee** — course_id, name, colour?; has `tee_hole_lengths` (per-hole
  length_m, stroke_index_override?) and `tee_ratings` per gender
  (course_rating, slope, par, total_length_m).
- **Tee role** — global catalog (`tee_roles`: Club / Tournament / Beginner,
  data-backed and open). `course_tee_roles` maps (course, role_key, gender) →
  tee; the tee must belong to the course and carry a rating for that gender
  (service-enforced, not FK-expressible).

### 3.1 Shell and navigation

- Sections list with **Courses** as the only v1 section; the section registry
  is the extension point for Competitions/Tours/Leagues.
- Breadcrumb within a section: Clubs → {Club} → {Course} → (tab).
- Deep-linkable routes for every screen (club, course, course tab).
- Permission-denied screen per §2.3; loading and request-failure states use
  the same patterns as the player app.

### 3.2 Clubs

- List all clubs with client-side search/filter (name, location) and course
  counts.
- Create club (name required; location, logo URL optional).
- Edit club fields inline on the club page.
- Delete club — confirm dialog stating consequences; blocked with a clear
  message when the club still has courses (§3.7).

### 3.3 Courses

- Club page lists its courses with hole count, tee count and a **readiness
  badge** driven by `GET /courses/validate` (ok / issues).
- Create course under a club: name + hole count; holes initialized by the
  existing service defaults.
- Edit course name and hole count (hole-count change follows the existing
  service semantics for adding/removing holes).
- Delete course — confirm dialog; blocked when referenced (§3.7).

### 3.3a Course GPS position (owner addition, 2026-08-03)

- New nullable `latitude` / `longitude` REAL columns on `courses` (WGS84
  decimal degrees; additive migration). Nullable is deliberate — a course
  without a position is complete, never flagged as an error.
- Purpose: future proximity features — the player app suggesting nearby
  courses when starting a round. That consumer is **out of scope here**; v1
  only captures and edits the data.
- Manage UI: one "Coordinates" text field on the course form, accepting a
  pasted `"57.7089, 11.9746"` pair (the shape Google/Apple Maps copy out),
  parsed and validated server-side (lat −90..90, long −180..180, both-or-
  neither) and shown re-formatted; clearable. One field, not two — pasting
  from a map is the real workflow, nobody types the halves separately.
- Course-level, not club-level, per the owner's call: two courses at one
  club can sit apart, and a round is played on a course. A club-level
  fallback can be derived later if a consumer wants it.

### 3.4 Holes editor

- Grid over all holes: hole number, par, stroke index. Inline editing, one
  hole per row (server API is per-hole update; batch UI, per-row saves).
- Front/back/total par summaries recomputed live.
- Stroke-index sanity surfaced from the validation endpoint (duplicates,
  gaps) rather than re-implemented client-side; the panel in §3.6 is the
  single presentation of it.

### 3.5 Tees editor

- Tee list per course: name, colour swatch + name (worded, per design
  guidelines), rated genders, total lengths.
- Create/edit/delete tee. Editing covers:
  - name and colour;
  - per-hole lengths in metres (grid, same interaction pattern as §3.4),
    including the optional per-hole stroke-index override;
  - ratings per gender: course rating, slope, par, total length — with an
    explicit "no rating for this gender" state (a tee rated for men only is
    legitimate).
- Delete tee: blocked when a tee-role mapping points at it, with a message
  naming the mapping (§3.7).

### 3.6 Tee roles (the headline feature)

- Per-course matrix: rows = role catalog (Club, Tournament, Beginner — read
  from `GET /courses/tee-roles/catalog`, never hardcoded), columns = gender
  (Men, Women). Each cell selects one of the course's tees or "not set".
- Only tees carrying a rating for that gender are offered — mirror of the
  server rule, which stays the authority.
- Clear a mapping explicitly (DELETE endpoint exists).
- Contextual explanation of what roles do (round setup resolves role → tee →
  snapshot), following the ⓘ-popover ruling: live data in the popover — e.g.
  which tee a "Club / Men" round would get right now.
- This supersedes the minimal `/course-setup` page in the player SPA: once
  this ships, the player-app account-menu entry points at the manage URL and
  `src/course-setup/` is deleted.

### 3.7 Server hardening (small, v1)

- `ClubService.remove` / `CourseService.remove` / `TeeService.remove` are
  bare deletes today. Add reference guards in the services (block with a
  clear error naming the blocking references: courses under a club, and
  players holding it as their home club — that FK has no ON DELETE and would
  otherwise surface as a raw 500; rounds, templates or tee-role mappings
  under a course; role mappings under a tee).
  Historical rounds snapshot course data, so this is about integrity of the
  authoring catalog, not about protecting past scorecards — the error copy
  should say what actually blocks.
- Route-level tests for the guards next to the existing
  `course-management.routes.test.ts`.

### 3.8 Explicitly deferred (named so they don't creep in)

- **Route-template editing** — `course_route_templates` has an API but
  `definition_json` authoring is its own project. v1 shows a read-only list
  on the course page so admins can see what exists.
- **Tee-role catalog administration** (adding a fourth role) — data-backed by
  design; defer the UI until a real role is needed.
- **Logo upload** — v1 keeps the URL field; binary upload is its own slice
  (the avatar pipeline is the precedent when we want it).
- **Audit trail** ("who changed hole 7") — competitions have audit events;
  catalog auditing waits until multiple admins actually exist.
- **Club-scoped course_admin grants** — deferred in `course-management-authz`
  already; revisit when clubs have owners.
- **CSV/bulk import, course duplication** — nice-to-haves, none blocking.
- **Course archive/deactivate** — a course with rounds is permanently
  undeletable (`rounds.course_id` is RESTRICT; the guard turns the 500 into
  a clear 409). Retiring such a course from pickers is an archive flag, a
  deliberate future decision — the UI should not present Delete as a live
  affordance for it.

## 4. Quality bar

- `bun run check:client` covers `manage/` (tsconfig wiring in M0).
- Component/service tests for list/edit/matrix logic in the established
  client-test style; server guard tests per §3.7.
- Both themes, both widths (desktop + mobile breakpoint) verified in the
  browser before a milestone closes.
- The deploy artifact rule extends to `public/manage/`: rebuild and commit
  together with source changes.
