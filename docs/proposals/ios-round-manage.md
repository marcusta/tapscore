# iOS: manage an existing round (edit / finish / delete / leave)

Status: SPEC — implementation target for the iOS app (`ios/`). The web client is
the **behavior** reference; the iOS **UI** re-implements it with the app's own
idioms (`ios/AGENTS.md` — "Re-implement, do not port"). Server contracts are
already generated in `ios/TapScore/API/Generated/FriendlyRoundsEndpoints.swift`
— **no server work, no generator work, no hand-written DTOs.**

Two deliverables, landed in order:

- **Part A — round manage sheet**: finish/reopen, delete, leave, and the
  entry-point chrome. Small, self-contained.
- **Part B — edit round configuration**: the create flow in edit mode,
  reached from Part A's sheet.

Numbered clauses (`A1`, `B3`…) are the review checklist. A reviewer verifies
each clause literally.

---

## Shared context (both parts)

### Server surface (verified against `server/api/friendly-rounds.api.ts`)

| Action | Endpoint (generated Swift) | Input | Output | Auth |
|---|---|---|---|---|
| probe editability | `FriendlyRoundsEndpoints.setup` (GET `/friendly-rounds/setup`) | `{token}` query | `FriendlyRoundsSetupOutput` — enum on `editable` | token only |
| save edited draft | `.editSetup` (POST `/friendly-rounds/setup`) | `{token, draft, clientEventId?}` | `.ok{round}` / `.notOk{diagnostics}` | token only |
| finish | `.finish` (POST `/friendly-rounds/finish`) | `{token}` | `{status, completedAt}` | token only |
| reopen | `.reopen` (POST `/friendly-rounds/reopen`) | `{token}` | `{status}` | token only |
| delete | `.remove` (DELETE `/friendly-rounds/:token`) | `pathValues: ["token": token]` | `{ok}` | signed-in creator + token |
| leave | `.leave` (POST `/friendly-rounds/leave`) | `{token}` | `.ok{round}` / `.notOk{diagnostics}` | **bearer session + token** |

Facts that shape behavior:

- **Finish seals nothing.** `complete` is organizational; the round stays
  scorable and reopenable. Re-finish is a no-op preserving the original
  `completedAt`. Reopen of a non-complete round is a no-op.
- **Delete is creator-scoped.** The signed-in caller must match
  `friendlyRound.creatorPlayerId`; a share token alone never authorizes removal
  of everyone else's data. It cascades all scores. Unknown token → 404;
  another caller → 403.
- **Leave** needs a signed-in session; `playerId` is server-resolved from the
  bearer. Refusals arrive as HTTP-200 diagnostics with codes such as
  `not_in_round`, `last_player` ("Delete the round instead."), `shared_ball`,
  `slot_would_be_empty`, plus compiler codes. The server deletes the leaver's
  own scores. No status gate — leaving mid-round is supported.
- **editSetup is a full-document REPLACE of the stored draft**, not a patch.
  Whatever the client posts becomes the round's setup. This drives invariant
  B7 (carry-through).
- The share token is a write credential: never log it (`ios/AGENTS.md`).

### Ground rules (from `ios/AGENTS.md` — reviewer: verify all)

1. `cd ios && xcodegen generate` after any file add/remove; never edit
   `TapScore.xcodeproj` or commit it.
2. Never hand-edit `TapScore/API/Generated/` or `ThemeTokens.swift`.
3. Swift 6, `SWIFT_STRICT_CONCURRENCY: complete`; stores are
   `@MainActor @Observable`; transports are actors; zero SPM deps.
4. Long option lists use `TapDropdown`; warnings are words, never emoji.
5. Visibility rules live in **pure testable value types**, mirroring
   `AccountSheetRows` (rows absent, not disabled).
6. Every simulator launch carries `-apiBaseURL http://localhost:3030/api`.
7. Tests stub `URLProtocol` (reuse `RoundStubURLProtocol` / `RoundFixtures` /
   `CreateStubs.routeCatalog()`); no test touches a server.
8. Build/test gate: `cd ios && xcodegen generate && xcodebuild -project
   TapScore.xcodeproj -scheme TapScore -destination 'platform=iOS
   Simulator,name=iPhone 17 Pro' test` must pass.

---

## Part A — round manage sheet

### A1. Entry point

