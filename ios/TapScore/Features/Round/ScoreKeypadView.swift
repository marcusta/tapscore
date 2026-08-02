import SwiftUI

/// The score-entry takeover: hole navigation, the group's balls as rows, and the
/// pad itself.
///
/// **It is dark in both appearances, and that is the design.** The web's
/// `.se-modal` is a fixed fullscreen `#121212` surface with a `#1c1c1e` pad on
/// top of it, in every theme — a keypad is used at arm's length in direct sun,
/// and the near-black plate with white numerals is the contrast that survives
/// glare. So this screen does not follow the app's surfaces: it pins
/// `colorScheme` to `.dark` (which resolves every theme token to its dark-side
/// value, the way the web reads its tokens over a dark plate) and hardcodes the
/// same neutrals the web CSS hardcodes.
///
/// Semantics carried from the web verbatim — see `KeypadKey`:
/// - `1…9` commit that value.
/// - `10+` opens a stepper starting at 10 (never below), committed with ✓.
/// - **pick up** commits `0` — a played-but-not-holed-out ball. It has a score
///   (the hole counts as attempted); it just isn't a stroke count.
/// - **clear** commits `nil`, which the store turns into a `score_cleared`
///   event rather than a `0`. Deleting a score and picking up are different
///   facts and the event log keeps them apart.
///
/// Hole navigation lives INSIDE the takeover (the header chevrons), exactly as
/// `.se-modal__nav` does — once the pad is up it covers the hole bar, so the
/// only way to the next tee has to be here.
struct KeypadView: View {
    @Bindable var store: RoundStore

    /// The `10+` stepper. Reseeded to 10 on every open, like `openExtended()`.
    @State private var extendedValue = 10
    @State private var extendedOpen = false

    var body: some View {
        VStack(spacing: 0) {
            header
            ballList
            pad
        }
        .background(KeypadPalette.screen.ignoresSafeArea())
        .environment(\.colorScheme, .dark)
        // The stepper is a MODE over one hole, exactly as the web's
        // `stepHole()` treats it (`extendedOpen.set(false)` before it moves):
        // a "13" half-typed on hole 4 must never land on hole 5. The chevrons
        // close it themselves, and this closes it for every OTHER route that
        // can move the hole under an open pad — the post-completion auto-jump,
        // a group switch, a reload that reshapes the itinerary.
        .onChange(of: store.holeIndex) { extendedOpen = false }
    }

    // MARK: - Header

    /// Web: `.se-modal__head` — close on the left, `Hole N · Par P` centred,
    /// prev/next chevrons on the right.
    private var header: some View {
        ZStack {
            VStack(spacing: 2) {
                Text(holeTitle)
                    .font(TapFont.display(size: 17.6, weight: .bold))
                    .foregroundStyle(KeypadPalette.ink)
                if store.holeCompleteOnEntry {
                    TapPillLabel(
                        text: "Correcting",
                        background: TapColors.warningSoft,
                        foreground: TapColors.warning
                    )
                }
            }

            HStack(spacing: 0) {
                iconButton("xmark", size: 17) { store.closeKeypad() }
                    .accessibilityLabel("Close keypad")
                Spacer(minLength: TapSpacing.sm)
                // Web: `.se-modal__nav { display: flex; gap: 4px }` — the pair
                // is one cluster, and only the pair.
                HStack(spacing: 4) {
                    iconButton("chevron.left", size: 22) { stepHole(store.prevHole) }
                        .disabled(!store.canPrevHole)
                        .opacity(store.canPrevHole ? 1 : 0.35)
                        .accessibilityLabel("Previous hole")
                    iconButton("chevron.right", size: 22) { stepHole(store.nextHole) }
                        .disabled(!store.canNextHole)
                        .opacity(store.canNextHole ? 1 : 0.35)
                        .accessibilityLabel("Next hole")
                }
            }
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.vertical, TapSpacing.md)
        .overlay(alignment: .bottom) {
            Rectangle().fill(KeypadPalette.rule).frame(height: 1)
        }
    }

