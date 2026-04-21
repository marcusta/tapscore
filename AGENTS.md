# tapscore — Agent Instructions

Greenfield rebuild of `~/dev/github/golf-serie`. Domain model is in `REWRITE_DOMAIN_SPEC.md` at this repo root — read it before designing entities. Phase plan is in `PHASES.md` — follow it top-to-bottom, stop at the gates.

## Framework

Built on `@basics/core` from `~/dev/github/mackans-client-fw`. Follow its conventions verbatim:

- `~/dev/github/mackans-client-fw/CLAUDE.md` — framework overview and invariants
- `~/dev/github/mackans-client-fw/docs/server-guide.md` — server-side patterns (service shape, query inventory, migrations, auth)
- `~/dev/github/mackans-client-fw/docs/agent-guide.md` — client-side canonical recipe
- `~/dev/github/mackans-client-fw/docs/app-patterns.md` — app composition

The starter app `~/dev/github/mackans-client-fw/apps/starter` is the reference layout. Mirror it.

## Tapscore-specific rules

- **One `players` table** for logged-in people. Fields live together (auth + identity + handicap_index). Handicap history goes in its own append-only table. Guest players (FriendlyRound, no login) go in a separate `guest_players` table. Role grants are a junction table. In app code, the word "user" only appears inside framework auth plumbing; everywhere else, say "player".
- **`participant_players` junction** uses two nullable FKs (`player_id` xor `guest_player_id`), not a type discriminator string.
- **Snapshot at time of play** — participant carries frozen copies of handicap index, course handicap, playing handicap, tee, and category. Results never recompute from live player data.
- **Score events are source of truth** — `score_event` is append-only; `scorecard` is a materialised view. The event log replays exact state; client writes are idempotent via `client_event_id`.
- **Format strategies are pluggable** — scoring mode × team shape axes. New format = new strategy file + registration. No schema change.
- **Format verification uses the canonical fixture workflow** — when working on formats, do not rely on whatever happens to already be in `data/app.sqlite`. Rebuild the dedicated fixture DB with `bun run seed:formats`, then render from that same fixture set with `bun run render:formats`.
- **Phase order is fixed** — see `PHASES.md`. Stop and hand-test between phases; do not skip ahead.
- **FK-target migrations precede dependents, regardless of phase narrative.** SQLite runs with `PRAGMA foreign_keys = ON`, which validates the parent table's existence on *every write* to the referencing table — even when the FK column is NULL. If a phase's narrative order puts an entity before the one it references, land the referenced table's migration first (it can ship with an empty service and fill out later). Example: Phase 1b extends `players` with `home_club_id` → `clubs(id)`, but `clubs` isn't introduced until 1c; the clubs migration lands as `002_create_clubs.ts` before the extend-players migration.

## Dependencies

`@basics/core` is linked via `file:../mackans-client-fw/core`. Behaviour:

- It tracks the framework's HEAD directly — a framework change appears here on next install. When a boot breaks unexpectedly, check the framework first.
- `hono`, `kysely`, `kysely-bun-sqlite`, `@sinclair/typebox` are pinned to exact versions matching `~/dev/github/mackans-client-fw/node_modules/.bun/`. Keep them pinned. When bumping `@basics/core`, also realign these pins, then `rm -rf node_modules bun.lock && bun install`.

## Commands

```bash
bun run dev:server       # Bun server on :3030 with --watch
bun run check:server     # tsgo on server/
bun run check:client     # tsgo on src/
bun run check:test       # tsgo on tests/
bun run test:server      # server tests
bun run test:affected    # only tests reachable from changed files (needs at least one commit)
bun test                 # full suite
bun run seed:formats     # rebuild canonical manual-format fixture DB under tmp/
bun run render:formats   # render canonical manual-format fixtures from that DB
```

## Runtime state

`data/*.sqlite` holds app data, sessions, and observability. Generated on boot by `createApp()`; gitignored; keep on disk.
