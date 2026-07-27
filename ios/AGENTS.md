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
  every screen reads), `Keychain` (bearer token; **never** `UserDefaults`),
  `DeepLinkRouter` (pure URL → route; the trust boundary for inbound links),
  `ScenePhaseCoordinator` (the single foreground/background funnel the SSE feed
  will hang off — screens must not observe `scenePhase` directly).
- `API/` — `TapScoreAPI` (an `actor`), `APIConfiguration` (dev
  `http://localhost:3030/api` vs prod
  `https://app.swedenindoorgolf.se/tapscore/api`), `APIError`, and the
  generated seam.
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
