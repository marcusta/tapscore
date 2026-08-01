import SwiftUI

/// The finish flow (2026-08-01) — the round's closing ceremony, and the fix
/// for rounds left hanging as "Live" forever because Finish only lived in the
/// "⋯" manage sheet. Presented as a `fullScreenCover` off
/// `RoundStore.finishFlowPresented`, which advance-policy's `roundComplete`
/// moment raises when the last ball on the last hole is scored.
///
/// Three stages, each fullscreen:
///
///  1. **Prompt** — "Finish round" is the one press that actually finishes
///     (`RoundStore.finishRound()`, finish-only and idempotent; never a lock,
///     never a reopen). "Go back" returns to the round untouched, for edits.
///     When the card is not actually full (a skipped hole, another group still
///     out) the prompt says how many scores are missing rather than gating —
///     the moment is right even when the data is not complete.
///  2. **Board** — the final results: the same `LeaderboardView` the round's
///     leaderboard tab renders, under the flow's own ceremony header instead
///     of the round chrome, with no dock. The bottom button is "View stats"
///     only when the reader could actually see round stats (the story card's
///     eligibility rule); otherwise it is "Close" straight home.
///  3. **Stats** — the per-round stats screen (`RoundStatsView`), with a
///     bottom "Close" that leaves for home.
///
/// Web twin: `src/round/finish-flow.component.ts` (stages 1–2) +
/// `round-stats.component.ts`'s finish mode (stage 3).
struct FinishFlowView: View {
    @Environment(AppEnvironment.self) private var environment
    @Bindable var store: RoundStore
    /// Leaves the round screen entirely — the same exit "← Home" takes.
    /// Dismissing the flow is the store's job; leaving the screen is this one.
    let onClose: () -> Void

    private enum Stage {
        case prompt, board, stats
    }

    @State private var stage: Stage = .prompt
    @State private var finishFailed = false

    var body: some View {
        ZStack {
            TapColors.bg.ignoresSafeArea()
            switch stage {
            case .prompt: prompt
            case .board: board
            case .stats: stats
            }
        }
    }

    // MARK: - Stage 1: the prompt

