import SwiftUI

// MARK: - Ranked

/// A ranked board: position, name, total, pace, thru. Every one of those five is
/// read straight off `RankedEntryLayout` — including `lead` and the pace TONE,
/// which are layout decisions, not styling guesses.
///
/// Web: `.lb-section` / `.lb-rank` in `src/round/leaderboard.component.ts` —
/// a serif section title over a hairline-ruled table whose leader row takes the
/// warm `--accent-soft` band with a brass rank numeral.
struct RankedSectionView: View {
    let layout: RankedLayout

    /// Web: `.lb-rank__col-*` — 2.25rem / 3.25rem / 3.25rem / 3rem.
    private let posWidth: CGFloat = 36
    private let totalWidth: CGFloat = 52
    private let paceWidth: CGFloat = 52
    private let thruWidth: CGFloat = 48

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: layout.metricLabel, size: 16)
            VStack(spacing: 0) {
                headerRow
                hairline
                ForEach(Array(layout.entries.enumerated()), id: \.offset) { _, entry in
                    row(entry)
                    hairline
                }
            }
        }
    }

    private var hairline: some View {
        Rectangle().fill(TapColors.border).frame(height: 1)
    }

    /// Web: `.lb-rank thead th` — 0.7rem/700 uppercase, 0.05em, muted.
    private var headerRow: some View {
        HStack(spacing: 0) {
            head("#", width: posWidth, alignment: .center)
            head("Player", width: nil, alignment: .leading)
            head("Total", width: totalWidth, alignment: .trailing)
            if layout.hasPace {
                head("Pace", width: paceWidth, alignment: .trailing)
            }
            head("Thru", width: thruWidth, alignment: .trailing)
        }
        .frame(height: 26)
    }

    private func head(_ text: String, width: CGFloat?, alignment: Alignment) -> some View {
        Text(text.uppercased())
            .font(TapFont.ui(size: 11.2, weight: .bold))
            .tracking(11.2 * 0.05)
            .foregroundStyle(TapColors.textMuted)
            .frame(width: width, alignment: alignment)
            .frame(maxWidth: width == nil ? .infinity : nil, alignment: alignment)
            .padding(.horizontal, TapSpacing.sm)
    }

    private func row(_ entry: RankedEntryLayout) -> some View {
        HStack(spacing: 0) {
            // Web: `.lb-rank__pos` — muted, brass on the leader row.
            Text("\(entry.position)")
                .font(TapFont.ui(size: 15.2, weight: .bold))
                .foregroundStyle(entry.lead ? TapColors.accent : TapColors.textMuted)
                .frame(width: posWidth)
                .padding(.horizontal, TapSpacing.sm)

            // Web: `.lb-rank__who` — Fraunces 600, with the group tag beside it.
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.xs) {
                Text(entry.name)
                    .font(TapFont.display(size: 15.2, weight: .semibold))
                    .foregroundStyle(TapColors.text)
                    .lineLimit(1)
                    .truncationMode(.tail)
                if let group = entry.group {
                    Text(group)
                        .font(TapFont.ui(size: 11.2, weight: .semibold))
                        .foregroundStyle(TapColors.textMuted)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, TapSpacing.sm)

            // Web: `.lb-rank__total` — 800 at 1.05rem, the row's loudest value.
            Text(entry.total)
                .font(TapFont.ui(size: 16.8, weight: .extraBold))
                .foregroundStyle(TapColors.text)
                .frame(width: totalWidth, alignment: .trailing)
                .padding(.horizontal, TapSpacing.sm)

            if layout.hasPace {
                // The column exists for the whole board when ANY entry has a
                // pace, so an entry without one renders an empty slot rather
                // than collapsing and shifting every other row.
                Text(entry.pace?.text ?? "")
                    .font(TapFont.ui(size: 14.4, weight: .bold))
                    .foregroundStyle(tone(entry.pace?.tone))
                    .frame(width: paceWidth, alignment: .trailing)
                    .padding(.horizontal, TapSpacing.sm)
            }

            Text("\(entry.holesPlayed)")
                .font(TapFont.ui(size: 15.2))
                .foregroundStyle(TapColors.textMuted)
                .frame(width: thruWidth, alignment: .trailing)
                .padding(.horizontal, TapSpacing.sm)
        }
        .frame(height: 36)
        // Web: `.lb-rank__lead td { background: var(--accent-soft) }`.
        .background(entry.lead ? TapColors.accentSoft : Color.clear)
        .accessibilityElement(children: .combine)
    }

    /// Web: `.lb-rank__pace--under/--over`, the same two colours the scorecard
    /// uses — routed through `ParDirection` so they cannot drift apart.
    private func tone(_ tone: PaceTone?) -> Color {
        switch tone {
        case .under: ParDirection.under.color
        case .over: ParDirection.over.color
        case .even, nil: ParDirection.level.color
        }
    }
}

