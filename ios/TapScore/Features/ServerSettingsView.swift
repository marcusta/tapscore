import SwiftUI

/// Where this build points, and how to change it — the super-admin-only screen.
///
/// It exists because the default is now production **everywhere**, simulator
/// included (see `APIConfiguration.default`). That removed a footgun (a build
/// silently on localhost because of where it happened to run) and left a
/// smaller one behind: a developer holding a device has no way to reach the dev
/// server without a rebuild or a launch argument. This is that way.
///
/// **Not a security boundary.** The gate that hides it is a role probe, and any
/// debug build accepts `-apiBaseURL` from the launch arguments regardless of
/// who is signed in. What this screen changes is where THIS device points
/// itself, which is not a privilege — `AdminAuthz` on the server is what
/// protects privileged actions. The gate is here so that the ordinary user
/// never meets a control that could break their app.
///
/// **Nothing hot-swaps.** See `ServerOverride` for the full reasoning: the API
/// actor, the SSE feed and the pending-score queue all hold the base URL that
/// was resolved at launch, and re-pointing them mid-session would produce a
/// half-migrated app. So this screen writes the override and says "relaunch".
struct ServerSettingsView: View {
    /// The configuration the app is ACTUALLY running with — resolved at launch,
    /// which is exactly why it can disagree with the stored override until the
    /// next one.
    let active: APIConfiguration

    var defaults: UserDefaults = .standard

    @Environment(\.dismiss) private var dismiss

    @State private var draft = ""
    @State private var problem: String?
    /// Set once a write lands, so the relaunch notice is feedback for an action
    /// rather than permanent furniture.
    @State private var pending: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.lg) {
                SectionHeader(title: "Server")

                currentCard

                presets

                custom

                if let pending {
                    relaunchNotice(pending)
                }

                if let problem {
                    Text(problem)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.danger)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("server-error")
                }

                Button("Reset to Production") {
                    ServerOverride.reset(defaults: defaults)
                    draft = APIConfiguration.production.baseURL.absoluteString
                    problem = nil
                    pending = APIConfiguration.production.baseURL.absoluteString
                }
                .buttonStyle(.tap(.ghost, fillsWidth: true))
                .accessibilityIdentifier("server-reset")

                Text("The launch argument `-apiBaseURL` writes this same setting. Whichever wrote last is what the next launch uses.")
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .safeAreaInset(edge: .top, spacing: 0) { header }
        .onAppear {
            draft = ServerOverride.current(defaults: defaults) ?? active.baseURL.absoluteString
        }
        .accessibilityIdentifier("server-settings")
    }

    // MARK: - Pieces

    private var header: some View {
        HStack {
            Text("Settings")
                .font(TapFont.display(size: 17.6, weight: .semibold))
                .foregroundStyle(TapColors.text)
            Spacer(minLength: 0)
            Button("Done") { dismiss() }
                .buttonStyle(.plain)
                .font(TapFont.ui(size: 14.4, weight: .semibold))
                .foregroundStyle(TapColors.accent)
                .accessibilityIdentifier("server-done")
        }
        .padding(TapSpacing.lg)
        .background(TapColors.surface)
        .overlay(alignment: .bottom) {
            Rectangle().fill(TapColors.border).frame(height: 1)
        }
    }

    private var currentCard: some View {
        TapCard(sunken: true) {
            VStack(alignment: .leading, spacing: TapSpacing.xs) {
                Text("Running against")
                    .font(TapFont.ui(size: 12.8, weight: .semibold))
                    .foregroundStyle(TapColors.textMuted)
                Text(verbatim: active.baseURL.absoluteString)
                    .font(TapFont.ui(size: 13.6, weight: .semibold))
                    .foregroundStyle(TapColors.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("server-current")
                Text(active == .production
                     ? "Production — the default everywhere, including the simulator."
                     : "Override in effect.")
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(TapSpacing.md)
        }
    }

    private var presets: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            Text("Presets")
                .font(TapFont.ui(size: 12.8, weight: .semibold))
                .foregroundStyle(TapColors.textMuted)
            Button("Production") { apply(APIConfiguration.production.baseURL.absoluteString) }
                .buttonStyle(.tap(.secondary, fillsWidth: true))
                .accessibilityIdentifier("server-preset-production")
            Button("Local dev") { apply(APIConfiguration.dev.baseURL.absoluteString) }
                .buttonStyle(.tap(.secondary, fillsWidth: true))
                .accessibilityIdentifier("server-preset-local")
        }
    }

    private var custom: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            Text("Custom base URL")
                .font(TapFont.ui(size: 12.8, weight: .semibold))
                .foregroundStyle(TapColors.textMuted)
            TextField("", text: $draft, prompt: tapFieldPrompt("https://host/api"))
                .tapField()
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .keyboardType(.URL)
                .accessibilityIdentifier("server-url-field")
            Text("Include the `/api` suffix. https is required unless the host is localhost.")
                .font(TapFont.ui(size: 12.8))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            Button("Apply") { apply(draft) }
                .buttonStyle(.tap(.primary, fillsWidth: true))
                .accessibilityIdentifier("server-apply")
        }
    }

    private func relaunchNotice(_ url: String) -> some View {
        TapCard(sunken: true) {
            VStack(alignment: .leading, spacing: TapSpacing.xs) {
                Label("Relaunch to apply", systemImage: "arrow.clockwise")
                    .font(TapFont.ui(size: 13.6, weight: .semibold))
                    .foregroundStyle(TapColors.text)
                Text(verbatim: url)
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Quit and reopen the app. The current session, the live feed and any queued scores are still addressed at the old server.")
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(TapSpacing.md)
        }
        .accessibilityIdentifier("server-pending")
    }

    // MARK: - Actions

    private func apply(_ raw: String) {
        switch ServerOverride.store(raw, defaults: defaults) {
        case let .success(configuration):
            draft = configuration.baseURL.absoluteString
            problem = nil
            pending = configuration.baseURL.absoluteString
        case let .failure(error):
            problem = error.message
            pending = nil
        }
    }
}
