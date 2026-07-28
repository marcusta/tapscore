#if DEBUG
import SwiftUI

/// A DEBUG-only catalogue of every design-system primitive in every state.
///
/// Reachable ONLY by launch argument — it is not wired into navigation, and no
/// screen links to it:
///
/// ```sh
/// xcrun simctl launch <udid> com.marcusandersson.tapscore -tapscoreGallery YES
/// xcrun simctl ui <udid> appearance dark   # the other half of a review pass
/// xcrun simctl io <udid> screenshot /tmp/gallery-dark.png
/// ```
///
/// Same mechanism as `LaunchDeepLink`, for the same reason: a review needs a
/// screenshot a script can take, and a gallery buried behind three taps is a
/// gallery nobody screenshots. It follows the system appearance by default so
/// `simctl ui appearance` alone flips it; the in-page picker is for a human
/// comparing the two without leaving the app.
struct DesignGalleryView: View {
    /// nil = follow the system, which is what the headless screenshot path
    /// depends on.
    @State private var forcedScheme: ColorScheme?
    @State private var selectedChip = 1
    @State private var tab = Tab.score
    @State private var hole = 7
    @State private var galleryCourse: String? = "lkpg"
    @State private var gallerySearch = ""
    @State private var galleryHole = 10
    @State private var galleryTee: String? = "rod"

    private enum Tab: Hashable { case score, leaderboard }

