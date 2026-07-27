import SwiftUI

// MARK: - Ranked

/// A ranked board: position, name, total, pace, thru. Every one of those five is
/// read straight off `RankedEntryLayout` — including `lead` and the pace TONE,
/// which are layout decisions, not styling guesses.
struct RankedSectionView: View {
    let layout: RankedLayout

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(layout.metricLabel).font(.headline)
            VStack(spacing: 0) {
                ForEach(Array(layout.entries.enumerated()), id: \.offset) { index, entry in
                    row(entry)
                    if index < layout.entries.count - 1 { Divider() }
                }
            }
            .background(.quaternary.opacity(0.35), in: RoundedRectangle(cornerRadius: 14))
        }
    }

    private func row(_ entry: RankedEntryLayout) -> some View {
        HStack(spacing: 10) {
            Text("\(entry.position)")
                .font(.subheadline.monospacedDigit().weight(entry.lead ? .bold : .regular))
                .frame(width: 26, alignment: .trailing)
                .foregroundStyle(entry.lead ? Color.primary : .secondary)

            VStack(alignment: .leading, spacing: 1) {
                Text(entry.name).font(.body.weight(entry.lead ? .semibold : .regular))
                if let group = entry.group {
                    Text(group).font(.caption2).foregroundStyle(.secondary)
                }
            }

            Spacer()

            if layout.hasPace {
                // The column exists for the whole board when ANY entry has a
                // pace, so an entry without one renders an empty slot rather
                // than collapsing and shifting every other row.
                Text(entry.pace?.text ?? "")
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(tone(entry.pace?.tone))
                    .frame(width: 44, alignment: .trailing)
            }

            Text(entry.total)
                .font(.body.monospacedDigit().weight(.semibold))
                .frame(width: 46, alignment: .trailing)

            Text("thru \(entry.holesPlayed)")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(width: 52, alignment: .trailing)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
    }

    private func tone(_ tone: PaceTone?) -> Color {
        switch tone {
        case .under: .green
        case .over: .red
        case .even, nil: .secondary
        }
    }
}

// MARK: - Match summary

