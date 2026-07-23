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

See ./game-rules.md for specfic instructions around how golf game works in Tapscore.

Changing scorecard rendering, cell decorations (birdie/bogey markers), or how
a format presents its results/leaderboard? Read
[docs/scorecard-presentation.md](docs/scorecard-presentation.md) first — it
maps the server-presenter → client-renderer pipeline and the closed
presentation vocabulary.

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

## Git workflow

Commit to `main`. Do not create a feature branch unless asked for one.

Before committing, say so plainly when the change is high risk or is one a
branch would suit better, and let the owner decide — then follow the answer.
Worth flagging: schema migrations and anything that rewrites existing rows,
changes to auth/session handling, work that cannot be verified locally (the
production base path, deploy config).

## Runtime state

`data/*.sqlite` holds app data, sessions, and observability. Generated on boot by `createApp()`; gitignored; keep on disk.

## Production

Deployed at `https://app.swedenindoorgolf.se/tapscore/` — the app is served
under the `/tapscore/` base path, so client routes and the API both sit beneath
it (for example `https://app.swedenindoorgolf.se/tapscore/api/health`).
