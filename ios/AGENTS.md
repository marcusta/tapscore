# ios — AGENTS

The native tapscore client (PHASES.md **N4**). SwiftUI, iOS 17+, iPhone only,
portrait. Swift 6 language mode with `SWIFT_STRICT_CONCURRENCY: complete`.
**Zero SPM dependencies** — that is a decision, not an accident.

Conventions mirror `~/dev/github/golf-map/ios` (same developer team, same
XcodeGen setup, same actor-client shape). When something here is unclear, look
at how golf-map does it before inventing a third way.

## The project is generated

`project.yml` is the source of truth. `TapScore.xcodeproj/` is **gitignored —
never edit it, and never commit it**. After cloning, after changing
`project.yml`, and after any file is added or removed under `TapScore/`:

```sh
cd ios && xcodegen generate
```

Requires `brew install xcodegen` and Xcode 26+.

Targets, build settings and the scheme live in `project.yml`. Nothing else.

## Info.plist and entitlements ARE committed

This is the one deliberate divergence from golf-map, which lets XcodeGen
synthesize a gitignored `Info.plist`.

- `TapScore/Info.plist` — hand-maintained, committed, wired via
  `INFOPLIST_FILE`. `GENERATE_INFOPLIST_FILE` is `false`.
- `TapScore/TapScore.entitlements` — hand-maintained, committed, wired via
  `CODE_SIGN_ENTITLEMENTS`.

Both are `excludes`d from the target's `sources` so they are not also copied in
as resources. Edit these files directly; do **not** move them into a
`project.yml` `info:` block, and never edit a build-output copy under
`build/DerivedData/…/TapScore.app/Info.plist` — that is a derivative and is
overwritten every build.

Two entries that must not drift:

- `NSAppTransportSecurity.NSAllowsLocalNetworking = true`, for the
  `http://localhost:3030` dev server. **Do not widen this to
  `NSAllowsArbitraryLoads`** — that turns off TLS enforcement for every host,
  including production.
- `CFBundleURLTypes` registers the `tapscore://` dev scheme. It exists because
  universal links do not resolve in the simulator; it is parsed by the same
  `DeepLinkRouter` as the https form.

`DeepLinkRouter` matches the production host over **https only** — universal
links are https-only, so a plaintext link naming that host is a downgrade
attempt. Plaintext is accepted for loopback (`localhost`, `127.0.0.1`) and only
in DEBUG, so `JoinView`'s paste fallback works against the dev server. The
DEBUG relaxation is a defaulted parameter (`allowsInsecureDevHosts`), not a bare
`#if` around the rule, so release semantics stay testable from the (always
DEBUG) test bundle.

## `TapScore/API/Generated/` is machine-written

Produced by `bun run generate:swift` (`scripts/generate-swift.ts`, from the repo
root — not from `ios/`).

**`Generated/` IS committed** — deliberately, mirroring the committed `public/`
build artifact. With zero SPM dependencies there is no package step that could
produce it at build time, and committing it keeps the wire contract *reviewable*:
a server type change shows up as a Swift diff in the same PR, where someone can
see it. So:

- **Regenerate with `bun run generate:swift`; never hand-edit.** The next
  generation silently eats your change.
- **Commit the regenerated files alongside the server contract change that
  caused them.** A `Generated/` diff without a `server/` diff (or the reverse)
  means someone edited by hand or forgot to regenerate.

Other rules:

- **Never create `Generated/` by hand.** It may not exist yet; the app builds
  fine without it because `project.yml` globs the whole `TapScore` folder and
  simply emits nothing for a directory that is absent.
- **After the first generation — and after any generation that adds or removes a
  file — run `cd ios && xcodegen generate`.** XcodeGen resolves the glob at
  generate time, so files that arrive later are invisible to an already-generated
  project until you regenerate. A "cannot find type X in scope" error right after
  running the generator is almost always this.
- Generated endpoint methods attach to `TapScoreAPI` via `extension`, and must
  route through the existing `request` / `requestData` transport. Building a
  second `URLSession` path means bearer injection and the `401 → .unauthorized`
  mapping diverge. See the marked seam at the bottom of
  `TapScore/API/TapScoreAPI.swift`.
- A missing endpoint is a generator bug, not an invitation to hand-write one.
  There are **no hand-written DTOs** left: the scaffold's temporary
  `AuthDTO.swift` (`AuthenticatedPlayer`) was deleted once the generator emitted
  `Player`, and `TapScoreAPI.me()` now decodes the generated type. Do not
  reintroduce a hand-written model — add it to the generator instead.

## `DesignSystem/ThemeTokens.swift` is machine-written too