- `RoundHeaderView` (`ios/TapScore/Features/Round/RoundView.swift`) gains a
  trailing chrome button (SF Symbol `ellipsis.circle` or `gearshape`; pick one,
  44pt tap target, `accessibilityIdentifier("round-manage-button")`,
  `accessibilityLabel("Manage round")`), rendered only when the round has
  loaded (`store.round != nil`).
- Tapping presents `RoundManageSheet` via `.sheet`. Follow the
  `AccountSheetView` presentation anatomy (header with Fraunces title +
  "Done" ghost button, `ScrollView`, 44pt rows with chevron where
  navigational, `.accessibilityIdentifier` per row).
- Sheet title: **"Manage round"**.

### A2. Row inventory and order

Top to bottom:

1. **"Edit round"** — navigational row (chevron). Part B wires its action; in
   Part A the row exists behind the same visibility rule but may present a
   placeholder unavailable-state ONLY if Part B has not landed — prefer
   landing Part A with the row hidden behind `RoundManageRows.editRow == nil`
   until B lands, then flipping in B's commit. No dead button may ship.
2. **"Remove me from this round"** — danger-tinted row.
3. **"Finish round"** / **"Reopen round"** — one row, label switches on
   `round.status == "complete"`.
4. **"Delete round"** — danger row, last.

Rows are **absent, not disabled**, per the `AccountSheetRows` idiom.

### A3. Visibility — pure struct `RoundManageRows`

New pure value type (own file, e.g.
`ios/TapScore/Features/Round/RoundManageRows.swift`):

```swift
struct RoundManageRows: Equatable {
  var showsEdit: Bool      // editability probe returned editable:true
  var showsLeave: Bool     // signed-in AND viewer is a producer on some ball
  var showsFinish: Bool    // round loaded (always true once loaded)
  var showsDelete: Bool    // signed-in viewer is friendlyRound.creatorPlayerId
  var finishLabel: String  // "Finish round" | "Reopen round"
}
```

Rules (mirror web):

- `showsEdit`: from a GET `setup` probe — `editable == true`. Probe failure of
  ANY kind ⇒ `false`, silently (web hides the card on any error).
- `showsLeave`: `authState == .signedIn(player)` AND `player.id` appears as a
  producer id on at least one ball in the loaded balls payload (web
  `canShowLeaveCard`, `src/round/leave.ts:24-35`). **No status gate** —
  leaving mid-round is deliberate.
- `showsFinish`: unconditional once the round is loaded.
- `showsDelete`: signed-in viewer id equals `friendlyRound.creatorPlayerId`.
  Anonymous and legacy rounds with no recorded creator show no Delete row; a
  participant may still see Remove me where the leave rule permits it.
- `finishLabel`: `"Reopen round"` iff status is `complete`, else
  `"Finish round"`.

Unit tests for this struct cover: anonymous viewer (no leave), signed-in
non-producer (no leave), signed-in producer (leave), probe failure (no edit),
`editable:false` reasons (no edit), complete vs active label.

### A4. Editability probe

- `RoundStore` performs the GET `setup` probe as part of `load()` alongside
  the existing non-fatal endpoint fan-out; stores the result (e.g.
  `var editability: FriendlyRoundsSetupOutput?`). Any thrown error ⇒ treated
  as not-editable, non-fatally (must not fail `load()`).
- The probe re-runs on every `load()`/`refresh()` (improvement over web's
  once-per-mount; deliberate, keep it).

### A5. Finish / reopen

- Row tap → confirmation via `.confirmationDialog` (the app's established
  destructive-confirm idiom, `RoundListView.swift:130`), `titleVisibility:
  .visible`.
  - Not complete — title: **"Finish this round?"**; message: **"It'll move to
    your finished rounds. You can still edit or reopen it any time."**;
    confirm button **"Finish round"** (non-destructive role), **"Cancel"**.
  - Complete — title: **"Reopen this round?"**; message: **"It'll move back to
    your ongoing rounds."**; confirm **"Reopen round"**, **"Cancel"**.
