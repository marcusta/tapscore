import SwiftUI

/// A collapsed field that opens a list — the one native shape for "choose one
/// of many".
///
/// Source: the web create screen's overlay dropdowns (`src/create/` course
/// select, start-hole select, tee selects). All of them are a field-styled
/// trigger showing the ANSWER, and a raised list showing the options. That is
/// the contract this primitive carries, and the design rule behind it is
/// standing (`ios/AGENTS.md`, "Chips vs dropdowns"):
///
/// - chips/segments only for **≤ 3–4 short, always-visible** options — the
///   route preset, the holes toggle, the format cards;
/// - a **collapsed dropdown** for everything longer — courses, start hole, tee
///   defaults, per-player tee overrides.
///
/// Eighteen start-hole chips in three wrapped rows is not a picker, it is a
/// wall; and a warning glued into a chip's label as an emoji is not a warning,
/// it is a glyph nobody can read out loud. So a row that needs qualifying
/// carries an **annotation** — words, in a token colour — and never an emoji.
///
/// The primitive is deliberately dumb: it draws groups and rows the caller
/// computed, reports the value that was tapped, and closes. The filtering, the
/// ordering and the meaning of a selection all stay in the caller's model,
/// which is what keeps `CreateStore` untouched by presentation.
struct TapDropdown<Value: Hashable>: View {
    /// The muted caption drawn inside the field, left of the value. `nil` when
    /// the field sits under a `SectionHeader` that already names it.
    var label: String?
    /// Shown in muted text when nothing is selected yet.
    var placeholder: String
    /// The sheet's navigation title.
    var title: String
    /// The currently selected value, or `nil`.
    var selection: Value?
    /// The rows, grouped. A single group with a `nil` header is the ungrouped
    /// case and draws no header.
    var groups: [TapDropdownGroup<Value>]
    /// What the COLLAPSED field draws, when that is not simply the selected
    /// row of `groups`. The course picker needs it: `groups` there is the
    /// SEARCH-FILTERED list, and a query that excludes the already-chosen
    /// course must not make the closed field read "Choose course".
    var selectedRow: TapDropdownRow<Value>?
    /// Search configuration; `nil` (the default) means no search field.
    var search: TapDropdownSearch?
    /// An optional extra row at the foot of the list — "Follow the default"
    /// and friends. It closes the sheet like any other choice.
    var extra: TapDropdownAction?
    /// Drawn instead of the list while the caller is still loading.
    var isLoading: Bool = false
    /// Fired as the sheet OPENS, before it draws. A caller whose `search` text
    /// outlives the sheet uses it to start clean: a query left over from a
    /// previous visit would reopen the list onto "No courses match …" — a
    /// filter this visit never applied.
    var onOpen: (() -> Void)?
    /// Tapping a row hands the value back and dismisses in the same act. A
    /// single-choice picker that needs confirming spends two taps on one
    /// question.
    var onSelect: (Value) -> Void

    @State private var isOpen = false

    var body: some View {
        Button {
            onOpen?()
            isOpen = true
        } label: { field }
            .buttonStyle(.plain)
            .accessibilityLabel(label ?? title)
            // The whole answer, not just its first line: the marker and the
            // annotation are the parts a sighted user reads as a qualification
            // ("Default", "No women's rating"), and words were chosen over an
            // emoji precisely so they could be SPOKEN. Dropping them here would
            // put the warning back out of reach of the person it was written
            // for.
            .accessibilityValue(
                TapDropdownModel.accessibilityValue(for: shownRow, placeholder: placeholder))
            .accessibilityHint("Opens the \(title.lowercased()) list")
            .sheet(isPresented: $isOpen) {
                TapDropdownSheet(
                    title: title,
                    selection: selection,
                    groups: groups,
                    search: search,
                    extra: extra,
                    isLoading: isLoading,
                    onSelect: onSelect)
            }
    }

    // MARK: - The collapsed half

    private var shownRow: TapDropdownRow<Value>? {
        selectedRow ?? TapDropdownModel.row(for: selection, in: groups)
    }

