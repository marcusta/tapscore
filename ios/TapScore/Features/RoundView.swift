import SwiftUI

/// Round screen — placeholder. Two tabs, matching the web client's split:
/// score entry and the leaderboard.
///
/// Neither tab is wired. Score entry will drive the extracted advance policy
/// (`src/round/advance-policy.ts`, 44 branch tests — that is the Swift spec, so
/// re-derive nothing here), and the leaderboard will render the server-side
/// result layout fold (`src/round/result-layout.ts`) rather than re-deciding
/// presentation on the client.
struct RoundView: View {
    /// The round's share token — its write credential. Never log it, never put
    /// it in an analytics event.
    let shareToken: String

    @State private var tab: Tab = .score

    var body: some View {
        VStack(spacing: 0) {
            Picker("View", selection: $tab) {
                ForEach(Tab.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding()

            switch tab {
            case .score: scorePlaceholder
            case .leaderboard: leaderboardPlaceholder
            }
        }
        .navigationTitle("Round")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var scorePlaceholder: some View {
        List {
            Section("Score entry") {
                Text("Placeholder. The keypad and hole carousel land with the advance policy port.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                ForEach(1...9, id: \.self) { hole in
                    LabeledContent("Hole \(hole)", value: "—")
                }
            }
        }
    }

    private var leaderboardPlaceholder: some View {
        List {
            Section("Leaderboard") {
                Text("Placeholder. Renders the server's result layout once the generated client exposes it.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                LabeledContent("1", value: "—")
                LabeledContent("2", value: "—")
            }
            Section("Share token") {
                // Truncated on purpose: enough to confirm the deep link
                // resolved, not enough to leak the credential over a shoulder.
                Text(String(shareToken.prefix(4)) + "…")
                    .font(.footnote.monospaced())
                    .foregroundStyle(.secondary)
            }
        }
    }

    enum Tab: String, CaseIterable, Identifiable {
        case score, leaderboard
        var id: Self { self }
        var title: String {
            switch self {
            case .score: "Score"
            case .leaderboard: "Leaderboard"
            }
        }
    }
}
