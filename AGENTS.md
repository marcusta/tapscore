# tapscore — Agent Instructions

Greenfield rebuild of `~/dev/github/golf-serie`. Domain model is in `REWRITE_DOMAIN_SPEC.md` at this repo root — read it before designing entities. Phase plan is in `PHASES.md` — follow it top-to-bottom, stop at the gates.

## Framework

Built on a **versioned release tarball** of `@basics/core`, committed at
`vendor/basics-core-<X.Y.Z>.tgz` and installed as a real `node_modules`
directory. The sibling checkout at `~/dev/github/mackans-client-fw` is the
upstream source; it now cuts real releases (git tags, `CHANGELOG.md`, release
tooling). Follow the framework conventions verbatim:

- `~/dev/github/mackans-client-fw/CLAUDE.md` — framework overview and invariants
- `~/dev/github/mackans-client-fw/CHANGELOG.md` — read on **every** upgrade
- `~/dev/github/mackans-client-fw/docs/rollout.md` — migration lessons from the 1.x rollout
- `~/dev/github/mackans-client-fw/docs/decisions.md` — framework ADRs (ADR-005 = CSS recipe functions)
- `~/dev/github/mackans-client-fw/docs/server-guide.md` — server-side patterns (service shape, query inventory, migrations, auth)
- `~/dev/github/mackans-client-fw/docs/agent-guide.md` — client-side canonical recipe
- `~/dev/github/mackans-client-fw/docs/app-patterns.md` — app composition

The starter app `~/dev/github/mackans-client-fw/apps/starter` is the reference
layout. Mirror it.

**Never edit anything under `node_modules/@basics/core`, and never recreate
`vendor/basics-core/` as a directory** — the old rsync mirror, `scripts/vendor-basics.ts`,
`scripts/framework-test-preload.ts`, and the `test:framework` script are deleted
and must not come back.

## Tapscore-specific rules

See ./game-rules.md for specfic instructions around how golf game works in Tapscore.

Changing scorecard rendering, cell decorations (birdie/bogey markers), or how
a format presents its results/leaderboard? Read
[docs/scorecard-presentation.md](docs/scorecard-presentation.md) first — it
maps the server-presenter → client-renderer pipeline and the closed
presentation vocabulary.

## Dependencies

`@basics/core` is installed via `file:./vendor/basics-core-<X.Y.Z>.tgz`. Behaviour:

- **Upgrading the framework.** Fix things upstream in `../mackans-client-fw`,
  release there (`bun release.ts <bump>` — requires a matching `CHANGELOG`
  heading), then land it here:

  ```bash
  bun run fw:update          # or: bun run fw:update 1.2.0
  ```

  Commit `vendor/*.tgz` + `package.json` + `bun.lock` **together**. Deploys and
  fresh clones need no sibling checkout.
- **Active framework development against this app.** `bun link @basics/core` in
  this repo (`vite.config.ts` already has `optimizeDeps.exclude` for it).
  **Never commit while linked** — `bun run test` starts with an
  assert-not-linked guard (`bun run fw:check`) that fails loudly. Do not remove
  or bypass it. Finish by releasing upstream and running `fw:update`.
- **After any `fw:update` or link/unlink:** restart the vite dev server, and
  `rm -rf node_modules/.vite` if modules look stale. `does not provide an export
  named ...` is the signature of a stale vite cache, not a broken framework.
- `generate` and `test:affected` run out of `node_modules/@basics/core/` (see
  `package.json`). If they fail with module-not-found, run `bun install` — do
  **not** repoint them at `vendor/`.
- `hono`, `kysely`, `kysely-bun-sqlite`, `@sinclair/typebox` are pinned to exact
  versions aligned with the released framework. When upgrading `@basics/core`,
  realign these pins, then reinstall and commit `bun.lock`.

## Authorization

Roles live in `role_grants` (`RoleService`) and are enforced at the API edge by
two small gates, never scattered `if`s:

- `server/api/competition-authz.ts` — owner-or-`competition_admin`, scoped to
  one competition; gates competition mutations.
- `server/api/admin-authz.ts` — the unscoped `super_admin` grant; gates every
  `/api/admin/*` route (`admin.api.ts`), the app's ONLY cross-player read path.
  Read-only by design: an operator sees rounds/players/activity and administers
  grants, and nothing else. `GET /api/me/roles` is caller-scoped (session only)
  so the client can decide whether to show the entry point — presentation, not
  the gate.