    private var field: some View {
        HStack(spacing: TapSpacing.md) {
            if let label {
                Text(label)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.textMuted)
                    .lineLimit(1)
                    .layoutPriority(1)
                Spacer(minLength: TapSpacing.sm)
                value(alignment: .trailing)
            } else {
                value(alignment: .leading)
                Spacer(minLength: 0)
            }
            Image(systemName: "chevron.down")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(TapColors.textMuted)
        }
        .tapField()
    }

    private func value(alignment: HorizontalAlignment) -> some View {
        VStack(alignment: alignment, spacing: 1) {
            Text(verbatim: shownRow?.title ?? placeholder)
                .font(TapFont.ui(size: 13.6))
                .foregroundStyle(shownRow == nil ? TapColors.textMuted : TapColors.text)
                .multilineTextAlignment(alignment == .leading ? .leading : .trailing)
            if let subtitle = shownRow?.subtitle {
                Text(verbatim: subtitle)
                    .font(TapFont.ui(size: 12, weight: .bold))
                    .tracking(0.4)
                    .foregroundStyle(TapColors.textMuted)
            }
            // A marker is NOT an eyebrow. "Default" says how this answer was
            // arrived at, not what category it belongs to, and setting it in
            // the subtitle's tracked bold gave a footnote the weight of a
            // heading — louder than the tee name it qualifies.
            if let marker = shownRow?.marker {
                Text(verbatim: marker)
                    .font(TapFont.ui(size: 12))
                    .foregroundStyle(TapColors.textMuted)
            }
            // The annotation follows the answer OUT of the sheet: a tee with no
            // rating for this gender must keep saying so once the list is shut,
            // or the collapsed field reads like an ordinary choice.
            if let annotation = shownRow?.annotation {
                Text(verbatim: annotation.text)
                    .font(TapFont.ui(size: 12))
                    .foregroundStyle(annotation.tone.colour)
                    .multilineTextAlignment(alignment == .leading ? .leading : .trailing)
            }
        }
    }
}

// MARK: - The model the caller hands over

/// How a row's annotation reads. `danger` for something that will refuse at
/// submit, `muted` for a consequence the user should know about.
enum TapDropdownTone: Sendable, Equatable {
    case muted
    case danger

    var colour: Color {
        switch self {
        case .muted: TapColors.textMuted
        case .danger: TapColors.danger
        }
    }
}

/// A row-level qualifier — "Orange — no men's rating", "won't count for
/// handicap". WORDS, never an emoji: an emoji has no accessible name, no
/// tone token and no room to say which gender it meant.
struct TapDropdownAnnotation: Sendable, Equatable {
    var text: String
    var tone: TapDropdownTone = .muted

    init(_ text: String, tone: TapDropdownTone = .muted) {
        self.text = text
        self.tone = tone
    }
}

struct TapDropdownRow<Value: Hashable>: Identifiable {
    var value: Value
    var title: String
    /// A second line under the title — the club a course belongs to, say. Drawn
    /// as an EYEBROW in the collapsed field (small, bold, tracked): a category
    /// the answer sits inside.
    var subtitle: String?
    /// A quiet note about the answer itself — "Default", i.e. this row was not
    /// chosen, it was inherited. Muted and untracked, deliberately lighter than
    /// `subtitle`: it qualifies the title rather than classifying it.
    var marker: String?
    var annotation: TapDropdownAnnotation?

    var id: Value { value }

    init(
        value: Value,
        title: String,
        subtitle: String? = nil,
        marker: String? = nil,
        annotation: TapDropdownAnnotation? = nil
    ) {
        self.value = value
        self.title = title
        self.subtitle = subtitle
        self.marker = marker
        self.annotation = annotation
    }
}

/// A run of rows under one non-selectable header. `header == nil` is the
/// ungrouped list.
struct TapDropdownGroup<Value: Hashable>: Identifiable {
    var id: String
    var header: String?
    var rows: [TapDropdownRow<Value>]