    private var holeTitle: String {
        guard let hole = store.currentPlayedHole else { return "" }
        return "Hole \(store.occurrenceLabel(hole.playHoleId)) · Par \(store.par(of: hole.playHoleId))"
    }

    /// Web: `stepHole(dir)` — drop the stepper, THEN move. Closing it here as
    /// well as in `onChange` is not belt-and-braces: a chevron press at either
    /// end of the round is a no-op in the store (`goToHole` clamps and returns
    /// early), so `holeIndex` never changes and `onChange` never fires — but the
    /// web still closes the stepper on that press, and so must this.
    private func stepHole(_ move: () -> Void) {
        extendedOpen = false
        move()
    }

    private func iconButton(_ system: String, size: CGFloat, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: system)
                .font(.system(size: size, weight: .medium))
                .foregroundStyle(KeypadPalette.ink)
                .frame(width: 40, height: 40)
                .contentShape(Rectangle())
        }
        .buttonStyle(KeypadPressStyle(pressed: KeypadPalette.inkWash, shape: .circle))
    }

    // MARK: - Balls

    /// Web: `.se-modal__list` / `.se-mrow` — one full-width row per ball, not a
    /// chip strip: the row under the cursor carries a leading accent bar and a
    /// lighter fill, so which ball the next key press lands on is unmissable.
    private var ballList: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(Array(store.ballsInGroup.enumerated()), id: \.element.id) { index, ball in
                    ballRow(ball, index: index)
                }
            }
        }
        .frame(maxHeight: .infinity)
    }

    private func ballRow(_ ball: RoundBall, index: Int) -> some View {
        let selected = index == store.currentBallIndex
        return Button {
            store.selectBall(index: index)
        } label: {
            HStack(spacing: TapSpacing.md) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(store.displayName(of: ball))
                        .font(TapFont.display(size: 16, weight: .semibold))
                        .foregroundStyle(KeypadPalette.ink)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    Text(handicapLine(ball))
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(KeypadPalette.inkMuted)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                scoreCircle(ball, selected: selected)
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(selected ? KeypadPalette.rowSelected : .clear)
            .overlay(alignment: .leading) {
                Rectangle()
                    .fill(selected ? TapColors.primary : .clear)
                    .frame(width: 4)
            }
            .overlay(alignment: .bottom) {
                Rectangle().fill(KeypadPalette.ruleSoft).frame(height: 1)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(ball.pending)
        .opacity(ball.pending ? 0.55 : 1)
    }

    /// Web: `.se-mrow__circle` — a **green disc, always**. There is no hollow
    /// state in the CSS: `background: var(--primary)` is unconditional, and the
    /// only variant is `.sel .se-mrow__circle`, which inverts to a white disc
    /// with green ink under the cursor. An unscored circle is therefore a filled
    /// green disc printing "–", or the handicap hint if there is one.
    ///
    /// The hint (`.se-mrow__val--hint`) is the Gamebook preview of what handicap
    /// does to the gross on this hole — smaller and at 55%, so it reads as a
    /// preview and never as a score already entered.
    private func scoreCircle(_ ball: RoundBall, selected: Bool) -> some View {
        let hole = store.currentPlayedHole
        let value = hole.flatMap { store.strokes(ballId: ball.id, playHoleId: $0.playHoleId) }
        let hint: String? = value == nil
            ? hole.flatMap { store.hintText(ballId: ball.id, playHoleId: $0.playHoleId) }
            : nil
        // `#fff`, not the cream: inside the takeover the web hardcodes white ink
        // on every green fill (`.se-mrow`'s own `color: #fff` shows through the
        // circle). The cream `--primary-text` belongs to the light surfaces.
        let fill: Color = selected ? KeypadPalette.ink : TapColors.primary
        let ink: Color = selected ? TapColors.primary : KeypadPalette.ink
        return Text(value.map { jsNumberString($0) } ?? hint ?? "–")
            // Web: `.se-mrow__val--hint { font-size: 1rem; opacity: 0.55 }`
            // against the circle's own 1.25rem.
            .font(TapFont.display(size: hint == nil ? 20 : 16, weight: .bold, tabular: true))
            .foregroundStyle(ink)
            .opacity(hint == nil ? 1 : 0.55)
            .frame(width: 52, height: 52)
            .background(Circle().fill(fill))
            .accessibilityLabel(circleLabel(value: value, hint: hint))
    }

    private func circleLabel(value: Double?, hint: String?) -> String {
        if let value { return jsNumberString(value) }
        if let hint { return "No score, handicap \(hint)" }
        return "No score"
    }

    /// Web: `.se-mrow__hcp` — the playing handicap this ball scores off, or what
    /// an unclaimed seat is instead. Same derivation (and same `HCP n → m`
    /// arrow under the selected format) as `BallRow.handicapText` — the two
    /// surfaces must never disagree about which number a ball plays off.
    private func handicapLine(_ ball: RoundBall) -> String {
        if ball.pending { return "Open seat — claim to score" }
        let base: String
        let baseValue: Double?
        if ball.players.count > 1 {
            baseValue = ball.courseHandicap
            base = "Team · HCP \(baseValue.map { jsNumberString($0) } ?? "–")"
        } else {
            baseValue = ball.players.first?.courseHandicap ?? ball.courseHandicap
            base = "HCP \(baseValue.map { jsNumberString($0) } ?? "–")"
        }
        if let baseValue,
           let effective = store.effectivePlayingHandicap(of: ball),
           effective != baseValue {
            return "\(base) → \(jsNumberString(effective))"
        }
        return base
    }

    // MARK: - Pad

    /// Web: `.se-pad` — a 3-wide grid on its own slightly-lifted plate, with the
    /// `10+` stepper as an overlay that covers the keys rather than a fourth row.
    private var pad: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 3), spacing: 6) {
            ForEach(KeypadKey.pad) { key in
                keyButton(key)
            }
        }
        // `.overlay`, not a `ZStack` sibling: the web's `.se-pad__ext` is
        // `position: absolute; inset: 0` over the keys, so the pad must not
        // change height when the stepper opens.
        .overlay {
            if extendedOpen { extendedStepper }
        }
        // Web: `.se-pad { padding: sm sm xl }` — the deep bottom edge is what
        // keeps the last key row off the home indicator. It sits INSIDE the safe
        // area here (the plate's background is what ignores it), so on a
        // notched phone the gap is the web's 24 plus the inset; that is the
        // point of the rule, not a divergence from it.
        .padding(.horizontal, TapSpacing.sm)
        .padding(.top, TapSpacing.sm)
        .padding(.bottom, TapSpacing.xl)
        .background(KeypadPalette.pad.ignoresSafeArea(edges: .bottom))
    }

    /// Web: `.se-key` — a serif numeral over its uppercase relation-to-par
    /// caption. The key that equals this hole's par is the filled one.
    private func keyButton(_ key: KeypadKey) -> some View {
        let isPar = key == .number(par)
        return Button {
            press(key)
        } label: {
            VStack(spacing: 1) {
                Text(key.numeral)
                    .font(TapFont.display(size: 20.8, weight: .bold, tabular: true))
                Text(key.caption(par: par))
                    .font(TapFont.ui(size: 9.9, weight: .bold))
                    .tracking(9.9 * 0.04)
                    .opacity(0.75)
            }
            .foregroundStyle(keyInk(key))
            .frame(maxWidth: .infinity)
            // Web: `.se-key { height: 56px }` — comfortably over the 44pt
            // minimum, so there is no reason to grow it.
            .frame(height: 56)
        }
        .buttonStyle(
            KeypadPressStyle(
                fill: isPar ? TapColors.primary : KeypadPalette.key,
                pressed: isPar ? TapColors.primary.opacity(0.85) : KeypadPalette.keyPressed,
                shape: .roundedRect(10)
            )
        )
        .accessibilityLabel(key.accessibilityLabel)
    }

    private func keyInk(_ key: KeypadKey) -> Color {
        switch key {
        case .clear: return TapColors.error
        case .pickUp: return KeypadPalette.inkHalf
        // `.se-key.par` swaps only the BACKGROUND; the ink stays the plate's
        // `#fff`. White on green, not cream on green.
        case .number: return KeypadPalette.ink
        case .extended: return KeypadPalette.ink
        }
    }

    private var par: Int { store.par(of: store.currentPlayedHole?.playHoleId) }

    /// The one place a key press becomes a store call. `KeypadKey.action` is the
    /// mapping, so the tests assert the same table the pad renders from.
    private func press(_ key: KeypadKey) {
        switch key.action {
        case .commit(let value):
            store.commit(value)
        case .openStepper:
            extendedValue = 10
            extendedOpen = true
        }
    }

    /// Web: `.se-pad__ext` — the 10+ stepper, laid over the keys. It never goes
    /// below 10; ✓ commits, Cancel drops back to the keys without writing.
    private var extendedStepper: some View {
        VStack(spacing: TapSpacing.sm) {
            HStack(spacing: TapSpacing.xl) {
                KeypadStepperButton(system: "minus") { extendedValue = max(10, extendedValue - 1) }
                Text("\(extendedValue)")
                    .font(TapFont.display(size: 41.6, weight: .bold, tabular: true))
                    .foregroundStyle(KeypadPalette.ink)
                    // Web: `.se-pad__ext-val { width: 72px }`. It is a label,
                    // not a target, so the touch minimum does not apply — and
                    // tabular figures keep 10…99 from shifting the ± buttons.
                    .frame(width: 72)
                KeypadStepperButton(system: "plus") { extendedValue += 1 }
            }
            .frame(maxHeight: .infinity)

            HStack(spacing: 6) {
                Button {
                    extendedOpen = false
                } label: {
                    Text("Cancel")
                        .font(TapFont.ui(size: 16, weight: .semibold))
                        .foregroundStyle(KeypadPalette.ink)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                }
                .buttonStyle(
                    KeypadPressStyle(
                        fill: KeypadPalette.key,
                        pressed: KeypadPalette.keyPressed,
                        shape: .roundedRect(10)
                    )
                )
                Button {
                    extendedOpen = false
                    store.commit(extendedValue)
                } label: {
                    Image(systemName: "checkmark")
                        .font(.system(size: 20, weight: .bold))
                        // `.se-pad__ext-ok { color: #fff }`.
                        .foregroundStyle(KeypadPalette.ink)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                }
                .buttonStyle(
                    KeypadPressStyle(
                        fill: TapColors.primary,
                        pressed: TapColors.primary.opacity(0.85),
                        shape: .roundedRect(10)
                    )
                )
                .accessibilityLabel("Save \(extendedValue)")
            }
        }
        .background(KeypadPalette.pad)
    }

}

