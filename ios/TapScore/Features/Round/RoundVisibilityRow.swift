import SwiftUI
import Observation

/// The round's friends-feed visibility, as a switch in the manage sheet.
///
/// **Placement is part of the design.** It is one level in — inside "Manage
/// round" — and deliberately NOT in the create flow and NOT in any collapsed
/// summary. Sharing a round with the friends you play golf with is the ordinary
/// case and should cost nothing to set up; opting out is for the day somebody
/// is shooting 112 and would rather nobody watched. That is a thing you go
/// looking for, once, and it should be findable — not a decision imposed on
/// everybody at round creation.
///
/// **Wording is part of the spec** (docs/proposals/friends-activity.md, "Known
/// gaps"). `private` removes the round from friends' feeds and from the
/// spectate path. It does NOT make the round secret: id-addressed reads stay
/// open server-side, and anyone holding the share link can still open and score
/// it. The copy below therefore promises exactly one thing — feed removal — and
/// says the link keeps working in the same breath. A label that over-promises
/// privacy is worse than no toggle at all, because somebody will act on it.
struct RoundVisibilityRow: View {
    let token: String
    /// The round's CURRENT server-side visibility, off the round payload this
    /// sheet already holds. Passed in rather than fetched: a control that
    /// reports its own state has to read the same value the server would
    /// return, and the round read is already on screen.
    let visibility: RoundVisibility
    let api: TapScoreAPI

    @State private var model: RoundVisibilityModel?

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Toggle(isOn: binding) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Show in friends' feeds")
                        .font(TapFont.ui(size: 14.4, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                    Text(detail)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            // A switch is a CONTROL, so it takes the framework action token
            // (fairway green), not the decorative brass `accent` — same as the
            // app's only other Toggle, in `ProfileView`. See AGENTS.md, "Theme
            // and CSS".
            .tint(TapColors.accentStrong)
            .frame(minHeight: 44)
            .disabled(model?.saving ?? true)

            if let problem = model?.error {
                Text(problem)
                    .font(TapFont.ui(size: 12.8))
                    .foregroundStyle(TapColors.danger)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .task {
            guard model == nil else { return }
            model = RoundVisibilityModel(token: token, visibility: visibility, api: api)
        }
        .accessibilityIdentifier("round-manage-visibility")
    }

    /// The honest half of the wording. Both states name the same two facts —
    /// who sees the round in a feed, and that the link is unaffected — so
    /// flipping the switch never looks like it changed what a link can do.
    private var detail: String {
        (model?.sharesWithFriends ?? RoundVisibilityModel.sharesWithFriends(visibility))
            ? "Friends who have added you back can see this round while you play. Anyone with the link can open and score it either way."
            : "Hidden from your friends' feeds. It is not private: anyone with the link can still open and score it."
    }

    private var binding: Binding<Bool> {
        Binding(
            get: { model?.sharesWithFriends ?? RoundVisibilityModel.sharesWithFriends(visibility) },
            set: { on in Task { await model?.set(sharesWithFriends: on) } }
        )
    }
}

/// The toggle's state.
///
/// **It reads the truth, and nothing here remembers anything.** The round
/// payload carries `visibility` (`rounds.visibility`, migration 049), so the
/// switch is initialised from the server's own value and re-initialised from
/// the server's echo after every write. There is deliberately no device-local
/// persistence: the only key such a cache could use is the SHARE TOKEN, which
/// every participant holds, so a remembered value would be wrong on the second
/// phone — showing the switch ON for a round its owner set to private, with
/// copy claiming friends can watch, and an off→on-shaped tap silently undoing
/// the opt-out.
@MainActor
@Observable
final class RoundVisibilityModel {
    private(set) var sharesWithFriends: Bool
    private(set) var saving = false
    private(set) var error: String?

    private let token: String
    private let api: TapScoreAPI

    init(token: String, visibility: RoundVisibility, api: TapScoreAPI) {
        self.token = token
        self.api = api
        self.sharesWithFriends = Self.sharesWithFriends(visibility)
    }

    /// ONLY `friends` puts a round in a feed. `link` is a spectate widening —
    /// the server's discovery query filters on `visibility = 'friends'` and the
    /// spec's table says a `link` round appears in feeds NEVER — so treating it
    /// as "on" would show a switch claiming friends can watch a round they will
    /// never be shown.
    static func sharesWithFriends(_ visibility: RoundVisibility) -> Bool {
        visibility == .friends
    }

    func set(sharesWithFriends on: Bool) async {
        guard !saving, on != sharesWithFriends else { return }
        // Optimistic: the switch must move under the thumb. It is put back if
        // the write fails, rather than left showing a state the server rejected.
        let previous = sharesWithFriends
        sharesWithFriends = on
        saving = true
        error = nil
        defer { saving = false }
        do {
            let result = try await api.send(
                FriendlyRoundsEndpoints.setVisibility,
                FriendlyRoundsSetVisibilityInput(
                    token: token,
                    visibility: on ? .friends : .private
                )
            )
            // Trust the ECHO, not the request: the server is the authority on
            // what the value ended up being.
            sharesWithFriends = Self.sharesWithFriends(result.visibility)
        } catch {
            sharesWithFriends = previous
            self.error = "Couldn't change who can see this round."
        }
    }
}