Produced by `bun run generate:theme` (`scripts/generate-theme-swift.ts`, from the
repo root) out of `src/theme.ts` — the SAME token tables the web client ships.
Committed for the same reasons as `Generated/`, and with the same rules: never
hand-edit, and `xcodegen generate` after any run that adds or removes a file.

**Regenerate whenever `src/theme.ts` changes.** That is the whole point of the
file: web and native read one palette. A `src/theme.ts` diff without a
`ThemeTokens.swift` diff means the two have drifted, and nothing at build time
will tell you — the app just stops matching the web. `ios/TapScoreTests/DesignSystem/ThemeTokensTests.swift`
spot-checks the load-bearing hexes by hand as a tripwire on the generator, not on
the palette; it will not notice a palette change that was never regenerated.

The generator imports `src/theme.ts` under a four-line DOM shim (the framework's
`createTokens` injects a `<style>` at import). It reads the exported
`resolvedLight` / `resolvedDark` maps, which is why those exports exist — keep
them if you refactor the theme.

The design-system primitives around it (`TapFont`, `TapCard`, `TapChip`,
`HoleBar`, …) are hand-written and each names its source web component in a doc
comment. `-tapscoreGallery` (DEBUG only, same seam as `-tapscoreDeepLink`) swaps
the app for `DesignGalleryView`, which is how the layer gets reviewed visually:

```
xcrun simctl launch <udid> com.marcusandersson.tapscore \
    -apiBaseURL http://localhost:3030/api -tapscoreGallery YES
xcrun simctl ui <udid> appearance dark   # then screenshot again
```

(The gallery renders no live data, so the base URL changes nothing it draws —
it is here anyway, because "every launch line in this file carries it" is a rule
that survives copy-paste and "this one doesn't need it" is not. See
**Which server a run talks to**.)

Screenshot BOTH appearances. The one real bug this layer has shipped so far —
an inactive tab label rendered dark-on-dark — was invisible in every test and
obvious in the dark screenshot.

## Chips vs dropdowns (standing design rule)

The cross-surface home for this and the rest of the UI rulings is
[docs/design-guidelines.md](../docs/design-guidelines.md) — including the
two-option case (a track segmented control, never a dropdown), how a selection
should read, and where an option's explanation goes. What follows is the iOS
half, in terms of the iOS primitives.

Owner ruling, twice over, on the create flow. **The web is the reference, and
the web already uses dropdowns for every long choice** — its course select, its
start-hole select and its tee selects are all collapsed fields with a raised
list. So:

- **Chips / segmented rows** are for **≤ 3–4 short options worth keeping
  permanently on screen**. In this app that is: the route preset
  (Full 18 / Front 9 / Back 9), the holes toggle, and the format template cards.
  Nothing else, until an owner says so.
- **Everything longer is a collapsed dropdown field** — `TapDropdown`, the one
  primitive: 44pt, `.tapField()` skin, selected value + chevron, opening a sheet
  with an optional search field, optional non-selectable group headers, and rows
  that select-and-dismiss on tap. Courses, start hole, the two gender tee
  defaults and the per-player tee override all go through it.
- **Warnings are row annotations, in WORDS** — "No men's rating", "Won't count
  for handicap" — in `--text-muted` or `--danger`. **Never an emoji.** `⚠` glued
  to a chip label has no accessible name, no theme token, and no room to say
  which gender or which hole it meant. When the annotated option is the
  selection, the collapsed field repeats the annotation.

Eighteen start-hole chips in three wrapped rows, and a tee chip row per gender,
were both rejected on sight: they push the questions below them off the screen
and re-ask a question the user already answered. The rule is written up
normatively in `docs/proposals/create-flow-behavior.md` §0 (B0.1–B0.4), with
B2.3, B3.8–B3.10 and B4.2a/B4.2b/B4.6 as the per-control instances. A new
long-list control that does not use `TapDropdown` is a deviation, not a style
choice.

## Bundle id == `APPLE_AUDIENCE` (coupling warning)

```
PRODUCT_BUNDLE_IDENTIFIER = com.marcusandersson.tapscore
```

This string **is** the server's production `APPLE_AUDIENCE` environment value.
Sign in with Apple identity tokens carry the bundle id as their `aud` claim, and
the server verifies it exactly (and fails closed at prod boot if the variable is
unset — N2). So:

**Changing the bundle id breaks Sign in with Apple for every user until the
systemd unit's `APPLE_AUDIENCE` is changed to match and the server is
restarted.** They are one value in two repos. If you change it here, say so
loudly in the commit message.

Related deploy-side prerequisites, all outside this repo (PHASES.md N4):