/// The round ± of the 10+ stepper, shared with the stats step's counters so
/// both pads press the same way.
struct KeypadStepperButton: View {
    let system: String
    var size: CGFloat = 60
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: system)
                .font(.system(size: size >= 60 ? 24 : 20, weight: .medium))
                .foregroundStyle(KeypadPalette.ink)
                .frame(width: size, height: size)
        }
        .buttonStyle(
            KeypadPressStyle(
                fill: KeypadPalette.key,
                pressed: KeypadPalette.keyPressed,
                shape: .circle
            )
        )
    }
}

// MARK: - Keys

/// The pad's key table — what it shows and what it does.
///
/// The order is the web's: `1…9`, then `10+`, clear, pick-up, laid out three to
/// a row. `action` is the only route from a key to the store, so a test that
/// pins this table pins what the pad actually commits.
enum KeypadKey: Equatable, Identifiable, Hashable {
    case number(Int)
    case extended
    case clear
    case pickUp

    /// What pressing the key does. `commit(nil)` is *clear*; `commit(0)` is a
    /// *pick up*. They are different facts and the store keeps them apart.
    enum Action: Equatable {
        case commit(Int?)
        case openStepper
    }

    static let pad: [KeypadKey] = (1...9).map(KeypadKey.number) + [.extended, .clear, .pickUp]

