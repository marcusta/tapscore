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
    /// Parallel to `layout.entries` — the card that hangs under each row, or
    /// `nil` for an INERT row (no chevron, no tap target). Empty means no row on
    /// this board is expandable, which is what every non-classified board gets.
    var attachedCards: [ScoreGridLayout?]
    /// The slot this board belongs to. Expansion keys are SLOT-SCOPED (see
    /// `ScorecardExpansion.key`), so the board cannot build a key without it.
    var slotDefId: String
    @Binding var expansion: ScorecardExpansion

    /// Honour Settings → Motion. `withAnimation(nil)` runs the mutation with no
    /// animation at all, which is what "reduce motion" asks for — the row still
    /// opens, it just does not slide.
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(
        layout: RankedLayout,
        attachedCards: [ScoreGridLayout?] = [],
        slotDefId: String = "",
        expansion: Binding<ScorecardExpansion> = .constant(ScorecardExpansion())
    ) {
        self.layout = layout
        self.attachedCards = attachedCards
        self.slotDefId = slotDefId
        self._expansion = expansion
    }

    /// Web: `.lb-rank__col-*` — 2.25rem / 3.25rem / 3.25rem / 3rem.
    private let posWidth: CGFloat = 36
    private let totalWidth: CGFloat = 52
    private let paceWidth: CGFloat = 52
    private let thruWidth: CGFloat = 48
    /// The disclosure affordance's column. Reserved for the WHOLE board as soon
    /// as one row is expandable — the same idiom as `hasPace` — so an inert row
    /// beside an expandable one keeps its columns aligned instead of shifting
    /// every value 20pt sideways.
    private let chevronWidth: CGFloat = 20

    /// The card for a row, or nil when the row is inert.
    private func attachedCard(_ index: Int) -> ScoreGridLayout? {
        index < attachedCards.count ? attachedCards[index] : nil
    }

    private var hasExpandable: Bool { attachedCards.contains { $0 != nil } }

    var body: some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: layout.metricLabel, size: 16)
            VStack(spacing: 0) {
                headerRow
                hairline
                ForEach(Array(layout.entries.enumerated()), id: \.offset) { index, entry in
                    if let card = attachedCard(index) {
                        expandableRow(entry, card: card)
                    } else {
                        row(entry)
                    }
                    hairline
                }
            }
        }
    }

    // MARK: - expansion

    /// A row whose scorecard folds out beneath it. The row itself is the
    /// button — the whole row, not the chevron alone — and the card is a
    /// sibling below it inside the same block, so the hairline still closes the
    /// row group whether the card is open or shut.
    @ViewBuilder
    private func expandableRow(_ entry: RankedEntryLayout, card: ScoreGridLayout) -> some View {
        let open = expansion.isOpen(slotDefId, card.subjectBallIds)
        Button {
            withAnimation(reduceMotion ? nil : RankedSectionView.disclosure) {
                expansion.toggle(slotDefId, card.subjectBallIds)
            }
        } label: {
            // The row keeps its 36pt visual rhythm but must be a 44pt target.
            // The trick: pad the label out to 44pt, declare the HIT SHAPE on the
            // padded view, then take the 8pt back with a negative pad. Layout
            // sees 36pt (rows still butt against their hairlines); the tappable
            // rectangle is the 44pt one, and neighbouring rows overlap into each
            // other's slack rather than growing the board.
            row(entry, chevron: open, combineAccessibility: false)
                .padding(.vertical, 4)
                .contentShape(Rectangle())
                .padding(.vertical, -4)
        }
        .buttonStyle(RankedRowButtonStyle())
        // Exactly ONE `.combine` on this path — the Button's. `row(…)` skips its
        // own above; two nested combines make VoiceOver announce the row twice.
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isButton)
        // No `expanded` trait exists on iOS, so the state is announced as the
        // element's VALUE — which VoiceOver reads after the row's content and
        // re-reads on every toggle.
        .accessibilityValue(open ? "Expanded" : "Collapsed")
        .accessibilityHint(open ? "Hides the scorecard" : "Shows the scorecard")

        if open {
            // Web: `.lb-rank__panelbox .lb-card` — an inline card drops its own
            // chrome, because the row above already names the player and a
            // bordered card inside the board reads as a box in a box.
            ScoreGridCardView(layout: card, variant: .inline)
                .padding(.top, TapSpacing.xs)
                .padding(.bottom, TapSpacing.sm)
                .transition(.opacity)
        }
    }

    /// Web: `.lb-rank__chev { transition: transform 200ms ease }` in
    /// `src/round/leaderboard.component.ts` — the board's own disclosure timing,
    /// not a second one invented here.
    static let disclosure: Animation = .easeInOut(duration: 0.2)

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
            if hasExpandable {
                Color.clear.frame(width: chevronWidth, height: 1)
            }
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

    /// - Parameter chevron: `nil` on an inert row — the affordance appears ONLY
    ///   where a tap does something; the reserved column stays blank otherwise.
    /// - Parameter combineAccessibility: `false` when the caller already wraps
    ///   this row in an accessibility element of its own (the expandable path).
    private func row(
        _ entry: RankedEntryLayout,
        chevron: Bool? = nil,
        combineAccessibility: Bool = true
    ) -> some View {
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

            if hasExpandable {
                // A quiet chevron, muted like the "thru" column: the row is a
                // leaderboard line first and a control second.
                Image(systemName: "chevron.down")
                    .font(TapFont.ui(size: 10, weight: .bold))
                    .foregroundStyle(TapColors.textMuted)
                    .rotationEffect(.degrees(chevron == true ? 0 : -90))
                    .opacity(chevron == nil ? 0 : 1)
                    .frame(width: chevronWidth)
                    .accessibilityHidden(true)
            }
        }
        .frame(height: 36)
        // Web: `.lb-rank__lead td { background: var(--accent-soft) }`.
        .background(entry.lead ? TapColors.accentSoft : Color.clear)
        .contentShape(Rectangle())
        .modifier(CombineChildren(active: combineAccessibility))
    }

    /// Applies `.accessibilityElement(children: .combine)` only when asked. A
    /// modifier rather than an `if` in the view body so the row's type — and
    /// therefore its identity across a toggle — does not change with the flag.
    private struct CombineChildren: ViewModifier {
        let active: Bool

        func body(content: Content) -> some View {
            if active {
                content.accessibilityElement(children: .combine)
            } else {
                content
            }
        }
    }

    /// The board row's press feedback. `.plain` gives none at all, which on a
    /// full-width row reads as a dead tap.
    ///
    /// It is an OVERLAY, not a background: the row paints its own background
    /// (`--accent-soft` on the leader), and a style-level background would sit
    /// behind that and never be seen on the one row most likely to be tapped.
    private struct RankedRowButtonStyle: ButtonStyle {
        func makeBody(configuration: Configuration) -> some View {
            configuration.label
                .overlay(
                    (configuration.isPressed ? TapColors.text.opacity(0.07) : Color.clear)
                        .allowsHitTesting(false)
                )
        }
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

/// One row of one stacked table block: the row's cells for that column group
/// plus that group's subtotal.
struct ScoreGridBlockRow: Equatable, Sendable {
    /// Contract row kind (`par` / `si` / `gross` / …) — a styling hint only.
    var kind: String
    /// The fold's canonical label composition (`GridRowLayout.composedLabel`).
    var label: String
    var emphasis: Bool
    var team: GridRowTeam?
    var cells: [CellLayout]
    var subtotal: String
}

/// One stacked table block — a column group's holes plus its own subtotal
/// column, headed by the group's label ("Out", "In").
struct ScoreGridBlock: Equatable, Sendable {
    var label: String
    var columnLabels: [String]
    var rows: [ScoreGridBlockRow]
}

/// Split a card into ONE BLOCK PER COLUMN GROUP, in layout order (which is the
/// round's play order — the fold froze it from the route sections).
///
/// This is `renderBlock` in `src/round/result-render.ts`, which is the adapter a
/// client-facing renderer follows: an 18-hole card is two stacked 9-hole tables,
/// never one wide table that scrolls sideways, and the fold's whole-card TOT
/// column is deliberately ignored — each block carries its own group subtotal
/// and a TOT has no place in a stacked card. (`ScoreGridLayout.hasTotalColumn`
/// and `GridRowLayout.total` stay in the shared fold for the verification
/// oracle, which lays the groups out side by side in one table.)
///
/// One deliberate divergence: the web indexes `row.groups[i]!`. A row that is
/// short a group is dropped from that block here instead of trapping — a
/// malformed card must not take down the scorecard tab.
func scoreGridBlocks(_ layout: ScoreGridLayout) -> [ScoreGridBlock] {
    layout.columnGroups.enumerated().map { index, group in
        ScoreGridBlock(
            label: group.label,
            columnLabels: group.columns.map(\.label),
            rows: layout.rows.compactMap { row in
                guard index < row.groups.count else { return nil }
                let rowGroup = row.groups[index]
                return ScoreGridBlockRow(
                    kind: row.kind,
                    label: row.composedLabel,
                    emphasis: row.emphasis,
                    team: row.team,
                    cells: rowGroup.cells,
                    subtotal: rowGroup.subtotal
                )
            }
        )
    }
}

/// Everything one scorecard card puts on screen, as DATA — so what the card
/// draws (and, load-bearing here, what it does NOT draw) is one value a test can
/// assert on instead of a claim about a SwiftUI body.
struct ScoreGridCardComposition: Equatable, Sendable {
    /// Empty when the card has no title — a match card renders no header at all.
    var title: String
    /// nil when the card has no subtitle facts.
    var subtitle: String?
    /// One stacked table block per column group, in layout order.
    var blocks: [ScoreGridBlock]
    var totals: [CardTotalLayout]

    /// Every string the card draws OUTSIDE the grid blocks. The product card's
    /// chrome is a title, a subtitle and the totals strip — deliberately not the
    /// fold's `footnotes` or `caption`, which are verification-mode chrome on
    /// the web (`renderScoreGridBase` gates both on `mode === 'verification'`).
    var chromeText: [String] {
        var out: [String] = []
        if !title.isEmpty { out.append(title) }
        if let subtitle { out.append(subtitle) }
        for total in totals { out.append(total.label); out.append(total.value) }
        return out
    }

    init(_ layout: ScoreGridLayout, variant: ScoreGridCardVariant = .standalone) {
        title = variant.showsTitle
            ? ScoreGridCardComposition.composedTitle(layout)
            // Web: `.lb-rank__panelbox .lb-card__head h4 { display: none }` — the
            // ranked row directly above the card already names the player, so the
            // title would be the same string twice, three points apart.
            : ""
        subtitle = layout.subtitleFacts.isEmpty ? nil : layout.subtitleFacts.joined(separator: " · ")
        blocks = scoreGridBlocks(layout)
        totals = layout.totals
    }

    private static func composedTitle(_ layout: ScoreGridLayout) -> String {
        layout.title.groups
            .map { $0.joined(separator: layout.title.nameJoiner) }
            .filter { !$0.isEmpty }
            .joined(separator: layout.title.joiner)
    }
}

/// How a scorecard card is framed.
///
/// Web: the SAME card markup renders twice — as `.lb-card` in the standalone
/// list, and inside `.lb-rank__panelbox`, where CSS strips its border, radius,
/// shadow and title (`.lb-rank__panelbox .lb-card { border: 0; box-shadow: none;
/// background: var(--surface-sunken); border-radius: 0 }`). Swift has no
/// descendant selector, so the same divergence has to be a parameter.
enum ScoreGridCardVariant: Equatable, Sendable {
    /// The card list below the board: full chrome — bordered, rounded, titled.
    case standalone
    /// Folded under a ranked row: no title head, no border, no radius, no
    /// shadow, sunken surface. A bordered card nested inside the board reads as
    /// a box in a box, and its title repeats the row three points above it.
    case inline

    var showsTitle: Bool { self == .standalone }
}

/// One scorecard card: a title, then one table block PER COLUMN GROUP stacked
/// vertically, then the card's totals.
///
/// Two things this view deliberately does NOT draw, both following
/// `renderScoreGridBase` in `src/round/result-render.ts`:
///
/// - **No TOT column and no sideways scroll.** Blocks are stacked (see
///   `scoreGridBlocks`) and every block fits the page width.
/// - **No footnotes and no caption.** The per-hole arithmetic block
///   ("h10: 4 pts (netPar 6 − 4 = +2)") and the explanatory caption are gated on
///   `mode === 'verification'` on the web — page chrome for the verification
///   oracle, not for a live board. The fold carries both fields in every mode on
///   purpose (`ScoreGridLayout.footnotes` / `.caption`); the GATING is
///   adapter-side, and this adapter is the product one.
///
/// Web: `.lb-card` + `.lb-grid` — a card surface, a hairline grid, sunken
/// subtotal columns, and the row label column on the card's own surface.
struct ScoreGridCardView: View {
    let layout: ScoreGridLayout
    /// Full chrome by default; `.inline` is the folded-under-a-row form.
    var variant: ScoreGridCardVariant = .standalone

    /// Web: `.lb-rowlabel { width: 6em }` (76.8px) and `.lb-sum { width: 2.4em }`
    /// (30.7px) at the grid's 0.8rem type. `sumWidth` follows the em math;
    /// `labelWidth` is DELIBERATELY narrower than the web's 6em — 66pt buys the
    /// nine hole columns room above the marker's 26pt halo footprint on a
    /// 402pt device, at the cost of slightly earlier name truncation.
    private let labelWidth: CGFloat = 66
    private let sumWidth: CGFloat = 32
    private let rowHeight: CGFloat = 24

    private var composition: ScoreGridCardComposition {
        ScoreGridCardComposition(layout, variant: variant)
    }

    var body: some View {
        let card = composition
        switch variant {
        case .standalone:
            TapCard { stack(card).padding(TapSpacing.md) }
        case .inline:
            // No TapCard at all: no border, no radius, no shadow — just the
            // sunken surface the web's panel box uses. Padding is tighter than
            // the standalone card's (web: `sm sm md`) because the board's own
            // gutters already indent it.
            stack(card)
                .padding(.horizontal, TapSpacing.sm)
                .padding(.top, TapSpacing.sm)
                .padding(.bottom, TapSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(TapColors.surfaceSunken)
        }
    }

    private func stack(_ card: ScoreGridCardComposition) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            // Skipped entirely rather than rendered empty: an empty header view
            // is still a VStack child, and the stack's spacing would leave a
            // phantom gap above the grid on every titleless (inline, match) card.
            if !card.title.isEmpty || card.subtitle != nil { header(card) }
            // Web: `.lb-card__scroll + .lb-card__scroll { margin-top: sm }`.
            ForEach(Array(card.blocks.enumerated()), id: \.offset) { _, block in
                blockView(block)
            }
            if !card.totals.isEmpty { totals(card.totals) }
        }
    }

    private var hairline: some View {
        Rectangle().fill(TapColors.border).frame(height: 1)
    }

    /// Web: `.lb-card__totals` — a wrapping strip of "label value" facts under
    /// the grid. The strings are the fold's; this only lays them out.
    private func totals(_ facts: [CardTotalLayout]) -> some View {
        HStack(spacing: TapSpacing.lg) {
            ForEach(Array(facts.enumerated()), id: \.offset) { _, total in
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
    private func header(_ card: ScoreGridCardComposition) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            // Web: a match card with no title renders no `<header>` at all —
            // the team-tinted row labels already say who is who.
            if !card.title.isEmpty {
                Text(card.title)
                    .font(TapFont.display(size: 16, weight: .semibold))
                    .foregroundStyle(TapColors.text)
            }
            if let subtitle = card.subtitle {
                Text(subtitle)
                    .font(TapFont.ui(size: 12))
                    .foregroundStyle(TapColors.textMuted)
            }
        }
    }

    // MARK: one stacked block

    /// A block wider than ~9 hole columns cannot fit the page (the marker's
    /// 26pt halo footprint sets the floor), which happens only when the round
    /// declares no route sections and the fold falls back to one group with
    /// every hole. The web keeps `.lb-card__scroll { overflow-x: auto }` for
    /// exactly that degradation — mirror it: scroll the OVERSIZED block, keep
    /// normal blocks fixed so Out/In always fit without scrolling.
    private let maxFixedColumns = 10

    @ViewBuilder
    private func blockView(_ block: ScoreGridBlock) -> some View {
        if block.columnLabels.count > maxFixedColumns {
            ScrollView(.horizontal, showsIndicators: false) {
                blockTable(block).frame(minWidth: labelWidth + sumWidth + CGFloat(block.columnLabels.count) * 28)
            }
        } else {
            blockTable(block)
        }
    }

    private func blockTable(_ block: ScoreGridBlock) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            headerRow(block)
            hairline
            ForEach(Array(block.rows.enumerated()), id: \.offset) { _, row in
                gridRow(row)
                hairline
            }
        }
    }

    /// Web: `<th class="lb-rowlabel">Hole</th>` + the group's hole numbers + the
    /// group label in the sunken subtotal column.
    private func headerRow(_ block: ScoreGridBlock) -> some View {
        HStack(spacing: 0) {
            Text("Hole")
                .font(TapFont.ui(size: 11.2, weight: .bold))
                .foregroundStyle(TapColors.textMuted)
                .frame(width: labelWidth, alignment: .leading)
            ForEach(Array(block.columnLabels.enumerated()), id: \.offset) { _, label in
                Text(label)
                    .font(TapFont.ui(size: 11.2, weight: .bold))
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .frame(maxWidth: .infinity)
                    .frame(height: rowHeight)
            }
            subtotalCell(block.label, bold: true, emphasis: false)
        }
        .frame(height: rowHeight)
    }

    /// Web: `.lb-sum` — bold, on the sunken surface.
    private func subtotalCell(_ text: String, bold: Bool, emphasis: Bool) -> some View {
        Text(text)
            .font(TapFont.ui(size: bold ? 11.2 : 12.8, weight: emphasis ? .extraBold : .bold))
            .foregroundStyle(bold ? TapColors.textMuted : TapColors.text)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            .frame(width: sumWidth, height: rowHeight)
            .background(TapColors.surfaceSunken)
    }

    private func gridRow(_ row: ScoreGridBlockRow) -> some View {
        HStack(spacing: 0) {
            Text(row.label)
                .font(TapFont.ui(size: 12.8, weight: .semibold))
                .lineLimit(1)
                .truncationMode(.tail)
                .frame(width: labelWidth, alignment: .leading)
                .foregroundStyle(ink(row))

            ForEach(Array(row.cells.enumerated()), id: \.offset) { _, cell in
                CellView(cell: cell, ink: ink(row), compact: isSI(row), emphasis: row.emphasis)
                    .frame(maxWidth: .infinity)
                    .frame(height: rowHeight)
            }
            subtotalCell(row.subtotal, bold: false, emphasis: row.emphasis)
        }
        .frame(height: rowHeight)
    }

    /// The cell ink a marker/plain value INHERITS. Web: `.lb-team-a/-b` colour
    /// the whole row (and its cells), `.lb-r-dim` mutes the SI and given rows.
    private func ink(_ row: ScoreGridBlockRow) -> Color {
        if let team = row.team { return TeamTint(team).color }
        return isDim(row) ? TapColors.textMuted : TapColors.text
    }

    /// Web: `.lb-r-dim` is added for the `si` and `given` row kinds.
    private func isDim(_ row: ScoreGridBlockRow) -> Bool {
        row.kind == "si" || row.kind == "given"
    }

    /// Web: `.lb-c-si` — the stroke-index row's cells alone are set at 0.7rem.
    /// `given` is dimmed but NOT shrunk, so the two cannot share one flag.
    private func isSI(_ row: ScoreGridBlockRow) -> Bool {
        row.kind == "si"
    }
}