- `APPLE_AUDIENCE=com.marcusandersson.tapscore` in the prod systemd unit.
- `apple-app-site-association` served from the **domain root** of
  `app.swedenindoorgolf.se` — *not* under `/tapscore/`. (Confusingly, the app
  itself *is* under `/tapscore/`. The AASA file is the exception.)
- Sign in with Apple capability enabled on the App ID.
- The N4 gate needs a real device: SIWA requires a signed-in Apple ID.

## Layout (`TapScore/`)

- `App/` — `@main TapScoreApp`, `AppEnvironment` (the DI container + auth state
  every screen reads), `Keychain` (bearer token; **never** `UserDefaults`, and
  the Keychain is for that bearer session only — the share tokens in
  `DeviceRoundsStore`/`ResultCursorStore` are deliberately `UserDefaults`-class:
  a share token is a write credential the holder already possesses, arriving in
  the link this device opened, so storing it grants nothing new),
  `DeepLinkRouter` (pure URL → route; the trust boundary for inbound links),
  `ScenePhaseCoordinator` (the single foreground/background funnel the SSE feed
  will hang off — screens must not observe `scenePhase` directly).
- `API/` — `TapScoreAPI` (an `actor`), `APIConfiguration` (prod
  `https://app.swedenindoorgolf.se/tapscore/api` — **the default everywhere** —
  vs dev `http://localhost:3030/api`, reachable only via the `apiBaseURL`
  override), `ServerOverride` (validation + the `UserDefaults` write-through),
  `APIError`, and the generated seam.
- `Features/` — SwiftUI screens. Currently placeholders.

Auth model, because it differs from golf-map: tapscore sends
`Authorization: Bearer <token>`, not a session cookie, and there is **no silent
re-login** — SIWA cannot be replayed headlessly, so a 401 surfaces as
`.unauthorized` and the UI asks. Anonymous is a normal, fully functional state:
share links are token-scoped, and scoring a round never requires an account.

The bearer is obtained by a **nonce-bound** Sign in with Apple exchange, and the
binding is a two-repo contract — `AppleSignInNonce` here, `checkAppleNonceBinding`
in `server/services/apple-identity.ts`:

1. `SignInView` generates a random raw nonce and puts **`sha256_hex(raw)`** in
   `ASAuthorizationAppleIDRequest.nonce`, so the hash — never the pre-image — is
   what ends up in the identity token's `nonce` claim.
2. The **raw** nonce is posted alongside the token to `/auth/apple`; the server
   hashes it and requires it to equal the claim.
3. A token carrying a nonce claim that arrives **without** a pre-image is
   rejected (`apple_nonce_required`); a mismatched one is `apple_nonce_mismatch`.