    var action: Action {
        switch self {
        case .number(let value): return .commit(value)
        case .extended: return .openStepper
        case .clear: return .commit(nil)
        case .pickUp: return .commit(0)
        }
    }

    var numeral: String {
        switch self {
        case .number(let value): return "\(value)"
        case .extended: return "10+"
        case .clear: return "✕"
        case .pickUp: return "0"
        }
    }

    /// The small tracked caption under the numeral. For a digit it is that
    /// score's name against this hole's par.
    func caption(par: Int) -> String {
        switch self {
        case .number(let value): return ScoreKeyLabel.label(score: value, par: par)
        case .extended: return ""
        case .clear: return "CLEAR"
        case .pickUp: return "PICK UP"
        }
    }

    var accessibilityLabel: String {
        switch self {
        case .number(let value): return "\(value)"
        case .extended: return "Ten or more"
        case .clear: return "Clear score"
        case .pickUp: return "Pick up"
        }
    }

    var id: String {
        switch self {
        case .number(let value): return "n\(value)"
        case .extended: return "ext"
        case .clear: return "clear"
        case .pickUp: return "pickup"
        }
    }
}

/// The golf name of a stroke count against a par — the Swift image of the web's
/// `scoreLabel` in `src/round/score-entry.component.ts`, including its two
/// quirks: **1 is always HIO** (a hole-in-one on a par 5 is not an albatross by
/// this label), and anything beyond albatross/quad is just `OTHER`.
enum ScoreKeyLabel {
    static func label(score: Int, par: Int) -> String {
        if score == 1 { return "HIO" }
        let d = score - par
        if d <= -4 || d >= 5 { return "OTHER" }
        switch d {
        case -3: return "ALBA"
        case -2: return "EAGLE"
        case -1: return "BIRDIE"
        case 0: return "PAR"
        case 1: return "BOGEY"
        case 2: return "DOUBLE"
        case 3: return "TRIPLE"
        case 4: return "QUAD"
        default: return ""
        }
    }
}