/// One grid cell, decoration included.
///
/// `CellDecorationLayout` is a closed union and every case is handled:
/// `.plain`, `.pill(team:)` and `.marker(template:tone:label:teamFill:)`.
///
/// A marker's appearance is NOT decided here — `MarkerVisual.resolve` runs the
/// web's `.lb-mark` cascade and this view draws the result, so "what a
/// double_ring looks like when the deciding ball carries it" is one testable
/// value rather than a branch buried in a body.
struct CellView: View {
    let cell: CellLayout
    /// The colour the cell inherits from its row — what `currentColor` resolves
    /// to for a bare or outline marker.
    var ink: Color = TapColors.text
    /// Web: `.lb-c-si { font-size: 0.7rem }` — the stroke-index row is set
    /// smaller than the score rows.
    var compact: Bool = false
    /// Web: `renderScoreGridBase` wraps an emphasised row's values in `<strong>`.
    var emphasis: Bool = false

    /// Web: `.lb-mark { width: 1.7em; height: 1.7em }` at the grid's 0.8rem.
    private let markerSize: CGFloat = 21
    private let markerFontSize: CGFloat = 11.2

    var body: some View {
        content
            .accessibilityLabel(accessibilityText)
    }

    private var accessibilityText: String {
        if case let .marker(_, _, label, _) = cell.decoration, let label { return label }
        return cell.title ?? cell.text
    }

