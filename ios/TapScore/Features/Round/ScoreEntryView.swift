import SwiftUI
import UIKit

/// Score entry — two hole columns at a time, one tap per stroke count.
///
/// The web original (`src/round/score-entry.component.ts`) is the spec for the
/// *behaviour*; the pixels follow its anatomy through the design system. What
/// is carried over exactly:
///
/// - **Two columns.** The hole header is a clipped two-cell window
///   (`.se__carousel` / `.se__clip`, `SLOT * 2` wide, right-aligned at
///   `RIGHT_PAD`): the previous hole ghosted beside the current one. Every
///   player row repeats that grid — `.se-row__prev` under the ghost cell,
///   the score circle under the active one — which is why the two share ONE
///   set of metrics (`ScoreColumns`) instead of each guessing its own.
/// - **The strip is the only thing that pages.** On the web the pointer
///   handler is bound to `.se__carousel`, not to the view; the title, the
///   chips and the share card never move under a drag. Here the strip is a
///   horizontal `ScrollView` scoped to that same 120pt window, so a vertical
///   drag anywhere (including over the strip) still scrolls the page.
/// - A seat that is still a placeholder (`ball.pending`) renders as an
///   unscoreable row. It is not hidden — the group's shape is information — but
///   nothing can be entered against a seat nobody has claimed.
/// - Correction mode is a property of the VISIT, snapshotted on arrival by
///   `RoundStore.noteHoleEntered()`, so re-entering a finished hole edits in
///   place instead of chain-advancing off it.
///
/// The hole's prev/next controls are NOT here: they live in the pinned gold
/// `HoleBar` that `RoundView` docks at the bottom, exactly as `.round-hole`
/// does on the web. Both routes end in `store.goToHole(index:)`, so a chevron
/// and a drag cancel a pending auto-advance identically (caller contract #3).
///
/// **Two web details are deliberately different, and neither is an oversight:**
///
/// - Momentum. `stepsFromDrag` projects the release velocity 180 ms forward and
///   crosses up to four holes, clamped to the round's ends. `.viewAligned` does
///   its own projection off UIKit's deceleration and lands on a cell boundary,
///   so a flick can likewise cross more than one hole. The FEEL matches — drag
///   moves, flick skips, nothing wraps — but the exact step count for a given
///   flick does not, and pinning it would mean re-implementing the physics.
/// - Where the paging gesture lives. See `holeStrip`: the web binds its pointer
///   handler to the whole 60pt sunken plate and drags the clipped window inside
///   it, so a thumb anywhere across the plate's full width pages the strip.
///   Here the gesture belongs to the `ScrollView`, which is only the 120pt
///   window itself — the plate's empty left half is inert. Same holes, same
///   snap, a smaller target.
///
/// The handicap hint inside an unscored circle (`.se-row__circle.hint`, the
/// Gamebook "−1 / 0 / +1" preview) IS rendered now: `RoundStore.hintText` ports
/// `strokesHintFor` — display only, mirroring the server's allocation, with the
/// server's net still authoritative.
struct ScoreEntryView: View {
    @Bindable var store: RoundStore

    /// The link the share card offers. Built by `RoundView` from the resolved
    /// web origin; this screen renders it and never derives one.
    let shareURL: String

    /// The round header. It scrolls with the page, exactly as the web's
    /// `.round-view__main` scrolls it with the carousel.
    let header: RoundHeaderView

    /// Where the strip is resting, as view state — see `ScoreStripAnchor`.
    @State private var stripAnchor: ScoreStripAnchor

