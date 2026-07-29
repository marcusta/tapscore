import SwiftUI

/// The round screen's two-item tab bar — the bottom half of the pinned dock,
/// directly under `HoleBar`.
///
/// Source: `.round-tabs` in `src/round/round.component.ts`. Dark fairway-green
/// `--topbar-bg`, icon over an uppercase 0.7rem/700 label, inactive text at
/// `rgba(247, 244, 234, 0.55)`, and `--accent` brass for the active item.
///
/// That cream wash is a LITERAL on the web and stays a literal here, which is
/// the one place in this layer that does not go through a token. `--topbar-bg`
/// is dark in *both* appearances (#1e3526 / #0f1a13), so the ink on it is not
/// appearance-dependent — and routing it through `--primary-text` instead,
/// which is cream in light but near-black in dark, paints the inactive tab
/// #0f1a13 on a #0f1a13 bar. It is invisible, and the gallery screenshot is
/// how that was caught.
///
/// Deliberately NOT a `TabView`: the web's dock is a control strip inside one
/// screen, not the app's navigation root, and modelling it as a `TabView` would
/// put a second navigation concept next to `ShellNavigation`.
struct BottomTabBar<Item: Hashable>: View {
    struct Tab: Identifiable {
        let id: Item
        let title: String
        /// SF Symbol. The web ships inline SVGs at 24×24; the symbol is the
        /// native equivalent, at the same size.
        let systemImage: String

        init(_ id: Item, title: String, systemImage: String) {
            self.id = id
            self.title = title
            self.systemImage = systemImage
        }
    }

    let tabs: [Tab]
    @Binding var selection: Item

    var body: some View {
        HStack(spacing: 0) {
            ForEach(tabs) { tab in
                Button {
                    selection = tab.id
                } label: {
                    VStack(spacing: 3) {
                        Image(systemName: tab.systemImage)
                            .font(.system(size: 20, weight: .semibold))
                            .frame(width: 24, height: 24)
                        Text(tab.title.uppercased())
                            .font(TapFont.ui(size: 11.2, weight: .bold))
                            .tracking(11.2 * 0.06)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, TapSpacing.sm)
                    .padding(.bottom, TapSpacing.md)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .foregroundStyle(
                    selection == tab.id ? TapColors.accent : bottomTabInactiveInk
                )
                .accessibilityAddTraits(selection == tab.id ? [.isSelected] : [])
            }
        }
        .background(TapColors.topbarBg.ignoresSafeArea(edges: .bottom))
    }
}

/// Web: `rgba(247, 244, 234, 0.55)` on `.round-tabs__tab`. A file-scope
/// constant rather than a static on `BottomTabBar`, which is generic and so
/// cannot hold stored type properties. See the note on the type for why this
/// one colour is a literal.
private let bottomTabInactiveInk = Color(
    red: 0xf7 / 255, green: 0xf4 / 255, blue: 0xea / 255
).opacity(0.55)