    @ViewBuilder
    private var content: some View {
        switch cell.decoration {
        case .plain:
            text(ink)
        case let .pill(team):
            // Web: `.lb-pill` — team-colour background, white text.
            text(TeamTint(team).onColor)
                .padding(.horizontal, markerFontSize * 0.45)
                .frame(minWidth: markerSize * 0.8, minHeight: 17)
                .background(Capsule().fill(TeamTint(team).color))
        case let .marker(template, tone, _, teamFill):
            MarkerBox(
                visual: MarkerVisual.resolve(template: template, tone: tone, teamFill: teamFill),
                text: cell.text,
                inheritedInk: ink,
                size: markerSize,
                fontSize: markerFontSize
            )
        }
    }

    private func text(_ color: Color) -> some View {
        Text(cell.text)
            .font(TapFont.ui(size: compact ? 11.2 : 12.8, weight: emphasis ? .extraBold : .semibold))
            .foregroundStyle(color)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
    }
}

/// Draws a resolved `MarkerVisual`: the halo outside the box, the fill, the
/// concentric rings inside it, and the value on top.
///
/// The shape branch is on the CONCRETE type rather than a type-erased one
/// because `strokeBorder` — which is what keeps a ring INSIDE the marker's box
/// (the web's `box-sizing: border-box`) instead of straddling its edge — needs
/// `InsettableShape`, and `AnyShape` drops it.
struct MarkerBox: View {
    let visual: MarkerVisual
    let text: String
    let inheritedInk: Color
    var size: CGFloat = 21
    var fontSize: CGFloat = 11.2