    /// **The remount seed**, and half of the fix for the hole-1 bug.
    ///
    /// `RoundView.panel` switches on `store.tab`, so leaving the Score tab (or
    /// the app) DESTROYS this view and its `@State`; coming back builds a
    /// brand-new `ScrollView`, and a brand-new scroll view sits at offset 0 —
    /// the leading cell, which reads as hole 1. The store never moved: one
    /// manual scroll used to snap the strip back, because that scroll was the
    /// first time the store's position and the strip's position were ever
    /// reconciled.
    ///
    /// Seeding here means the view is BORN knowing the answer — before any
    /// `onAppear`, before the first layout, and without a round-trip through
    /// the store. It is what `holeStrip`'s `onAppear` hands to `scrollTo`, and
    /// what `anchorBinding` reads, so nothing in this screen ever *derives*
    /// hole 1 from a missing position.
    ///
    /// It is not sufficient on its own, and that was measured rather than
    /// assumed: with only this seed the strip still drew hole 1 after a tab
    /// flip on a live round. `.scrollPosition(id:)` moves a scroll view when
    /// the bound value CHANGES; the value a scroll view is born with is not a
    /// change, so nothing scrolled. The push lives in `holeStrip`.
    ///
    /// Both halves are view-state alignment, **not navigation**: neither calls
    /// `store.goToHole`, so a remount cannot cancel a pending auto-advance
    /// (caller contract #3). See `ScoreStripAnchor`.
    init(store: RoundStore, shareURL: String, header: RoundHeaderView) {
        _store = Bindable(wrappedValue: store)
        self.shareURL = shareURL
        self.header = header
        _stripAnchor = State(
            initialValue: ScoreStripAnchor(holeIndex: store.holeIndex, in: store.playedOrder))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header
                if store.groups.count > 1 { groupChips }
                if store.playedOrder.isEmpty {
                    RoundEmptyState(
                        title: "Nothing to score yet",
                        systemImage: "flag",
                        message: "This round has no holes assigned to your group."
                    )
                } else {
                    hole
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .refreshable { await store.refresh() }
        // Re-alignment, for the two ways the seed above can be stale:
        //
        // - `@State` SURVIVED the remount. SwiftUI is free to keep this view's
        //   identity (it is the same `panel` slot), in which case `init`'s
        //   `initialValue` is ignored and the cached anchor — the hole we were
        //   on when we left — is what the strip restores to. Usually right,
        //   wrong the moment the store moved while we were away.
        // - `store.holeIndex` CHANGED WHILE UNMOUNTED. The keypad cannot
        //   advance a hole from the leaderboard tab, but a live event or a
        //   reload re-clamps the index against a `playedOrder` that shrank or
        //   was reordered (`RoundStore` clamps on load), and a backgrounded app
        //   comes back through the same reload.
        //
        // Both are "the store is right and the strip is stale", so both are the
        // same one-line alignment. When the seed was already correct `align`
        // reports no change and no state is written — no scroll, no animation,
        // nothing for the eye to catch.
        .onAppear { alignStripToStore() }
        .onChange(of: store.holeIndex) { _, _ in alignStripToStore() }
        // A group switch or a reload replaces the itinerary under a hole index
        // that did not itself change; the anchor is a cell ID out of the OLD
        // order and would resolve to nothing.
        .onChange(of: store.playedOrder.map(\.playHoleId)) { _, _ in alignStripToStore() }
        .background(TapColors.bg)
        // The pad is a full-height dark TAKEOVER, not a sheet — the web's
        // `.se-modal` is `position: fixed; inset: 0`, and a detented sheet would
        // leave the (light) round view showing above it.
        .fullScreenCover(isPresented: keypadBinding) { keypadSheet }
    }

    // MARK: - Chrome

    /// Web: `.round-view__groups` — accent-toned chips, so a group switch never
    /// reads as a format switch.
    private var groupChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: TapSpacing.sm) {
                ForEach(Array(store.groups.enumerated()), id: \.element.id) { index, _ in
                    TapChip(
                        title: "Group \(index + 1)",
                        isSelected: index == store.groupIndex,
                        tone: .accent
                    ) {
                        store.selectGroup(index: index)
                    }
                }
            }
            .padding(.horizontal, TapSpacing.lg)
            .padding(.bottom, TapSpacing.xs)
        }
        .padding(.bottom, TapSpacing.sm)
    }

    // MARK: - The hole

    /// Everything that belongs to the hole being scored: the two-cell strip,
    /// the rows under it, and the share card. One vertical stack — nothing here
    /// pages sideways except the strip itself.
    private var hole: some View {
        VStack(alignment: .leading, spacing: 0) {
            holeStrip
            rows
            shareCard.padding(.top, TapSpacing.xxl)
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.bottom, TapSpacing.xl)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Web: `.se__carousel` — a 60pt sunken plate holding a clipped window that
    /// is exactly two score columns wide, right-aligned at `RIGHT_PAD` over the
    /// ghost and circle columns of the rows below.
    ///
    /// The window is a horizontal `ScrollView`, which is what scopes the paging
    /// gesture: a horizontal drag on these 120pt pages the strip; a vertical
    /// drag — here or anywhere else — belongs to the page's own scroll view.
    /// The web achieves the same split by hand (`touch-action: pan-y` plus an
    /// 8pt axis-lock in `pointermove`); nesting scroll views gets it from UIKit.
    ///
    /// **The drag region is narrower than the web's, and it is stated rather
    /// than fixed.** There the pointer handler is on `.se__carousel` — the whole
    /// full-width plate — and the clipped window is only what you SEE move; a
    /// thumb on the plate's empty left half still pages. Here the gesture is the
    /// scroll view's own, so it stops at the 120pt window's edge. Widening it
    /// would mean driving the scroll position from a `DragGesture` on the plate
    /// and giving up `.viewAligned`'s snap physics — a worse trade than a target
    /// that is still two thumb-widths wide and sits exactly where the numbers
    /// are.
    private var holeStrip: some View {
        TapCard(sunken: true) {
            HStack(spacing: 0) {
                Spacer(minLength: 0)
                // The reader exists for ONE call: pushing the seeded position
                // into a freshly-built scroll view (see `onAppear` below).
                // Everything else still goes through `anchorBinding`.
                ScrollViewReader { proxy in
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 0) {
                            // The empty leading cell. It is what lets hole 1 sit
                            // in the ACTIVE (trailing) column with nothing beside
                            // it — the web's `.se-hole.gone` at offset −1.
                            Color.clear
                                .frame(width: ScoreColumns.slot, height: ScoreColumns.stripHeight)
                                .id(ScoreColumns.leadingAnchor)
                            ForEach(store.playedOrder, id: \.playHoleId) { hole in
                                holeCell(hole).id(hole.playHoleId)
                            }
                        }
                        .scrollTargetLayout()
                    }
                    // Snaps to a cell boundary, with momentum — the web's
                    // `stepsFromDrag` + `snap`, from UIKit instead of by hand.
                    // (`limitBehavior:` would cap a flick at one hole; it is
                    // iOS 18+, and the web does not cap it at one either.)
                    .scrollTargetBehavior(.viewAligned)
                    .scrollPosition(id: anchorBinding, anchor: .leading)
                    // **The other half of the remount fix.** A scroll view does
                    // not adopt the bound position it is BORN with:
                    // `.scrollPosition(id:)` reacts to a CHANGE, and the seeded
                    // value is not a change — it is where the binding started.
                    // Verified on a live round: with the seed alone the strip
                    // still came back on hole 1. So the seed is pushed once, by
                    // hand, at the first moment this scroll view exists.
                    //
                    // Unanimated on purpose. This is not the strip travelling
                    // from hole 1 to hole 7; it is the strip having been on hole
                    // 7 the whole time. An animated version would BE the bug,
                    // just slower.
                    //
                    // `stripAnchor` is view state seeded from the store, never a
                    // navigation: no `goToHole`, so no `cancelJump()`.
                    .onAppear {
                        guard let anchor = stripAnchor.anchor else { return }
                        var transaction = Transaction()
                        transaction.disablesAnimations = true
                        withTransaction(transaction) { proxy.scrollTo(anchor, anchor: .leading) }
                    }
                    .frame(width: ScoreColumns.stripWidth)
                    .padding(.trailing, ScoreColumns.rightPad)
                }
            }
            .frame(height: ScoreColumns.stripHeight)
        }
    }

    /// Web: `.se-hole` — hole number over `Par n`, half-opacity and scaled to
    /// 0.84 unless it is the active cell.
    private func holeCell(_ hole: RoundGroupPlayedHole) -> some View {
        let isActive = hole.playHoleId == store.currentPlayedHole?.playHoleId
        return VStack(spacing: 1) {
            Text(store.occurrenceLabel(hole.playHoleId))
                .font(TapFont.display(size: 19.2, weight: .bold, tabular: true))
                .foregroundStyle(TapColors.text)
            Text("Par \(store.par(of: hole.playHoleId))")
                .font(TapFont.ui(size: 10.9))
                .foregroundStyle(TapColors.textMuted)
        }
        .lineLimit(1)
        .frame(width: ScoreColumns.slot, height: ScoreColumns.stripHeight)
        .opacity(isActive ? 1 : 0.5)
        .scaleEffect(isActive ? 1 : 0.84)
        .animation(.easeOut(duration: 0.18), value: isActive)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            "Hole \(store.occurrenceLabel(hole.playHoleId)), par \(store.par(of: hole.playHoleId))"
                + (isActive ? "" : ", previous hole")
        )
    }

    /// Web: `.se__rows` — hairline-separated rows, no card. The top rule is
    /// `border-top` on the list; each row carries its own `border-bottom`.
    @ViewBuilder
    private var rows: some View {
        if let columns = ScoreColumns.at(index: store.holeIndex, in: store.playedOrder) {
            VStack(spacing: 0) {
                hairline
                ForEach(store.ballsInGroup, id: \.id) { ball in
                    BallRow(store: store, ball: ball, columns: columns)
                    hairline
                }
            }
            .padding(.top, TapSpacing.sm)
        }
    }

    private var hairline: some View {
        Rectangle().fill(TapColors.border).frame(height: 1)
    }

    /// Web: `.round-view__share` — a sunken card with an uppercase tracked
    /// label, a read-only link field and a green Copy button.
    private var shareCard: some View {
        TapCard(sunken: true) {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                Text("Share this round".uppercased())
                    .font(TapFont.ui(size: 12.8, weight: .bold))
                    .tracking(12.8 * 0.06)
                    .foregroundStyle(TapColors.textMuted)

                HStack(spacing: TapSpacing.sm) {
                    // Web: `<input readonly>` — a field, not a label, so the URL
                    // can be selected and dragged out even when Copy is not what
                    // the user wants. Disabled rather than read-only-by-binding:
                    // there is no keyboard to raise here, and the constant
                    // binding makes an edit unrepresentable.
                    TextField("", text: .constant(shareURL))
                        .disabled(true)
                        .textFieldStyle(.plain)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .lineLimit(1)
                        .truncationMode(.middle)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, TapMetrics.fieldPaddingY)
                        .padding(.horizontal, TapMetrics.fieldPaddingX)
                        .background(
                            RoundedRectangle(cornerRadius: TapRadius.fieldRadius, style: .continuous)
                                .fill(TapColors.fieldBg)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: TapRadius.fieldRadius, style: .continuous)
                                .strokeBorder(TapColors.fieldBorder, lineWidth: TapMetrics.fieldBorderWidth)
                        )
                        .accessibilityLabel("Share link")

                    Button("Copy") { UIPasteboard.general.string = shareURL }
                        .buttonStyle(.tap(.primary))
                }

                Text("Anyone with this link can open and score — no sign-in.")
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(TapSpacing.lg)
        }
    }

    /// The strip's scroll position, expressed as the id of the cell resting
    /// against the window's LEADING edge — the ghost column. `ScoreColumns`
    /// owns both directions of that translation; this is only the plumbing.
    ///
    /// The value READ is view state (`stripAnchor`), not a fresh derivation
    /// from the store, because a scroll view's initial position can only come
    /// from state it can see at layout time — that is the whole remount fix,
    /// and `alignStripToStore()` is what keeps that state honest.
    ///
    /// A change routes through `goToHole`: a drag is manual navigation and must
    /// cancel a pending auto-advance (caller contract #3).
    ///
    /// **Only a change.** `scrollPosition` writes back liberally — on settle, on
    /// a bounce, and after we ourselves scrolled the strip because `holeIndex`
    /// moved — and each of those reports the hole the round is already on. An
    /// unguarded setter turns every one of them into a `goToHole` call, which
    /// cancels whatever auto-advance jump is pending: the chain the advance
    /// policy exists to drive would be killed by the animation that the chain
    /// itself started. `goToHole` also short-circuits on an unchanged index, but
    /// only AFTER `cancelJump()` and `statsOpen = false`, so the guard has to be
    /// here — in `ScoreStripAnchor.scrolled(to:holeIndex:in:)`, which returns a
    /// hole index only when the report is real movement.
    private var anchorBinding: Binding<String?> {
        Binding(
            get: { stripAnchor.anchor },
            set: { reported in
                var next = stripAnchor
                let target = next.scrolled(
                    to: reported, holeIndex: store.holeIndex, in: store.playedOrder)
                if next != stripAnchor { stripAnchor = next }
                if let target { store.goToHole(index: target) }
            }
        )
    }

    /// Point the strip at the hole the store is on. **View state only** — it
    /// never calls `goToHole`, so no remount, tab flip or reload can cancel a
    /// pending jump by merely showing the screen again.
    private func alignStripToStore() {
        var next = stripAnchor
        guard next.align(toHoleIndex: store.holeIndex, in: store.playedOrder) else { return }
        stripAnchor = next
    }

    // MARK: - Keypad

    private var keypadBinding: Binding<Bool> {
        Binding(get: { store.keypadOpen }, set: { if !$0 { store.closeKeypad() } })
    }

    @ViewBuilder
    private var keypadSheet: some View {
        if store.statsOpen {
            StatsView(store: store)
        } else {
            KeypadView(store: store)
        }
    }
}

