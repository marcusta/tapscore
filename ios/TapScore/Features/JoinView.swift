import SwiftUI

/// Share-link entry: paste a link, see what it is, open it.
///
/// The manual fallback for N4's cold-tap gate — a friend whose universal link
/// did not resolve (association not propagated yet, link pasted into an app
/// that strips it) still gets to score entry. It runs the pasted text through
/// the *same* `DeepLinkRouter` the OS path uses, so there is one parser and one
/// set of tests behind both doors.
///
/// **It does not join anything.** No seat claim, no `POST /friendly-rounds/join`
/// — matching the web, where the share link lands directly in the round and the
/// round screen owns whatever comes next. This screen resolves a link to a
/// round and hands the token to the shell.
struct JoinView: View {
    @Environment(AppEnvironment.self) private var environment

    /// Asks the shell to open the round. Carries the preview's metadata so the
    /// device-recent row is complete the moment it is recorded.
    let onOpen: (RoundOpenRequest) -> Void

    @State private var input = ""
    @State private var problem: String?
    @State private var preview: RoundPreview?
    @State private var isLoading = false

    var body: some View {
        Form {
            Section("Paste a round link") {
                TextField(
                    "https://app.swedenindoorgolf.se/tapscore/round?token=…",
                    text: $input,
                    axis: .vertical
                )
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .textContentType(.URL)
                .font(.footnote)
                .onChange(of: input) { _, _ in
                    // Editing invalidates whatever the last paste resolved to,
                    // so "Open round" can never open a stale token.
                    preview = nil
                    problem = nil
                }

                Button(isLoading ? "Looking up…" : "Look up round") {
                    Task { await lookUp() }
                }
                .disabled(isLoading || input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }

            if let problem {
                Section {
                    Label(problem, systemImage: "exclamationmark.triangle")
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }

            if let preview {
                Section("Round") {
                    LabeledContent("Course", value: preview.courseName.isEmpty ? "—" : preview.courseName)
                    LabeledContent("Date", value: preview.displayDate ?? "—")
                    LabeledContent("Status", value: preview.status.label)
                    if !preview.players.isEmpty {
                        LabeledContent("Players", value: preview.players.joined(separator: ", "))
                    }
                    Button("Open round") { onOpen(preview.openRequest) }
                        .font(.body.weight(.semibold))
                }
            }

            Section {
                Text("No account needed — a share link is all it takes to score.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Open a share link")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func lookUp() async {
        preview = nil
        guard let token = JoinLink.token(in: input) else {
            problem = "That doesn't look like a tapscore round link."
            return
        }
        problem = nil
        isLoading = true
        defer { isLoading = false }
        do {
            preview = try await JoinLink.preview(token: token, api: environment.api)
        } catch APIError.unauthorized {
            problem = "That link is no longer valid."
        } catch let APIError.server(code, _) where code == 404 {
            problem = "No round found for that link."
        } catch {
            problem = "Couldn't reach the server. Check the connection and try again."
        }
    }
}

/// What the preview card shows, and everything the shell needs to open the
/// round afterwards.
struct RoundPreview: Equatable, Sendable {
    let token: String
    let courseName: String
    let date: String?
    let status: DeviceRoundStatus
    let completedAt: String?
    /// Names already sitting in the start list — enough for "is this the round
    /// my friends are in?" and nothing more.
    let players: [String]

    var displayDate: String? {
        guard let date, let parsed = LandingRow.parse(date) else { return date }
        return parsed.formatted(.dateTime.day().month(.abbreviated).year())
    }

    var openRequest: RoundOpenRequest {
        RoundOpenRequest(
            token: token,
            courseName: courseName.isEmpty ? nil : courseName,
            status: status,
            completedAt: completedAt,
            date: date
        )
    }
}

/// The link → token → preview glue, kept out of the view so it is testable
/// against the `URLProtocol` stub with no UI harness.
enum JoinLink {
    /// Resolves pasted text to a share token, via the one parser.
    ///
    /// A link that resolves to `.roundList` (the bare domain, or a round link
    /// whose token was stripped) is deliberately *not* a token — opening an
    /// empty round screen would be worse than saying the link is unusable.
    static func token(
        in text: String,
        allowsInsecureDevHosts: Bool = DeepLinkRouter.allowsInsecureDevHostsByDefault
    ) -> String? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let url = URL(string: trimmed) else { return nil }
        guard case let .round(token)? = DeepLinkRouter.route(
            for: url,
            allowsInsecureDevHosts: allowsInsecureDevHosts
        ) else { return nil }
        return token
    }

    /// Fetches the round behind a token and folds it into the preview card.
    ///
    /// Read-only: `GET /friendly-rounds/by-token`. Nothing here claims a seat
    /// or mutates the round.
    static func preview(token: String, api: TapScoreAPI) async throws -> RoundPreview {
        let output = try await api.send(
            FriendlyRoundsEndpoints.byToken,
            FriendlyRoundsByTokenInput(token: token)
        )
        let claimed = output.startList.claimedSeats.map(\.displayName)
        return RoundPreview(
            token: token,
            courseName: output.round.courseNameSnapshot ?? "",
            date: output.round.date,
            status: DeviceRoundStatus(rawValue: output.round.status.rawValue) ?? .notStarted,
            completedAt: output.round.completedAt,
            // Before anyone has claimed a seat the labels are what the round
            // has to show ("Player 1", "Marcus"), which is still the answer to
            // "is this the right round?".
            players: claimed.isEmpty ? output.startList.seats.map(\.label) : claimed
        )
    }
}
