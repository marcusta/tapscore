import SwiftUI

/// One round's stats (§4.2) — the hole strip, the waterfall, and the §3 panels
/// scoped to this round.
///
/// Reachable two ways, and it must render the same both times: pushed from the
/// dashboard's round list, and from the round-end story card. It therefore
/// carries no navigation chrome of its own beyond a title — `RoundStatsScreen`
/// wraps it for the sheet presentation.
///
/// Nothing here computes. Every figure comes off `RoundStatsStore.model`, and
/// the cell decorations are classified locally by `ScoreMarkerForm.forScore`
/// rather than resolved from server templates the way the scorecard's are
/// (`MarkerVisual.resolve`). A birdie reads the same on both because the two
/// classifications share the `MARKER_TOKENS` table, not because they share a
/// code path.
struct RoundStatsView: View {
    @Environment(AppEnvironment.self) private var environment

    let roundId: String
    /// A model the caller already fetched (the story card). Skips the second
    /// round trip for what is, by definition, the same two reads.
    var preloaded: RoundStatsModel?
    /// Summary rows the caller holds (the dashboard's loaded history). Not a
    /// model — the hole read still has to happen — but it spares the walk back
    /// through `myStats` for rows already in memory.
    var preloadedHistory: [PlayerRoundStats] = []

    @State private var store: RoundStatsStore?
    @State private var expanded: Set<StatsPanelID> = []
    @State private var openHole: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TapSpacing.lg) {
                if let preloaded {
                    content(preloaded)
                } else if let store {
                    switch store.phase {
                    case .loading:
                        message(RoundStatsCopy.loading)
                    case .notFound:
                        message(RoundStatsCopy.noStatsInRound)
                    case .notAuthorized:
                        message(StatsCopy.notAuthorized)
                    case let .failed(problem):
                        message(problem)
                    case .ready:
                        if let model = store.model { content(model) }
                    }
                } else {
                    message(RoundStatsCopy.loading)
                }
            }
            .padding(TapSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(TapColors.bg)
        .navigationTitle("Round stats")
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("round-stats")
        .task {
            guard preloaded == nil, store == nil else { return }
            let created = RoundStatsStore(
                roundId: roundId, api: environment.api, preloadedHistory: preloadedHistory)
            store = created
            await created.load()
        }
    }

    private func message(_ text: String) -> some View {
        Text(text)
            .font(TapFont.ui(size: 14.4))
            .foregroundStyle(TapColors.textMuted)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityIdentifier("round-stats-message")
    }

    // MARK: - Content

    @ViewBuilder
    private func content(_ model: RoundStatsModel) -> some View {
        header(model)
        if model.hasHoleStrip {
            holeStrip(model)
        }
        RoundWaterfallSection(
            waterfall: model.waterfall, deltas: model.deltas, windowCount: model.windowCount)
        StatsPanelsView(model: model.panels, expanded: $expanded, idPrefix: "round-stats")
    }

    private func header(_ model: RoundStatsModel) -> some View {
        TapCard {
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.md) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(model.title)
                        .font(TapFont.display(size: 19.2, weight: .semibold))
                        .foregroundStyle(TapColors.text)
                    Text(RoundStatsCopy.subtitle(model))
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
                VStack(alignment: .trailing, spacing: 2) {
                    Text(model.strokes.map { StatsFormat.count($0) } ?? "—")
                        .font(TapFont.ui(size: 22.4, weight: .bold))
                        .foregroundStyle(TapColors.text)
                    if let vsPar = model.vsPar {
                        Text(StatsFormat.vsPar(vsPar))
                            .font(TapFont.ui(size: 12.8, weight: .bold))
                            .foregroundStyle(ParDirection(toPar: Int(vsPar.rounded())).color)
                    }
                }
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("round-stats-header")
    }

    // MARK: - Hole strip

    private func holeStrip(_ model: RoundStatsModel) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Hole by hole")
            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 6), spacing: 6
            ) {
                ForEach(model.cells) { cell in
                    Button {
                        withAnimation(.easeInOut(duration: 0.15)) {
                            openHole = openHole == cell.id ? nil : cell.id
                        }
                    } label: {
                        RoundStatsHoleCellView(cell: cell, isOpen: openHole == cell.id)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("round-stats-hole")
                }
            }
            if let openHole, let cell = model.cells.first(where: { $0.id == openHole }) {
                holeDetail(cell)
            }
            RoundStatsLegend()
        }
        .accessibilityIdentifier("round-stats-strip")
    }

    private func holeDetail(_ cell: RoundStatsHoleCell) -> some View {
        TapCard(sunken: true) {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                Text(RoundStatsCopy.holeTitle(cell))
                    .font(TapFont.ui(size: 14.4, weight: .bold))
                    .foregroundStyle(TapColors.text)
                let lines = RoundStatsCopy.holeLines(cell)
                if lines.isEmpty {
                    Text(RoundStatsCopy.nothingRecordedOnHole)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                } else {
                    StatsFigureRows(items: lines)
                }
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .accessibilityIdentifier("round-stats-hole-detail")
    }
}