// MARK: - Match summary

/// Match panels: two sides, a standing (`AS` / `N UP`) and a status
/// (`Final` / `thru N`). All three strings are already composed by the fold.
///
/// Web: `.lb-mp` — a bordered three-column strip; the leading side's block
/// takes the team fill.
struct MatchSummaryView: View {
    let layout: MatchSummaryLayout

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: layout.title, size: 16)
            ForEach(Array(layout.matches.enumerated()), id: \.offset) { _, match in
                panel(match)
            }
        }
    }

    private func panel(_ match: MatchPanelLayout) -> some View {
        HStack(spacing: 0) {
            side(match.sideAName, tint: .a, leading: match.leader == .a, alignment: .leading)
            VStack(spacing: 1) {
                Text(match.standing)
                    .font(TapFont.ui(size: 20, weight: .extraBold))
                    .foregroundStyle(TapColors.text)
                Text(match.status.uppercased())
                    .font(TapFont.ui(size: 9.9, weight: .semibold))
                    .tracking(9.9 * 0.04)
                    .foregroundStyle(TapColors.textMuted)
            }
            .padding(.vertical, TapSpacing.xs)
            .padding(.horizontal, TapSpacing.md)
            side(match.sideBName, tint: .b, leading: match.leader == .b, alignment: .trailing)
        }
        .frame(maxWidth: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .strokeBorder(TapColors.border, lineWidth: 1)
        )
    }

    private func side(
        _ name: String,
        tint: TeamTint,
        leading: Bool,
        alignment: Alignment
    ) -> some View {
        Text(name)
            .font(TapFont.ui(size: 14.4, weight: .bold))
            .foregroundStyle(leading ? tint.onColor : tint.color)
            .multilineTextAlignment(alignment == .leading ? .leading : .trailing)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: alignment)
            .padding(.vertical, TapSpacing.sm)
            .padding(.horizontal, TapSpacing.md)
            .background(leading ? tint.color : Color.clear)
    }
}

// MARK: - Score grid

/// One scorecard card, rendered as a horizontally scrolling table.
///
/// The column structure is `layout.columnGroups` (front/back, or whatever the
/// route declares) and each row's cells are PARALLEL to it — so the table is
/// built by zipping, never by matching hole numbers. `hasTotalColumn` decides
/// whether the TOT column appears; this view does not second-guess it by
/// counting groups.
///
/// Web: `.lb-card` + `.lb-grid` — a card surface, a hairline grid, sunken
/// subtotal columns, and the row label column on the card's own surface.
struct ScoreGridCardView: View {
    let layout: ScoreGridLayout

    private let labelWidth: CGFloat = 96
    private let cellWidth: CGFloat = 30
    private let totalWidth: CGFloat = 38
    private let rowHeight: CGFloat = 24

