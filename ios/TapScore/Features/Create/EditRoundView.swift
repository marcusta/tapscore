import SwiftUI

/// How an edit ended, from the caller's point of view. The round-manage sheet
/// reloads on `.saved` and does nothing at all on `.cancelled`.
enum EditRoundOutcome: Sendable, Equatable {
    case saved
    case cancelled
}

/// Edit an existing round's setup — the create flow, opened on a round that
/// already exists (spec `docs/proposals/ios-round-manage.md` Part B).
///
/// Thin by design. Everything that differs between creating and editing lives
/// either in `CreateRoundView.Mode` (the copy and which load runs) or in
/// `CreateStore` (the hydrate, the scores lock, the assemble-and-replace save).
/// A second screen would mean two step bars, two footers and two sets of
/// diagnostics plumbing to keep in step — and the one thing an edit screen must
/// never do is disagree with the create screen about what a valid setup is.
struct EditRoundView: View {
    /// The round's share token — its write credential. Never logged, never
    /// rendered.
    let token: String
    let onDone: (EditRoundOutcome) -> Void

    var body: some View {
        CreateRoundView(
            mode: .edit(token: token),
            onCancel: { onDone(.cancelled) },
            onSaved: { onDone(.saved) })
    }
}
