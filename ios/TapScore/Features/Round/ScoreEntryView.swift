import SwiftUI
import UIKit

/// Score entry — one hole at a time, one tap per stroke count.
///
/// The web original (`src/round/score-entry.component.ts`) is the spec for the
/// *behaviour*; the pixels follow its anatomy through the design system. What
/// is carried over exactly:
///
/// - The hole pager is a plain `TabView(.page)`. Carousel physics are not part
///   of the contract; landing on the right hole is.
/// - A seat that is still a placeholder (`ball.pending`) renders as an
///   unscoreable row. It is not hidden — the group's shape is information — but
///   nothing can be entered against a seat nobody has claimed.
/// - Correction mode is a property of the VISIT, snapshotted on arrival by
///   `RoundStore.noteHoleEntered()`, so re-entering a finished hole edits in
///   place instead of chain-advancing off it.
///
/// The hole's prev/next controls are NOT here: they live in the pinned gold
/// `HoleBar` that `RoundView` docks at the bottom, exactly as `.round-hole`
/// does on the web.
///
/// **Two web details are deliberately absent, and neither is an oversight:**
///
/// - `.se-row__prev` — the ghosted previous-hole score printed beside the
///   circle. It is a glance-back affordance for a wide row; at phone width the
///   row is already name + to-par + status + circle, and the ghost is what a
///   swipe back to the previous hole gives instead.
/// - The handicap hint inside an unscored circle (`.se-row__circle.hint`, the
///   Gamebook "−1 / 0 / +1" preview). `ScoreCircle.State.hint` EXISTS and is
///   rendered; what is missing is the store-side `hintText` — the per-ball
///   given-strokes computation. It arrives with the handicap work, and until
///   the numbers are computed once, server-side or not at all, a native
///   reimplementation would be a second source of truth for strokes given.
///
/// Revisit both when the row gets wider (iPad) or handicaps land; do not file
/// them as regressions against this screen.
struct ScoreEntryView: View {
    @Bindable var store: RoundStore

    /// The link the share card offers. Built by `RoundView` from the resolved
    /// web origin; this screen renders it and never derives one.
    let shareURL: String

    /// The round header. It scrolls with the page, exactly as the web's
    /// `.round-view__main` scrolls it with the carousel.
    let header: RoundHeaderView

    /// The pager's height, measured from the tallest page.
    ///
    /// A `TabView` has no intrinsic height, and the whole point of this screen's
    /// anatomy is that ONE scroll view moves the header, the chips and the hole
    /// together. So the pages report their ideal heights and the tallest wins;
    /// each page is laid out `fixedSize` vertically, so what they report never
    /// depends on what is set here (no measure/lay-out feedback loop).
    @State private var pageHeight: CGFloat = 420

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
                    pager.frame(height: pageHeight)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .refreshable { await store.refresh() }
        .onPreferenceChange(PageHeightKey.self) { height in
            if height > 0 { pageHeight = height }
        }
        .background(TapColors.bg)
        .sheet(isPresented: keypadBinding) { keypadSheet }
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

    // MARK: - Pager

    private var pager: some View {
        TabView(selection: holeBinding) {
            ForEach(Array(store.playedOrder.enumerated()), id: \.element.playHoleId) { index, hole in
                page(hole).tag(index)
            }
        }
        // No page dots: the gold hole bar under the pager already says which
        // hole this is, and the dots would land on top of it.
        .tabViewStyle(.page(indexDisplayMode: .never))
    }