/// The two hole columns the score list shows at once, and the ONE column grid
/// the header strip and the player rows both lay out against.
///
/// Web: `SLOT` / `RIGHT_PAD` in `src/round/score-entry.component.ts`. There the
/// header window (`.se__clip`, `SLOT * 2` wide, `right: RIGHT_PAD`) and the row
/// scores (`.se-row__scores`, two `.se-row__slot`s, `padding-right: RIGHT_PAD`)
/// are two rules that happen to agree. Natively they are one type, because the
/// bug this replaced was exactly the two disagreeing: a hole number that did
/// not sit over the score beneath it.
///
/// The pair itself is pure index arithmetic over the group's `playedOrder`, so
/// the previous column follows the ITINERARY (a custom or reversed order gives
/// the hole actually played before this one, not `courseHoleNumber - 1`), and
/// the first hole of the order has no previous column at all.
struct ScoreColumns: Equatable {
    /// One score column, and one header cell. Web: `SLOT`.
    static let slot: CGFloat = 60
    /// The gutter between the last column and the card's edge. Web: `RIGHT_PAD`.
    static let rightPad: CGFloat = 8
    /// The clipped header window: exactly two columns. Web: `.se__clip` width.
    static let stripWidth: CGFloat = slot * 2
    /// Web: `.se__carousel { height: 60px }`.
    static let stripHeight: CGFloat = 60

