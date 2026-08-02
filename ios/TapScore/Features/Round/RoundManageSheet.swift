import SwiftUI

/// Everything you can do TO a round, as opposed to in it: edit its setup,
/// remove yourself from it, finish or reopen it, delete it.
///
/// A sheet rather than a screen, and the same anatomy as `AccountSheetView` —
/// Fraunces title with a "Done" ghost button, a scrolling body, 44pt rows. None
/// of this is a destination a link can reach and none of it has back-stack
/// meaning; it is a menu hung off the round header.
///
/// The view is thin on purpose: every action is an `async` method on
/// `RoundStore`, and the only decisions made here are which rows exist
/// (`RoundManageRows`) and which confirmation is on screen.
struct RoundManageSheet: View {
    @Bindable var store: RoundStore
    /// Called after a successful delete, once this sheet has dismissed itself:
    /// the round no longer exists, so the screen behind it must not stay up.
    let onDeleted: () -> Void

    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    /// Which destructive confirmation is being asked. One piece of state for
    /// all three, so two dialogs can never be up at once.
    private enum Confirmation: Identifiable {
        case finish, delete, leave
        var id: Self { self }
    }

    @State private var confirmation: Confirmation?
    /// The edit flow, over everything. A `fullScreenCover` rather than a pushed
    /// destination: the create flow owns its own navigation stack, its own
    /// Cancel and its own three steps, and half of it peeking out from under a
    /// sheet is not a screen anybody designed.
    @State private var editing = false

    private var rows: RoundManageRows {
        RoundManageRows(
            status: store.round?.status,
            editability: store.editability,
            creatorPlayerId: store.friendlyRound?.creatorPlayerId,
            viewerPlayerId: RoundManageRows.viewerPlayerId(environment.authState),
            balls: store.balls
        )
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.lg) {
                // ROW ORDER IS THE SPEC'S: Edit, Remove me, Finish / Reopen,
                // Delete last. Edit appears only on a POSITIVE `editable:true`
                // from the setup probe (`RoundManageRows`) — a probe that failed
                // or never answered reads the same as "no", because a row that
                // opens a screen the server will refuse is worse than no row.

                if rows.showsEdit { editRow }
                // Between "edit the round" and the rows that remove things:
                // it is a setting, not an action, and it is not destructive.
                //
                // It appears only once the round has actually loaded (a switch
                // that cannot read its own state has nothing honest to show)
                // and never on a COMPETITION round: the write is inert there by
                // design — the feed and the spectate path exclude competition
                // rounds whatever the column says — so its "on" copy, which
                // promises friends can watch, would simply be false.
                if let visibility = store.round?.visibility, !store.isCompetitionRound {
                    RoundVisibilityRow(
                        token: store.token,
                        visibility: visibility,
                        api: environment.api
                    )
                }
                if rows.showsLeave { leaveRow }
                if rows.showsFinish { finishRow }
                if rows.showsDelete { deleteRow }

                if let problem = store.manageError {
                    Text(problem)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.danger)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("round-manage-error")
                }
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .safeAreaInset(edge: .top, spacing: 0) { header }
        .accessibilityIdentifier("round-manage-sheet")
        .confirmationDialog(
            confirmationTitle,
            isPresented: Binding(
                get: { confirmation != nil },
                set: { if !$0 { confirmation = nil } }
            ),
            titleVisibility: .visible,
            presenting: confirmation
        ) { pending in
            confirmButtons(for: pending)
        } message: { pending in
            Text(message(for: pending))
        }
        .fullScreenCover(isPresented: $editing) {
            EditRoundView(token: store.token) { outcome in
                editing = false
                guard outcome == .saved else { return }
                // Saved: the sheet has nothing left to say about a setup that
                // just changed under it, and the screen behind it is showing
                // the OLD one. Close and reload, in that order.
                dismiss()
                Task { await store.load() }
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("Manage round")
                .font(TapFont.display(size: 20, weight: .bold))
                .foregroundStyle(TapColors.text)
            Spacer(minLength: 0)
            // Just dismiss. The inline error is cleared by the presenter's
            // `onDismiss` (`RoundView`), which catches the swipe too — clearing
            // it here as well would be a second mechanism saying the same thing,
            // and the one that gets forgotten when this button moves.
            Button("Done") { dismiss() }
            .buttonStyle(.tap(.ghost))
            .accessibilityIdentifier("round-manage-done")
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.vertical, TapSpacing.md)
        .background(TapColors.surface)
        .overlay(alignment: .bottom) {
            Rectangle().fill(TapColors.border).frame(height: 1)
        }
    }