    var body: some View {
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                header
                ScrollView(.horizontal, showsIndicators: true) {
                    VStack(alignment: .leading, spacing: 0) {
                        headerRow
                        hairline
                        ForEach(Array(layout.rows.enumerated()), id: \.offset) { _, row in
                            gridRow(row)
                            hairline
                        }
                    }
                }
                if !layout.totals.isEmpty { totals }
                if let caption = layout.caption {
                    Text(caption)
                        .font(TapFont.ui(size: 11.5))
                        .italic()
                        .foregroundStyle(TapColors.textMuted)
                }
                ForEach(Array(layout.footnotes.enumerated()), id: \.offset) { _, note in
                    Text(note)
                        .font(TapFont.ui(size: 11.5))
                        .foregroundStyle(TapColors.textMuted)
                }
            }
            .padding(TapSpacing.md)
        }
    }

    private var hairline: some View {
        Rectangle().fill(TapColors.border).frame(height: 1)
    }

    /// Web: `.lb-card__totals` — a wrapping strip of "label value" facts under
    /// the grid. The strings are the fold's; this only lays them out.
    private var totals: some View {
        HStack(spacing: TapSpacing.lg) {
            ForEach(Array(layout.totals.enumerated()), id: \.offset) { _, total in
                HStack(spacing: TapSpacing.xs) {
                    Text(total.label.uppercased())
                        .font(TapFont.ui(size: 11.2, weight: .bold))
                        .tracking(11.2 * 0.05)
                        .foregroundStyle(TapColors.textMuted)
                    Text(total.value)
                        .font(TapFont.ui(size: 14.4, weight: .extraBold))
                        .foregroundStyle(TapColors.text)
                }
            }
            Spacer(minLength: 0)
        }
    }

    /// Web: `.lb-card__head h4` over `.lb-card__sub`.
    ///
    /// Names within a title group join with `nameJoiner`, groups with `joiner`.
    /// Both separators come from the layout — no literal `" vs. "` here.
    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(
                layout.title.groups
                    .map { $0.joined(separator: layout.title.nameJoiner) }
                    .joined(separator: layout.title.joiner)
            )
            .font(TapFont.display(size: 16, weight: .semibold))
            .foregroundStyle(TapColors.text)

            if !layout.subtitleFacts.isEmpty {
                Text(layout.subtitleFacts.joined(separator: " · "))
                    .font(TapFont.ui(size: 12))
                    .foregroundStyle(TapColors.textMuted)
            }
        }
    }

    /// Web: `<th class="lb-rowlabel">Hole</th>` + the group's hole numbers + the
    /// group label in the sunken subtotal column.
    private var headerRow: some View {
        HStack(spacing: 0) {
            Text("Hole")
                .font(TapFont.ui(size: 11.2, weight: .bold))
                .foregroundStyle(TapColors.textMuted)
                .frame(width: labelWidth, alignment: .leading)
            ForEach(Array(layout.columnGroups.enumerated()), id: \.offset) { _, group in
                ForEach(Array(group.columns.enumerated()), id: \.offset) { _, column in
                    Text(column.label)
                        .font(TapFont.ui(size: 11.2, weight: .bold))
                        .foregroundStyle(TapColors.textMuted)
                        .frame(width: cellWidth, height: rowHeight)
                }
                subtotalCell(group.label, bold: true)
            }
            if layout.hasTotalColumn {
                subtotalCell("TOT", bold: true)
            }
        }
        .frame(height: rowHeight)
        .padding(.horizontal, 2)
    }

    /// Web: `.lb-sum` — bold, on the sunken surface.
    private func subtotalCell(_ text: String, bold: Bool) -> some View {
        Text(text)
            .font(TapFont.ui(size: bold ? 11.2 : 12.8, weight: .bold))
            .foregroundStyle(bold ? TapColors.textMuted : TapColors.text)
            .frame(width: totalWidth, height: rowHeight)
            .background(TapColors.surfaceSunken)
    }

    private func gridRow(_ row: GridRowLayout) -> some View {
        HStack(spacing: 0) {
            Text(row.composedLabel)
                .font(TapFont.ui(size: 12.8, weight: .semibold))
                .lineLimit(1)
                .truncationMode(.tail)
                .frame(width: labelWidth, alignment: .leading)
                .foregroundStyle(labelInk(row))

            // Parallel to `columnGroups` by contract — zip, never match.
            ForEach(Array(row.groups.enumerated()), id: \.offset) { _, group in
                ForEach(Array(group.cells.enumerated()), id: \.offset) { _, cell in
                    CellView(cell: cell, dim: isDim(row), compact: isSI(row))
                        .frame(width: cellWidth, height: rowHeight)
                }
                subtotalCell(group.subtotal, bold: false)
            }
            if layout.hasTotalColumn {
                subtotalCell(row.total, bold: false)
            }
        }
        .frame(height: rowHeight)
        .padding(.horizontal, 2)
    }

    /// Web: `.lb-team-a/-b th` tint the label, `.lb-r-dim` mutes the SI and
    /// given-strokes rows.
    private func labelInk(_ row: GridRowLayout) -> Color {
        if let team = row.team { return TeamTint(team).color }
        return isDim(row) ? TapColors.textMuted : TapColors.text
    }

    /// Web: `.lb-r-dim` is added for the `si` and `given` row kinds.
    private func isDim(_ row: GridRowLayout) -> Bool {
        row.kind == "si" || row.kind == "given"
    }

    /// Web: `.lb-c-si` — the stroke-index row's cells alone are set at 0.7rem.
    /// `given` is dimmed but NOT shrunk, so the two cannot share one flag.
    private func isSI(_ row: GridRowLayout) -> Bool {
        row.kind == "si"
    }
}