    /// The id of the strip's empty leading cell — the ghost column's stand-in
    /// on the first hole, and the scroll anchor that puts hole 1 in the active
    /// column. Not a `playHoleId`, and cannot collide with one (ids are UUIDs).
    static let leadingAnchor = "__lead"

    /// The hole being scored — the active column.
    var current: RoundGroupPlayedHole
    /// The hole played before it, ghosted beside the active column. `nil` on
    /// the first hole of the order: there is nothing behind it to glance at.
    var previous: RoundGroupPlayedHole?

    /// The pair shown at `index`, or nil when the order cannot supply one.
    static func at(index: Int, in order: [RoundGroupPlayedHole]) -> ScoreColumns? {
        guard order.indices.contains(index) else { return nil }
        return ScoreColumns(current: order[index], previous: index > 0 ? order[index - 1] : nil)
    }

    /// Which cell must rest at the strip's leading edge for `index` to be the
    /// active column: the previous hole, or the empty lead cell for the first.
    static func anchor(forHoleIndex index: Int, in order: [RoundGroupPlayedHole]) -> String? {
        guard !order.isEmpty else { return nil }
        let clamped = min(max(index, 0), order.count - 1)
        return clamped == 0 ? leadingAnchor : order[clamped - 1].playHoleId
    }

