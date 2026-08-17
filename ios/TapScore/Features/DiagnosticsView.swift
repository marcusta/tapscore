import SwiftUI
import UIKit

/// The failed API calls of this launch, verbatim — the super-admin-only screen.
///
/// It exists because the player-facing surfaces are deliberately vague: the
/// landing says "Couldn't reach the server" for every dashboard failure — a
/// 500, a decode mismatch and a dead Wi-Fi all read the same. Right for a
/// player, useless for whoever has to fix it. This screen is where the real
/// error goes, and the account sheet only offers it to a super admin, so the
/// jargon never meets an ordinary user.
///
/// Same trust story as the Server screen: the gate is presentation, not
/// security. Everything here already happened on THIS device on THIS account —
/// the screen reveals nothing the device did not just see.
struct DiagnosticsView: View {
    var diagnostics: APIDiagnostics = .shared

    @Environment(\.dismiss) private var dismiss

    @State private var failures: [APIFailure] = []
    /// Feedback for the copy action — set on tap, never permanent furniture.
    @State private var copied = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.lg) {
                SectionHeader(title: "Diagnostics")

                Text("Failed API calls since this launch, newest first. Also written to the system log — readable from a Mac with Console.app, subsystem com.marcusandersson.tapscore.")
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)

                if failures.isEmpty {
                    TapCard(sunken: true) {
                        Text("No failed requests recorded.")
                            .font(TapFont.ui(size: 13.6))
                            .foregroundStyle(TapColors.textMuted)
                            .padding(TapSpacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                } else {
                    actions
                    ForEach(failures) { failure in
                        entry(failure)
                    }
                }
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .safeAreaInset(edge: .top, spacing: 0) { header }
        .onAppear { failures = diagnostics.snapshot() }
        .accessibilityIdentifier("diagnostics")
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
                .accessibilityIdentifier("diagnostics-done")
        }
        .padding(TapSpacing.lg)
        .background(TapColors.surface)
        .overlay(alignment: .bottom) {
            Rectangle().fill(TapColors.border).frame(height: 1)
        }
    }

    private var actions: some View {
        HStack(spacing: TapSpacing.sm) {
            Button(copied ? "Copied" : "Copy all") {
                UIPasteboard.general.string = Self.report(failures)
                copied = true
            }
            .buttonStyle(.tap(.secondary))
            .accessibilityIdentifier("diagnostics-copy")

            Button("Refresh") {
                failures = diagnostics.snapshot()
                copied = false
            }
            .buttonStyle(.tap(.ghost))
            .accessibilityIdentifier("diagnostics-refresh")

            Spacer(minLength: 0)

            Button("Clear") {
                diagnostics.clear()
                failures = []
                copied = false
            }
            .buttonStyle(.tap(.ghost))
            .accessibilityIdentifier("diagnostics-clear")
        }
    }

    private func entry(_ failure: APIFailure) -> some View {
        TapCard(sunken: true) {
            VStack(alignment: .leading, spacing: TapSpacing.xs) {
                HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                    Text(verbatim: "\(failure.method) /\(failure.path)")
                        .font(TapFont.ui(size: 13.6, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                    Text(failure.date, format: .dateTime.hour().minute().second())
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                }
                Text(verbatim: failure.detail)
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                    .textSelection(.enabled)
            }
            .padding(TapSpacing.md)
        }
    }

    /// The pasteboard form — one block per failure, ISO timestamps, so a paste
    /// into a chat or an issue carries everything the screen shows.
    static func report(_ failures: [APIFailure]) -> String {
        failures.map { failure in
            "\(failure.date.formatted(.iso8601)) \(failure.method) /\(failure.path)\n\(failure.detail)"
        }
        .joined(separator: "\n\n")
    }
}
