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
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 0) {
                        // The empty leading cell. It is what lets hole 1 sit in
                        // the ACTIVE (trailing) column with nothing beside it —
                        // the web's `.se-hole.gone` at offset −1.
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
                .frame(width: ScoreColumns.stripWidth)
                .padding(.trailing, ScoreColumns.rightPad)
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
    /// A change routes through `goToHole`, in both directions: a drag is manual
    /// navigation and must cancel a pending auto-advance (caller contract #3),
    /// and reading `store.holeIndex` back out is what makes the gold `HoleBar`'s
    /// chevrons scroll the strip.
    ///
    /// **Only a change.** `scrollPosition` writes back liberally — on settle, on
    /// a bounce, and after we ourselves scrolled the strip because `holeIndex`
    /// moved — and each of those reports the hole the round is already on. An
    /// unguarded setter turns every one of them into a `goToHole` call, which
    /// cancels whatever auto-advance jump is pending: the chain the advance
    /// policy exists to drive would be killed by the animation that the chain
    /// itself started. `goToHole` also short-circuits on an unchanged index, but
    /// only AFTER `cancelJump()` and `statsOpen = false`, so the guard has to be
    /// here.
    private var anchorBinding: Binding<String?> {
        Binding(
            get: { ScoreColumns.anchor(forHoleIndex: store.holeIndex, in: store.playedOrder) },
            set: { anchor in
                guard let index = ScoreColumns.holeIndex(forAnchor: anchor, in: store.playedOrder),
                      index != store.holeIndex
                else { return }
                store.goToHole(index: index)
            }
        )
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

/// One ball's row on one hole: who, how they stand, and what they scored.
/// Tapping opens the keypad aimed at this ball.
///
/// Web: `.se-row` — serif name over a coloured running to-par, with the cream
/// score circle on the right.
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
                toParLine
            }
            Spacer(minLength: 0)
            statusIcon
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

    /// Web: `.se-row__topar` — the running to-par over scored holes, tinted
    /// under/over/even. A pending seat says what it is instead.
    @ViewBuilder
    private var toParLine: some View {
        if ball.pending {
            Text("open seat")
                .font(TapFont.ui(size: 12.8, weight: .semibold))
                .foregroundStyle(TapColors.textMuted)
        } else if let value = toPar {
            let direction = ParDirection(toPar: value)
            Text(direction.formatted(toPar: value))
                .font(TapFont.ui(size: 12.8, weight: .semibold))
                .foregroundStyle(direction.color)
        } else {
            Text("–")
                .font(TapFont.ui(size: 12.8, weight: .semibold))
                .foregroundStyle(TapColors.textMuted)
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

    /// The ghost column is part of the row's label, not a separate element:
    /// VoiceOver reading "Ada, 4, previous hole 5" is the glance the sighted
    /// two-column layout gives, and a focusable ghost would be a stop with
    /// nothing to do at it.
    private var accessibilityLabel: String {
        let name = store.displayName(of: ball)
        let previous = previousText.map { ", previous hole \($0)" } ?? ""
        guard let strokes else {
            if ball.pending { return "\(name), open seat" }
            if case let .hint(text) = circleState {
                return "\(name), no score, handicap \(text)\(previous)"
            }
            return "\(name), no score\(previous)"
        }
        return "\(name), \(jsNumberString(strokes))\(previous)"
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