- On confirm: POST `finish` (or `reopen`).
  - Success (finish): patch `round.status = "complete"`,
    `round.completedAt = response.completedAt` in place — no refetch required
    — then call the existing `recordDeviceRound()` seam
    (`RoundStore.swift:640-655`) so the landing row moves Ongoing → Recently
    finished, and re-evaluate the live gate (status `complete` closes
    SSE/polling — the store's existing `applyRemoteStatus`/`updateLiveGate`
    machinery; reuse, don't duplicate).
  - Success (reopen): `status = "active"`, `completedAt = nil`,
    `recordDeviceRound()`, live gate re-opens.
  - Failure: inline error line in the sheet — **"Could not update the round.
    Try again."** (web silently swallows; we improve deliberately). No state
    change.
- No navigation either way; the sheet stays open, row label flips.
- In-flight: the row is disabled while the request runs (no double-fire).

### A6. Delete

- Row tap → `.confirmationDialog`, `titleVisibility: .visible`:
  - title: **"Delete round?"**
  - message: **"This permanently removes the round and all its scores for
    everyone. This can't be undone."**
  - confirm: **"Delete round"** with `role: .destructive`; **"Cancel"**.
- On confirm: `DELETE` via `.remove` with `pathValues: ["token": token]`.
  - Success: `deviceRounds.remove(token:)`, drop the round's durable SSE
    cursor (`ResultCursorStore` — use its existing removal API; if none
    exists, add one mirroring `forgetResultCursor` on web), stop the store
    (`stop()`), dismiss the sheet, and pop navigation back to the landing
    screen. The landing list must no longer show the round.
  - Failure (incl. 404): inline error line — **"Could not delete the round.
    Try again."** — stay put, local state untouched.
- In-flight: row disabled.

### A7. Leave ("Remove me from this round")

- Row tap → `.confirmationDialog`, `titleVisibility: .visible`:
  - title: **"Remove yourself from this round?"**
  - message: **"Your scores here will be deleted. Everyone else's stay, and
    the round keeps going without you."**
  - confirm: **"Remove me"** with `role: .destructive`; **"Cancel"**.
- On confirm: POST `leave` `{token}` (bearer injected by the transport).
  - `.ok`: full `load()` reload; the viewer disappears from balls/leaderboard;
    `RoundManageRows.showsLeave` recomputes to false. **No navigation** — the
    round stays open; the device-rounds entry is deliberately NOT pruned
    (web parity: the token is still valid, the round continues without you).
  - `.notOk`: render the diagnostics' `message` strings verbatim, joined with
    `" · "`, as the inline error line (web `leave-card.component.ts:115-123`).
    Typical: last player → "…Delete the round instead.", shared ball, scored
    partner constraints.
  - Thrown error: inline **"Could not remove you right now. Try again."**;
    a 401 additionally means the session died — surface the same line (do not
    build a re-auth flow here).
- In-flight: row disabled.

### A8. State plumbing

- All four actions live on `RoundStore` (async funcs returning enough for the
  sheet to render errors), not in the view. The sheet is thin.
- Errors are transient view-model state on the store or a small sheet-model;
  cleared on the next attempt.
- Strict-concurrency clean: no detached tasks that outlive the store beyond
  the existing patterns.

### A9. Tests (Part A definition of done)

Using `RoundStubURLProtocol` + `RoundFixtures` (which already parameterizes
`status:`):

1. `RoundManageRows` pure tests (per A3 matrix).
2. Finish: store patches status/completedAt without refetch, records device
   round (assert via injected `DeviceRoundsStore` on throwaway
   `UserDefaults`), request body carried `{token}`.
3. Reopen: status flips back, `completedAt == nil`, device round re-recorded.
4. Delete success: DELETE hit `/friendly-rounds/tok-1` with method DELETE,
   device round removed, store stopped.
5. Delete failure: error surfaced, device round still present.
6. Leave ok: reload triggered (second `byToken` request observed).
7. Leave notOk: diagnostics joined with `" · "` surfaced, no reload.
8. Probe failure ⇒ `showsEdit == false` and `load()` still succeeds.
9. Full suite green (rule 8 above).

---

## Part B — edit round configuration

The create flow (`ios/TapScore/Features/Create/`) gains an **edit mode**. Web
reference: `src/create/create.component.ts` + `src/create/setup.service.ts`
(`loadForEdit`, `submit` edit path).

### B1. Entry and chrome

- `EditRoundView(token: String, onDone: (EditRoundOutcome) -> Void)` with
  `enum EditRoundOutcome { case saved, cancelled }` — presented
  `fullScreenCover` from the manage sheet's "Edit round" row (which Part A
  left gated off). Saved ⇒ dismiss cover, dismiss sheet, `RoundStore.load()`
  reload. Cancelled ⇒ dismiss cover only, back to the round untouched.