// MARK: - Stats

/// The optional per-hole stats step, shown only when a format in this round
/// declares metadata inputs that apply to the current hole.
///
/// Web: `.se-stats` — a second dark plate *above* the keypad, and a two-option
/// segmented control per category rather than a switch: the stored value is
/// always the highlighted segment, so "off" is a choice the player made and not
/// a switch nobody touched.
///
/// The button label is "Next ›" while another ball on the hole is still
/// unscored and "Done ›" on the last one — the same affordance the web shows,
/// and the reason `hasMoreUnscored` exists in the policy at all.
///
/// The header's back chevron is `.se-stats__back`: it drops back to the keypad
/// and dispatches nothing. Whatever was toggled stays toggled (each toggle
/// persisted itself), the score stays written, and no advance happens — which is
/// what makes it safe to press when the score was the thing that was wrong.
struct StatsView: View {
    @Bindable var store: RoundStore
    @State private var explainersPresented = false

    var body: some View {
        VStack(spacing: 0) {
            header
            who
            // A par 5 with every module on is seven prompts — this scrolls, and
            // the footer stays put below it.
            ScrollView {
                VStack(spacing: TapSpacing.xl) {
                    // The format's own toggles first (what the round needs to
                    // score), then the player's own stats (what they asked to
                    // track). A key both channels want renders once, in the
                    // stats half — see `formatMetadataInputsForStep`.
                    ForEach(store.formatMetadataInputsForStep, id: \.key) { input in
                        group(input)
                    }
                    if !store.formatMetadataInputsForStep.isEmpty && !store.statPrompts.isEmpty {
                        Rectangle()
                            .fill(KeypadPalette.ruleSoft)
                            .frame(height: 1)
                            .padding(.horizontal, TapSpacing.xl)
                    }
                    ForEach(store.statPrompts) { prompt in
                        statGroup(prompt)
                    }
                    // One worded trigger, one sheet — never eleven ⓘ glyphs on
                    // a card whose whole job is to stay quiet.
                    if !store.statPrompts.isEmpty {
                        explainerTrigger
                    }
                }
                .padding(.horizontal, TapSpacing.lg)
                .padding(.top, TapSpacing.lg)
                .padding(.bottom, TapSpacing.xl)
                .frame(maxWidth: .infinity)
            }
            footer
        }
        .background(KeypadPalette.screen.ignoresSafeArea())
        .environment(\.colorScheme, .dark)
        .sheet(isPresented: $explainersPresented) {
            StatExplainerSheet(prompts: store.statPrompts)
        }
    }

