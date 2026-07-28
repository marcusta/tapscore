import SwiftUI

/// Create a round — course, game, players, go.
///
/// The native image of `src/create/create.component.ts` for the friendly path:
/// three questions, each on its own screen, and a round at the end. It is
/// deliberately NOT the web's single long form — a phone on a first tee wants
/// one decision at a time and a thumb-sized Next.
///
/// Everything it decides lives in `CreateStore` and the pure types behind it;
/// this file only draws. Refusals are shown where they can be FIXED: a
/// game-scoped diagnostic on the game step, a roster-scoped one on the player
/// step, and the flow jumps back to that step rather than announcing failure
/// from the last one.
struct CreateRoundView: View {
    @Environment(AppEnvironment.self) private var environment

    /// Dismiss without creating anything.
    let onCancel: () -> Void
    /// The round was created — hand it to the shell to record and open.
    let onCreated: (RoundOpenRequest) -> Void

    @State private var store: CreateStore?

    var body: some View {
        NavigationStack {
            Group {
                if let store {
                    content(store)
                } else {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .background(TapColors.bg)
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(TapColors.bg, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onCancel)
                        .font(TapFont.ui(size: 16))
                        .foregroundStyle(TapColors.textMuted)
                }
            }
        }
        .task {
            if store == nil {
                let store = CreateStore(api: environment.api)
                self.store = store
                await store.load()
                // The owner is the likeliest first player; pre-seating them
                // saves the most common typing on this screen.
                if case .signedIn(let player) = environment.authState {
                    store.seatOwner(player)
                }
            }
        }
    }

    // MARK: - Shell

    @ViewBuilder
    private func content(_ store: CreateStore) -> some View {
        @Bindable var store = store
        VStack(spacing: 0) {
            stepBar(store)
            ScrollView {
                VStack(alignment: .leading, spacing: TapSpacing.xl) {
                    if let loadError = store.loadError {
                        notice(loadError, tone: .danger)
                    }
                    switch store.step {
                    case .course: courseStep(store)
                    case .game: gameStep(store)
                    case .players: playerStep(store)
                    }
                    ForEach(store.generalDiagnostics, id: \.self) { notice($0, tone: .danger) }
                    if let submitError = store.submitError {
                        notice(submitError, tone: .danger)
                    }
                }
                .padding(.horizontal, TapSpacing.lg)
                .padding(.top, TapSpacing.lg)
                .padding(.bottom, TapSpacing.xxl)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            footer(store)
        }
    }

    /// Where you are in the flow, and a way back to a step you already passed.
    private func stepBar(_ store: CreateStore) -> some View {
        HStack(spacing: TapSpacing.sm) {
            ForEach(CreateStore.Step.allCases, id: \.rawValue) { step in
                TapChip(
                    title: step.title,
                    isSelected: store.step == step,
                    action: { if step.rawValue <= store.step.rawValue { store.step = step } })
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.bottom, TapSpacing.md)
    }

    /// The one action bar, pinned so Next never scrolls away.
    private func footer(_ store: CreateStore) -> some View {
        VStack(spacing: TapSpacing.sm) {
            if let blocker = store.blocker, store.step == .players {
                Text(blocker)
                    .font(TapFont.ui(size: 13.6))
                    .foregroundStyle(TapColors.textMuted)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            HStack(spacing: TapSpacing.sm) {
                if store.step != .course {
                    Button("Back") { store.step = previous(store.step) }
                        .buttonStyle(.tap(.ghost))
                }
                if store.step == .players {
                    Button(store.submitting ? "Creating…" : "Create round") {
                        Task { await create(store) }
                    }
                    .buttonStyle(.tap(.primary, size: .prominent, fillsWidth: true))
                    .disabled(!store.canSubmit)
                } else {
                    Button("Next") { store.step = next(store.step) }
                        .buttonStyle(.tap(.primary, size: .prominent, fillsWidth: true))
                        .disabled(!canAdvance(store))
                }
            }
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.top, TapSpacing.md)
        .padding(.bottom, TapSpacing.md)
        .background(TapColors.surface)
        .overlay(alignment: .top) {
            Rectangle().fill(TapColors.border).frame(height: 1)
        }
    }

    private func canAdvance(_ store: CreateStore) -> Bool {
        switch store.step {
        case .course: store.courseStepComplete
        case .game: store.gameStepComplete
        case .players: store.canSubmit
        }
    }

    private func next(_ step: CreateStore.Step) -> CreateStore.Step {
        CreateStore.Step(rawValue: step.rawValue + 1) ?? step
    }

    private func previous(_ step: CreateStore.Step) -> CreateStore.Step {
        CreateStore.Step(rawValue: step.rawValue - 1) ?? step
    }

    private func create(_ store: CreateStore) async {
        await store.submit()
        if let request = store.openRequest {
            onCreated(request)
            return
        }
        // Refused: land on the step that can fix it.
        if let step = store.diagnosticsStep { store.step = step }
    }

    // MARK: - Step 1 — course

    @ViewBuilder
    private func courseStep(_ store: CreateStore) -> some View {
        @Bindable var store = store
        heading("Where are you playing?", subtitle: "Pick the course and the tee you're playing off.")

        TextField(
            "",
            text: $store.courseSearch,
            prompt: tapFieldPrompt("Search club or course"))
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .tapField()

        if store.loading {
            ProgressView().frame(maxWidth: .infinity)
        }

        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Course")
            VStack(spacing: TapSpacing.sm) {
                ForEach(store.filteredClubs(), id: \.id) { club in
                    clubCard(store, club: club)
                }
            }
        }

        if !store.tees.isEmpty {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                SectionHeader(title: "Tee")
                FlowRow(spacing: TapSpacing.sm) {
                    ForEach(store.tees, id: \.id) { tee in
                        TapChip(
                            title: tee.name,
                            isSelected: store.selectedTee?.id == tee.id,
                            action: { store.selectTee(tee.id) })
                    }
                }
            }
        } else if store.loadingTees {
            ProgressView().frame(maxWidth: .infinity)
        }

        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Holes")
            FlowRow(spacing: TapSpacing.sm) {
                ForEach(Self.roundTypes, id: \.0.rawValue) { type, label in
                    TapChip(
                        title: label,
                        isSelected: store.roundType == type,
                        action: { store.roundType = type })
                }
            }
        }
    }