- Reuses the create flow's screen with copy differences:
  - Title **"Edit round"** (create: "New round").
  - Subtitle **"Change the setup — scored balls are preserved."**
  - Submit button **"Save changes"**, in-flight **"Saving…"**.
  - **"Cancel"** toolbar action → `onDone(.cancelled)`.

### B2. Load sequence (web `loadForEdit` parity)

On appear: reset store → load format catalog, GET `setup {token}`, courses,
tees-by-course for the draft's course, and `balls {token}` (to resolve display
names for existing producers) → hydrate every control from the returned draft.
Loading state until hydrated; any load failure shows a retryable error state
(no partial form).

### B3. Blocked states

When GET `setup` returns `.notEditable`, or the client-side seat rule fires,
the form body is not shown; a notice + back/cancel is:

- `roundComplete` → **"This round is complete — its setup can no longer be
  edited."**
- `noStoredDraft` → **"This round didn't come from the setup wizard, so it
  can't be edited here."**
- Client-side, when any draft producer is a placeholder seat →
  **"This round has open seats waiting to be claimed — the wizard cannot edit
  it yet."** (web `setup.service.ts:388-390`).

(The manage sheet's row is gated on `editable:true`, so these normally appear
only on races — they must still render correctly.)

### B4. Editable sections and the scores lock

Whatever the iOS create flow already surfaces is editable: course, route
preset + start hole, players (add/remove/rename guests, HCP, gender, tee),
formats/games, teams — via the existing `CreateStore` controls.

When the setup payload says `hasScores == true`:

- Course dropdown, start-hole dropdown, and route preset chips are
  **disabled**, with the notice (words, muted tone): **"Scores have been
  recorded — the course and route are locked for this round."**
- Everything else stays editable.

### B5. Identity preservation (scored balls survive)

- Existing producers keep their `producerDefId` verbatim through hydrate →
  edit → rebuild. Freshly added rows mint new ids the same way the web does
  (web uses `p-<key>` for new rows in edit mode; matching the server's
  expectations matters only in uniqueness, not spelling).
- Existing guests keep their guest ids; brand-new guest rows mint a guest via
  the guest-players create endpoint before submit (exactly like
  `CreateStore.submit()` does today for create).
- Renaming an existing guest goes through the token-scoped
  `POST /friendly-rounds/rename-guest` endpoint BEFORE `editSetup` (both
  clients): the draft carries only the guest ref, so a name typed over a
  hydrated guest row would otherwise be silently dropped. The row keeps the
  hydrated name as its baseline and renames only on drift.
- `playedAt` is preserved verbatim from the loaded draft — there is no date
  UI, and the date must not silently become "today".

### B6. Submit (web `submit()` edit path parity)

- Local pre-checks with the create flow's existing messages ("Pick a course
  first.", "Add at least one player.", "Add at least one format.", per-row
  "Name required" / "Handicap index required" / "Pick a tee").
- POST `editSetup` `{token, draft, clientEventId: UUID}`.
- `.ok{round}` → `onDone(.saved)`.
- `.notOk{diagnostics}` → render diagnostics inline against the controls they
  name where the create flow already has a mapping (`CreateDiagnostics`), else
  as the global error. Server codes to expect: `producer_has_scores`,
  `scored_ball_orphaned`, `scored_hole_removed`, `unknown_tee`,
  `tee_wrong_course`, `unknown_player`, `unknown_guest`, compiler codes.
- Thrown/HTTP failure → global error **"Could not save the round. Try
  again."**
- Success does NOT need `recordDeviceRound` (the round reload after dismissal
  records it — same net effect as web).

### B7. Carry-through invariant (THE critical clause)

`editSetup` **replaces the entire stored draft**. Any draft field the iOS UI
does not surface MUST be carried through from the loaded draft, byte-for-byte
in value terms — never dropped, never defaulted. Known fields the iOS create
flow does not currently edit: `playedAt`, `venueType`, `playingGroups`,
`startList` policy, per-producer fields the UI doesn't show (e.g.
`category`), any future additions.

Mechanics are the implementer's choice (overlay the rebuilt sections onto the
loaded draft, or thread preserved fields through the builder), with two
mandated adjustments when players are removed:

- removed producers' ids are stripped from `playingGroups` membership;
- a group left empty is dropped entirely (web `draftWithoutLeaver` semantics).

**Round-trip test is mandatory**: hydrate from a fixture draft containing
playing groups + startList policy + non-default venueType, change nothing,
rebuild — the posted draft must equal the loaded draft (allowing only
formatting-neutral differences). A second test removes one player and asserts
groups are pruned and everything else is untouched.

### B8. Tests (Part B definition of done)

1. Round-trip parity tests per B7 (fixtures: extend `WebDraftFixtures` /
   derive from the canonical web fixtures if the tooling supports it).
2. Edit-mode `CreateStore` tests using `routeCatalog()` + a
   `/friendly-rounds/setup` GET route: hydration fills course, route, players
   (with preserved `producerDefId`s), formats.
3. Scores-lock: `hasScores:true` fixture ⇒ course/route controls report
   disabled state (via whatever pure state drives them).
4. Blocked states render the three B3 messages.
5. Submit posts `{token, draft, clientEventId}`; `.notOk` diagnostics surface;
   `.ok` calls `onDone(.saved)`.
6. New-guest minting still hits guest create before `editSetup`.
7. Manage-sheet "Edit round" row now visible when probe says editable
   (flips the Part A gate).
8. Full suite green.

---

## Part C — web adopts the manage sheet (owner ruling 2026-07-29)

The iOS design won: management actions belong behind one "Manage round"
affordance, not a card stack at the bottom of the score tab. The web round
view adopts it. Behavior is unchanged — this is a relocation plus the iOS
copy refinements.

### C1. Entry point

- The round view header gains a manage button ("⋯", `aria-label="Manage
  round"`), rendered only once the round has loaded, visually aligned with
  the existing header chrome. Reachable from both tabs (it is header chrome,
  unlike the old score-panel stack).

### C2. The manage overlay

- Opens a modal overlay styled like the app's existing raised surfaces
  (mobile-first: bottom-sheet feel is fine, a centered panel is fine —
  match existing overlay idioms). Title **"Manage round"**, a close
  affordance, backdrop click and Escape both close it.
- Rows, in order, absent-not-disabled, each with title + muted subtitle
  (adopt the iOS row copy):
  1. **"Edit round"** — "Change the course, players or formats. Scores
     already taken are kept." Shown iff the setup probe returned
     `editable:true` (same probe the edit card uses today). Navigates to
     `/create?token=` exactly as the old card did.
  2. **"Remove me from this round"** (danger) — "Your scores here will be
     deleted. Everyone else's stay." Shown per `canShowLeaveCard` — logic
     and diagnostics rendering move here from the leave card.
  3. **"Finish round"** / **"Reopen round"** — "Move it to your finished
     rounds. Nothing is locked." / "Move it back to your ongoing rounds."
  4. **"Delete round"** (danger) — "Removes the round and every score in
     it, for everyone."

### C3. Confirmations and effects

- Reuse the existing `RoundViewService` methods and Confirm dialogs, with
  the iOS split copy for finish/reopen: title **"Finish this round?"** /
  **"Reopen this round?"**, messages as today's web sentences, confirm
  labels **"Finish round"** / **"Reopen round"** (replacing the generic
  "Confirm"). Delete and leave dialogs keep their current copy.
- All post-action effects unchanged (device rounds, navigation, reload).
- Action failures render as an inline error line in the overlay (adopt the
  iOS improvement; finish/reopen failures are no longer silent).

### C4. Removal

- The old bottom-stack `edit`, `leave` cards and inline `finishBtn` /
  `deleteBtn` (and their bindings) are removed from the score panel.
  Share card, seats, claim and join cards stay where they are.

### C5. Definition of done

- `bun run check:client` + `bun run test:client` green; any tests naming
  the removed bindings updated.
- Verified in the browser, both themes, mobile viewport: overlay opens from
  both tabs, rows gate correctly, finish/reopen/delete/leave flows work.
- `public/` rebuilt and committed with the change (deploy artifact rule).

## Out of scope (do not build)

- Seat claim/release UI (`claimSeat`/`releaseSeat`) — separate feature.
- Join flow changes.
- Any competition-round management.
- Re-auth flow on leave-401.
- Server or generator changes of any kind.