    /// The inverse: the hole index a resting anchor selects. `nil` for an
    /// unknown id, so a stale scroll report can never move the round.
    static func holeIndex(forAnchor anchor: String?, in order: [RoundGroupPlayedHole]) -> Int? {
        guard let anchor, !order.isEmpty else { return nil }
        if anchor == leadingAnchor { return 0 }
        guard let position = order.firstIndex(where: { $0.playHoleId == anchor }) else { return nil }
        return min(position + 1, order.count - 1)
    }
}

/// Where the hole strip is resting, as view state — and the one place that
/// decides whether a scroll report is navigation or an echo.
///
/// The strip's position cannot be a pure derivation of `store.holeIndex`, even
/// though that is the truth it must always show. A `ScrollView`'s position is
/// state the scroll view itself owns and starts at zero, and
/// `.scrollPosition(id:)` moves it when the bound value CHANGES. A binding that
/// only computes from the store therefore never announces a change at mount
/// time: the strip stays where a fresh scroll view starts — the leading cell,
/// i.e. hole 1 — until the user's first drag finally pushes the store's value
/// through. That was the bug: leave the Score tab and come back, and a round on
/// hole 7 draws a strip on hole 1 over rows that are still hole 7's.
///
/// So the position is held here, and there are exactly two ways it moves:
///
/// - `align(toHoleIndex:in:)` — the store moved, or we just remounted and must
///   catch up. **View state only. It must never call `store.goToHole`**:
///   arriving on a screen is not navigating, and `goToHole` would
///   `cancelJump()` — killing the auto-advance the round was mid-way through
///   for no reason other than a tab flip.
/// - `scrolled(to:holeIndex:in:)` — the strip reported a rest position. That IS
///   navigation (a drag), but only when it names a different hole than the one
///   the round is on; every other report is the scroll view echoing a position
///   we just set.
///
/// The index↔cell translation itself belongs to `ScoreColumns` (the ghost-cell
/// off-by-one: the cell at the LEADING edge is the PREVIOUS hole).
struct ScoreStripAnchor: Equatable {
    /// The id of the cell resting at the window's leading edge, or nil when
    /// there is no itinerary to rest on yet.
    private(set) var anchor: String?

    /// Seeded from the round's current hole, so a freshly-built strip's FIRST
    /// laid-out frame is already on that hole.
    init(holeIndex: Int, in order: [RoundGroupPlayedHole]) {
        anchor = ScoreColumns.anchor(forHoleIndex: holeIndex, in: order)
    }

    /// Move the strip to where the store says the round is.
    ///
    /// - Returns: whether the anchor actually moved. `false` means the seed was
    ///   already right and the caller should not write state — no redundant
    ///   scroll, and nothing that could animate on a remount.
    @discardableResult
    mutating func align(toHoleIndex index: Int, in order: [RoundGroupPlayedHole]) -> Bool {
        let target = ScoreColumns.anchor(forHoleIndex: index, in: order)
        guard target != anchor else { return false }
        anchor = target
        return true
    }

