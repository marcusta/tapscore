import SwiftUI

/// The round-end story (§4.1) — the entry point, and the gate in front of it.
///
/// This sits at the top of the leaderboard, which is where a friendly round
/// already ends up: the results surface is untouched, the story is one card
/// above it, and everything below is exactly what shipped before.
///
/// The gate is the interesting part. It is SELF ONLY and it is conservative:
/// the card appears when the reader is signed in, tracked stats of their own in
/// this round, actually answered something, and has a complete card. A phone
/// that scored for three friends gets nothing — not an empty state, nothing.
struct RoundStoryEntry: View {
    @Environment(AppEnvironment.self) private var environment
    @Bindable var store: RoundStore

    @State private var statsStore: RoundStatsStore?
    /// Set once the fetch has finished, however it finished. It exists so a
    /// round the reader has no stats in leaves NO trace: without it the
    /// zero-height loading placeholder would sit at the top of the board
    /// forever, costing a stack gap for a card that is never coming.
    @State private var settled = false

    var body: some View {
        let eligibility = store.storyEligibility(signedInPlayerId: signedInPlayerId)
        Group {
            if eligibility.isEligible, let roundId = store.round?.id {
                content(roundId: roundId)
            }
        }
    }

    @ViewBuilder
    private func content(roundId: String) -> some View {
        // Only a READY store draws. Loading, a 404, a dead session and a network
        // failure all render nothing: this is a flourish on top of a round that
        // works logged out, and it never gets to put an error in front of one.
        if let statsStore, statsStore.phase == .ready, let model = statsStore.model {
            RoundStoryCard(model: model)
        } else if !settled {
            Color.clear
                .frame(height: 0)
                .task(id: roundId) {
                    guard statsStore?.roundId != roundId else { return }
                    let created = RoundStatsStore(roundId: roundId, api: environment.api)
                    statsStore = created
                    await created.load()
                    settled = true
                }
        }
    }

    /// The app's own way of asking who is signed in — the same pattern-match
    /// `RoundManageRows` and the account menu make.
    private var signedInPlayerId: String? {
        if case let .signedIn(player) = environment.authState { return player.id }
        return nil
    }
}

/// The story itself: what the round cost, where against your own normal, and
/// two or three sentences about it.
struct RoundStoryCard: View {
    var model: RoundStatsModel

    @State private var showsDetail = false

    var body: some View {
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                headline
                RoundWaterfallSection(
                    waterfall: model.waterfall, deltas: model.deltas,
                    windowCount: model.windowCount, showsHint: false)
                lines
                Button {
                    showsDetail = true
                } label: {
                    Text("See the whole round")
                }
                .buttonStyle(TapButtonStyle(tier: .secondary, fillsWidth: true))
                .accessibilityIdentifier("round-story-open")
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .accessibilityIdentifier("round-story")
        .sheet(isPresented: $showsDetail) {
            RoundStatsScreen(roundId: model.roundId, preloaded: model)
        }
    }

    private var headline: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(RoundStoryCopy.title)
                .font(TapFont.ui(size: 12.8, weight: .bold))
                .foregroundStyle(TapColors.textMuted)
                .textCase(.uppercase)
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                Text(model.strokes.map { StatsFormat.count($0) } ?? "—")
                    .font(TapFont.display(size: 28.8, weight: .bold))
                    .foregroundStyle(TapColors.text)
                if let vsPar = model.vsPar {
                    Text(StatsFormat.vsPar(vsPar))
                        .font(TapFont.ui(size: 16, weight: .bold))
                        .foregroundStyle(ParDirection(toPar: Int(vsPar.rounded())).color)
                }
                Spacer(minLength: 0)
            }
            Text(RoundStatsCopy.subtitle(model))
                .font(TapFont.ui(size: 12.8))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }

    /// Nothing at all when the module picked nothing. A round that triggered no
    /// rule gets the score and the waterfall, which is already the honest
    /// version of "nothing stood out".
    @ViewBuilder
    private var lines: some View {
        if !model.insights.isEmpty {
            VStack(alignment: .leading, spacing: TapSpacing.xs) {
                ForEach(Array(model.insights.enumerated()), id: \.offset) { _, line in
                    HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                        Circle()
                            .fill(TapColors.accent)
                            .frame(width: 5, height: 5)
                            .offset(y: -3)
                        Text(RoundStoryCopy.line(line))
                            .font(TapFont.ui(size: 14.4))
                            .foregroundStyle(TapColors.text)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                    .accessibilityIdentifier("round-story-line")
                }
            }
        }
    }
}