/// One grid cell, decoration included.
///
/// `CellDecorationLayout` is a closed union and every case is handled:
/// `.plain`, `.pill(team:)` and `.marker(template:tone:label:teamFill:)`.
///
/// The marker's shape and fill come from `ScoreMarkerForm` — the SAME table the
/// score circle tints from — so a birdie is one red disc everywhere in the app.
/// A template with no form is NOT one bucket, because `MARKER_TOKENS` does not
/// treat it as one:
///
/// - `dot` is the bare base shape — "no fill, no border, inherits cell colour".
///   It draws as tone-coloured text with no shape at all (and, when the flag
///   carries no text, as a small filled dot so it is still visible).
/// - `badge` is `width: auto; min-width: 1.8em` with `0.45em` side padding and
///   a 2px `currentColor` border — a labelled outline pill that must grow with
///   its text.
/// - `custom`, or a template this client predates, takes the badge treatment
///   too: the web's "visible as unfinished" outcome (`marker-tokens.ts` rule 4).
struct CellView: View {
    let cell: CellLayout
    var dim: Bool = false
    /// Web: `.lb-c-si { font-size: 0.7rem }` — the stroke-index row is set
    /// smaller than the score rows, on top of the shared `.lb-r-dim` muting.
    var compact: Bool = false

    private let size: CGFloat = 22

    var body: some View {
        content
            .accessibilityLabel(cell.title ?? cell.text)
    }

    @ViewBuilder
    private var content: some View {
        switch cell.decoration {
        case .plain:
            text(TapColors.text)
        case let .pill(team):
            // Web: `.lb-pill` — team-colour background, white text.
            text(TeamTint(team).onColor)
                .frame(minWidth: size, minHeight: 17)
                .background(Capsule().fill(TeamTint(team).color))
        case let .marker(template, tone, label, teamFill):
            marker(template: template, tone: tone, label: label, teamFill: teamFill)
        }
    }

    private func text(_ color: Color) -> some View {
        Text(cell.text)
            .font(TapFont.ui(size: compact ? 11.2 : 12.8, weight: .semibold))
            .foregroundStyle(dim ? TapColors.textMuted : color)
    }

    @ViewBuilder
    private func marker(
        template: String,
        tone: MarkerTone?,
        label: String?,
        teamFill: GridRowTeam?
    ) -> some View {
        let form = ScoreMarkerForm(webTemplate: template)
        let fill = teamFill.map { TeamTint($0).color } ?? form?.fill
        Group {
            if let fill {
                filledMarker(form: form, fill: fill, ringed: teamFill != nil)
            } else if template == "dot" {
                dotMarker(tone: tone)
            } else {
                badgeMarker(tone: tone)
            }
        }
        // The marker's word ("Birdie") is the web's `title` tooltip, not printed
        // ink — a 22pt cell in a 30pt column has no room for it, and drawn small
        // enough to fit it collides with the row above. It is announced instead.
        .accessibilityLabel(label ?? cell.title ?? cell.text)
    }