    /// Record a position the strip reported, and say whether it is navigation.
    ///
    /// - Returns: the hole index to navigate to, or nil when the report is an
    ///   echo of the current hole (the common case — settle, bounce, and every
    ///   scroll we ourselves caused) or names a cell this itinerary does not
    ///   contain.
    ///
    /// An unresolvable report (nil, or an id left over from the group we just
    /// switched away from) is not stored: it is a transient the scroll view
    /// passes through mid-gesture, and echoing it back would make the strip
    /// forget where it is and re-render from the leading edge.
    mutating func scrolled(
        to reported: String?, holeIndex: Int, in order: [RoundGroupPlayedHole]
    ) -> Int? {
        guard let index = ScoreColumns.holeIndex(forAnchor: reported, in: order) else { return nil }
        anchor = reported
        guard index != holeIndex else { return nil }
        return index
    }
}

/// One ball's row on one hole: who, how they stand, and what they scored.
/// Tapping opens the keypad aimed at this ball.
///
/// Web: `.se-row` — a Gamebook row. Serif name over a small muted handicap line
/// on the left (`.se-row__name` / `.se-row__hcp`), the running to-par as the
/// loud number to their right (`.se-row__topar`), then the ghost column and the
/// cream score circle.
///
/// **The to-par used to be the small line under the name and is now the row's
/// second-biggest number.** That swap is the whole point of the redesign: what
/// the name sits over is the *static* fact (the handicap this ball plays off),
/// and what stands beside it is the *moving* one. A row whose two facts were
/// stacked made the moving one look like a caption.
private struct BallRow: View {
    @Bindable var store: RoundStore
    let ball: RoundBall
    /// The hole pair this row prints — the same pair the strip above it shows.
    let columns: ScoreColumns

    private var playHoleId: String { columns.current.playHoleId }
    private var strokes: Double? { store.strokes(ballId: ball.id, playHoleId: playHoleId) }
    private var status: RoundStore.CellState.Status? {
        store.writeStatus(ballId: ball.id, playHoleId: playHoleId)
    }

    var body: some View {
        HStack(spacing: TapSpacing.md) {
            VStack(alignment: .leading, spacing: 2) {
                // Web: `.se-row__name` — Fraunces 600 at 1.05rem; a pending
                // seat is muted and italic.
                Text(store.displayName(of: ball))
                    .font(TapFont.display(size: 16.8, weight: .semibold))
                    .italic(ball.pending)
                    .foregroundStyle(ball.pending ? TapColors.textMuted : TapColors.text)
                    .lineLimit(1)
                    .truncationMode(.tail)
                handicapLine
            }
            Spacer(minLength: 0)
            // The write indicator sits LEFT of the to-par, in the slack the
            // `Spacer` gives up — so a save that starts and finishes never
            // nudges the row's biggest number sideways. Between them it would:
            // a spinner appearing pushed the to-par ~32pt left mid-save and
            // left it there on `.error`, which reads as the number changing.
            statusIcon
            toParValue
            // Web: `.se-row__scores` — the two slots are flush (no gap) and
            // sit `RIGHT_PAD` off the edge, which is what puts them under
            // the header's two cells.
            HStack(spacing: 0) {
                previousScore
                    .frame(width: ScoreColumns.slot)
                // `marker: nil` — the entry circle is PLAIN. The web tints
                // no score-entry circle by par (`.se-row__circle` is one
                // cream `--accent-soft` disc with `--primary` ink at every
                // value); the par-tinted shape language belongs to the
                // leaderboard's markers, where it distinguishes cells in a
                // dense grid. Tinting here would put two different visual
                // systems on one screen and make the circle look like a
                // marker you can tap.
                ScoreCircle(state: circleState, marker: nil)
                    .frame(width: ScoreColumns.slot)
            }
            .padding(.trailing, ScoreColumns.rightPad)
        }
        .padding(.vertical, TapSpacing.md)
        .contentShape(Rectangle())
        // A TAP, not a `Button`, and that is load-bearing now that only the
        // hole strip pages: a SwiftUI `Button` fires on touch-up however
        // far the finger travelled sideways inside its bounds, so every
        // horizontal drag across a full-width row — the gesture a thumb
        // reaches for to change hole — opened this player's keypad.
        // `TapGesture` has the slop the row needs; a drag that goes
        // anywhere simply does nothing, exactly as on the web (where the
        // row is not a control at all — only the circle is).
        //
        // A placeholder seat is shown but not scoreable: there is nobody to
        // score for yet, and an entry against it would have to be
        // re-attributed when the seat is claimed. So it gets no tap and no
        // button trait — not a disabled control, which would announce a
        // control that might become available.
        .onTapGesture { if !ball.pending { store.openKeypad(ballId: ball.id) } }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityAddTraits(ball.pending ? [] : .isButton)
        .accessibilityAction {
            if !ball.pending { store.openKeypad(ballId: ball.id) }
        }
        // The retry affordance is a rotor action rather than a nested
        // element: `children: .ignore` is what stops VoiceOver reading the
        // row's four visual parts as four stops, and a failed write still
        // has to be retryable from the one stop that remains.
        .accessibilityAction(named: "Retry saving score") {
            guard status == .error else { return }
            Task { await store.retry(ballId: ball.id, playHoleId: playHoleId) }
        }
    }