// MARK: - Wording

/// The UI half of the insight contract: `StatMeasuresMath` decides WHICH lines a
/// round earns, this decides what they SAY.
///
/// The switch is exhaustive with no `default:`, and `RoundStoryCopyTests` walks
/// `InsightID.allCases` through it. Both together are the mechanism: a rule
/// added to the module fails to compile here, and a case that returns nothing
/// useful fails the test — a new insight cannot reach a reader unworded.
enum RoundStoryCopy {
    static let title = "Your round"

    static func line(_ line: InsightLine) -> String {
        switch line.id {
        case .componentBestVsBaseline:
            guard let component = component(line, "component"), let delta = number(line, "delta")
            else { return "One part of your game beat your usual round." }
            return
                "\(name(component)) was \(StatsFormat.number(abs(delta))) strokes better than your recent rounds."

        case .componentWorstVsBaseline:
            guard let component = component(line, "component"), let delta = number(line, "delta")
            else { return "One part of your game cost you more than usual." }
            return
                "\(name(component)) cost you \(StatsFormat.number(abs(delta))) strokes more than your recent rounds."

        case .penaltiesSpike:
            guard let penalties = number(line, "penalties"), let baseline = number(line, "baseline")
            else { return "More penalty strokes than you usually take." }
            return
                "\(strokes(penalties)) penalty \(penalties == 1 ? "stroke" : "strokes"), against \(StatsFormat.number(baseline)) in a normal round."

        case .hardScrambleStreak:
            guard let attempts = number(line, "attempts")
            else { return "You saved par from every hard spot you were in." }
            return "You saved par from all \(strokes(attempts)) of the hard spots you were in."

        case .scrambleStreak:
            guard let successes = number(line, "successes"), let attempts = number(line, "attempts")
            else { return "You scrambled well when you missed the green." }
            return
                "You saved par \(strokes(successes)) of the \(strokes(attempts)) times you missed the green."

        case .threePuttFree:
            guard let putts = number(line, "putts") else { return "No three-putts all round." }
            return "No three-putts — \(strokes(putts)) putts across the round."

        case .bestPuttingRound:
            guard let rounds = number(line, "rounds")
            else { return "Your best putting round in recent memory." }
            return
                "Your best putting of the last \(strokes(rounds)) \(rounds == 1 ? "round" : "rounds")."

        case .bounceBackPerfect:
            guard let opportunities = number(line, "opportunities")
            else { return "You answered every dropped shot straight away." }
            return
                "You came straight back after all \(strokes(opportunities)) of your dropped shots."
        }
    }

    /// The waterfall components in the second person's vocabulary — "your
    /// putting", not the enum's `putting`.
    static func name(_ component: StrokesLostComponent) -> String {
        switch component {
        case .putting: return "Putting"
        case .shortGame: return "Your short game"
        case .penalties: return "Penalties"
        case .longGame: return "Tee to green"
        }
    }

    private static func number(_ line: InsightLine, _ key: String) -> Double? {
        if case let .number(value) = line.params[key] { return value }
        return nil
    }

    private static func component(_ line: InsightLine, _ key: String) -> StrokesLostComponent? {
        if case let .component(value) = line.params[key] { return value }
        return nil
    }

    /// Whole-number counts read as counts: "3 putts", never "3.0 putts".
    private static func strokes(_ value: Double) -> String {
        StatsFormat.count(value)
    }
}