The first `super_admin` is minted with `bun run grant:role` on the box holding
the DB. There is deliberately no network path to bootstrap one, and no env-var
auto-grant.

Ordinary rules are unchanged: reads are open, round writes are token-scoped.
Note that `/api/admin/rounds` returns share tokens — the token is a round's
write credential, so an operator can act on any round the same way a
participant can. That is the front door's trust model, not a new privilege.

## Theme and CSS

**Recipe-first ordering (ADR-005).** In `css` template literals, recipe
interpolations come **first** in a block, app overrides **after**:

```ts
css`.save { ${btn('primary')} padding: 0.5rem 1rem; }`   // correct
css`.save { padding: 0.5rem 1rem; ${btn('primary')} }`   // wrong — recipe wins
```

The 1.x recipes emit sizing (padding / font-size / line-height), so a recipe
placed last silently overrides app sizing. All 37 `btn()` and 11 `input()` sites
were reordered for this. The 23 `${card(` sites still have overrides-before-recipe;
harmless today because `card()` emits no sizing — **re-check the framework
CHANGELOG on every upgrade** and reorder them if `card()` ever starts emitting
sizing.

**Tokens.** `src/theme.ts` calls `bridgeLegacyControls(appTokens, neutralLight |
neutralDark)` from `@basics/core/client/default-theme`, deriving the 1.x control
tokens (`--field-*`, `--btn-*`) from our legacy tokens (radius / border /
input-bg / btn-bg / …) so the clubhouse look survives framework upgrades. An
explicit control token in the theme always beats the bridge.

Keep the vocabulary split deliberate:

- `accent` = decorative brass, used by app components.
- Framework **action** tokens (`accent-strong`, `on-accent`) = fairway green.
- The `danger` family = terracotta.

New framework-facing tokens go through the bridge call in `src/theme.ts`, not
scattered literals.

## Commands

```bash
bun run dev:server       # Bun server on :3030 with --watch
bun run check:server     # tsgo on server/
bun run check:client     # tsgo on src/
bun run check:test       # tsgo on tests/
bun run test:server      # server tests
bun run test:client      # project client/pure UI tests
bun run test:scripts     # render/scenario tooling tests
bun run test             # canonical project suite (asserts not linked, then server + client + scripts)
bun run test:affected    # only tests reachable from changed files (needs at least one commit)
bun run generate         # regenerate typed clients using the installed framework generator
bun run grant:role list  # role grants in the DB (DB_PATH-aware)
bun run grant:role grant <username> super_admin   # mint an operator
bun run fw:update [X.Y.Z] # pull a released @basics/core tarball into vendor/ + package.json
bun run fw:check         # assert @basics/core is not bun-linked (safe to commit)
bun run seed:formats     # rebuild canonical manual-format fixture DB under tmp/
bun run render:formats   # render canonical manual-format fixtures from that DB
bun run check:format-fixtures # compare the canonical fixture oracle
```

## iOS API base URL

`APIConfiguration.default` is **production everywhere** — device, simulator,
DEBUG, release. Reaching the dev server is always an explicit act.

- **Simulator:** always pass the override. Without it the simulator talks to
  PROD, and seeded local players simply fail to log in.

  ```bash
  xcrun simctl launch <udid> com.marcusandersson.tapscore \
      -apiBaseURL http://localhost:3030/api
  ```

  Carry it on every launch line — deep link, gallery, screenshot, all of them.
  It is a `UserDefaults` write, so it persists for that simulator until
  overwritten; pass it anyway, it is idempotent.

- **Physical device / TestFlight / App Store:** pass **nothing**. The default
  (`https://app.swedenindoorgolf.se/tapscore/api`) is correct, and a device
  cannot see the builder Mac's loopback in any case.

Full rationale, and the super-admin Server screen that writes the same key:
`ios/AGENTS.md`.

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

**The `@basics/core` 1.1.0 migration is not deployed yet.** Pre-deploy QA walk,
in **both** light and dark themes: create round → score entry → leaderboard →
settings, checking confirm dialogs and selects at each step (those surfaces
depend most on the bridged control tokens).