    /// Web: `.se-row__prev` — the previous hole's score, ghosted: a plain
    /// muted tabular numeral, no circle, so it reads as history rather than as
    /// a second thing to tap. Empty on the first hole of the order (there is no
    /// previous hole) and on a pending seat (nothing was ever entered for it);
    /// an unscored previous hole prints the same "–" the web's `displayScore`
    /// gives it.
    ///
    /// Empty means an empty STRING, never an absent view: the web's
    /// `.se-row__slot` is a fixed 60pt cell whether or not it has a number in
    /// it, and an `EmptyView` here would collapse the cell (a `.frame` on
    /// `EmptyView` lays out as nothing) and slide the score circle left — so the
    /// first hole of the order, and every pending seat, would print its circle
    /// out from under the header cell above it.
    private var previousScore: some View {
        Text(previousText ?? "")
            .font(TapFont.display(size: 16.8, weight: .bold, tabular: true))
            .foregroundStyle(TapColors.textMuted)
    }

    private var previousText: String? {
        guard !ball.pending, let previous = columns.previous else { return nil }
        guard let value = store.strokes(ballId: ball.id, playHoleId: previous.playHoleId) else {
            return "–"
        }
        return jsNumberString(value)
    }

    /// Web: `.se-row__hcp` — the small muted line UNDER the name: the handicap
    /// this ball plays off, prefixed `Team · ` when the ball is more than one
    /// player. A pending seat says what it is instead.
    ///
    /// 12pt REGULAR, not the 12.8 semibold the old to-par line used at these
    /// coordinates. The web's `.se-row__hcp` is `0.75rem` at normal weight —
    /// this is a caption for the name above it, and the semibold left over from
    /// the number that used to live here made it compete with the name.
    ///
    /// **Absent, not dashed.** The keypad's version of this line prints "–" for
    /// a missing handicap because it is a labelled field in a form-ish sheet and
    /// a field with nothing in it has to say so. Here it is an optional second
    /// line in a dense list: a round played without handicaps should look like a
    /// list of names, not a column of dashes. Hence `handicapText` returning nil
    /// rather than a placeholder.
    @ViewBuilder
    private var handicapLine: some View {
        if ball.pending {
            // The same line, so the same type: a seat's status is what it has
            // instead of a handicap, not a differently-weighted thing.
            Text("open seat")
                .font(TapFont.ui(size: 12, weight: .regular))
                .foregroundStyle(TapColors.textMuted)
        } else if let handicapText {
            Text(handicapText)
                .font(TapFont.ui(size: 12, weight: .regular))
                .foregroundStyle(TapColors.textMuted)
                .lineLimit(1)
        }
    }

    /// The handicap this ball scores off — the SAME derivation
    /// `ScoreKeypadView.handicapLine` uses, and it has to stay the same one: two
    /// surfaces disagreeing about which number a ball plays off is the kind of
    /// bug nobody reports, they just stop trusting the app.
    ///
    /// A team's handicap is the BALL's (the composed one the server allocates
    /// against); a single player's is their own, with the ball's as the fallback
    /// for a ball whose player row carries none.
    ///
    /// User-facing spelling is **HCP**, not CH — the same rename the server's
    /// subtitle facts and the web client made. See `productSubtitleFacts` in
    /// `ResultLayout.swift`, which filters the server's `HCP n` fact by prefix.
    private var handicapText: String? {
        if ball.players.count > 1 {
            guard let value = ball.courseHandicap else { return nil }
            return "Team · HCP \(jsNumberString(value))"
        }
        guard let value = ball.players.first?.courseHandicap ?? ball.courseHandicap else {
            return nil
        }
        return "HCP \(jsNumberString(value))"
    }