// MARK: - Hole cell

/// One cell of the strip: the score in its scorecard colour, with compact
/// glyphs under it for what was recorded — and NOTHING for what was not.
///
/// The colour decision is not made here. `ScoreMarkerForm.forScore` already
/// classified the hole in `RoundStatsHoleCell`, and this draws that form's own
/// fill (white numeral on top, square corners for the over-par forms) exactly as
/// the leaderboard's markers do.
struct RoundStatsHoleCellView: View {
    var cell: RoundStatsHoleCell
    var isOpen: Bool

    var body: some View {
        VStack(spacing: 3) {
            Text("\(cell.holeNumber)")
                .font(TapFont.ui(size: 10.4))
                .foregroundStyle(TapColors.textMuted)
            Text(scoreText)
                .font(TapFont.ui(size: 15.2, weight: .bold))
                .foregroundStyle(cell.marker == nil ? TapColors.text : .white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
                .background(background)
            glyphs
                .frame(height: 9)
        }
        .padding(.vertical, 4)
        .padding(.horizontal, 3)
        .overlay(
            RoundedRectangle(cornerRadius: TapRadius.radiusSm, style: .continuous)
                .strokeBorder(isOpen ? TapColors.accent : Color.clear, lineWidth: 2)
        )
        .contentShape(Rectangle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(RoundStatsCopy.cellAccessibility(cell))
    }

    private var scoreText: String {
        if let strokes = cell.strokes { return String(strokes) }
        // Strokes `0` is a pick-up everywhere in this app, never the digit.
        return cell.isPickedUp ? "–" : "·"
    }

    @ViewBuilder
    private var background: some View {
        if let marker = cell.marker {
            RoundedRectangle(
                cornerRadius: marker.isBoxy ? 3 : TapRadius.radiusSm, style: .continuous
            )
            .fill(marker.fill)
        } else {
            RoundedRectangle(cornerRadius: TapRadius.radiusSm, style: .continuous)
                .fill(TapColors.surfaceSunken)
                .overlay(
                    RoundedRectangle(cornerRadius: TapRadius.radiusSm, style: .continuous)
                        .strokeBorder(TapColors.border, lineWidth: 1)
                )
        }
    }

    /// Absent means absent: an unrecorded dimension draws no glyph, so an empty
    /// row is a hole nobody answered rather than a hole answered "no".
    @ViewBuilder
    private var glyphs: some View {
        HStack(spacing: 3) {
            if let tee = cell.tee {
                Circle()
                    .fill(RoundStatsGlyph.teeColor(tee))
                    .frame(width: 6, height: 6)
            }
            if let gir = cell.gir {
                Circle()
                    .strokeBorder(TapColors.primary, lineWidth: 1.5)
                    .background(Circle().fill(gir ? TapColors.primary : Color.clear))
                    .frame(width: 7, height: 7)
            }
            if let putts = cell.putts {
                Text(String(putts))
                    .font(TapFont.ui(size: 9.6, weight: .bold))
                    .foregroundStyle(TapColors.textMuted)
            }
            if cell.hasPenalty {
                Image(systemName: "flag.fill")
                    .font(.system(size: 7))
                    .foregroundStyle(TapColors.danger)
            }
        }
    }
}

/// The glyph colours, in one place so the strip and its legend cannot drift.
enum RoundStatsGlyph {
    static func teeColor(_ tee: PlayerHoleStatsTeeResult) -> Color {
        switch tee {
        case .fairway: return TapColors.primary
        case .inPlay: return TapColors.accent
        case .trouble: return TapColors.danger
        }
    }
}

/// What the glyphs mean, in words.
///
/// Worded, never emoji (the app's standing rule): each row draws the real glyph
/// beside the sentence that explains it, and the last line states the absence
/// rule outright, because "no ring" reading as "missed the green" would be the
/// obvious wrong guess.
struct RoundStatsLegend: View {
    var body: some View {
        TapCard(sunken: true) {
            VStack(alignment: .leading, spacing: TapSpacing.xs) {
                StatsSubhead(text: "Reading the strip")
                row {
                    Circle().fill(TapColors.primary).frame(width: 6, height: 6)
                } text: {
                    RoundStatsCopy.legendTee
                }
                row {
                    Circle()
                        .strokeBorder(TapColors.primary, lineWidth: 1.5)
                        .background(Circle().fill(TapColors.primary))
                        .frame(width: 7, height: 7)
                } text: {
                    RoundStatsCopy.legendGir
                }
                row {
                    Text("2")
                        .font(TapFont.ui(size: 9.6, weight: .bold))
                        .foregroundStyle(TapColors.textMuted)
                } text: {
                    RoundStatsCopy.legendPutts
                }
                row {
                    Image(systemName: "flag.fill")
                        .font(.system(size: 7))
                        .foregroundStyle(TapColors.danger)
                } text: {
                    RoundStatsCopy.legendPenalty
                }
                Text(RoundStatsCopy.legendAbsence)
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 2)
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .accessibilityIdentifier("round-stats-legend")
    }

    private func row(
        @ViewBuilder glyph: () -> some View, text: () -> String
    ) -> some View {
        HStack(alignment: .center, spacing: TapSpacing.sm) {
            glyph().frame(width: 10)
            Text(text())
                .font(TapFont.ui(size: 12.8))
                .foregroundStyle(TapColors.text)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
    }
}

// MARK: - Waterfall

/// The round's four strokes-lost terms, and how each sat against the player's
/// own recent rounds.
///
/// Two baselines on one row, deliberately: the BAR is the fixed baseline (what
/// the round cost against a reference player), the line under it is the
/// PERSONAL one (what it cost against your last N). With no prior rounds the
/// second simply is not drawn — a first round with stats has no personal normal,
/// and a delta of zero would claim it did.
struct RoundWaterfallSection: View {
    var waterfall: StrokesLost
    var deltas: StrokesLostDeltas?
    var windowCount: Int
    var showsHint = true

    var body: some View {
        let magnitude =
            StrokesLostComponent.allCases.compactMap { waterfall[$0].map(abs) }.max() ?? 0
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Where the round went")
            TapCard {
                VStack(alignment: .leading, spacing: TapSpacing.md) {
                    if showsHint {
                        Text(RoundStatsCopy.waterfallHint)
                            .font(TapFont.ui(size: 12.8))
                            .foregroundStyle(TapColors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    ForEach(StrokesLostComponent.allCases, id: \.rawValue) { component in
                        componentRow(component, magnitude: magnitude)
                    }
                }
                .padding(TapSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .accessibilityIdentifier("round-stats-waterfall")
    }

    @ViewBuilder
    private func componentRow(_ component: StrokesLostComponent, magnitude: Double) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                Text(StatsFormat.title(component))
                    .font(TapFont.ui(size: 14.4, weight: .bold))
                    .foregroundStyle(TapColors.text)
                Spacer(minLength: 0)
                if let value = waterfall[component] {
                    Text(StatsFormat.signedNumber(value))
                        .font(TapFont.ui(size: 14.4, weight: .bold))
                        .foregroundStyle(StatsChartColor.forStrokesLost(value))
                } else {
                    Text(StatsCopy.notRecorded)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                }
            }
            if let value = waterfall[component] {
                StatsSignedBar(value: value, magnitude: magnitude)
            }
            if let delta = deltas?[component], windowCount > 0 {
                Text(RoundStatsCopy.baselineDelta(delta, windowCount: windowCount))
                    .font(TapFont.ui(size: 12.0))
                    .foregroundStyle(TapColors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Sheet wrapper

/// The per-round view as a sheet, for callers that are not inside a navigation
/// stack of their own — the round screen, whose own bar is deliberately empty.
struct RoundStatsScreen: View {
    @Environment(\.dismiss) private var dismiss

    let roundId: String
    var preloaded: RoundStatsModel?

    var body: some View {
        NavigationStack {
            RoundStatsView(roundId: roundId, preloaded: preloaded)
                .toolbarBackground(TapColors.bg, for: .navigationBar)
                .toolbarBackground(.visible, for: .navigationBar)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { dismiss() }
                    }
                }
        }
    }
}

// MARK: - Copy

/// Every sentence the per-round view speaks, lifted out so each is one
/// assertable string — the same discipline as `StatsCopy`.
enum RoundStatsCopy {
    static let loading = "Reading the round…"
    static let noStatsInRound =
        "No statistics of your own in this round. Only the player whose card carried them can see them."
    static let nothingRecordedOnHole = "Nothing was recorded on this hole."
    static let waterfallHint =
        "Strokes lost against a fixed baseline. Positive costs you shots."

    static let legendTee =
        "Dot — where the tee shot finished: green fairway, brass in play, terracotta trouble."
    static let legendGir = "Ring — green in regulation: filled hit, hollow missed."
    static let legendPutts = "Number — putts taken on the hole."
    static let legendPenalty = "Flag — a penalty stroke."
    static let legendAbsence =
        "Anything you did not record is left out: an empty row is a hole nobody answered, not a hole answered no."

    static func subtitle(_ model: RoundStatsModel) -> String {
        var parts = [StatsFormat.day(model.date)]
        let course = (model.courseName ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if !course.isEmpty, course != model.title { parts.append(course) }
        parts.append(model.holeCount == 1 ? "1 hole" : "\(model.holeCount) holes")
        return parts.joined(separator: " · ")
    }

    static func holeTitle(_ cell: RoundStatsHoleCell) -> String {
        var title = "Hole \(cell.holeNumber) · par \(cell.par)"
        if let length = cell.lengthM { title += " · \(length) m" }
        return title
    }

    /// The hole's stat line, in words — RECORDED dimensions only.
    ///
    /// An unrecorded dimension is not a row: "Not recorded" repeated six times
    /// says nothing, and the whole point of the strip is that absence is
    /// visible as absence.
    static func holeLines(_ cell: RoundStatsHoleCell) -> [StatsFigure] {
        var lines: [StatsFigure] = []
        if let score = scoreLine(cell) { lines.append(score) }
        if let tee = cell.tee { lines.append(StatsFigure("Tee shot", title(tee))) }
        if let gir = cell.gir {
            lines.append(StatsFigure("Green in regulation", gir ? "Hit" : "Missed"))
        }
        if let putts = cell.putts {
            lines.append(StatsFigure("Putts", putts == 1 ? "1 putt" : "\(putts) putts"))
        }
        if let firstPutt = cell.firstPutt {
            lines.append(StatsFigure("First putt", title(firstPutt)))
        }
        if let shortGame = cell.shortGame {
            lines.append(StatsFigure("Short game", title(shortGame)))
        }
        if let recoveryOk = cell.recoveryOk {
            lines.append(
                StatsFigure("Recovery", recoveryOk ? "Back in play" : "Still in trouble"))
        }
        if let penalties = cell.penalties {
            lines.append(
                StatsFigure(
                    "Penalties",
                    penalties == 0
                        ? "None" : (penalties == 1 ? "1 stroke" : "\(penalties) strokes")))
        }
        return lines
    }

    /// The leading "Score" line of `holeLines`, or nil for a hole with no score
    /// at all.
    ///
    /// Split out so `cellAccessibility` can ask whether one exists instead of
    /// assuming it does. A stats-only hole — answers recorded, no scorecard
    /// entry — starts its lines with a STAT, and dropping the first line
    /// unconditionally silently ate it for VoiceOver.
    static func scoreLine(_ cell: RoundStatsHoleCell) -> StatsFigure? {
        if let strokes = cell.strokes, let vsPar = cell.vsPar {
            return StatsFigure(
                "Score", "\(strokes) (\(ParDirection(toPar: vsPar).formatted(toPar: vsPar)))")
        }
        if cell.isPickedUp { return StatsFigure("Score", "Picked up") }
        return nil
    }

    static func title(_ tee: PlayerHoleStatsTeeResult) -> String {
        switch tee {
        case .fairway: return "Fairway"
        case .inPlay: return "In play"
        case .trouble: return "Trouble"
        }
    }

    /// The five v2 buckets, plus the three LEGACY ones rounds captured before
    /// the ladder was split. They are worded as the coarse bands they are —
    /// re-labelling `2_to_6m` as one of the new buckets would put a measurement
    /// where none was taken.
    static func title(_ firstPutt: PlayerHoleStatsFirstPutt) -> String {
        switch firstPutt {
        case .inside1m: return "Inside 1 m"
        case .v1To2m: return "1–2 m"
        case .v2To4m: return "2–4 m"
        case .v4To8m: return "4–8 m"
        case .over8m: return "Over 8 m"
        case .inside2m: return "Inside 2 m"
        case .v2To6m: return "2–6 m"
        case .over6m: return "Over 6 m"
        }
    }

    static func title(_ shortGame: PlayerHoleStatsShortGameDifficulty) -> String {
        switch shortGame {
        case .standard: return "Standard chip or pitch"
        case .hard: return "Hard chip or pitch"
        }
    }

    /// "1.2 worse than your last 10" — the personal-baseline line under a
    /// waterfall bar. Positive delta = more strokes lost than usual.
    static func baselineDelta(_ delta: Double, windowCount: Int) -> String {
        let rounds = windowCount == 1 ? "round" : "last \(windowCount) rounds"
        let magnitude = StatsFormat.number(abs(delta))
        if abs(delta) < 0.05 {
            return windowCount == 1
                ? "The same as your previous round." : "The same as your \(rounds)."
        }
        let direction = delta > 0 ? "worse" : "better"
        return windowCount == 1
            ? "\(magnitude) \(direction) than your previous round."
            : "\(magnitude) \(direction) than your \(rounds)."
    }

    /// One cell, read out loud. The glyphs are decorative on their own; this is
    /// the only thing VoiceOver gets, so it says everything the cell draws.
    static func cellAccessibility(_ cell: RoundStatsHoleCell) -> String {
        var parts = ["Hole \(cell.holeNumber), par \(cell.par)"]
        if let strokes = cell.strokes {
            parts.append(cell.marker.map { "\(strokes) strokes, \($0.accessibilityName)" }
                ?? "\(strokes) strokes, par")
        } else if cell.isPickedUp {
            parts.append("picked up")
        } else {
            parts.append("no score")
        }
        // The score is already spoken above, so drop it from the stat lines —
        // but only when `holeLines` actually emitted one.
        let lines = holeLines(cell)
        let stats = scoreLine(cell) == nil ? lines : Array(lines.dropFirst())
        parts.append(contentsOf: stats.map { "\($0.title) \($0.value ?? "")" })
        return parts.joined(separator: ", ")
    }
}
