import SwiftUI

/// The landing's "Out now" strip — the friends who are on the course right now.
///
/// Two rules from docs/proposals/friends-activity.md shape everything here:
///
/// 1. **It renders only when it has something to say.** The caller is expected
///    to skip it entirely when there are no chips (this view returns an empty
///    body in that case as a second line of defence). An empty-state card
///    reading "no friends are playing" would take permanent room on the one
///    screen the app opens to, in order to report a non-event.
/// 2. **A chip carries holes played and score to par, and nothing finer.** The
///    reduction lives in `FriendsActivityModel`; this view only lays it out.
///    Anything more detailed — a hole, a streak, a bad stretch — is a thing you
///    should have to open someone's round to see.
///
/// A horizontal row rather than a list: the strip sits above the player's own
/// rounds and must not push them off screen no matter how sociable they are.
struct OutNowStrip: View {
    let contextLine: String
    let chips: [OutNowChip]
    let onOpen: (OutNowChip) -> Void

    var body: some View {
        if chips.isEmpty {
            EmptyView()
        } else {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                HStack(spacing: TapSpacing.sm) {
                    LiveDot()
                    Text(contextLine)
                        .font(TapFont.ui(size: 13.6, weight: .semibold))
                        .foregroundStyle(TapColors.textMuted)
                }
                .accessibilityElement(children: .combine)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: TapSpacing.sm) {
                        ForEach(chips) { chip in
                            OutNowChipView(chip: chip, onOpen: { onOpen(chip) })
                        }
                    }
                    // The row scrolls inside the landing's own horizontal
                    // padding, so a chip can run to the screen edge instead of
                    // stopping short of it and looking clipped.
                    .padding(.horizontal, TapSpacing.lg)
                }
                .padding(.horizontal, -TapSpacing.lg)
            }
            .accessibilityIdentifier("out-now-strip")
        }
    }
}

/// One friend's live round, as a tappable card.
private struct OutNowChipView: View {
    let chip: OutNowChip
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            TapCard {
                HStack(spacing: TapSpacing.sm) {
                    ZStack(alignment: .bottomTrailing) {
                        TapAvatar(
                            playerId: chip.playerId,
                            avatarVersion: chip.avatarVersion,
                            displayName: chip.displayName,
                            size: 36
                        )
                        // The live marker rides the avatar rather than sitting
                        // in the text: the row is already "who + how far", and
                        // a third text fragment per chip is a wall of words at
                        // four chips wide.
                        LiveDot()
                            .padding(2)
                            .background(Circle().fill(TapColors.surface))
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(chip.title)
                            .font(TapFont.ui(size: 15, weight: .semibold))
                            .foregroundStyle(TapColors.text)
                            .lineLimit(1)
                        Text(chip.progress)
                            .font(TapFont.ui(size: 12.8, weight: .semibold))
                            .foregroundStyle(TapColors.accent)
                            .lineLimit(1)
                    }
                }
                .padding(.vertical, TapSpacing.sm)
                .padding(.horizontal, TapSpacing.md)
            }
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(chip.accessibilityLabel)
        .accessibilityAddTraits(.isButton)
        .accessibilityIdentifier("out-now-chip")
    }
}

/// The small "someone is playing" marker. A plain filled circle — it does not
/// animate, and nothing on this screen should: the strip sits above the
/// player's own rounds, and a pulse there is motion in the corner of the eye
/// every time the app is opened.
///
/// A dot rather than the `LiveBadge` pill: this appears next to a name in a
/// dense row (a chip's avatar, a friend list row), where a 10px uppercase word
/// would outweigh the name it annotates.
struct LiveDot: View {
    var diameter: CGFloat = 8

    var body: some View {
        Circle()
            .fill(TapColors.accent)
            .frame(width: diameter, height: diameter)
            .accessibilityHidden(true)
    }
}
