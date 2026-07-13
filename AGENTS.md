# tapscore — Agent Instructions

Greenfield rebuild of `~/dev/github/golf-serie`. Domain model is in `REWRITE_DOMAIN_SPEC.md` at this repo root — read it before designing entities. Phase plan is in `PHASES.md` — follow it top-to-bottom, stop at the gates.

## Framework

Built on a committed, self-contained snapshot of `@basics/core` in
`vendor/basics-core`. The sibling checkout at `~/dev/github/mackans-client-fw`
is the upstream source used when deliberately refreshing that snapshot. Follow
the framework conventions verbatim:

- `~/dev/github/mackans-client-fw/CLAUDE.md` — framework overview and invariants
- `~/dev/github/mackans-client-fw/docs/server-guide.md` — server-side patterns (service shape, query inventory, migrations, auth)
- `~/dev/github/mackans-client-fw/docs/agent-guide.md` — client-side canonical recipe
- `~/dev/github/mackans-client-fw/docs/app-patterns.md` — app composition

The starter app `~/dev/github/mackans-client-fw/apps/starter` is the reference
layout. Mirror it. Runtime imports, API generation, affected-test selection, and
normal verification must use the committed `vendor/basics-core` adapter; they
must not silently follow the sibling checkout's HEAD.

## Tapscore-specific rules

- **One `players` table** for logged-in people. Fields live together (auth + identity + handicap_index). Handicap history goes in its own append-only table. Guest players (FriendlyRound, no login) go in a separate `guest_players` table. Role grants are a junction table. In app code, the word "user" only appears inside framework auth plumbing; everywhere else, say "player".
- **Rounds are ball-native.** A round definition declares producers; compilation
  creates `balls` and `ball_players`. Each `ball_players` identity uses two
  nullable FKs (`player_id` xor `guest_player_id`), never a discriminator string.
  Do not reintroduce the retired `participant_players` model; its remaining
  mentions are migration-history bridges only.
- **Snapshot at time of play** — `ball_players` carries frozen copies of identity,
  handicap index, course handicap, tee, and category; per-slot `slot_balls`
  carries the frozen playing handicap. Results never recompute from live player
  data.
- **Score events are source of truth** — `score_events` is append-only;
  `scorecards` is a materialised view. The event log replays exact state; client
  writes are idempotent via `client_event_id`.
- **Format strategies are pluggable** — scoring mode × team shape axes. New format = new strategy file + registration. No schema change.
- **Result render vocabulary is closed + presentation-only, and is wired.**
  `server/domain/strategies/result-vocabulary.ts` defines the closed tones,
  markers, grid-component ids, and smart constructors used by the live
  `result-sections.ts` contract. Format presenters emit these hints (for example
  `marker.diamond(...)`), and both static and client renderers consume them
  without format-id branching. Golf meaning belongs in labels, never token names
  such as `birdie` or `win5`. `result-sections-vnext.ts` is now only an
  unreferenced Phase-0 design artifact; do not mistake it for the live contract.
  The live types are the source of truth; do not restate the token list in docs.
- **Format verification uses the canonical fixture workflow** — when working on formats, do not rely on whatever happens to already be in `data/app.sqlite`. Rebuild the dedicated fixture DB with `bun run seed:formats`, then render from that same fixture set with `bun run render:formats`.
- **Phase order is fixed** — see `PHASES.md`. Stop and hand-test between phases; do not skip ahead.
- **FK-target migrations precede dependents, regardless of phase narrative.** SQLite runs with `PRAGMA foreign_keys = ON`, which validates the parent table's existence on *every write* to the referencing table — even when the FK column is NULL. If a phase's narrative order puts an entity before the one it references, land the referenced table's migration first (it can ship with an empty service and fill out later). Example: Phase 1b extends `players` with `home_club_id` → `clubs(id)`, but `clubs` isn't introduced until 1c; the clubs migration lands as `002_create_clubs.ts` before the extend-players migration.
- **Reserved columns are not added twice.** If an earlier migration reserved a
  plain nullable TEXT column for a later FK (currently
  `competitions.point_template_id`), the later phase must create the parent and
  then rebuild the SQLite table with the FK or install an explicit equivalent
  integrity mechanism. Never attempt `ADD COLUMN` with the same name.

## Dependencies

`@basics/core` is installed via `file:./vendor/basics-core`. Behaviour:

- Framework changes land only through `bun run vendor:basics`, which copies the
  sibling framework into `vendor/basics-core`. Review and commit the vendored
  diff, then run `bun install`; deploys and fresh clones need no sibling checkout.
- `generate`, `test:affected`, runtime imports, and `test:framework` all consume
  the vendored snapshot. The sibling checkout is required only to refresh the
  snapshot and to read its reference documentation/starter app.
- `hono`, `kysely`, `kysely-bun-sqlite`, `@sinclair/typebox` are pinned to exact
  versions aligned with the vendored framework. When refreshing `@basics/core`,
  also realign these pins, then reinstall and commit `bun.lock`.

## Commands

```bash
bun run dev:server       # Bun server on :3030 with --watch
bun run check:server     # tsgo on server/
bun run check:client     # tsgo on src/
bun run check:test       # tsgo on tests/
bun run test:server      # server tests
bun run test:client      # project client/pure UI tests
bun run test:scripts     # render/scenario tooling tests
bun run test             # canonical project suite (server + client + scripts)
bun run test:framework   # vendored @basics/core suite with happy-dom
bun run test:affected    # only tests reachable from changed files (needs at least one commit)
bun run generate         # regenerate typed clients using the vendored generator
bun run seed:formats     # rebuild canonical manual-format fixture DB under tmp/
bun run render:formats   # render canonical manual-format fixtures from that DB
bun run check:format-fixtures # compare the canonical fixture oracle
```

## Runtime state

`data/*.sqlite` holds app data, sessions, and observability. Generated on boot by `createApp()`; gitignored; keep on disk.