    /// Web: the `.se-stats` step header's `What these mean`. A word, not a
    /// symbol, and it sits after the prompts so it never reads as a step.
    private var explainerTrigger: some View {
        Button { explainersPresented = true } label: {
            Text(StatsCopy.statExplainerTrigger)
                .font(TapFont.ui(size: 15.2, weight: .semibold))
                .foregroundStyle(KeypadPalette.inkMuted)
                .underline()
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("stat-explainer-trigger")
    }

    /// Web: `.se-stats__head` — back chevron, hole title, and a 40pt spacer on
    /// the right so the title sits centred rather than merely between them.
    private var header: some View {
        HStack(spacing: 0) {
            Button { store.statsBack() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 22, weight: .medium))
                    .foregroundStyle(KeypadPalette.ink)
                    .frame(width: 40, height: 40)
                    .contentShape(Rectangle())
            }
            .buttonStyle(KeypadPressStyle(pressed: KeypadPalette.inkWash, shape: .circle))
            .accessibilityLabel("Back to keypad")

            Text(holeTitle)
                .font(TapFont.display(size: 17.6, weight: .bold))
                .foregroundStyle(KeypadPalette.ink)
                .frame(maxWidth: .infinity)

            // `.se-stats__spacer { width: 40px }`.
            Color.clear.frame(width: 40, height: 40)
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.vertical, TapSpacing.md)
        .overlay(alignment: .bottom) {
            Rectangle().fill(KeypadPalette.rule).frame(height: 1)
        }
    }

    /// Web: `.se-stats__who` — the ball, and the score just entered for it, so
    /// the toggles are unambiguously about that stroke count.
    private var who: some View {
        HStack(spacing: TapSpacing.md) {
            Text(store.ballUnderCursor.map { store.displayName(of: $0) } ?? "—")
                .font(TapFont.display(size: 22.4, weight: .bold))
                .foregroundStyle(KeypadPalette.ink)
            if let score = enteredScore {
                Text(score)
                    .font(TapFont.display(size: 20.8, weight: .bold, tabular: true))
                    // `.se-stats__score { color: #fff }`.
                    .foregroundStyle(KeypadPalette.ink)
                    .frame(minWidth: 44, minHeight: 44)
                    .padding(.horizontal, TapSpacing.sm)
                    .background(Capsule().fill(TapColors.primary))
            }
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.top, TapSpacing.lg)
    }

    private var enteredScore: String? {
        guard let ball = store.ballUnderCursor, let hole = store.currentPlayedHole,
              let strokes = store.strokes(ballId: ball.id, playHoleId: hole.playHoleId)
        else { return nil }
        return jsNumberString(strokes)
    }

    private var holeTitle: String {
        guard let hole = store.currentPlayedHole else { return "" }
        return "Hole \(store.occurrenceLabel(hole.playHoleId)) · Par \(store.par(of: hole.playHoleId))"
    }

    /// Web: `.se-stats__group` — a centred label over a Miss/Hit segmented pair.
    private func group(_ input: MetadataInput) -> some View {
        let on = store.pendingMeta[input.key] == true
        return VStack(spacing: TapSpacing.sm) {
            Text(input.label)
                .font(TapFont.display(size: 16.8, weight: .bold))
                .foregroundStyle(KeypadPalette.ink)
                .multilineTextAlignment(.center)
            HStack(spacing: TapSpacing.sm) {
                segment("Miss", selected: !on, tone: .miss) { store.setMetadata(key: input.key, value: false) }
                segment("Hit", selected: on, tone: .hit) { store.setMetadata(key: input.key, value: true) }
            }
        }
    }

    /// One player-stats prompt: the same centred label, over either a segmented
    /// row or a compact stepper. Which prompts exist, and what a
    /// tap means, is `StatStep`'s answer — this only draws it.
    @ViewBuilder
    private func statGroup(_ prompt: StatPrompt) -> some View {
        VStack(spacing: TapSpacing.sm) {
            Text(prompt.label)
                .font(TapFont.display(size: 16.8, weight: .bold))
                .foregroundStyle(KeypadPalette.ink)
                .multilineTextAlignment(.center)
            switch prompt.control {
            case .segments(let options):
                HStack(spacing: TapSpacing.sm) {
                    ForEach(options) { option in
                        let selected = store.statValue(prompt.key) == option.value
                        // Neutral, not green: a stat is an observation, and the
                        // plate should not congratulate or scold one.
                        segment(option.label, selected: selected, tone: .neutral) {
                            // Tapping the selected option de-selects it — the
                            // only way back to "did not answer", which is a
                            // different fact from answering the low option.
                            store.answerStat(prompt.key, value: selected ? nil : option.value)
                        }
                    }
                }
            case .stepper(let min, let max):
                statStepper(prompt, min: min, max: max)
            }
            if prompt.key == .gir, let hint = girHint {
                Text(hint.text)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(hint.danger ? TapColors.danger : KeypadPalette.inkMuted)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityLabel(hint.announcement)
                    .accessibilityIdentifier("stat-gir-hint")
            }
        }
    }

    /// The derived-GIR line (§B.5): a statement of what will happen, never a
    /// request. Which disagreement sentence shows is decided by the DERIVED
    /// value, not the stored one.
    private var girHint: (text: String, danger: Bool, announcement: String)? {
        switch store.statDerivedGirState {
        case .manual, .persisted, .idle:
            return nil
        case .pending:
            return (
                StatsCopy.girPending, false,
                "Green in regulation, not answered, will be filled in from your score"
            )
        case .disagree:
            let stored = store.statValue(.gir) == "1" ? "hit" : "miss"
            return (
                store.statDerivedGir == "0"
                    ? StatsCopy.girDisagreeMiss : StatsCopy.girDisagreeHit,
                true,
                "Green in regulation, \(stored), your score disagrees"
            )
        }
    }

    /// A one-tap counter. It shows its floor before anyone touches it, dimmed,
    /// so an untouched row cannot be mistaken for an answered zero.
    private func statStepper(_ prompt: StatPrompt, min: Int, max: Int?) -> some View {
        let value = store.statStepperValue(prompt.key, min: min)
        let answered = store.statIsAnswered(prompt.key)
        return HStack(spacing: TapSpacing.xl) {
            KeypadStepperButton(system: "minus", size: 52) {
                store.stepStat(prompt.key, by: -1)
            }
            .accessibilityLabel("Fewer \(prompt.label)")
            Text(StatVocabulary.stepperText(value, max: max))
                .font(TapFont.display(size: 33.6, weight: .bold, tabular: true))
                .foregroundStyle(answered ? KeypadPalette.ink : KeypadPalette.inkMuted)
                .frame(width: 72)
                .accessibilityLabel(
                    answered ? "\(prompt.label) \(value)" : "\(prompt.label) not answered")
            KeypadStepperButton(system: "plus", size: 52) {
                store.stepStat(prompt.key, by: 1)
            }
            .accessibilityLabel("More \(prompt.label)")
        }
    }

    private enum SegmentTone { case miss, hit, neutral }

    private func segment(
        _ title: String,
        selected: Bool,
        tone: SegmentTone,
        action: @escaping () -> Void
    ) -> some View {
        let fill: Color =
            selected
            ? (tone == .hit ? TapColors.primary : KeypadPalette.segmentOn)
            : KeypadPalette.pad
        return Button(action: action) {
            Text(title)
                .font(TapFont.ui(size: 16.8, weight: .bold))
                .lineLimit(1)
                .minimumScaleFactor(0.72)
                // Both `on-hit` and `on-miss` set `color: #fff`.
                .foregroundStyle(selected ? KeypadPalette.ink : KeypadPalette.inkMuted)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous).fill(fill)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .strokeBorder(
                            selected
                                ? (tone == .hit ? TapColors.primary : KeypadPalette.segmentBorderOn)
                                : KeypadPalette.hollowBorder,
                            lineWidth: 1
                        )
                )
        }
        .buttonStyle(.plain)
        // Web: `flex: 1; max-width: 180px` — the pair grows to fill the row but
        // never turns into two banners on a wide screen.
        .frame(maxWidth: 180)
    }

    private var footer: some View {
        Button {
            store.statsDone()
        } label: {
            Text(store.hasMoreUnscoredBalls ? "Next ›" : "Done ›")
                .font(TapFont.display(size: 18.4, weight: .bold))
                // `.se-stats__next { color: #fff }`.
                .foregroundStyle(KeypadPalette.ink)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
        }
        .buttonStyle(
            KeypadPressStyle(
                fill: TapColors.primary,
                pressed: TapColors.primary.opacity(0.85),
                shape: .roundedRect(12)
            )
        )
        .padding(.horizontal, TapSpacing.lg)
        .padding(.top, TapSpacing.md)
        .padding(.bottom, TapSpacing.sm)
        .overlay(alignment: .top) {
            Rectangle().fill(KeypadPalette.rule).frame(height: 1)
        }
    }
}