    private func page(_ hole: RoundGroupPlayedHole) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            holeCard(hole)
            rows(hole)
            shareCard.padding(.top, TapSpacing.xxl)
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.bottom, TapSpacing.xl)
        // Ideal height regardless of what the pager proposes — see `pageHeight`.
        .fixedSize(horizontal: false, vertical: true)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            GeometryReader { proxy in
                Color.clear.preference(key: PageHeightKey.self, value: proxy.size.height)
            }
        )
    }

    /// Web: `.se__carousel` / `.se-hole` — a 60pt sunken plate whose big serif
    /// hole number sits over the score column, with the par as a caption.
    private func holeCard(_ hole: RoundGroupPlayedHole) -> some View {
        TapCard(sunken: true) {
            HStack(spacing: 0) {
                Spacer(minLength: 0)
                VStack(spacing: 1) {
                    Text(store.occurrenceLabel(hole.playHoleId))
                        .font(TapFont.display(size: 19.2, weight: .bold, tabular: true))
                        .foregroundStyle(TapColors.text)
                    Text("Par \(store.par(of: hole.playHoleId))")
                        .font(TapFont.ui(size: 10.9))
                        .foregroundStyle(TapColors.textMuted)
                }
                // The web parks the active hole over the circle column rather
                // than at the edge; `RIGHT_PAD` + half a slot, natively.
                .frame(width: 72)
                .padding(.trailing, TapSpacing.md)
            }
            .frame(height: 60)
        }
    }

    /// Web: `.se__rows` — hairline-separated rows, no card. The top rule is
    /// `border-top` on the list; each row carries its own `border-bottom`.
    private func rows(_ hole: RoundGroupPlayedHole) -> some View {
        VStack(spacing: 0) {
            hairline
            ForEach(store.ballsInGroup, id: \.id) { ball in
                BallRow(store: store, ball: ball, playHoleId: hole.playHoleId)
                hairline
            }
        }
        .padding(.top, TapSpacing.sm)
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

    /// Every page change routes through `goToHole` — it is manual navigation,
    /// so it must cancel a pending auto-advance (caller contract #3).
    private var holeBinding: Binding<Int> {
        Binding(get: { store.holeIndex }, set: { store.goToHole(index: $0) })
    }

    // MARK: - Keypad

    private var keypadBinding: Binding<Bool> {
        Binding(get: { store.keypadOpen }, set: { if !$0 { store.closeKeypad() } })
    }

    @ViewBuilder
    private var keypadSheet: some View {
        if store.statsOpen {
            StatsView(store: store)
                .presentationDetents([.medium])
        } else {
            KeypadView(store: store)
                .presentationDetents([.medium, .large])
        }
    }
}

/// The tallest hole page's height, reduced with `max` across the pager's pages.
private struct PageHeightKey: PreferenceKey {
    static let defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
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
    let playHoleId: String

    private var strokes: Double? { store.strokes(ballId: ball.id, playHoleId: playHoleId) }
    private var status: RoundStore.CellState.Status? {
        store.writeStatus(ballId: ball.id, playHoleId: playHoleId)
    }

    var body: some View {
        Button {
            store.openKeypad(ballId: ball.id)
        } label: {
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
                // `marker: nil` — the entry circle is PLAIN. The web tints no
                // score-entry circle by par (`.se-row__circle` is one cream
                // `--accent-soft` disc with `--primary` ink at every value);
                // the par-tinted shape language belongs to the leaderboard's
                // markers, where it distinguishes cells in a dense grid. Tinting
                // here would put two different visual systems on one screen and
                // make the circle look like a marker you can tap.
                ScoreCircle(state: circleState, marker: nil)
            }
            .padding(.vertical, TapSpacing.md)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        // A placeholder seat is shown but not scoreable — there is nobody to
        // score for yet, and an entry against it would have to be re-attributed
        // when the seat is claimed.
        .disabled(ball.pending)
        .accessibilityLabel(accessibilityLabel)
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
    private var circleState: ScoreCircle.State {
        if ball.pending { return .pending }
        guard let strokes else { return .empty }
        let count = countInt(strokes)
        return count == 0 ? .pickedUp : .score(count)
    }

    private var accessibilityLabel: String {
        let name = store.displayName(of: ball)
        guard let strokes else {
            return ball.pending ? "\(name), open seat" : "\(name), no score"
        }
        return "\(name), \(jsNumberString(strokes))"
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

/// The keypad: digits, a 10+ stepper, pick-up and clear.
///
/// Semantics carried from the web verbatim:
/// - `1…9` commit that value.
/// - `10+` opens a stepper starting at 10 (never below), committed with ✓.
/// - **pick up** commits `0` — a played-but-not-holed-out ball. It has a score
///   (the hole counts as attempted); it just isn't a stroke count.
/// - **clear** commits `nil`, which the store turns into a `score_cleared`
///   event rather than a `0`. Deleting a score and picking up are different
///   facts and the event log keeps them apart.
///
/// The web's pad is a dark fullscreen modal; natively it is a sheet, so it sits
/// on the app's own surfaces rather than borrowing a second palette.
struct KeypadView: View {
    @Bindable var store: RoundStore

    @State private var bigValue = 10

    private let columns = [GridItem(.adaptive(minimum: 72), spacing: TapSpacing.sm)]

    var body: some View {
        VStack(spacing: TapSpacing.lg) {
            header
            LazyVGrid(columns: columns, spacing: TapSpacing.sm) {
                ForEach(1...9, id: \.self) { value in
                    numberKey(value)
                }
            }
            HStack(spacing: TapSpacing.sm) {
                Button("Pick up") { store.commit(0) }
                    .buttonStyle(.tap(.ghost, fillsWidth: true))
                Button("Clear") { store.commit(nil) }
                    .buttonStyle(.tap(.danger, fillsWidth: true))
            }
            bigStepper
            Spacer(minLength: 0)
        }
        .padding(TapSpacing.lg)
        .background(TapColors.bg)
    }

    private var header: some View {
        VStack(spacing: TapSpacing.xs) {
            Text(store.ballUnderCursor.map { store.displayName(of: $0) } ?? "—")
                .font(TapFont.display(size: 17.6, weight: .bold))
                .foregroundStyle(TapColors.text)
            HStack(spacing: TapSpacing.sm) {
                if let hole = store.currentPlayedHole {
                    Text("Hole \(store.occurrenceLabel(hole.playHoleId)) · Par \(store.par(of: hole.playHoleId))")
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                }
                if store.holeCompleteOnEntry {
                    TapPillLabel(
                        text: "Correcting",
                        background: TapColors.warningSoft,
                        foreground: TapColors.warning
                    )
                }
            }
            if store.ballsInGroup.count > 1 { ballStrip }
        }
    }

    /// Jump straight to another ball on the same hole without leaving the pad.
    private var ballStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: TapSpacing.sm) {
                ForEach(Array(store.ballsInGroup.enumerated()), id: \.element.id) { index, ball in
                    TapChip(
                        title: store.displayName(of: ball),
                        isSelected: index == store.currentBallIndex,
                        tone: .primary
                    ) {
                        store.selectBall(index: index)
                    }
                    .disabled(ball.pending)
                    .opacity(ball.pending ? 0.55 : 1)
                }
            }
            .padding(.horizontal, 2)
        }
        .frame(height: 44)
        .padding(.top, TapSpacing.xs)
    }