    init(id: String? = nil, header: String? = nil, rows: [TapDropdownRow<Value>]) {
        self.id = id ?? header ?? "__ungrouped"
        self.header = header
        self.rows = rows
    }
}

/// The search field's wiring. The TEXT is the caller's, because the caller is
/// also the one filtering `groups` by it — the primitive never guesses what
/// "matches" means (diacritics, club names, collation all live in the model).
struct TapDropdownSearch {
    var prompt: String
    var text: Binding<String>
    /// Prefix of the empty state, completed with the query: "No courses match
    /// “linkoping”."
    var emptyPrefix: String

    init(prompt: String, text: Binding<String>, emptyPrefix: String) {
        self.prompt = prompt
        self.text = text
        self.emptyPrefix = emptyPrefix
    }
}

struct TapDropdownAction {
    var title: String
    var action: () -> Void

    init(title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }
}

// MARK: - Pure glue (the part that has tests)

/// Everything the dropdown decides that is not drawing. Pure, so the rules
/// — which row is selected, what the collapsed field says, when the list is
/// empty-handed — are testable without a view.
enum TapDropdownModel {
    static func rows<Value>(in groups: [TapDropdownGroup<Value>]) -> [TapDropdownRow<Value>] {
        groups.flatMap(\.rows)
    }

    static func row<Value>(
        for value: Value?,
        in groups: [TapDropdownGroup<Value>]
    ) -> TapDropdownRow<Value>? {
        guard let value else { return nil }
        return rows(in: groups).first { $0.value == value }
    }

    /// What the collapsed field says: the selected row's title, or the
    /// placeholder. A selection that is not in `groups` (a stale id after the
    /// course changed, say) reads as unselected rather than as a blank field.
    static func valueText<Value>(
        for value: Value?,
        in groups: [TapDropdownGroup<Value>],
        placeholder: String
    ) -> String {
        row(for: value, in: groups)?.title ?? placeholder
    }

    /// What VoiceOver reads for the COLLAPSED field: everything the field
    /// draws, in the order it draws it, as one comma-separated value.
    ///
    /// The annotation is the load-bearing part. B0.3 chose words over an emoji
    /// so a qualification could be spoken; drawing "No women's rating" and then
    /// announcing only "Röd" would hand the sighted user a warning and the
    /// screen-reader user a plain answer — the exact failure the rule exists to
    /// prevent.
    static func accessibilityValue<Value>(
        for row: TapDropdownRow<Value>?,
        placeholder: String
    ) -> String {
        guard let row else { return placeholder }
        return [row.title, row.subtitle, row.marker, row.annotation?.text]
            .compactMap { $0 }
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            .joined(separator: ", ")
    }

    /// True when the user has typed and nothing survived — the sentence, not a
    /// blank list, which reads as "still loading".
    static func isEmptyHanded<Value>(
        groups: [TapDropdownGroup<Value>],
        query: String
    ) -> Bool {
        !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && rows(in: groups).isEmpty
    }

    /// Headers are drawn uppercase; a group that lost every row to a filter
    /// draws nothing at all.
    static func headerText<Value>(_ group: TapDropdownGroup<Value>) -> String? {
        guard !group.rows.isEmpty, let header = group.header, !header.isEmpty else { return nil }
        return header.uppercased()
    }
}

// MARK: - The open half

/// The raised list. Split out so the collapsed control stays readable, and so
/// the sheet's focus rule (§2.2 B2.3a: the search field owns the keyboard the
/// moment it appears) has one home.
struct TapDropdownSheet<Value: Hashable>: View {
    var title: String
    var selection: Value?
    var groups: [TapDropdownGroup<Value>]
    var search: TapDropdownSearch?
    var extra: TapDropdownAction?
    var isLoading: Bool
    var onSelect: (Value) -> Void

    @Environment(\.dismiss) private var dismiss
    @FocusState private var searchFocused: Bool