    private var prompt: some View {
        VStack(spacing: 0) {
            Spacer()
            VStack(spacing: TapSpacing.sm) {
                kicker("That was the last hole")
                Text("Round complete")
                    .font(TapFont.display(size: 30, weight: .semibold))
                    .tracking(30 * -0.02)
                    .foregroundStyle(TapColors.text)
                    .multilineTextAlignment(.center)
                if !roundLine.isEmpty {
                    Text(roundLine)
                        .font(TapFont.ui(size: 15.2))
                        .foregroundStyle(TapColors.textMuted)
                        .multilineTextAlignment(.center)
                }
                if let missing = missingLine {
                    Text(missing)
                        .font(TapFont.ui(size: 14.4, weight: .semibold))
                        .foregroundStyle(TapColors.error)
                        .multilineTextAlignment(.center)
                        .padding(.top, TapSpacing.md)
                }
                if finishFailed {
                    Text("Could not finish the round. Try again.")
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.error)
                        .multilineTextAlignment(.center)
                        .padding(.top, TapSpacing.sm)
                }
            }
            .padding(.horizontal, TapSpacing.xl)
            Spacer()
            VStack(spacing: TapSpacing.sm) {
                Button {
                    finishFailed = false
                    Task {
                        if await store.finishRound() {
                            stage = .board
                        } else {
                            finishFailed = true
                        }
                    }
                } label: {
                    Text("Finish round")
                }
                .buttonStyle(TapButtonStyle(tier: .primary, size: .prominent, fillsWidth: true))
                .disabled(store.manageAction != nil)
                .accessibilityIdentifier("finish-flow-finish")

                Button {
                    store.dismissFinishFlow()
                } label: {
                    Text("Go back")
                }
                .buttonStyle(TapButtonStyle(tier: .secondary, fillsWidth: true))
                .accessibilityIdentifier("finish-flow-back")
            }
            .padding(.horizontal, TapSpacing.xl)
            .padding(.bottom, TapSpacing.lg)
        }
    }

    // MARK: - Stage 2: the final board

    private var board: some View {
        LeaderboardView(store: store, header: boardHeader)
            .task {
                // Fresh board for the ceremony — the same refetch the
                // leaderboard tab's pull-to-refresh does.
                await store.refresh()
            }
            .safeAreaInset(edge: .bottom) {
                bottomBar {
                    Button {
                        if statsEligible, store.round?.id != nil {
                            stage = .stats
                        } else {
                            leave()
                        }
                    } label: {
                        Text(statsEligible ? "View stats" : "Close")
                    }
                    .buttonStyle(
                        TapButtonStyle(tier: .primary, size: .prominent, fillsWidth: true))
                    .accessibilityIdentifier("finish-flow-next")
                }
            }
    }

    private var boardHeader: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            kicker("Round finished")
            Text("Final results")
                .font(TapFont.display(size: 24, weight: .semibold))
                .tracking(24 * -0.02)
                .foregroundStyle(TapColors.text)
            if !roundLine.isEmpty {
                Text(roundLine)
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, TapSpacing.lg)
        .padding(.top, TapSpacing.xl)
    }

    // MARK: - Stage 3: the round's stats

    @ViewBuilder
    private var stats: some View {
        if let roundId = store.round?.id {
            NavigationStack {
                RoundStatsView(roundId: roundId)
                    .toolbarBackground(TapColors.bg, for: .navigationBar)
                    .toolbarBackground(.visible, for: .navigationBar)
            }
            .safeAreaInset(edge: .bottom) {
                bottomBar {
                    Button {
                        leave()
                    } label: {
                        Text("Close")
                    }
                    .buttonStyle(
                        TapButtonStyle(tier: .primary, size: .prominent, fillsWidth: true))
                    .accessibilityIdentifier("finish-flow-close")
                }
            }
        } else {
            // No loaded round means nothing to show — leave rather than strand.
            Color.clear.onAppear { leave() }
        }
    }

    // MARK: - Shared pieces

    private func kicker(_ text: String) -> some View {
        Text(text.uppercased())
            .font(TapFont.ui(size: 12.5, weight: .bold))
            .tracking(1.0)
            .foregroundStyle(TapColors.accent)
    }

    private func bottomBar(@ViewBuilder content: () -> some View) -> some View {
        VStack(spacing: 0) {
            content()
                .padding(.horizontal, TapSpacing.lg)
                .padding(.vertical, TapSpacing.md)
        }
        .frame(maxWidth: .infinity)
        .background(TapColors.surface)
        .tapShadow(TapShadows.shadowElevated)
    }

    /// "Round name · course", whichever parts exist — the web flow's line.
    private var roundLine: String {
        guard let round = store.round else { return "" }
        let named = (round.name ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let title =
            named.isEmpty
            ? (RoundHeaderView.localizedDate(round.date) ?? round.date)
            : named
        let course = (round.courseNameSnapshot ?? "").trimmingCharacters(
            in: .whitespacesAndNewlines)
        if !course.isEmpty, course != title { return "\(title) · \(course)" }
        return title
    }

    /// The prompt's honesty line: `roundComplete` means the LAST hole filled
    /// in, not that every hole did. Copy matches the web flow exactly.
    private var missingLine: String? {
        let count = store.unscoredCellCount()
        guard count > 0 else { return nil }
        return count == 1 ? "1 score is still missing." : "\(count) scores are still missing."
    }

    /// Whether "View stats" leads anywhere: the story card's exact eligibility
    /// rule. Anyone else goes straight home.
    private var statsEligible: Bool {
        store.storyEligibility(signedInPlayerId: signedInPlayerId).isEligible
    }

    private var signedInPlayerId: String? {
        if case let .signedIn(player) = environment.authState { return player.id }
        return nil
    }

    /// Off the round screen entirely: drop the cover, then leave the screen.
    private func leave() {
        store.dismissFinishFlow()
        onClose()
    }
}