    /// Web: `.se-key` — a serif numeral over its uppercase relation-to-par
    /// caption. The par key is the filled one.
    private func numberKey(_ value: Int) -> some View {
        Button {
            store.commit(value)
        } label: {
            VStack(spacing: 1) {
                Text("\(value)")
                    .font(TapFont.display(size: 20.8, weight: .bold, tabular: true))
                Text(keyCaption(value))
                    .font(TapFont.ui(size: 9.9, weight: .bold))
                    .tracking(9.9 * 0.04)
                    .opacity(0.75)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
        }
        .buttonStyle(.tap(isPar(value) ? .primary : .secondary))
    }

    private var par: Int { store.par(of: store.currentPlayedHole?.playHoleId) }

    private func isPar(_ value: Int) -> Bool { value == par }

    /// Web: `scoreLabel` — the golf name of a stroke count against this par.
    private func keyCaption(_ value: Int) -> String {
        if value == 1 { return "HIO" }
        switch value - par {
        case -3: return "ALB"
        case -2: return "EAGLE"
        case -1: return "BIRDIE"
        case 0: return "PAR"
        case 1: return "BOGEY"
        case 2: return "+2"
        default: return value - par > 0 ? "+\(value - par)" : "\(value - par)"
        }
    }

    private var bigStepper: some View {
        HStack(spacing: TapSpacing.sm) {
            Button { bigValue = max(10, bigValue - 1) } label: {
                Image(systemName: "minus").frame(width: 24)
            }
            .buttonStyle(.tapSecondary)

            Text("\(bigValue)")
                .font(TapFont.display(size: 22.4, weight: .bold, tabular: true))
                .foregroundStyle(TapColors.text)
                .frame(minWidth: 48)

            Button { bigValue += 1 } label: {
                Image(systemName: "plus").frame(width: 24)
            }
            .buttonStyle(.tapSecondary)

            Button("Save \(bigValue)") { store.commit(bigValue) }
                .buttonStyle(.tap(.primary))
        }
    }
}

/// The optional per-hole stats step, shown only when a format in this round
/// declares metadata inputs that apply to the current hole.
///
/// The button label is "Next ›" while another ball on the hole is still
/// unscored and "Done ›" on the last one — the same affordance the web shows,
/// and the reason `hasMoreUnscored` exists in the policy at all.
struct StatsView: View {
    @Bindable var store: RoundStore

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.lg) {
            Text(store.ballUnderCursor.map { store.displayName(of: $0) } ?? "—")
                .font(TapFont.display(size: 22.4, weight: .bold))
                .foregroundStyle(TapColors.text)

            ForEach(store.metadataInputsForCurrentHole, id: \.key) { input in
                Toggle(isOn: toggleBinding(input.key)) {
                    Text(input.label)
                        .font(TapFont.ui(size: 16, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                }
                .toggleStyle(.switch)
                .tint(TapColors.primary)
            }

            Spacer()

            Button(store.hasMoreUnscoredBalls ? "Next ›" : "Done ›") {
                store.statsDone()
            }
            .buttonStyle(.tap(.primary, size: .prominent, fillsWidth: true))
        }
        .padding(TapSpacing.lg)
        .background(TapColors.bg)
    }

    private func toggleBinding(_ key: String) -> Binding<Bool> {
        Binding(
            get: { store.pendingMeta[key] == true },
            set: { store.setMetadata(key: key, value: $0) }
        )
    }
}