    /// Web: `.se-row__topar` — the running to-par over scored holes, tinted
    /// under/over/even, at the display face's 1.35rem against the name's 1.05.
    ///
    /// It is right of the name block and pushed hard against the score columns
    /// by the row's `Spacer`, so the values line up down the list without a
    /// fixed-width slot: every row's to-par ENDS at the same x. That holds only
    /// because the ONE view that comes and goes beside it — `statusIcon` — sits
    /// on its LEFT, where it eats the spacer's slack instead of the to-par's
    /// position. Putting the icon between the to-par and the score columns
    /// breaks the alignment for exactly as long as a write is in flight, and
    /// permanently on an error.
    ///
    /// `layoutPriority(1)` is the web's `flex-shrink: 0` on the same element:
    /// at an accessibility text size something in this row has to give, and it
    /// must be the name (which truncates with an ellipsis and is still
    /// identifiable) rather than the number (which would truncate to a lie —
    /// "+1" out of "+12"). A pending seat has no standing to report and renders
    /// nothing at all; its "open seat" is on the line under the name.
    @ViewBuilder
    private var toParValue: some View {
        if ball.pending {
            EmptyView()
        } else if let value = toPar {
            let direction = ParDirection(toPar: value)
            Text(direction.formatted(toPar: value))
                .font(TapFont.display(size: 21.6, weight: .bold, tabular: true))
                .foregroundStyle(direction.color)
                .lineLimit(1)
                .layoutPriority(1)
        } else {
            Text("–")
                .font(TapFont.display(size: 21.6, weight: .bold, tabular: true))
                .foregroundStyle(TapColors.textMuted)
                .lineLimit(1)
                .layoutPriority(1)
        }
    }

    /// Running to-par over scored holes — the Swift image of the web's
    /// `toParValue`. Pick-ups (`0`) and unscored holes are excluded, and a ball
    /// with nothing scored yet has no value at all.
    private var toPar: Int? {
        var shots = 0
        var par = 0
        var any = false
        for occurrence in store.playedOrder {
            guard let value = store.strokes(ballId: ball.id, playHoleId: occurrence.playHoleId),
                  countInt(value) > 0
            else { continue }
            shots += countInt(value)
            par += store.par(of: occurrence.playHoleId)
            any = true
        }
        return any ? shots - par : nil
    }

    /// `0` strokes is a PICK-UP, not a zero — the same overload the web keypad
    /// uses. It must never render as the digit.
    ///
    /// An unscored circle shows the handicap hint when there is one (web:
    /// `.se-row__circle.hint`) and the plain "–" when there is not — a round
    /// with no playing handicaps looks exactly as it did.
    private var circleState: ScoreCircle.State {
        if ball.pending { return .pending }
        guard let strokes else {
            guard let hint = store.hintText(ballId: ball.id, playHoleId: playHoleId) else {
                return .empty
            }
            return .hint(hint)
        }
        let count = countInt(strokes)
        return count == 0 ? .pickedUp : .score(count)
    }

    /// Every visible part of the row is in this ONE label rather than in its own
    /// element: VoiceOver reading "Ada, HCP 12, +3, 4, previous hole 5" is the
    /// glance the sighted layout gives in one sweep, and a focusable ghost
    /// column, handicap or to-par would be stops with nothing to do at them.
    ///
    /// **The to-par is in it because it is the loudest thing on the row.** The
    /// redesign made it the second-biggest number on screen; a label that named
    /// the name, the handicap and the score but not how the ball stands would be
    /// describing a different row than the one being looked at. It is spoken in
    /// its written form (`ParDirection.formatted` — "E", "-3", "+2") for the
    /// same reason the handicap is spoken as WRITTEN (`Team · HCP 12`): a
    /// listener and a looker have to be able to describe the row to each other.
    /// It is omitted when nothing has been scored yet, where the row shows a
    /// muted "–" that would only be noise read aloud.
    ///
    /// The unscored circle's stroke preview says "**receives** -1", not
    /// "handicap -1": in a sentence that already carries `HCP 12`, using the
    /// same word for the hole's allocation makes two different numbers sound
    /// like one restated. A pending seat keeps its one short sentence.
    private var accessibilityLabel: String {
        let name = store.displayName(of: ball)
        let handicap = handicapText.map { ", \($0)" } ?? ""
        let standing = toPar.map { ", \(ParDirection(toPar: $0).formatted(toPar: $0))" } ?? ""
        let previous = previousText.map { ", previous hole \($0)" } ?? ""
        guard let strokes else {
            if ball.pending { return "\(name), open seat" }
            if case let .hint(text) = circleState {
                return "\(name)\(handicap)\(standing), no score, receives \(text)\(previous)"
            }
            return "\(name)\(handicap)\(standing), no score\(previous)"
        }
        return "\(name)\(handicap)\(standing), \(jsNumberString(strokes))\(previous)"
    }

    @ViewBuilder
    private var statusIcon: some View {
        switch status {
        case .saving:
            ProgressView().controlSize(.small).tint(TapColors.accent)
        case .error:
            Button {
                Task { await store.retry(ballId: ball.id, playHoleId: playHoleId) }
            } label: {
                Image(systemName: "arrow.clockwise.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(TapColors.error)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Retry saving score")
        case .saved, .none:
            EmptyView()
        }
    }
}

