import SwiftUI

/// Score entry — one hole at a time, one tap per stroke count.
///
/// The web original (`src/round/score-entry.component.ts`) is the spec for the
/// *behaviour*; the pixels are native. What is carried over exactly:
///
/// - The hole pager is a plain `TabView(.page)`. Carousel physics are not part
///   of the contract; landing on the right hole is.
/// - A seat that is still a placeholder (`ball.pending`) renders as an
///   unscoreable row. It is not hidden — the group's shape is information — but
///   nothing can be entered against a seat nobody has claimed.
/// - Correction mode is a property of the VISIT, snapshotted on arrival by
///   `RoundStore.noteHoleEntered()`, so re-entering a finished hole edits in
///   place instead of chain-advancing off it.
struct ScoreEntryView: View {
    @Bindable var store: RoundStore

    var body: some View {
        VStack(spacing: 0) {
            if store.groups.count > 1 { groupPicker }
            holeBar
            if store.playedOrder.isEmpty {
                ContentUnavailableView(
                    "Nothing to score yet",
                    systemImage: "flag",
                    description: Text("This round has no holes assigned to your group.")
                )
                .frame(maxHeight: .infinity)
            } else {
                pager
            }
        }
        .sheet(isPresented: keypadBinding) { keypadSheet }
    }

    // MARK: - Chrome

