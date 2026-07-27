import SwiftUI

/// Share-link entry — placeholder.
///
/// The manual fallback for N4's cold-tap gate: a friend who has the link but
/// whose universal link did not resolve (association not yet propagated, link
/// pasted into a message app that strips it) can still get to score entry. It
/// runs the pasted text through the *same* `DeepLinkRouter` the OS path uses,
/// so there is one parser and one set of tests behind both doors.
struct JoinView: View {
    /// Called with a resolved share token.
    let onOpen: (String) -> Void

    @State private var input = ""
    @State private var problem: String?

    var body: some View {
        Form {
            Section("Paste a round link") {
                TextField("https://app.swedenindoorgolf.se/tapscore/round?token=…", text: $input, axis: .vertical)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .font(.footnote)
                if let problem {
                    Text(problem).font(.footnote).foregroundStyle(.red)
                }
                Button("Open round", action: open)
                    .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            Section {
                Text("Placeholder screen — no API wiring. Sign in with Apple is not required to score a round you were invited to.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Join a round")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func open() {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: trimmed),
              case let .round(token)? = DeepLinkRouter.route(for: url)
        else {
            problem = "That doesn't look like a tapscore round link."
            return
        }
        problem = nil
        onOpen(token)
    }
}
