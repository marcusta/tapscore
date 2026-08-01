import SwiftUI

/// The custom window's editor.
///
/// Everything here narrows a list of rounds that is ALREADY on the device — the
/// sheet issues no request and cannot. That is why the course list, the venue
/// types and the checklist are all built from the fetched rows: an option the
/// player's history does not contain is a row that can only ever produce an
/// empty window.
///
/// Edits are staged and applied on Done. A live-applying filter would rebuild
/// every sum on the screen behind the sheet on each keystroke of a date picker,
/// and — worse — a half-finished date range is a window the player never asked
/// for.
struct StatsFilterSheet: View {
    @Environment(\.dismiss) private var dismiss

    var filter: StatsRoundFilter
    var courses: [StatsCourseOption]
    /// Every fetched round, newest first — the checklist's contents.
    var rounds: [PlayerRoundStats]
    var onApply: (StatsRoundFilter) -> Void
    var onClear: () -> Void

    @State private var draft = StatsRoundFilter()
    @State private var usesFrom = false
    @State private var usesTo = false
    @State private var fromDate = Date()
    @State private var toDate = Date()
    @State private var loaded = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: TapSpacing.lg) {
                    dates
                    venues
                    roundTypes
                    courseList
                    checklist
                }
                .padding(TapSpacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(TapColors.bg)
            .navigationTitle("Filter rounds")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(TapColors.bg, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    // Clears the filter AND leaves the custom window — an empty
                    // custom window and "Last 10" render the same rounds, and
                    // the picker should say the one the player understands.
                    Button("Clear") {
                        onClear()
                        dismiss()
                    }
                    .accessibilityIdentifier("stats-filter-clear")
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        onApply(committed)
                        dismiss()
                    }
                    .accessibilityIdentifier("stats-filter-done")
                }
            }
        }
        .accessibilityIdentifier("stats-filter-sheet")
        .task {
            // Once: the sheet opens on the live filter, and re-seeding on every
            // re-render would stamp on edits in progress.
            guard !loaded else { return }
            loaded = true
            draft = filter
            usesFrom = filter.from != nil
            usesTo = filter.to != nil
            // Local midnight, not UTC: a `DatePicker` shows the day its `Date`
            // falls on in the DEVICE's zone, so seeding it from a UTC instant
            // displays the day before the one that was committed anywhere west
            // of Greenwich. Paired with `committed` below, which prints the day
            // back out of the same zone.
            if let from = filter.from, let date = StatsFormat.localDate(fromISODay: from) {
                fromDate = date
            }
            if let to = filter.to, let date = StatsFormat.localDate(fromISODay: to) {
                toDate = date
            }
        }
    }

    /// The draft with the date switches folded in. A date picker holding a value
    /// its switch is off for must not reach the window.
    ///
    /// The wire format is unchanged (`yyyy-MM-dd`); what changed is WHOSE day it
    /// is — the reader's, which is the only one they ever saw.
    private var committed: StatsRoundFilter {
        var next = draft
        next.from = usesFrom ? StatsFormat.isoDay(localDayOf: fromDate) : nil
        next.to = usesTo ? StatsFormat.isoDay(localDayOf: toDate) : nil
        return next
    }

    // MARK: - Dates

    private var dates: some View {
        section("Dates") {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                Toggle("From", isOn: $usesFrom)
                    .font(TapFont.ui(size: 14.4))
                    .tint(TapColors.primary)
                if usesFrom {
                    DatePicker(
                        "From", selection: $fromDate, displayedComponents: .date
                    )
                    .datePickerStyle(.compact)
                    .labelsHidden()
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                Toggle("To", isOn: $usesTo)
                    .font(TapFont.ui(size: 14.4))
                    .tint(TapColors.primary)
                if usesTo {
                    DatePicker("To", selection: $toDate, displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .labelsHidden()
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    // MARK: - Venue and round type

    private var venues: some View {
        section("Where") {
            // Two options, both one word: chips, per the app's rule. Neither
            // selected means both, which is what the empty set already means in
            // `StatsRoundFilter`.
            HStack(spacing: TapSpacing.sm) {
                ForEach([VenueType.outdoor, .indoor], id: \.rawValue) { venue in
                    TapChip(
                        title: StatsFormat.title(venue),
                        isSelected: draft.venueTypes.contains(venue),
                        tone: .accent
                    ) {
                        toggle(venue, in: \.venueTypes)
                    }
                }
                Spacer(minLength: 0)
            }
        }
    }

    private var roundTypes: some View {
        section("How many holes") {
            // Four short options — still chips, at the top of the rule's range.
            // A wrapping row rather than a horizontal scroll: four is few enough
            // that hiding any behind a gesture would be gratuitous.
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                HStack(spacing: TapSpacing.sm) {
                    chip(.full18)
                    chip(.front9)
                    Spacer(minLength: 0)
                }
                HStack(spacing: TapSpacing.sm) {
                    chip(.back9)
                    chip(.customHoles)
                    Spacer(minLength: 0)
                }
            }
        }
    }

    private func chip(_ type: RoundType) -> some View {
        TapChip(
            title: StatsFormat.title(type),
            isSelected: draft.roundTypes.contains(type),
            tone: .accent
        ) {
            toggle(type, in: \.roundTypes)
        }
    }

    // MARK: - Courses

    @ViewBuilder
    private var courseList: some View {
        if !courses.isEmpty {
            section("Courses") {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(courses) { course in
                        checkRow(
                            title: course.name,
                            subtitle: course.roundCount == 1
                                ? "1 round" : "\(course.roundCount) rounds",
                            isOn: draft.courseIDs.contains(course.id)
                        ) {
                            toggle(course.id, in: \.courseIDs)
                        }
                    }
                    Text(StatsFilterCopy.coursesHint)
                        .font(TapFont.ui(size: 12.0))
                        .foregroundStyle(TapColors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, TapSpacing.sm)
                }
            }
        }
    }

    // MARK: - Per-round checklist

    /// The escape hatch every other criterion cannot cover: the round played in
    /// a storm, the nine holes with a borrowed putter. Exclusions are per round
    /// and survive the other criteria — a round struck out here stays out even
    /// if the date range moves over it.
    @ViewBuilder
    private var checklist: some View {
        if !rounds.isEmpty {
            section("Rounds") {
                // LAZY: this is the one list here whose length is a career, not a
                // menu — a player with 600 rounds gets 600 rows, and a plain
                // `VStack` builds every one of them the instant the sheet opens.
                LazyVStack(alignment: .leading, spacing: 0) {
                    Text(StatsFilterCopy.checklistHint)
                        .font(TapFont.ui(size: 12.0))
                        .foregroundStyle(TapColors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.bottom, TapSpacing.sm)
                    ForEach(rounds, id: \.roundId) { round in
                        checkRow(
                            title: StatsFilterCopy.label(round),
                            subtitle: StatsFormat.day(round.date),
                            isOn: !draft.excludedRoundIDs.contains(round.roundId)
                        ) {
                            if draft.excludedRoundIDs.contains(round.roundId) {
                                draft.excludedRoundIDs.remove(round.roundId)
                            } else {
                                draft.excludedRoundIDs.insert(round.roundId)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Primitives

    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: title, size: 15.2)
            TapCard {
                content()
                    .padding(TapSpacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// A row that reads as checked or not without relying on colour — the state
    /// is a word-shaped mark, and the row carries the `.isSelected` trait for
    /// VoiceOver.
    private func checkRow(
        title: String, subtitle: String?, isOn: Bool, action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(alignment: .center, spacing: TapSpacing.md) {
                Image(systemName: isOn ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isOn ? TapColors.primary : TapColors.borderStrong)
                VStack(alignment: .leading, spacing: 1) {
                    Text(title)
                        .font(TapFont.ui(size: 14.4))
                        .foregroundStyle(TapColors.text)
                        .lineLimit(1)
                    if let subtitle {
                        Text(subtitle)
                            .font(TapFont.ui(size: 12.0))
                            .foregroundStyle(TapColors.textMuted)
                            .lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.vertical, TapSpacing.xs)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn ? [.isSelected] : [])
    }

    private func toggle<T: Hashable>(
        _ value: T, in keyPath: WritableKeyPath<StatsRoundFilter, Set<T>>
    ) {
        if draft[keyPath: keyPath].contains(value) {
            draft[keyPath: keyPath].remove(value)
        } else {
            draft[keyPath: keyPath].insert(value)
        }
    }
}

enum StatsFilterCopy {
    static let coursesHint = "Pick none to include every course."
    static let checklistHint =
        "Every round is in by default. Uncheck one to leave it out of the totals."

    static func label(_ round: PlayerRoundStats) -> String {
        let named = (round.name ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if !named.isEmpty { return named }
        let course = (round.courseName ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return course.isEmpty ? "Round" : course
    }
}
