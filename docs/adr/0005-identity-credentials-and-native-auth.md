# Identity is one player row; auth methods are credential rows; native is logged-in only

Status: **accepted, not implemented** (2026-07-26). Precedes the native iOS
track (PHASES.md "Native track"). Extends the person-model rule (one `players`
table per human — never user/player/profile) to the authentication axis.

## Context

`players` currently welds a credential onto the identity row:

```
players(id, username, password_hash NOT NULL, display_name, nickname,
        avatar_url, home_club_id, handicap_index, gender, deleted_at, created_at)
```

`server/main.ts` wires `verify: (u, p) => playerService.verify(u, p)` into the
framework's `createAuthApi({ verify, sessions })`, which mints an opaque session
token and delivers it as an httpOnly cookie. There is no sign-up endpoint —
players exist only via seeds. The web client is deliberately no-login
(FriendlyRound-first): a share token is the capability, and a logged-out
device's round list lives in `localStorage` (`src/landing/device-rounds.ts`).

Two forces make the current shape untenable:

1. **A native iOS client.** Cookie jars are fragile under `URLSession`
   (persistence across launches, background sessions, no explicit refresh), and
   a device-local round index does not survive app reinstall — on iOS,
   `UserDefaults` is wiped, and the share token was the *only* key to the round.
   Losing the list loses access, not just convenience.
2. **A second auth method.** The moment Sign in with Apple exists, a human has
   0..n credentials. With `password_hash NOT NULL` on `players`, an Apple user
   needs a fabricated hash — the exact "AI trap" shape the person-model rule
   exists to prevent, one level down.

## Decision

**Identity and credential are separate rows.** A `players` row is one human.
How that human proves who they are is zero or more `player_credentials` rows.
Native iOS requires an authenticated player; the web client keeps its
anonymous FriendlyRound path unchanged.

### Locked design decisions

- **Schema**:

  ```
  players(id, username, display_name, ...)          -- password_hash DROPPED
  player_credentials(
      player_id   FK players ON DELETE CASCADE,
      provider    'password' | 'apple',
      subject     text,          -- password: the username; apple: the Apple `sub`
      password_hash text NULL,   -- password provider only; NULL for all others
      created_at)
      UNIQUE(provider, subject)
  ```

  `username` **stays on `players`** — it is a public handle (friend search
  returns it, `PlayerSearchResult.username`), not a credential. For
  `provider='password'`, `subject` mirrors it; the password provider's row owns
  the hash.

- **Backfill is total**: every existing player gets one `provider='password'`
  row carrying its current hash, in the same migration that drops the column.
  No player may end with zero credentials at migration end — asserted in the
  migration, not just tested.

- **`verify()` reads credentials, not players.** `playerService.verify(u, p)`
  resolves `(provider='password', subject=u)` → hash → player. The framework's
  `createAuthApi` contract is unchanged; only what sits behind `verify` moves.
  Existing per-username login rate limiting stays as-is.

- **Session token is transport-agnostic.** `vendor/basics-core/server/auth.ts`
  already separates minting (`sessions.create(userId)`) from delivery
  (`issueSessionCookie`). Web keeps the cookie. Native receives the *same*
  opaque token in the response body, stores it in Keychain, and sends
  `Authorization: Bearer <token>`. One `SessionStore`, one session table, two
  deliveries — never two session systems.

- **Sign in with Apple is the iOS sign-up and sign-in path.** Password remains
  a web path. Rationale beyond preference: SIWA is what makes "iOS is
  logged-in only" survivable at the moment it hurts most — a friend taps a
  share link mid-round, installs, and must get to score entry in ~two taps
  under sun glare. A password form there loses the user.

- **Apple's name/email arrive once.** Apple returns the human's name and email
  **only on first authorization**; later sign-ins carry the stable `sub` alone.
  The `/auth/apple` handler must persist `display_name` on that first callback
  or it is unrecoverable. Pinned by a test that replays a second callback with
  the name fields absent.

- **No Google, deliberately.** App Store Guideline 4.8: an app using a
  *third-party* login service must also offer an equivalent privacy-preserving
  option (SIWA qualifies). Own-account + SIWA triggers nothing. Adding Google
  later is a product decision that costs nothing extra *because* SIWA is
  already present — but it is not free before that.

- **Account linking is an insert.** Same human, Apple on iOS and password on
  web = two `player_credentials` rows, one `players` row. Linking is
  authenticated-session + new-credential-insert, guarded by
  `UNIQUE(provider, subject)`. No merge path for two *already-separate* player
  rows is in scope — that is a distinct, harder problem (scored balls,
  friendships, handicap chain) and is explicitly deferred.

- **Anonymous device identity stays a web-only question.** With iOS
  logged-in-only, a signed-in player's round list is already a server query
  (`dashboard.myRounds`). No device table, no anonymous device id, no reinstall
  data-loss on native. The `localStorage` device index in
  `src/landing/device-rounds.ts` remains the web's logged-out affordance and is
  not ported.

### Per-layer

1. **Migration**: create `player_credentials`, backfill from
   `players.password_hash`, assert every player has ≥1 credential, drop the
   column. Note the migration-tombstone hazard — dev DBs need the ledger
   patched, not deleted.
2. **`player.service.ts`**: `verify()` moves to the credentials lookup; add
   `createWithPassword()` and `findOrCreateByApple(sub, name?, email?)`, both
   returning a player + issuing through the shared session path.
3. **API**: `POST /auth/signup` (password, web) and `POST /auth/apple` (verify
   Apple identity token, upsert credential, issue session). Both route through
   the existing `issueSessionCookie` or its bearer sibling. Signup joins the
   rate-limit map.
4. **Framework** (`vendor/basics-core/server/auth.ts`): add bearer-token
   acceptance alongside the cookie in the session-reading middleware, and a
   token-returning issue path. Refresh the vendored snapshot via
   `bun run vendor:basics`; tapscore is the first consumer, same as Phase 9.
5. **Client (web)**: unchanged except a real signup form; the anonymous path is
   untouched.

### Proof obligations (tests to ship with it)

- Migration round-trip: seeded players still log in with their existing
  passwords after the backfill; zero players left credential-less.
- `UNIQUE(provider, subject)` rejects a duplicate Apple `sub` and a duplicate
  password username.
- One player, two credentials: password login and Apple login resolve to the
  **same** `players.id`.
- Apple second callback with name/email absent does not clobber the stored
  `display_name`.
- Cookie session and bearer session are accepted by the same middleware and
  resolve to the same `AuthUser`.
- Deleting a player cascades its credentials.

## Consequences

Auth methods become data, so a third provider is a row type plus a handler —
never a schema change and never a nullable column bolted onto `players`. The
person-model rule now holds on both axes: one row per human, one row per way
that human signs in.

Costs and accepted limits: `player_credentials` adds a join to the login path
(negligible, indexed by the unique key); merging two already-distinct player
rows remains unsolved and out of scope; and the web keeps a device-local round
index that native does not share, so a human's anonymous web rounds do not
appear in their signed-in iOS list until they open the share link there.
Password reset machinery is still owed to the web password path — SIWA avoids
it on iOS, it does not remove it from the web.