/// Match panels: two sides, a standing (`AS` / `N UP`) and a status
/// (`Final` / `thru N`). All three strings are already composed by the fold.
struct MatchSummaryView: View {
    let layout: MatchSummaryLayout

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(layout.title).font(.headline)
            ForEach(Array(layout.matches.enumerated()), id: \.offset) { _, match in
                panel(match)
            }
        }
    }

    private func panel(_ match: MatchPanelLayout) -> some View {
        VStack(spacing: 8) {
            HStack {
                side(match.sideAName, leading: match.leader == .a)
                Text(match.standing)
                    .font(.subheadline.weight(.bold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(.quaternary, in: Capsule())
                side(match.sideBName, leading: match.leader == .b)
            }
            Text(match.status).font(.caption).foregroundStyle(.secondary)
        }
        .padding(12)
        .background(.quaternary.opacity(0.35), in: RoundedRectangle(cornerRadius: 14))
    }

    private func side(_ name: String, leading: Bool) -> some View {
        Text(name)
            .font(.subheadline.weight(leading ? .semibold : .regular))
            .foregroundStyle(leading ? Color.primary : .secondary)
            .frame(maxWidth: .infinity)
            .multilineTextAlignment(.center)
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
struct ScoreGridCardView: View {
    let layout: ScoreGridLayout

    private let labelWidth: CGFloat = 116
    private let cellWidth: CGFloat = 34
    private let totalWidth: CGFloat = 40

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            title
            if !layout.subtitleFacts.isEmpty {
                Text(layout.subtitleFacts.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            ScrollView(.horizontal, showsIndicators: true) {
                VStack(alignment: .leading, spacing: 0) {
                    headerRow
                    ForEach(Array(layout.rows.enumerated()), id: \.offset) { index, row in
                        gridRow(row)
                        if index < layout.rows.count - 1 { Divider() }
                    }
                }
                .background(.quaternary.opacity(0.35), in: RoundedRectangle(cornerRadius: 12))
            }
            if !layout.totals.isEmpty {
                HStack(spacing: 14) {
                    ForEach(Array(layout.totals.enumerated()), id: \.offset) { _, total in
                        HStack(spacing: 4) {
                            Text(total.label).font(.caption).foregroundStyle(.secondary)
                            Text(total.value).font(.subheadline.weight(.semibold))
                        }
                    }
                }
            }
            if let caption = layout.caption {
                Text(caption).font(.caption2).foregroundStyle(.secondary)
            }
            ForEach(Array(layout.footnotes.enumerated()), id: \.offset) { _, note in
                Text(note).font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    /// Names within a title group join with `nameJoiner`, groups with `joiner`.
    /// Both separators come from the layout — no literal `" vs. "` here.
    private var title: some View {
        Text(
            layout.title.groups
                .map { $0.joined(separator: layout.title.nameJoiner) }
                .joined(separator: layout.title.joiner)
        )
        .font(.headline)
    }

    private var headerRow: some View {
        HStack(spacing: 0) {
            Text("").frame(width: labelWidth, alignment: .leading)
            ForEach(Array(layout.columnGroups.enumerated()), id: \.offset) { _, group in
                ForEach(Array(group.columns.enumerated()), id: \.offset) { _, column in
                    Text(column.label)
                        .font(.caption2.monospacedDigit())
                        .frame(width: cellWidth)
                }
                Text(group.label)
                    .font(.caption2.weight(.semibold))
                    .frame(width: totalWidth)
            }
            if layout.hasTotalColumn {
                Text("TOT").font(.caption2.weight(.semibold)).frame(width: totalWidth)
            }
        }
        .foregroundStyle(.secondary)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
    }

    private func gridRow(_ row: GridRowLayout) -> some View {
        HStack(spacing: 0) {
            Text(row.composedLabel)
                .font(.caption.weight(row.emphasis ? .semibold : .regular))
                .lineLimit(1)
                .truncationMode(.tail)
                .frame(width: labelWidth, alignment: .leading)
                .foregroundStyle(teamTint(row.team) ?? .primary)

            // Parallel to `columnGroups` by contract — zip, never match.
            ForEach(Array(row.groups.enumerated()), id: \.offset) { _, group in
                ForEach(Array(group.cells.enumerated()), id: \.offset) { _, cell in
                    CellView(cell: cell).frame(width: cellWidth)
                }
                Text(group.subtotal)
                    .font(.caption.monospacedDigit().weight(.semibold))
                    .frame(width: totalWidth)
            }
            if layout.hasTotalColumn {
                Text(row.total)
                    .font(.caption.monospacedDigit().weight(.semibold))
                    .frame(width: totalWidth)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(row.emphasis ? Color.primary.opacity(0.04) : .clear)
    }

    private func teamTint(_ team: GridRowTeam?) -> Color? {
        switch team {
        case .a: .blue
        case .b: .purple
        case nil: nil
        }
    }
}

/// One grid cell, decoration included.
///
/// `CellDecorationLayout` is a closed union and every case is handled:
/// `.plain`, `.pill(team:)` and `.marker(template:tone:label:teamFill:)`. A
/// marker is drawn as a simple shape keyed on its template plus the tone the
/// layout supplies — data fidelity, not an SVG replica. The template is never
/// interpreted beyond choosing a shape; its meaning belongs to the format.
struct CellView: View {
    let cell: CellLayout

    var body: some View {
        Text(cell.text)
            .font(.caption.monospacedDigit())
            .frame(width: 26, height: 26)
            .background(background)
            .overlay(marker)
            .accessibilityLabel(cell.title ?? cell.text)
    }

    @ViewBuilder
    private var background: some View {
        switch cell.decoration {
        case .pill(let team):
            Capsule().fill(teamColor(team).opacity(0.22))
        case .marker(_, _, _, let teamFill):
            if let teamFill {
                Circle().fill(teamColor(teamFill).opacity(0.22))
            } else {
                Color.clear
            }
        case .plain:
            Color.clear
        }
    }

    @ViewBuilder
    private var marker: some View {
        if case .marker(let template, let tone, let label, _) = cell.decoration {
            ZStack {
                shape(template).stroke(markerColor(tone), lineWidth: 1.2)
                if let label, !label.isEmpty {
                    Text(label)
                        .font(.system(size: 7, weight: .bold))
                        .foregroundStyle(markerColor(tone))
                        .offset(x: 11, y: -10)
                }
            }
        }
    }

    /// Circles for under-par family, squares for over-par family, per the web's
    /// idiom. An unknown template falls through to a circle rather than
    /// vanishing — a decoration the layout asked for must be visible.
    private func shape(_ template: String) -> AnyShape {
        switch template {
        case "square", "double_square": AnyShape(Rectangle())
        default: AnyShape(Circle())
        }
    }

    private func markerColor(_ tone: MarkerTone?) -> Color {
        switch tone {
        case .success: .green
        case .warning: .orange
        case .danger: .red
        case nil: .secondary
        }
    }

    private func teamColor(_ team: GridRowTeam) -> Color {
        switch team {
        case .a: .blue
        case .b: .purple
        }
    }
}