    private var groupPicker: some View {
        Picker("Group", selection: groupBinding) {
            ForEach(Array(store.groups.enumerated()), id: \.element.id) { index, _ in
                Text("Group \(index + 1)").tag(index)
            }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
        .padding(.bottom, 8)
    }

    private var groupBinding: Binding<Int> {
        Binding(get: { store.groupIndex }, set: { store.selectGroup(index: $0) })
    }

    private var holeBar: some View {
        HStack {
            Button { store.prevHole() } label: { Image(systemName: "chevron.left") }
                .disabled(!store.canPrevHole)
            Spacer()
            VStack(spacing: 2) {
                Text(currentHoleTitle).font(.title3.weight(.semibold))
                Text("Par \(store.par(of: store.currentPlayedHole?.playHoleId))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Button { store.nextHole() } label: { Image(systemName: "chevron.right") }
                .disabled(!store.canNextHole)
        }
        .padding(.horizontal)
        .padding(.bottom, 8)
    }

    private var currentHoleTitle: String {
        guard let hole = store.currentPlayedHole else { return "—" }
        return "Hole \(store.occurrenceLabel(hole.playHoleId))"
    }

    // MARK: - Pager

    private var pager: some View {
        TabView(selection: holeBinding) {
            ForEach(Array(store.playedOrder.enumerated()), id: \.element.playHoleId) { index, hole in
                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(store.ballsInGroup, id: \.id) { ball in
                            BallRow(
                                store: store,
                                ball: ball,
                                playHoleId: hole.playHoleId,
                                par: store.par(of: hole.playHoleId)
                            )
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 24)
                }
                .tag(index)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .automatic))
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

/// One ball's row on one hole: who, what they scored, and how the write is
/// going. Tapping opens the keypad aimed at this ball.
private struct BallRow: View {
    @Bindable var store: RoundStore
    let ball: RoundBall
    let playHoleId: String
    let par: Int

    private var strokes: Double? { store.strokes(ballId: ball.id, playHoleId: playHoleId) }
    private var status: RoundStore.CellState.Status? {
        store.writeStatus(ballId: ball.id, playHoleId: playHoleId)
    }

    var body: some View {
        Button {
            store.openKeypad(ballId: ball.id)
        } label: {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(store.displayName(of: ball))
                        .font(.body.weight(.medium))
                        .foregroundStyle(ball.pending ? .secondary : .primary)
                    if ball.pending {
                        Text("Open seat").font(.caption).foregroundStyle(.secondary)
                    } else if let handicap = ball.courseHandicap {
                        Text("CH \(jsNumberString(handicap))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                statusIcon
                scoreCircle
            }
            .padding(12)
            .background(.quaternary.opacity(0.4), in: RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
        // A placeholder seat is shown but not scoreable — there is nobody to
        // score for yet, and an entry against it would have to be re-attributed
        // when the seat is claimed.
        .disabled(ball.pending)
        .accessibilityLabel(accessibilityLabel)
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
            ProgressView().controlSize(.small)
        case .error:
            Button {
                Task { await store.retry(ballId: ball.id, playHoleId: playHoleId) }
            } label: {
                Image(systemName: "arrow.clockwise.circle.fill").foregroundStyle(.orange)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Retry saving score")
        case .saved, .none:
            EmptyView()
        }
    }

    /// `0` strokes is a PICK-UP, not a zero — the same overload the web keypad
    /// uses. It must never render as the digit.
    private var scoreCircle: some View {
        ZStack {
            Circle()
                .strokeBorder(strokes == nil ? Color.secondary.opacity(0.4) : .clear, lineWidth: 1.5)
                .background(Circle().fill(fill))
            Text(text)
                .font(.headline.monospacedDigit())
                .foregroundStyle(strokes == nil ? Color.secondary : .primary)
        }
        .frame(width: 46, height: 46)
    }

    private var text: String {
        guard let strokes else { return "–" }
        return countInt(strokes) == 0 ? "—" : jsNumberString(strokes)
    }

    private var fill: Color {
        guard let strokes, countInt(strokes) > 0 else { return .clear }
        let delta = countInt(strokes) - par
        if delta <= -2 { return .yellow.opacity(0.35) }
        if delta == -1 { return .red.opacity(0.22) }
        if delta == 0 { return .secondary.opacity(0.12) }
        if delta == 1 { return .blue.opacity(0.18) }
        return .blue.opacity(0.3)
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
struct KeypadView: View {
    @Bindable var store: RoundStore

    @State private var bigValue = 10

    private let columns = [GridItem(.adaptive(minimum: 64), spacing: 12)]

    var body: some View {
        VStack(spacing: 16) {
            header
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(1...9, id: \.self) { value in
                    key("\(value)") { store.commit(value) }
                }
            }
            HStack(spacing: 12) {
                key("Pick up", wide: true) { store.commit(0) }
                key("Clear", wide: true, tint: .red) { store.commit(nil) }
            }
            bigStepper
            Spacer(minLength: 0)
        }
        .padding()
    }

    private var header: some View {
        VStack(spacing: 4) {
            Text(store.ballUnderCursor.map { store.displayName(of: $0) } ?? "—")
                .font(.headline)
            HStack(spacing: 6) {
                if let hole = store.currentPlayedHole {
                    Text("Hole \(store.occurrenceLabel(hole.playHoleId)) · Par \(store.par(of: hole.playHoleId))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if store.holeCompleteOnEntry {
                    Text("Correcting")
                        .font(.caption2.weight(.semibold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(.orange.opacity(0.18), in: Capsule())
                }
            }
            if store.ballsInGroup.count > 1 { ballStrip }
        }
    }

    /// Jump straight to another ball on the same hole without leaving the pad.
    private var ballStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Array(store.ballsInGroup.enumerated()), id: \.element.id) { index, ball in
                    Button(store.displayName(of: ball)) { store.selectBall(index: index) }
                        .font(.caption)
                        .buttonStyle(.bordered)
                        .tint(index == store.currentBallIndex ? .accentColor : .secondary)
                        .disabled(ball.pending)
                }
            }
            .padding(.horizontal, 2)
        }
        .frame(height: 40)
    }

    private var bigStepper: some View {
        HStack(spacing: 12) {
            Button { bigValue = max(10, bigValue - 1) } label: { Image(systemName: "minus") }
                .buttonStyle(.bordered)
            Text("\(bigValue)").font(.title3.monospacedDigit().weight(.semibold)).frame(minWidth: 44)
            Button { bigValue += 1 } label: { Image(systemName: "plus") }
                .buttonStyle(.bordered)
            Button("Save \(bigValue)") { store.commit(bigValue) }
                .buttonStyle(.borderedProminent)
        }
    }

    private func key(
        _ label: String,
        wide: Bool = false,
        tint: Color = .accentColor,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(label)
                .font(wide ? .callout.weight(.medium) : .title2.weight(.semibold))
                .frame(maxWidth: .infinity)
                .frame(height: wide ? 44 : 64)
        }
        .buttonStyle(.bordered)
        .tint(tint)
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
        VStack(alignment: .leading, spacing: 20) {
            Text(store.ballUnderCursor.map { store.displayName(of: $0) } ?? "—")
                .font(.headline)

            ForEach(store.metadataInputsForCurrentHole, id: \.key) { input in
                Toggle(input.label, isOn: toggleBinding(input.key))
                    .toggleStyle(.switch)
            }

            Spacer()

            Button(store.hasMoreUnscoredBalls ? "Next ›" : "Done ›") {
                store.statsDone()
            }
            .buttonStyle(.borderedProminent)
            .frame(maxWidth: .infinity)
        }
        .padding()
    }

    private func toggleBinding(_ key: String) -> Binding<Bool> {
        Binding(
            get: { store.pendingMeta[key] == true },
            set: { store.setMetadata(key: key, value: $0) }
        )
    }
}
