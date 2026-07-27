import SwiftUI

/// A serif section title, optionally with a count beside it.
///
/// Source: `.landing__section` in `src/landing/landing.component.ts`
/// ("Ongoing", "Recently finished" — Fraunces 600 at 1.1rem, with a muted
/// 0.85rem count on the baseline) and `.lb-section__title` /
/// `.lb-cards__head` in `src/round/leaderboard.component.ts`, which are the
/// same idea one step down and up in size.
///
/// The serif is the whole point: Fraunces marks structure, Archivo carries
/// content. A section header in the UI face reads as a list row.
struct SectionHeader: View {
    let title: String
    /// The muted trailing count ("3"). The landing's "New — you were added"
    /// strip promotes this to an accent pill instead; see `accented`.
    var count: String?
    /// Web: `.landing__new-count` — the fresh-adds strip draws its count as an
    /// accent pill so a new round pulls the eye at the top of the list.
    var accented: Bool = false
    var size: CGFloat = 17.6

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
            Text(title)
                .font(TapFont.display(size: size, weight: .semibold))
                .foregroundStyle(TapColors.text)
            if let count {
                if accented {
                    Text(count)
                        .font(TapFont.ui(size: 12.8, weight: .bold))
                        .foregroundStyle(TapColors.accent)
                        .padding(.vertical, 1)
                        .padding(.horizontal, 9)
                        .background(Capsule().fill(TapColors.accentSoft))
                } else {
                    Text(count)
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.textMuted)
                }
            }
            Spacer(minLength: 0)
        }
    }
}