// MARK: - Surfaces

/// The takeover's neutrals. The web hardcodes these same values (`#121212`,
/// `#1c1c1e`, `#2a2a2a`, `rgba(255,255,255,…)`) instead of tokenising them,
/// because the plate is dark in every theme; everything that *is* tokenised
/// there (`--primary`, `--error`, `--warning`) stays a token here and resolves
/// to its dark-appearance value via the pinned `colorScheme`.
enum KeypadPalette {
    static let screen = Color(red: 0x12 / 255, green: 0x12 / 255, blue: 0x12 / 255)
    static let pad = Color(red: 0x1c / 255, green: 0x1c / 255, blue: 0x1e / 255)
    static let key = Color(red: 0x2a / 255, green: 0x2a / 255, blue: 0x2a / 255)
    static let keyPressed = Color(red: 0x3a / 255, green: 0x3a / 255, blue: 0x3a / 255)
    static let ink = Color.white
    static let inkHalf = Color.white.opacity(0.5)
    static let inkMuted = Color.white.opacity(0.55)
    static let inkWash = Color.white.opacity(0.1)
    static let rule = Color.white.opacity(0.1)
    static let ruleSoft = Color.white.opacity(0.08)
    static let hollowBorder = Color.white.opacity(0.22)
    static let segmentOn = Color.white.opacity(0.14)
    static let segmentBorderOn = Color.white.opacity(0.45)
    /// `.se-mrow.sel` — `rgba(93,155,117,0.14)`, the dark primary at 14%.
    static let rowSelected = Color(red: 93 / 255, green: 155 / 255, blue: 117 / 255).opacity(0.14)
}

/// A flat key: a fill, a pressed fill, and a shape. The web's keys have no
/// border and no shadow — `:active` only swaps the background.
struct KeypadPressStyle: ButtonStyle {
    enum Shape { case circle, roundedRect(CGFloat) }

    var fill: Color = .clear
    var pressed: Color
    var shape: Shape

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(background(pressed: configuration.isPressed))
            .contentShape(Rectangle())
    }

    @ViewBuilder
    private func background(pressed isPressed: Bool) -> some View {
        let color = isPressed ? pressed : fill
        switch shape {
        case .circle:
            Circle().fill(color)
        case .roundedRect(let radius):
            RoundedRectangle(cornerRadius: radius, style: .continuous).fill(color)
        }
    }
}
