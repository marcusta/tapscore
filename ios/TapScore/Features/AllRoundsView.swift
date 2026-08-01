import SwiftUI

/// Every round this viewer has, at full length.
///
/// Home is deliberately short — it shows what is being played now and the last
/// three finished rounds inside a 14-day window. This screen is the rest of
/// that same list: the **same** `LandingLoader` rows, the same Ongoing /
/// finished split, and the same `RoundRow` (swipe-to-remove where the row is
/// device-local). The only difference is the window, which is `nil` here, so
/// nothing ages off.
///
/// It owns no loading of its own. The loader belongs to the shell, Home keys
/// its loads on the auth state, and a second screen deciding when to fetch is
/// how the two would start showing different lists; pull-to-refresh is offered
/// because an explicit ask is always honoured.
struct AllRoundsView: View {
    @Environment(AppEnvironment.self) private var environment

    /// This device's recent-rounds list — the same object Home and the shell
    /// hold, so a Remove here is a Remove there.
    let deviceRounds: DeviceRoundsStore

    /// The shell's rows. Shared, not copied.
    let loader: LandingLoader

    /// Asks the shell to open a round, through the same funnel a Home row uses.
    let onOpen: (RoundOpenRequest) -> Void

    /// The row whose swipe-revealed Remove action was invoked, parked while the
    /// confirmation is up.
    @State private var pendingRemoval: LandingRow?

    var body: some View {
        ScrollView {
            // No window: a round finished two years ago is still a round this
            // player played, and this is the screen that says so.
            let partition = LandingRow.partition(loader.rows, now: Date(), windowDays: nil)

            VStack(alignment: .leading, spacing: TapSpacing.xl) {
                heading

                section("Ongoing", rows: partition.ongoing)
                section("Finished", rows: partition.finished)

                if partition.ongoing.isEmpty && partition.finished.isEmpty {
                    Text(LandingEmptyCopy.message(
                        signedIn: isSignedIn,
                        serverRoundCount: loader.serverRoundCount
                    ))
                    .font(TapFont.ui(size: 14.4))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.vertical, TapSpacing.lg)
                }
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
        .refreshable {
            await loader.load(
                auth: environment.authState,
                api: environment.api,
                device: deviceRounds.all(),
                force: true
            )
        }
        // Same reason as Home: coming back from a round must re-read the device
        // list, and a merge (not a reseed) is what keeps the server rows and
        // their role labels.
        .onAppear { loader.applyDevice(deviceRounds.all()) }
        .roundRemovalDialog(pending: $pendingRemoval) { token in remove(token: token) }
        .accessibilityIdentifier("all-rounds-screen")
    }

    // MARK: - Rendering

    private var heading: some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            Text("All rounds")
                .font(TapFont.display(size: 27.2, weight: .semibold))
                .foregroundStyle(TapColors.text)
            // Signed out there is no account to speak of, and this screen is
            // reachable anonymously — the sentence must not invent one.
            Text(isSignedIn
                ? "Everything on this account and on this device."
                : "Everything opened on this device.")
                .font(TapFont.ui(size: 14.4))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    @ViewBuilder
    private func section(_ title: String, rows sectionRows: [LandingRow]) -> some View {
        if !sectionRows.isEmpty {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                SectionHeader(title: title, count: String(sectionRows.count))
                VStack(spacing: TapSpacing.sm) {
                    ForEach(sectionRows) { row in
                        RoundRow(
                            row: row,
                            onOpen: { open(row) },
                            onRemove: { pendingRemoval = row }
                        )
                    }
                }
            }
        }
    }

    // MARK: - Actions

    private var isSignedIn: Bool {
        if case .signedIn = environment.authState { return true }
        return false
    }

    private func open(_ row: LandingRow) {
        guard let token = row.token else { return }
        onOpen(
            RoundOpenRequest(
                token: token,
                courseName: row.courseName.isEmpty ? nil : row.courseName,
                name: row.name,
                status: row.status,
                completedAt: row.completedAt,
                date: row.date
            )
        )
    }

    /// Local only, exactly as on Home: the round is untouched server-side and
    /// its share link brings it back, so a server row stays (minus its
    /// device-local flag) and only a device-only row disappears.
    private func remove(token: String) {
        loader.applyDevice(deviceRounds.remove(token: token))
    }
}