    /// One of the six par shapes, or any form carrying a team fill.
    private func filledMarker(form: ScoreMarkerForm?, fill: Color, ringed: Bool) -> some View {
        ZStack {
            MarkerShape(
                // Web: `boxy` forms get 3px corners; everything else is the
                // 999px pill.
                boxy: form?.isBoxy == true,
                fill: fill,
                // Web: `.lb-mark-fill--a/b { border: 2px solid #fff }` — the
                // white ring is what keeps a team-filled marker from reading as
                // the plain standing pill.
                ringed: ringed
            )
            .frame(width: size, height: size)

            Text(cell.text)
                .font(TapFont.ui(size: 11.2, weight: .bold))
                .foregroundStyle(Color.white)
        }
        .frame(width: size, height: size)
    }

    /// Web: `MARKER_TOKENS.dot` — "the bare base shape (no fill, no border) —
    /// inherits cell colour". A lightweight per-hole flag, so it must stay
    /// lighter than the badge's outline pill: no shape, just the tone.
    @ViewBuilder
    private func dotMarker(tone: MarkerTone?) -> some View {
        if cell.text.isEmpty {
            // A flag with nothing to print still has to be visible; the base
            // shape at its smallest is a filled dot in the inherited colour.
            Circle()
                .fill(markerColor(tone))
                .frame(width: 6, height: 6)
                .frame(width: size, height: size)
        } else {
            Text(cell.text)
                .font(TapFont.ui(size: 11.2, weight: .bold))
                .foregroundStyle(markerColor(tone))
                .frame(minWidth: size, minHeight: size)
        }
    }

    /// Web: `MARKER_TOKENS.badge` — `width: auto; min-width: 1.8em;` with
    /// `0.45em` of side padding and a 2px `currentColor` border. The width is
    /// AUTO by contract: a badge carries short text ("2UP", "+4") and a fixed
    /// box would clip it. Also the fallback for `custom` and for a template
    /// this client predates.
    private func badgeMarker(tone: MarkerTone?) -> some View {
        // 1.8em / 0.45em against the badge's own 11.2pt text.
        let minWidth = 11.2 * 1.8
        let padding = 11.2 * 0.45
        return Text(cell.text)
            .font(TapFont.ui(size: 11.2, weight: .bold))
            .foregroundStyle(markerColor(tone))
            .lineLimit(1)
            .padding(.horizontal, padding)
            .frame(minWidth: minWidth, minHeight: size)
            .background(
                Capsule().strokeBorder(markerColor(tone), lineWidth: 1.5)
            )
    }

    private func markerColor(_ tone: MarkerTone?) -> Color {
        switch tone {
        case .success: TapColors.success
        case .warning: TapColors.warning
        case .danger: TapColors.danger
        case nil: TapColors.textMuted
        }
    }
}

/// The marker's filled disc or rounded square, with the team-fill ring.
///
/// The branch is on the CONCRETE shape rather than a type-erased one because
/// `strokeBorder` — which is what keeps a 2pt ring inside the marker's 22pt box
/// instead of straddling its edge — needs `InsettableShape`, and `AnyShape`
/// drops it.
private struct MarkerShape: View {
    let boxy: Bool
    let fill: Color
    let ringed: Bool

    var body: some View {
        if boxy {
            faces(RoundedRectangle(cornerRadius: 3, style: .continuous))
        } else {
            faces(Circle())
        }
    }

    private func faces<S: InsettableShape>(_ shape: S) -> some View {
        ZStack {
            shape.fill(fill)
            if ringed { shape.strokeBorder(Color.white, lineWidth: 2) }
        }
    }
}

extension ScoreMarkerForm {
    /// The wire template string → this table's form.
    ///
    /// The spellings are `MARKER_TOKENS`' keys in `src/round/marker-tokens.ts`
    /// (snake_case, straight off the server vocabulary). `dot`, `badge` and
    /// `custom` deliberately map to nil: they are the web's bare/outline forms,
    /// not one of the six par shapes. `CellView` tells those three apart —
    /// nil here means "not a par shape", never "draw the same fallback".
    init?(webTemplate: String) {
        switch webTemplate {
        case "ring": self = .ring
        case "double_ring": self = .doubleRing
        case "diamond": self = .diamond
        case "square": self = .square
        case "double_square": self = .doubleSquare
        case "box_badge": self = .boxBadge
        default: return nil
        }
    }
}