    private static let roundTypes: [(RoundRoundType, String)] = [
        (.full18, "18 holes"),
        (.front9, "Front 9"),
        (.back9, "Back 9"),
    ]

    private func clubCard(_ store: CreateStore, club: Club) -> some View {
        let courses = store.courses(inClub: club.id)
        return TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                Text(club.name)
                    .font(TapFont.ui(size: 15.2, weight: .semibold))
                    .foregroundStyle(TapColors.text)
                FlowRow(spacing: TapSpacing.sm) {
                    ForEach(courses, id: \.id) { course in
                        TapChip(
                            title: course.name,
                            isSelected: store.courseId == course.id,
                            action: { Task { await store.selectCourse(course.id) } })
                    }
                }
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Step 2 — game

    @ViewBuilder
    private func gameStep(_ store: CreateStore) -> some View {
        heading("What are you playing?", subtitle: "Pick the game. You can change nothing else — the rules come with it.")

        ForEach(store.gameDiagnostics, id: \.self) { notice($0, tone: .danger) }

        VStack(spacing: TapSpacing.sm) {
            ForEach(store.catalog.presets(), id: \.id) { descriptor in
                gameCard(store, descriptor: descriptor)
            }
        }

        if let format = store.selectedFormat, let fields = format.configFields, !fields.isEmpty {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                SectionHeader(title: "Options")
                TapCard {
                    VStack(alignment: .leading, spacing: TapSpacing.md) {
                        ForEach(fields, id: \.key) { field in
                            configField(store, field: field)
                        }
                    }
                    .padding(TapSpacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private func gameCard(_ store: CreateStore, descriptor: FormatDescriptor) -> some View {
        let selected = store.formatId == descriptor.id
        return Button {
            store.selectFormat(descriptor.id)
        } label: {
            TapCard(sunken: selected) {
                VStack(alignment: .leading, spacing: TapSpacing.xs) {
                    HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                        Text(store.catalog.label(descriptor))
                            .font(TapFont.display(size: 17.6, weight: .semibold))
                            .foregroundStyle(TapColors.text)
                            .multilineTextAlignment(.leading)
                        Spacer(minLength: 0)
                        if selected {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(TapColors.primary)
                        }
                    }
                    Text(store.catalog.tagline(descriptor))
                        .font(TapFont.ui(size: 13.6))
                        .foregroundStyle(TapColors.textMuted)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(store.catalog.shapeText(descriptor.id))
                        .font(TapFont.ui(size: 12.8, weight: .medium))
                        .foregroundStyle(TapColors.accent)
                }
                .padding(TapSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
        }
        .buttonStyle(.plain)
    }

    /// A knob the FORMAT declared. Generic by construction — the key, the
    /// options and their labels all come off the descriptor, so a format that
    /// grows an option needs no change here.
    private func configField(_ store: CreateStore, field: FormatConfigField) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            Text(store.catalog.configLabel(field.labels))
                .font(TapFont.ui(size: 13.6, weight: .medium))
                .foregroundStyle(TapColors.textMuted)
            FlowRow(spacing: TapSpacing.sm) {
                ForEach(field.options, id: \.value) { option in
                    TapChip(
                        title: store.catalog.configLabel(option.labels),
                        isSelected: (store.formatConfig[field.key] ?? field.`default`) == option.value,
                        tone: .accent,
                        action: { store.setConfig(field.key, option.value) })
                }
            }
        }
    }

    // MARK: - Step 3 — players

    @ViewBuilder
    private func playerStep(_ store: CreateStore) -> some View {
        heading("Who's playing?", subtitle: playersSubtitle(store))

        ForEach(store.playerDiagnostics, id: \.self) { notice($0, tone: .danger) }

        VStack(spacing: TapSpacing.sm) {
            ForEach(Array(store.players.enumerated()), id: \.element.id) { index, row in
                playerCard(store, index: index, row: row)
            }
        }

        Button {
            store.addPlayer()
        } label: {
            HStack(spacing: TapSpacing.sm) {
                Image(systemName: "plus")
                Text("Add player")
            }
        }
        .buttonStyle(.tap(.secondary, fillsWidth: true))
        .disabled(!store.canAddPlayer)
    }

    private func playersSubtitle(_ store: CreateStore) -> String {
        guard let formatId = store.formatId else { return "Names are enough — handicaps are optional." }
        let min = store.catalog.minPlayers(for: formatId)
        if min > 0, let max = store.maxPlayers, max == min {
            return "\(store.catalog.label(formatId) ?? "This game") is played by exactly \(min). Handicaps are optional."
        }
        if min > 0 {
            return "\(store.catalog.label(formatId) ?? "This game") needs at least \(min). Handicaps are optional."
        }
        return "Names are enough — handicaps are optional."
    }

    /// A text binding onto one roster row, resolved BY ID on every read.
    ///
    /// The obvious spelling — `get: { row.name }` — captures the row VALUE that
    /// `body` was handed, and a `TextField` reads its binding far more often
    /// than the body re-runs. Type two characters faster than SwiftUI can
    /// re-evaluate and the second read still answers with the first character's
    /// snapshot, so the field snaps back and the keystroke is gone. Reading
    /// through the store means the getter is always current no matter how stale
    /// the enclosing body is.
    ///
    /// The setter needs no such care (it addresses the row by id already), and
    /// a row that has been removed reads as empty and swallows writes rather
    /// than resurrecting itself.
    static func rowText(
        _ store: CreateStore,
        id: UUID,
        _ field: WritableKeyPath<CreateStore.PlayerRow, String>
    ) -> Binding<String> {
        Binding(
            get: { store.player(id: id)?[keyPath: field] ?? "" },
            set: { value in store.updatePlayer(id: id) { $0[keyPath: field] = value } })
    }

    private func playerCard(_ store: CreateStore, index: Int, row: CreateStore.PlayerRow) -> some View {
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                HStack(spacing: TapSpacing.sm) {
                    TextField(
                        "",
                        text: Self.rowText(store, id: row.id, \.name),
                        prompt: tapFieldPrompt("Player \(index + 1)"))
                        .textInputAutocapitalization(.words)
                        .autocorrectionDisabled()
                        .tapField()
                        .disabled(row.playerId != nil)

                    if store.players.count > 1 {
                        Button {
                            store.removePlayer(id: row.id)
                        } label: {
                            Image(systemName: "trash")
                                .font(.system(size: 17, weight: .medium))
                                .foregroundStyle(TapColors.textMuted)
                                .frame(width: 44, height: 44)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Remove \(row.name.isEmpty ? "player \(index + 1)" : row.name)")
                    }
                }

                HStack(spacing: TapSpacing.sm) {
                    TextField(
                        "",
                        text: Self.rowText(store, id: row.id, \.handicapText),
                        prompt: tapFieldPrompt("HCP"))
                        // Both notations the parser accepts need typing: a
                        // decimal comma and a leading "+" for a plus handicap.
                        .keyboardType(.numbersAndPunctuation)
                        .autocorrectionDisabled()
                        .tapField()
                        .frame(maxWidth: 120)

                    TapChip(
                        title: "Men",
                        isSelected: row.gender == .m,
                        action: { store.updatePlayer(id: row.id) { $0.gender = .m } })
                    TapChip(
                        title: "Women",
                        isSelected: row.gender == .f,
                        action: { store.updatePlayer(id: row.id) { $0.gender = .f } })
                    Spacer(minLength: 0)
                }

                ForEach(store.playerDiagnostics(rowId: row.id), id: \.self) { message in
                    Text(message)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.danger)
                }
            }
            .padding(TapSpacing.md)
        }
    }

    // MARK: - Shared bits

    private func heading(_ title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            Text(title)
                .font(TapFont.display(size: 27.2, weight: .semibold))
                .tracking(27.2 * -0.02)
                .foregroundStyle(TapColors.text)
            Text(subtitle)
                .font(TapFont.ui(size: 14.4))
                .foregroundStyle(TapColors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private enum NoticeTone { case danger, muted }

    private func notice(_ message: String, tone: NoticeTone) -> some View {
        TapCard(sunken: true) {
            HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                Image(systemName: "exclamationmark.triangle")
                Text(message)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }
            .font(TapFont.ui(size: 13.6))
            .foregroundStyle(tone == .danger ? TapColors.danger : TapColors.textMuted)
            .padding(TapSpacing.md)
        }
    }
}

/// A wrapping row of chips. SwiftUI has no flow layout primitive before the
/// `Layout` protocol, and a horizontal `ScrollView` of tees would hide the ones
/// past the edge — on a picker where every option must be visible at once.
struct FlowRow: Layout {
    var spacing: CGFloat = TapSpacing.sm

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.replacingUnspecifiedDimensions().width
        let rows = layout(subviews: subviews, width: width)
        let height = rows.last.map { $0.y + $0.height } ?? 0
        return CGSize(width: width, height: height)
    }

    func placeSubviews(
        in bounds: CGRect,
        proposal: ProposedViewSize,
        subviews: Subviews,
        cache: inout ()
    ) {
        for row in layout(subviews: subviews, width: bounds.width) {
            for item in row.items {
                subviews[item.index].place(
                    at: CGPoint(x: bounds.minX + item.x, y: bounds.minY + row.y),
                    proposal: ProposedViewSize(item.size))
            }
        }
    }

    private struct Row {
        var y: CGFloat
        var height: CGFloat
        var items: [(index: Int, x: CGFloat, size: CGSize)]
    }

    private func layout(subviews: Subviews, width: CGFloat) -> [Row] {
        var rows: [Row] = []
        var current = Row(y: 0, height: 0, items: [])
        var x: CGFloat = 0
        for index in subviews.indices {
            let size = subviews[index].sizeThatFits(.unspecified)
            if x > 0 && x + size.width > width {
                rows.append(current)
                current = Row(y: current.y + current.height + spacing, height: 0, items: [])
                x = 0
            }
            current.items.append((index, x, size))
            current.height = max(current.height, size.height)
            x += size.width + spacing
        }
        if !current.items.isEmpty { rows.append(current) }
        return rows
    }
}
