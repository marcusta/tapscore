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
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.xl) {
                heading
                pasteCard
                if let problem { problemNotice(problem) }
                if let preview { previewCard(preview) }
                Text("No account needed — a share link is all it takes to score.")
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.textMuted)
            }
            .padding(.horizontal, TapSpacing.lg)
            .padding(.top, TapSpacing.xl)
            .padding(.bottom, TapSpacing.xxl)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(TapColors.bg, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }

    // MARK: - Rendering

    /// Web `.login__hero` tone, one step down in size: the serif carries the
    /// screen's name, a muted line says what it is for.
    private var heading: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            Text("Open a share link")
                .font(TapFont.display(size: 27.2, weight: .semibold))
                .tracking(27.2 * -0.02)
                .foregroundStyle(TapColors.text)
            Text("Paste the link a friend sent you.")
                .font(TapFont.ui(size: 14.4))
                .foregroundStyle(TapColors.textMuted)
        }
    }

    /// The paste target, skinned by the `--field-*` tokens (`.tapField()`,
    /// which is the same skin the sign-in form's fields wear).
    private var linkField: some View {
        TextField(
            "",
            text: $input,
            prompt: tapFieldPrompt("https://app.swedenindoorgolf.se/tapscore/round?token=…"),
            axis: .vertical
        )
        .textInputAutocapitalization(.never)
        .autocorrectionDisabled()
        .textContentType(.URL)
        .onChange(of: input) { _, _ in
            // Editing invalidates whatever the last paste resolved to, so
            // "Open round" can never open a stale token.
            preview = nil
            problem = nil
        }
        .tapField()
    }

    private var pasteCard: some View {
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                linkField

                Button(isLoading ? "Looking up…" : "Look up round") {
                    Task { await lookUp() }
                }
                .buttonStyle(.tap(.secondary, fillsWidth: true))
                .disabled(isLoading || input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding(TapSpacing.lg)
        }
    }

    private func problemNotice(_ message: String) -> some View {
        TapCard(sunken: true) {
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                Image(systemName: "exclamationmark.triangle")
                Text(message)
                Spacer(minLength: 0)
            }
            .font(TapFont.ui(size: 13.6))
            .foregroundStyle(TapColors.danger)
            .padding(TapSpacing.md)
        }
    }

    private func previewCard(_ preview: RoundPreview) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Round")
            TapCard {
                VStack(alignment: .leading, spacing: TapSpacing.md) {
                    HStack(alignment: .firstTextBaseline, spacing: TapSpacing.md) {
                        Text(preview.courseName.isEmpty ? "Round" : preview.courseName)
                            .font(TapFont.display(size: 19.2, weight: .semibold))
                            .foregroundStyle(TapColors.text)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: TapSpacing.sm)
                        StatusChip(status: RoundStatusTone(preview.status))
                    }
                    if let date = preview.displayDate {
                        detail("Date", date)
                    }
                    if !preview.players.isEmpty {
                        detail("Players", preview.players.joined(separator: ", "))
                    }
                    Button("Open round") { onOpen(preview.openRequest) }
                        .buttonStyle(.tap(.primary, fillsWidth: true))
                }
                .padding(TapSpacing.lg)
            }
        }
    }

    private func detail(_ label: String, _ value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: TapSpacing.md) {
            Text(label)
                .font(TapFont.ui(size: 13.6))
                .foregroundStyle(TapColors.textMuted)
            Spacer(minLength: TapSpacing.sm)
            Text(value)
                .font(TapFont.ui(size: 13.6, weight: .medium))
                .foregroundStyle(TapColors.text)
                .multilineTextAlignment(.trailing)
        }
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