    var body: some View {
        VStack(spacing: 0) {
            appearancePicker
            ScrollView {
                VStack(alignment: .leading, spacing: TapSpacing.xl) {
                    typography
                    buttons
                    chips
                    dropdowns
                    badges
                    cards
                    scoreCircles
                    parDirections
                    holeBarSection
                }
                .padding(TapSpacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            BottomTabBar(
                tabs: [
                    .init(Tab.score, title: "Score", systemImage: "pencil.line"),
                    .init(Tab.leaderboard, title: "Leaderboard", systemImage: "list.number"),
                ],
                selection: $tab
            )
        }
        .background(TapColors.bg)
        .preferredColorScheme(forcedScheme)
    }

    // MARK: - Sections

    private var appearancePicker: some View {
        Picker("Appearance", selection: $forcedScheme) {
            Text("System").tag(ColorScheme?.none)
            Text("Light").tag(ColorScheme?.some(.light))
            Text("Dark").tag(ColorScheme?.some(.dark))
        }
        .pickerStyle(.segmented)
        .padding(TapSpacing.sm)
        .background(TapColors.surface)
    }

    private var typography: some View {
        section("Typography") {
            Text("Clubhouse scorecard")
                .font(TapFont.display(size: 35.2, weight: .semibold))
                .foregroundStyle(TapColors.text)
            Text("Fraunces 400 / 600 / 700")
                .font(TapFont.display(size: 17.6, weight: .regular))
                .foregroundStyle(TapColors.textMuted)
            Text("Archivo 400 500 600 700 800 — 0123456789")
                .font(TapFont.ui(size: 14.4))
                .foregroundStyle(TapColors.text)
            Text("Tabular figures: 11 · 18 · 108")
                .font(TapFont.ui(size: 14.4, weight: .bold))
                .foregroundStyle(TapColors.text)
            SectionHeader(title: "Ongoing", count: "3")
            SectionHeader(title: "New — you were added", count: "2", accented: true)
        }
    }

    private var buttons: some View {
        section("Buttons") {
            Button("Create round") {}
                .buttonStyle(.tap(.primary, size: .prominent, fillsWidth: true))
            HStack(spacing: TapSpacing.sm) {
                Button("Primary") {}.buttonStyle(.tapPrimary)
                Button("Secondary") {}.buttonStyle(.tapSecondary)
                Button("Ghost") {}.buttonStyle(.tapGhost)
                Button("Danger") {}.buttonStyle(.tapDanger)
            }
            Button("Disabled") {}
                .buttonStyle(.tapSecondary)
                .disabled(true)
        }
    }

    private var chips: some View {
        section("Chips") {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: TapSpacing.sm) {
                    ForEach(0..<3) { index in
                        TapChip(
                            title: ["Stroke play", "Stableford", "Match"][index],
                            isSelected: selectedChip == index,
                            action: { selectedChip = index }
                        )
                    }
                }
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: TapSpacing.sm) {
                    TapChip(title: "Group 1", isSelected: true, tone: .accent)
                    TapChip(title: "Group 2", tone: .accent)
                }
            }
        }
    }

    /// The long-choice control (`TapDropdown`) next to the short-choice one
    /// (`TapChip`), because the standing rule in `ios/AGENTS.md` is about
    /// choosing BETWEEN them — and because a warning that renders as words in a
    /// tone rather than an emoji has to be looked at to be believed.
    private var dropdowns: some View {
        section("Dropdowns") {
            TapDropdown(
                placeholder: "Choose course",
                title: "Course",
                selection: galleryCourse,
                groups: [
                    TapDropdownGroup(id: "halmstad", header: "Halmstad GK", rows: [
                        TapDropdownRow(value: "north", title: "North"),
                    ]),
                    TapDropdownGroup(id: "lkpg", header: "Linköpings Golfklubb", rows: [
                        TapDropdownRow(value: "lkpg", title: "Linköping"),
                    ]),
                ],
                selectedRow: TapDropdownRow(
                    value: "lkpg", title: "Linköping", subtitle: "LINKÖPINGS GOLFKLUBB"),
                search: TapDropdownSearch(
                    prompt: "Search club or course",
                    text: $gallerySearch,
                    emptyPrefix: "No courses match"),
                onSelect: { galleryCourse = $0 })

            TapDropdown(
                label: "Start hole",
                placeholder: "Hole 1",
                title: "Start hole",
                selection: galleryHole,
                groups: [TapDropdownGroup(rows: (1...18).map { hole in
                    TapDropdownRow(
                        value: hole,
                        title: "Hole \(hole)",
                        annotation: hole == 1
                            ? nil
                            : TapDropdownAnnotation("Won't count for handicap"))
                })],
                onSelect: { galleryHole = $0 })

            TapDropdown(
                label: "Women",
                placeholder: "Choose tee",
                title: "Women's tee",
                selection: galleryTee,
                groups: [TapDropdownGroup(rows: [
                    TapDropdownRow(value: "vit", title: "Vit", annotation: TapDropdownAnnotation(
                        "No women's rating", tone: .danger)),
                    TapDropdownRow(value: "gul", title: "Gul"),
                    TapDropdownRow(value: "rod", title: "Röd"),
                ])],
                onSelect: { galleryTee = $0 })
        }
    }

    private var badges: some View {
        section("Badges") {
            HStack(spacing: TapSpacing.sm) {
                LiveBadge()
                ForEach(RoundStatusTone.allCases, id: \.self) { StatusChip(status: $0) }
            }
        }
    }

    private var cards: some View {
        section("Cards") {
            TapCard {
                VStack(alignment: .leading, spacing: TapSpacing.xs) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("Linköpings GK")
                            .font(TapFont.ui(size: 16.8, weight: .bold))
                            .foregroundStyle(TapColors.text)
                        Spacer()
                        StatusChip(status: .active)
                    }
                    HStack {
                        Text("2026-07-27").font(TapFont.ui(size: 13.6))
                        Spacer()
                        Text("Stroke play").font(TapFont.ui(size: 13.6))
                    }
                    .foregroundStyle(TapColors.textMuted)
                }
                .padding(TapSpacing.md)
            }
            TapCard(sunken: true) {
                Text("Share this round")
                    .font(TapFont.ui(size: 12.8, weight: .bold))
                    .tracking(12.8 * 0.06)
                    .foregroundStyle(TapColors.textMuted)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(TapSpacing.lg)
            }
        }
    }

    private var scoreCircles: some View {
        section("Score circles") {
            HStack(spacing: TapSpacing.sm) {
                ScoreCircle(state: .empty)
                ScoreCircle(state: .hint("+1"))
                ScoreCircle(state: .score(4))
                ScoreCircle(state: .pending)
            }
            // Every marker form, keyed off the same thresholds the leaderboard
            // uses — par 4 throughout, so the strokes read as the relation.
            HStack(spacing: TapSpacing.sm) {
                ForEach([1, 2, 3, 5, 6, 7], id: \.self) { strokes in
                    ScoreCircle(
                        state: .score(strokes),
                        marker: ScoreMarkerForm.forScore(strokes: strokes, par: 4)
                    )
                }
            }
        }
    }

    private var parDirections: some View {
        section("To par") {
            HStack(spacing: TapSpacing.lg) {
                ForEach([-3, 0, 4], id: \.self) { toPar in
                    let direction = ParDirection(toPar: toPar)
                    Text(direction.formatted(toPar: toPar))
                        .font(TapFont.ui(size: 12.8, weight: .semibold))
                        .foregroundStyle(direction.color)
                }
            }
        }
    }

    private var holeBarSection: some View {
        section("Hole bar") {
            HoleBar(
                hole: hole,
                par: 4,
                strokeIndex: 11,
                canGoPrevious: hole > 1,
                canGoNext: hole < 18,
                onPrevious: { hole -= 1 },
                onNext: { hole += 1 }
            )
            HoleBar(hole: 1, par: 3, strokeIndex: nil, canGoPrevious: false)
        }
    }

    // MARK: - Layout helper

    @ViewBuilder
    private func section(
        _ title: String,
        @ViewBuilder content: () -> some View
    ) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: title)
            content()
        }
    }
}

/// The `-tapscoreGallery` launch switch.
///
/// A sibling of `LaunchDeepLink` (`App/TapScoreApp.swift`) and read the same
/// two ways, so a wrapper that cannot pass argv can use the environment form.
/// Any value but an explicit `NO`/`0`/`false` turns it on — `-tapscoreGallery
/// YES` and a bare `-tapscoreGallery` both work.
enum LaunchGallery {
    static let argument = "-tapscoreGallery"
    static let environmentKey = "TAPSCORE_GALLERY"

    static var isEnabled: Bool {
        enabled(
            arguments: ProcessInfo.processInfo.arguments,
            environment: ProcessInfo.processInfo.environment
        )
    }

    /// Pure lookup, split out so it is testable without a process.
    static func enabled(arguments: [String], environment: [String: String]) -> Bool {
        if let index = arguments.firstIndex(of: argument) {
            let value = index + 1 < arguments.count ? arguments[index + 1] : ""
            return !isNegative(value)
        }
        guard let value = environment[environmentKey] else { return false }
        return !value.isEmpty && !isNegative(value)
    }

    private static func isNegative(_ value: String) -> Bool {
        ["no", "0", "false"].contains(value.lowercased())
    }
}
#endif
