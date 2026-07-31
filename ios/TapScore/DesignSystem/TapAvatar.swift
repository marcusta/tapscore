import SwiftUI

/// A player's photo, or their initials when there is none.
///
/// The initials are not a placeholder for a photo that is coming — they are the
/// majority state, and they are drawn in the app's own type and colours rather
/// than a grey silhouette, because a roster of letters tells you more than a
/// roster of identical heads.
///
/// The photo, when there is one, arrives through `AvatarStore` — never
/// `AsyncImage`, which cannot send the bearer header the serve route requires.
/// See that type for why.
struct TapAvatar: View {
    let playerId: String
    /// Nil means "this player has no photo", stated by the server on the
    /// payload the row came from. It is never a thing to guess at.
    let avatarVersion: String?
    let displayName: String
    /// Feeds the initials fallback when the display name has no usable letter.
    var username: String = ""
    var size: CGFloat = 40
    var fontSize: CGFloat = 13.6
    var background: Color = TapColors.primary
    var foreground: Color = TapColors.primaryText

    @Environment(AppEnvironment.self) private var environment
    @State private var image: UIImage?

    var body: some View {
        ZStack {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    // Fill, so a source that is not perfectly square still reads
                    // as a circle instead of an oval with bars.
                    .scaledToFill()
            } else {
                Text(AccountAvatar.initials(displayName: displayName, username: username))
                    .font(TapFont.ui(size: fontSize, weight: .bold))
                    .foregroundStyle(foreground)
            }
        }
        .frame(width: size, height: size)
        .background(image == nil ? background : Color.clear)
        .clipShape(Circle())
        // The badge sits beside the name it belongs to on every screen that
        // uses it, so announcing it would read the person out twice.
        .accessibilityHidden(true)
        // Keyed on the identity AND the version: a row recycled onto a
        // different player, or the same player after they change their photo,
        // both have to re-resolve. Without the key a scrolled-away row keeps
        // the previous occupant's face.
        .task(id: "\(playerId)@\(avatarVersion ?? "")") {
            let resolved = await environment.avatars.image(
                playerId: playerId,
                version: avatarVersion
            )
            // The task is cancelled and restarted when the key changes, so a
            // late answer for the previous player cannot land here — but a
            // cancelled task still resumes, hence the explicit check.
            guard !Task.isCancelled else { return }
            image = resolved
        }
    }
}