The wire spelling is **lowercase hex, not base64**, and the same vector is pinned
on both sides (`ios/TapScoreTests/AuthFlowTests.swift` and
`server/services/apple-identity.test.ts`) — a disagreement 401s every native
sign-in and neither suite would see it alone. What the binding buys is narrow and
worth stating exactly: **replay from the token alone fails.** On the app→server
hop the token travels with its pre-image, and nonces are not single-use, so TLS
is what protects that request; the nonce is what makes a token lifted from
anywhere else (Apple's response, a log, a crash report) useless.

Two consequences for anyone touching this flow:

- The nonce must be **the same one that went out** — regenerating it mid-flight
  (a second button tap) guarantees a mismatch, which is why `SignInView` marks
  itself busy in the request builder, not in the completion handler.
- The Keychain write happens **before** `authState` flips, and if it fails the
  just-issued token is revoked server-side before the error is thrown — a
  session whose only token was dropped is otherwise unrevokable.

## Build / test (CLI)

Both lines run from `ios/`, so the paths below are relative to it — copy-paste
the whole block:

```sh
cd ios
xcodegen generate
xcodebuild -project TapScore.xcodeproj -scheme TapScore \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build   # or: test
```

(From the repo root instead, it is `-project ios/TapScore.xcodeproj` — but then
`xcodegen generate` needs `--spec ios/project.yml`. Pick one cwd; `ios/` is the
one the rest of this file assumes.)

Pick a destination that actually exists — `xcrun simctl list devices available`.

`xcodebuild test` never touches a server — every suite stubs `URLProtocol` — so
those two lines need no base-URL argument. **Every line that LAUNCHES the app
does.** See the next section.

## Which server a run talks to (🚩 read before any simulator run)

**The default is production, everywhere.** Device, simulator, DEBUG, release —
`APIConfiguration.default` is `.production` with no `#if` in it. It used to
branch on `targetEnvironment(simulator)` and hand the simulator `.dev`; that is
gone, and `ServerConfigurationTests.testDefaultIsProductionEvenInTheSimulator`
(which runs in a simulator) is what keeps it gone.

**So a simulator launch that forgets the argument hits PRODUCTION.** Silently.
It looks like a working app with someone else's data in it — real rounds, real
players, real score writes. A verification screenshot taken against prod is not
a verification; it is a change to prod that also produced a picture. Never
accept one, never take one.

The only way anywhere else is the `apiBaseURL` override, so **every run,
verify, and screenshot command in this repo carries it**:

```sh
xcrun simctl launch <udid> com.marcusandersson.tapscore \
    -apiBaseURL http://localhost:3030/api
```

Add it to the deep-link line, the gallery line, and anything you write next:

```sh
xcrun simctl launch <udid> com.marcusandersson.tapscore \
    -apiBaseURL http://localhost:3030/api \
    -tapscoreDeepLink 'tapscore://round?token=<share-token>'

xcrun simctl launch <udid> com.marcusandersson.tapscore \
    -apiBaseURL http://localhost:3030/api -tapscoreGallery YES
```

`-apiBaseURL` is a plain `UserDefaults` argument, so **it persists across
launches** of that simulator until something overwrites or removes it — which
cuts both ways: one launch with it and the next launch without it is still on
localhost, and one launch pointed at prod poisons the next one that assumed
otherwise. When in doubt, pass it explicitly; it is idempotent.

### The Server screen (super-admin only)

`ServerSettingsView` is the same override with a UI: it shows the base URL the
app actually resolved, offers Production / Local dev presets and a validated
custom URL, and writes the **same `apiBaseURL` key** the launch argument does.
Validation: parseable, has a scheme and host, and https unless the host is
loopback (`localhost` / `127.0.0.1` / `::1`) — the same set `Info.plist`'s
`NSAllowsLocalNetworking` actually makes reachable.

Nothing hot-swaps. The API actor, the SSE feed and the pending-score queue all
hold the base URL resolved at launch; re-pointing them mid-session would leave a
half-migrated app whose every symptom looks like a server bug. The screen says
"relaunch to apply" and means it.

It is reached from the signed-in account inset, and the row **exists only when
`AppEnvironment.isSuperAdmin`** — no disabled row, no long-press easter egg.
`isSuperAdmin` comes from one `GET /me/roles` probe per session (the generated
`AdminEndpoints.myRoles`), cached in memory, with **every** failure — 401, 403,
decode mismatch, unreachable — meaning "not a super admin", silently and without
a retry.

**That gate is a footgun-hider, not a security boundary.** Any debug build
accepts `-apiBaseURL` from the launch arguments no matter who is signed in, and
all the screen can do is re-point this device at a server. `AdminAuthz` on the
server is the real gate for anything privileged; do not add a privileged action
behind this flag and think it is protected.

## Re-implement, do not port

The web client's `.component.ts` files, its `static styles`, and its
`localStorage` modules are **not** references to translate line by line. Carry
across the *pure* modules as specs with their tests attached — above all
`src/round/advance-policy.ts` (44 branch tests; three documented QUIRKs that
need a joint policy+tests decision before anyone tightens them) and
`src/round/result-layout.ts` (the leaderboard fold: zero imports,
JSON-serializable, and deliberately the Swift renderer's contract). Deciding
presentation on the client instead of rendering that fold is how the two clients
start disagreeing about who won.

## Driving a round headlessly (`-tapscoreDeepLink`)

`xcrun simctl openurl` opens a `tapscore://` link, but the first one a fresh
simulator sees raises a SpringBoard confirmation alert that a script cannot
dismiss — so any automated check of the round screen quietly becomes "a human
taps Open". A launch argument avoids the system UI entirely:

```sh
xcrun simctl launch <udid> com.marcusandersson.tapscore \
    -apiBaseURL http://localhost:3030/api \
    -tapscoreDeepLink 'tapscore://round?token=<share-token>'
# environment form, for wrappers that cannot pass argv:
SIMCTL_CHILD_TAPSCORE_DEEP_LINK='tapscore://round?token=<share-token>' \
    xcrun simctl launch <udid> com.marcusandersson.tapscore \
        -apiBaseURL http://localhost:3030/api
```

The `-apiBaseURL` is not optional here. A share token is scoped to ONE server;
opening a dev token against prod (the default) is a 404 that reads as "the deep
link is broken". See **Which server a run talks to**.

Read by `LaunchDeepLink` (in `App/TapScoreApp.swift`) and handed to
`AppEnvironment.handle(url:)` at startup — the *same* `DeepLinkRouter` parse and
the same `ShellNavigation` push a real universal link takes. It widens **how a
URL arrives, never which URLs count**: the host allow-list and the https rule
are untouched, and the whole hook is `#if DEBUG`. The argument wins over the
environment variable when both are set.

A round token is a write credential — keep it out of CI logs like any other.
