import SwiftUI

/// Landing screen — placeholder.
///
/// The one piece of real behaviour here is the **connectivity probe**: it
/// renders `AppEnvironment.authState`, which is resolved by `GET /api/auth/me`.
/// That is the smoke proof that XcodeGen, the entitlements, ATS local
/// networking, the base URL and the bearer header are all wired correctly —
/// point the simulator at a running dev server and this row changes.
///
/// Everything else is static content standing in for the real round list.
struct RoundListView: View {
    @Environment(AppEnvironment.self) private var environment

    /// Pushes the share-link entry screen.
    let onJoin: () -> Void

    var body: some View {
        List {
            Section("Server") {
                probeRow
                Text(environment.configuration.baseURL.absoluteString)
                    .font(.footnote.monospaced())
                    .foregroundStyle(.secondary)
                Button("Re-run probe") {
                    Task { await environment.retry() }
                }
            }

            Section("Your rounds") {
                // Static stand-ins. Real data lands once the generated client
                // exposes the round list endpoints.
                ForEach(Self.placeholderRounds, id: \.self) { name in
                    LabeledContent(name, value: "—")
                }
                Text("Placeholder — no API wiring yet.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section {
                Button("Join with a share link", action: onJoin)
            }
        }
        .navigationTitle("TapScore")
    }

    @ViewBuilder
    private var probeRow: some View {
        switch environment.authState {
        case .unknown:
            LabeledContent("GET /auth/me") { ProgressView() }
        case .anonymous:
            LabeledContent("GET /auth/me", value: "anonymous")
        case let .signedIn(player):
            LabeledContent("GET /auth/me", value: player.username)
        case let .unreachable(detail):
            LabeledContent("GET /auth/me", value: "unreachable")
                .foregroundStyle(.red)
                .accessibilityHint(detail)
        }
    }

    private static let placeholderRounds = [
        "Linköpings GK — Friendly",
        "Vreta Kloster — Fourball",
    ]
}