    // MARK: - Rows

    private var editRow: some View {
        row(
            title: "Edit round",
            detail: "Change the course, players or formats. Scores already taken are kept.",
            identifier: "round-manage-edit",
            tone: .plain,
            chevron: true
        ) { editing = true }
    }

    private var leaveRow: some View {
        row(
            title: "Remove me from this round",
            detail: "Your scores here are deleted; the round goes on without you.",
            identifier: "round-manage-leave",
            tone: .danger
        ) { confirmation = .leave }
    }

    private var finishRow: some View {
        row(
            title: rows.finishLabel,
            detail: store.round?.status == .complete
                ? "Move it back to your ongoing rounds."
                : "Move it to your finished rounds. Nothing is locked.",
            identifier: "round-manage-finish",
            tone: .plain
        ) { confirmation = .finish }
    }

    private var deleteRow: some View {
        row(
            title: "Delete round",
            detail: "Removes the round and every score in it, for everyone.",
            identifier: "round-manage-delete",
            tone: .danger
        ) { confirmation = .delete }
    }

    private enum RowTone { case plain, danger }

    /// One 44pt row. The chevron is NAVIGATION, and only Edit has it: every
    /// other row opens a confirmation in place, and a chevron on those would
    /// promise a screen that never arrives.
    private func row(
        title: String,
        detail: String,
        identifier: String,
        tone: RowTone,
        chevron: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: TapSpacing.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(TapFont.ui(size: 14.4, weight: .semibold))
                        .foregroundStyle(tone == .danger ? TapColors.danger : TapColors.text)
                    Text(detail)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                if chevron {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(TapColors.textMuted)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        // Every manage row is disabled while ANY of them is in flight: they all
        // act on the same round, and a delete racing a finish has no defensible
        // outcome.
        .disabled(store.manageAction != nil)
        .accessibilityIdentifier(identifier)
    }

    // MARK: - Confirmations

    private var confirmationTitle: String {
        switch confirmation {
        case .finish:
            return store.round?.status == .complete ? "Reopen this round?" : "Finish this round?"
        case .delete: return "Delete round?"
        case .leave: return "Remove yourself from this round?"
        case nil: return ""
        }
    }

    private func message(for pending: Confirmation) -> String {
        switch pending {
        case .finish:
            return store.round?.status == .complete
                ? "It'll move back to your ongoing rounds."
                : "It'll move to your finished rounds. You can still edit or reopen it any time."
        case .delete:
            return "This permanently removes the round and all its scores for everyone. This can't be undone."
        case .leave:
            return "Your scores here will be deleted. Everyone else's stay, and the round keeps going without you."
        }
    }

    @ViewBuilder
    private func confirmButtons(for pending: Confirmation) -> some View {
        switch pending {
        case .finish:
            // NOT destructive: finishing seals nothing and reopening undoes it.
            Button(rows.finishLabel) {
                confirmation = nil
                Task { await store.finishOrReopen() }
            }
            Button("Cancel", role: .cancel) { confirmation = nil }
        case .delete:
            Button("Delete round", role: .destructive) {
                confirmation = nil
                Task {
                    guard await store.deleteRound() else { return }
                    // The sheet goes first, then the screen behind it: the round
                    // it was showing does not exist any more.
                    dismiss()
                    onDeleted()
                }
            }
            Button("Cancel", role: .cancel) { confirmation = nil }
        case .leave:
            Button("Remove me", role: .destructive) {
                confirmation = nil
                Task { await store.leaveRound() }
            }
            Button("Cancel", role: .cancel) { confirmation = nil }
        }
    }
}
