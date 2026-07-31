# iOS home redesign — dock FAB, identity strip, recent card, stats card

Owner-approved design (2026-07-31, session decisions). iOS first; the web
landing mirrors this in a later pass. This document is the contract for the
implementing and reviewing agents: WHEN/THEN items are numbered; deviations
need an entry in the table at the bottom.

## Approved decisions

- Dock becomes `Home | Play golf | Friends`. The Play control is a raised
  **text pill — no icon, no glyph, no emoji** ("Play golf" in the display
  face). Owner rule: primary actions are words, not symbols.
- FAB tap goes **straight to the create flow**. Join-by-code moves to a quiet
  "Have a code? Join a round" link on the create screen. The home screen's two
  stacked buttons (Create round / Join a round) are removed.
- Home order, top to bottom: identity strip (signed in) or wordmark (signed
  out) → Ongoing → Friends on the course (out-now strip) → Recently finished
  card (max 3, "All rounds →" footer, no trash) → Statistics card.
- Statistics card: presentation only — tiles for avg vs par, FIR%, GIR%, plus
  one strokes-lost priority line; whole card navigates to the stats dashboard.
  Stats *settings* stay on the profile screen, untouched.
- Out of scope for this pass (web-only today, iOS parity later): the
  "New — you were added" strip and the "From your friends" recent rows.

## Stage 1 — dock FAB + create/join rewiring

Files: `ios/TapScore/Features/RootView.swift`,
`ios/TapScore/Features/RoundListView.swift`,
`ios/TapScore/Features/Create/CreateRoundView.swift`,
`ios/TapScore/DesignSystem/` (new `PlayFab` view or similar),
`ios/TapScoreTests/Shell/ShellNavigationTests.swift`.

1. WHEN the shell dock area renders, THEN a "Play golf" pill floats centered,
   overlapping the tab bar's top edge: `TapFont.display` semibold text,
   `TapColors.primary` background, `primaryText` ink, pill radius, elevated
   shadow. **No `Image`/SF Symbol anywhere in the control.**
2. WHEN the viewer is signed in, THEN the tab bar shows `Home | Friends` as
   today with the pill riding above/between them; both tabs stay functional.
3. WHEN the viewer is signed out, THEN the tab bar stays hidden (as today) but
   the Play pill still renders, padded to the bottom safe area — anonymous
   play is core, the FAB must not be welded to the signed-in bar.