    var body: some View {
        NavigationStack {
            content
                .background(TapColors.bg)
                .navigationTitle(title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbarBackground(TapColors.bg, for: .navigationBar)
                .toolbarBackground(.visible, for: .navigationBar)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { dismiss() }
                            .font(TapFont.ui(size: 16))
                            .foregroundStyle(TapColors.textMuted)
                    }
                }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .onAppear { if search != nil { searchFocused = true } }
    }

    @ViewBuilder
    private var content: some View {
        VStack(spacing: 0) {
            if let search {
                TextField("", text: search.text, prompt: tapFieldPrompt(search.prompt))
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($searchFocused)
                    .submitLabel(.search)
                    .tapField()
                    .padding(.horizontal, TapSpacing.lg)
                    .padding(.vertical, TapSpacing.md)
            }

            ScrollView {
                LazyVStack(alignment: .leading, spacing: TapSpacing.sm) {
                    if isLoading {
                        ProgressView().frame(maxWidth: .infinity).padding(.top, TapSpacing.xl)
                    }
                    if let search,
                       TapDropdownModel.isEmptyHanded(groups: groups, query: search.text.wrappedValue) {
                        Text(verbatim: "\(search.emptyPrefix) “\(search.text.wrappedValue)”.")
                            .font(TapFont.ui(size: 13.6))
                            .foregroundStyle(TapColors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.top, TapSpacing.md)
                    }
                    ForEach(groups) { group in
                        if let header = TapDropdownModel.headerText(group) {
                            headerView(header)
                        }
                        ForEach(group.rows) { row in
                            rowView(row)
                        }
                    }
                    if let extra {
                        Divider().overlay(TapColors.border).padding(.vertical, TapSpacing.sm)
                        Button {
                            extra.action()
                            dismiss()
                        } label: {
                            Text(verbatim: extra.title)
                                .font(TapFont.ui(size: 15.2))
                                .foregroundStyle(TapColors.primary)
                                .padding(.horizontal, TapSpacing.md)
                                .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, TapSpacing.lg)
                .padding(.bottom, TapSpacing.xxl)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// A group header is a HEADER: no tap target, no selected state, because
    /// choosing a club chooses no course.
    private func headerView(_ text: String) -> some View {
        Text(verbatim: text)
            .font(TapFont.ui(size: 12.8, weight: .bold))
            .tracking(0.6)
            .foregroundStyle(TapColors.textMuted)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, TapSpacing.md)
            .accessibilityAddTraits(.isHeader)
    }

    private func rowView(_ row: TapDropdownRow<Value>) -> some View {
        let isSelected = row.value == selection
        return Button {
            onSelect(row.value)
            dismiss()
        } label: {
            HStack(spacing: TapSpacing.md) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(verbatim: row.title)
                        .font(TapFont.ui(size: 15.2, weight: isSelected ? .bold : .regular))
                        .foregroundStyle(TapColors.text)
                        .multilineTextAlignment(.leading)
                    if let subtitle = row.subtitle {
                        Text(verbatim: subtitle)
                            .font(TapFont.ui(size: 12.8))
                            .foregroundStyle(TapColors.textMuted)
                    }
                    if let marker = row.marker {
                        Text(verbatim: marker)
                            .font(TapFont.ui(size: 12.8))
                            .foregroundStyle(TapColors.textMuted)
                    }
                    if let annotation = row.annotation {
                        Text(verbatim: annotation.text)
                            .font(TapFont.ui(size: 12.8))
                            .foregroundStyle(annotation.tone.colour)
                            .fixedSize(horizontal: false, vertical: true)
                            .multilineTextAlignment(.leading)
                    }
                }
                Spacer(minLength: 0)
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(TapColors.primary)
                }
            }
            .padding(.horizontal, TapSpacing.md)
            .padding(.vertical, TapSpacing.xs)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: TapRadius.fieldRadius, style: .continuous)
                    .fill(isSelected ? TapColors.surface : Color.clear)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(TapDropdownModel.accessibilityValue(for: row, placeholder: row.title))
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }
}