    var body: some View {
        if visual.shape == .boxy {
            // Web: the shared `border-radius: 3px` rule for the boxy forms.
            faces(RoundedRectangle(cornerRadius: 3, style: .continuous))
        } else {
            // Web: the base `.lb-mark { border-radius: 999px }`.
            faces(Capsule(style: .continuous))
        }
    }

    private var ink: Color { visual.inkHex.map { Color(webHex: $0) } ?? inheritedInk }

    @ViewBuilder
    private func faces<S: InsettableShape>(_ shape: S) -> some View {
        if visual.isBare && text.isEmpty {
            // A bare flag with nothing to print still has to be visible; the
            // base shape at its smallest is a filled dot in the inherited ink.
            Circle()
                .fill(inheritedInk)
                .frame(width: 6, height: 6)
                .frame(width: size, height: size)
        } else {
            label
                .frame(width: visual.autoWidth ? nil : size, height: size)
                .frame(minWidth: visual.autoWidth ? fontSize * 1.8 : nil)
                .background(backdrop(shape))
        }
    }

    private var label: some View {
        Text(text)
            .font(TapFont.ui(size: fontSize, weight: .bold))
            .foregroundStyle(ink)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            // Web: `padding-left/right: 0.45em` on the auto-width badge only.
            .padding(.horizontal, visual.autoWidth ? fontSize * 0.45 : 0)
    }

    @ViewBuilder
    private func backdrop<S: InsettableShape>(_ shape: S) -> some View {
        ZStack {
            // Web: `box-shadow: 0 0 0 2.5px <team>` — drawn OUTSIDE the box, so
            // the marker reads as fill / white gap-ring / team ring.
            if let haloHex = visual.haloHex {
                shape.fill(Color(webHex: haloHex)).padding(-visual.haloWidth)
            }
            if let fillHex = visual.fillHex {
                shape.fill(Color(webHex: fillHex))
            }
            ForEach(Array(visual.rings.enumerated()), id: \.offset) { _, ring in
                shape
                    .strokeBorder(ring.hex.map { Color(webHex: $0) } ?? inheritedInk, lineWidth: ring.width)
                    .padding(ring.inset)
            }
        }
    }
}