4. WHEN the pill is tapped (from Home or Friends section), THEN the create
   flow presents as a `fullScreenCover` — the same `CreateRoundView`
   presentation the home screen owns today, hoisted to `RootView`.
   - Hoist `LandingLoader` ownership from `RoundListView` to `RootView` and
     inject it, so `existingRoundNames` (create's name de-dupe) still comes
     from the loaded rows and `RoundListView` keeps its load-keying behavior
     (`.task(id: LandingLoader.key(...))`, `onAppear` device merge) unchanged.
   - `onCreated` keeps routing through the shell's `open(round:)` funnel.
5. WHEN the home screen renders, THEN the `callsToAction` block (both the
   "Create round" primary and "Join a round" secondary buttons) is gone.
6. WHEN the create screen renders, THEN a quiet text affordance
   "Have a code? Join a round" (worded link row, secondary/muted tier, no
   icon) is available without scrolling past the fold on step 1; tapping it
   dismisses the create cover and calls the shell's `openJoin()` path.
7. WHEN a join/round deep link arrives, THEN behavior is unchanged
   (`ShellNavigation` routes untouched except any addition).
8. Accessibility: the pill is a button labeled "Play golf"; the join link is a
   button labeled with its visible text.

## Stage 2 — home layout: identity strip, recent card, all-rounds screen

Files: `RoundListView.swift`, `RootView.swift`,
`ios/TapScore/App/ShellNavigation.swift`, new
`ios/TapScore/Features/AllRoundsView.swift`,
`ios/TapScoreTests/` (pure-partition and copy tests as touched).

9. WHEN signed in, THEN the wordmark header is replaced by an identity strip:
   `TapAvatar` (the signed-in player, `avatarVersion` from `authState`'s
   `Player`), display name, and — when `handicapIndex` is non-nil — an
   "HCP 18.4" pill (stored negative index renders as a plus handicap,
   `+2.0`, matching `ProfileView`). Nil index ⇒ no pill, never "HCP –".
10. WHEN the identity strip is tapped, THEN the shell switches to the Profile
    section (same destination as the account menu's profile entry).
11. WHEN signed out, THEN the current wordmark + tagline header renders
    exactly as today.
12. WHEN sections render, THEN the order is: identity/wordmark → Ongoing →
    out-now strip ("Friends on the course") → Recently finished card → stats
    card slot. Empty means invisible for every section, as today.
13. WHEN finished rounds exist (current 14-day window), THEN they render as
    ONE card: section header, up to 3 compact rows (label, course subtitle,
    date, status chip — **no trash column**), hairline separators, and an
    "All rounds →" footer row inside the card.
14. WHEN more finished rounds exist than shown, or any rounds exist at all,
    THEN "All rounds →" navigates to a new pushed `AllRoundsView`. If no
    finished rounds exist but ongoing/device rows do, a quiet bottom
    "All rounds →" text link stands in (mirrors web `.landing__history`).
15. WHEN `AllRoundsView` renders, THEN it lists every loader row — Ongoing
    section plus ALL finished rounds with **no 14-day cutoff** — reusing the
    existing `RoundRow` (with trash where removable) and the same
    open/remove/confirm behavior as home. Route added to `ShellNavigation`
    following the `friendRounds` pattern.
16. WHEN a row is removed on either screen, THEN the confirm dialog and
    device-local-only semantics are unchanged.
17. Ongoing rows on home keep today's full `RoundRow` (including trash where
    removable).

## Stage 3 — statistics card

Files: new `ios/TapScore/Features/Stats/HomeStatsCard.swift` (+ small store),
`RoundListView.swift`, tests under `ios/TapScoreTests/Stats/`.

18. WHEN signed in, THEN the home screen loads ONE page of
    `GET /players/me/stats` (limit ≈20, no paging loop, no `extendIfNeeded`)
    keyed on auth state like other home loads; pull-to-refresh refetches.
19. WHEN the fetch fails, is unauthorized, or the window has zero rounds,
    THEN the card is absent entirely — it never explains itself.
20. WHEN rows exist, THEN the card applies the player's persisted window
    preset (`StatsWindowPreference.load`) over the rows in hand via
    `StatsWindow.apply`, and builds `StatsDashboardModel` — all pure reuse,
    no new math beyond an overall avg-vs-par if the model lacks one.
21. WHEN tiles render, THEN up to three data-conditioned tiles show: avg vs
    par (scoring), fairways hit % (tee panel), greens in regulation %
    (approach panel). A tile whose denominator is 0 is omitted; if all three
    are empty the card is absent (rule 19).
22. WHEN the strokes-lost priorities have a `hasData` leader, THEN one worded
    line renders, e.g. "Costing you most: Putting" — words, no emoji.
23. WHEN the card (anywhere on it) is tapped, THEN it pushes the existing
    `StatsDashboardView()` — same destination as the profile's stats link.
24. The card contains NO settings, toggles, or window pickers.
25. Title row: "Statistics" in the section-header face + the window label
    (e.g. "Last 20 rounds") muted.

## Verification

Per stage: `xcodebuild -project TapScore.xcodeproj -scheme TapScore
-destination 'platform=iOS Simulator,name=iPhone 17 Pro' build` from `ios/`,
plus targeted unit tests for pure logic touched. Full `xcodebuild test` and
the web gates run once, centrally, before commit. Implementers do not commit.

## Deviations

| # | Spec item | Deviation | Why |
|---|-----------|-----------|-----|
| 1 | 23 | The card PRESENTS `StatsDashboardView()` as a sheet rather than pushing it | That view carries its own `NavigationStack` and a "Done" toolbar button, and `ProfileView` presents it exactly this way. Pushing it would nest stacks and leave a Done button with nothing to dismiss — "same destination as the profile's stats link" is the binding half of the item. |
| 2 | 20 | A persisted `.custom` window falls back to `StatsWindowPreference.fallback` on the card | The custom FILTER is deliberately never persisted (`StatsWindowPreference`'s own note), so `.custom` on a cold launch is the empty filter — it admits everything while the title row would claim "Custom". |
| 3 | 25 | A window with no round limit appends "— newest N" when the page was truncated | One page is ~20 rows, so "All rounds" / "This year" over a longer history would overstate the sample the tiles rest on. Count-bounded windows (Last 5/10/20) are unaffected. |
| 4 | 22 | The priority line also requires the leader to cost MORE than zero | `penalties` is the one waterfall term that is never nil (a clean round records 0.0), so a scoring-only window always has a `hasData` leader. The card prints no number beside the name, so "Costing you most: Penalties" at 0.0 would be a claim the data does not make. |
| 5 | 21 | The scoring tile is "Vs par per hole" (`(strokesTotal − parTotal) / holesScored`), not a per-round average | A window mixes 9- and 18-hole rounds, so a per-round vs-par is a number about round lengths as much as scoring; per hole matches the dashboard's own scoring panel. Under the thin-sample floor the tile carries the sample as a note, per the display policy. |
