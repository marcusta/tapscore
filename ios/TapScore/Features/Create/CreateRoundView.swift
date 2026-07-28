import SwiftUI

/// Create a round — course, players, formats, go.
///
/// The native image of `src/create/create.component.ts` for the friendly path:
/// three questions, each on its own screen, and a round at the end. It is
/// deliberately NOT the web's single long form — a phone on a first tee wants
/// one decision at a time and a thumb-sized Next.
///
/// The step ORDER is contractual (`docs/proposals/create-flow-behavior.md`
/// §1.2): Course — with the route, the start hole and the round's tee defaults
/// folded into it — then Players, then Format, which carries submit. Each step
/// is gated with a stated reason rather than letting a user walk to the end and
/// only there learn what is missing (B1.2/B1.3).
///
/// Everything it decides lives in `CreateStore` and the pure types behind it;
/// this file only draws. Refusals are shown where they can be FIXED: a
/// slot-scoped diagnostic on that slot's own panel, a roster-scoped one on the
/// player row, and the flow jumps back to the earliest step carrying an error
/// rather than announcing failure from the last one.
struct CreateRoundView: View {
    /// The same three questions, asked of a round that does not exist yet or of
    /// one that does. Only the copy, the load and the submit differ — which is
    /// the whole reason edit REUSES this screen instead of forking it (B1).
    enum Mode: Equatable {
        case create
        /// The share token of the round being edited. Never logged.
        case edit(token: String)

        var title: String {
            switch self {
            case .create: "New round"
            case .edit: "Edit round"
            }
        }

        var isEditing: Bool {
            if case .edit = self { return true }
            return false
        }
    }

    @Environment(AppEnvironment.self) private var environment

    var mode: Mode = .create
    /// Dismiss without creating or saving anything.
    let onCancel: () -> Void
    /// The round was created — hand it to the shell to record and open.
    var onCreated: (RoundOpenRequest) -> Void = { _ in }
    /// An edit was accepted by the server.
    var onSaved: () -> Void = {}

    @State private var store: CreateStore?
    /// The row whose handicap pad is open. Nil ⇒ closed.
    @State private var padRowId: UUID?
    @State private var friendsOpen = false

    var body: some View {
        NavigationStack {
            Group {
                if let store {
                    screen(store)
                } else {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .background(TapColors.bg)
            .navigationTitle(mode.title)
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
                // Who is playing decides the STARTING roster (B5.1/B5.2), so
                // it is answered before the catalog lands rather than patched
                // onto a row that already exists.
                if case .signedIn(let player) = environment.authState {
                    store.setOwner(player)
                } else {
                    store.setOwner(nil)
                }
                switch mode {
                case .create: await store.load()
                // The hydrate REPLACES the starting roster, so the owner row
                // above never survives into an edit — it is set purely so the
                // friends path exists while editing.
                case .edit(let token): await store.loadForEdit(token: token)
                }
            }
        }
    }

    // MARK: - Shell

    /// The screen's three states in edit mode: blocked, loading, or the form.
    /// In create mode only the last exists.
    @ViewBuilder
    private func screen(_ store: CreateStore) -> some View {
        if let blocked = store.editBlockedReason {
            blockedState(blocked)
        } else if mode.isEditing, !store.editHydrated {
            editLoadingState(store)
        } else {
            content(store)
        }
    }

    /// B3: a round that cannot be edited says why and offers the way back —
    /// never a form that will be refused when it is submitted.
    private func blockedState(_ reason: CreateStore.EditBlockedReason) -> some View {
        VStack(spacing: TapSpacing.lg) {
            Spacer(minLength: 0)
            Text(reason.message)
                .font(TapFont.ui(size: 16))
                .foregroundStyle(TapColors.text)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("edit-round-blocked")
            Button("Back", action: onCancel)
                .buttonStyle(.tap(.secondary))
            Spacer(minLength: 0)
        }
        .padding(TapSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    /// Loading, or the retry a failed load leaves behind (B2). Deliberately not
    /// a partial form: half a hydrated setup looks saveable and is not.
    @ViewBuilder
    private func editLoadingState(_ store: CreateStore) -> some View {
        VStack(spacing: TapSpacing.lg) {
            Spacer(minLength: 0)
            if let loadError = store.loadError {
                notice(loadError, tone: .danger)
                Button("Try again") {
                    if case .edit(let token) = mode {
                        Task { await store.loadForEdit(token: token) }
                    }
                }
                .buttonStyle(.tap(.primary))
                .accessibilityIdentifier("edit-round-retry")
            } else {
                ProgressView()
            }
            Spacer(minLength: 0)
        }
        .padding(TapSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder
    private func content(_ store: CreateStore) -> some View {
        @Bindable var store = store
        VStack(spacing: 0) {
            stepBar(store)
            ScrollView {
                VStack(alignment: .leading, spacing: TapSpacing.xl) {
                    if mode.isEditing {
                        // B1: what an edit is, said once at the top — the
                        // question everyone opening this screen has is whether
                        // the scores they already took are about to vanish.
                        Text("Change the setup — scored balls are preserved.")
                            .font(TapFont.ui(size: 14.4))
                            .foregroundStyle(TapColors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityIdentifier("edit-round-subtitle")
                    }
                    if let loadError = store.loadError {
                        notice(loadError, tone: .danger)
                    }
                    switch store.step {
                    case .course: courseStep(store)
                    case .players: playerStep(store)
                    case .format: formatStep(store)
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
        .sheet(isPresented: $friendsOpen) { FriendsPickerSheet(store: store) }
        .sheet(item: Binding(
            get: { padRowId.flatMap { store.player(id: $0) } },
            set: { padRowId = $0?.id })) { row in
            HandicapPadSheet(
                playerName: row.name.isEmpty ? "Handicap index" : row.name,
                tee: store.tee(for: row),
                gender: row.gender,
                initialText: row.handicapText,
                onCommit: { text in
                    store.updatePlayer(id: row.id) { $0.handicapText = text }
                })
        }
    }

    /// Where you are in the flow, and a way back to a step you already passed.
    ///
    /// A step carrying a refusal is marked (B9.8) — otherwise a diagnostic on a
    /// step the user has walked away from is discoverable only by walking back
    /// to it on a hunch.
    private func stepBar(_ store: CreateStore) -> some View {
        HStack(spacing: TapSpacing.sm) {
            ForEach(CreateStore.Step.allCases, id: \.rawValue) { step in
                HStack(spacing: 2) {
                    TapChip(
                        title: step.title,
                        isSelected: store.step == step,
                        action: { if step.rawValue <= store.step.rawValue { store.step = step } })
                    if store.stepsWithErrors.contains(step) {
                        Image(systemName: "exclamationmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(TapColors.danger)
                            .accessibilityLabel("\(step.title) has a problem")
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, TapSpacing.lg)
        .padding(.bottom, TapSpacing.md)
    }

    /// The one action bar, pinned so Next never scrolls away.
    private func footer(_ store: CreateStore) -> some View {
        VStack(spacing: TapSpacing.sm) {
            // B1.2/B1.3: the advance control is disabled WITH ITS REASON, so
            // "Next does nothing" is never the whole message.
            if let blocker = store.advanceBlocker(from: store.step) {
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
                if store.step == .format, mode.isEditing {
                    Button(store.submitting ? "Saving…" : "Save changes") {
                        Task { await save(store) }
                    }
                    .buttonStyle(.tap(.primary, size: .prominent, fillsWidth: true))
                    .disabled(!store.canSubmit)
                    .accessibilityIdentifier("edit-round-save")
                } else if store.step == .format {
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
        store.advanceBlocker(from: store.step) == nil && !store.submitting
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

    private func save(_ store: CreateStore) async {
        if await store.saveEdits() {
            onSaved()
            return
        }
        if let step = store.diagnosticsStep { store.step = step }
    }

    // MARK: - Step 1 — course

    @ViewBuilder
    private func courseStep(_ store: CreateStore) -> some View {
        heading("Where are you playing?", subtitle: "Pick the course, the holes you're playing and the tees.")

        // B4: a round with scores has settled its course and its route — the
        // balls are already addressed to them. The reason is stated ONCE, above
        // both locked controls, rather than repeated on each.
        if store.courseRouteLocked {
            notice(CreateStore.courseRouteLockNotice, tone: .muted)
        }

        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Course")
            // B2.3/B2.7: the selector is a COLLAPSED field — the answer, or the
            // placeholder until there is one — and the grouped list lives behind
            // it. Kept collapsed, the route and tee questions below stay on the
            // same screen as the course they belong to; expanded inline, they
            // are a club list away.
            courseField(store)
                .disabled(store.courseRouteLocked)
        }

        if store.courseId != nil {
            routeSection(store)
            teeDefaultsSection(store)
        }
    }

    /// B2.3/B2.3a: the collapsed trigger and, behind it, the searchable grouped
    /// overlay — one `TapDropdown`, the same primitive the start hole and the
    /// tees use. The filter, the grouping and the act of selecting all stay in
    /// the store; this hands over rows and takes back an id.
    private func courseField(_ store: CreateStore) -> some View {
        TapDropdown(
            placeholder: store.loading ? "Loading courses…" : "Choose course",
            title: "Course",
            selection: store.courseId,
            groups: CreatePickerRows.courses(store.filteredCourseGroups()),
            // The club under the name, so two same-named courses are told
            // apart — and read from the SELECTION, not from the filtered list,
            // which a leftover query can empty.
            selectedRow: store.selectedCourse.map { course in
                TapDropdownRow(
                    value: course.id,
                    title: course.name,
                    subtitle: course.clubName.uppercased())
            },
            search: TapDropdownSearch(
                prompt: "Search club or course",
                text: Binding(
                    get: { store.courseSearch },
                    set: { store.courseSearch = $0 }),
                emptyPrefix: "No courses match"),
            isLoading: store.loading,
            // Every opening starts on the whole list. The query outlives the
            // sheet (the binding is the store's), so without this the picker
            // reopens onto the last search — often onto its empty state, which
            // reads as "your course is gone" rather than "you typed this once".
            onOpen: { store.beginCourseSearch() },
            onSelect: { id in Task { await store.selectCourse(id) } })
    }

    /// Route + start hole (§3), which live on the Course step (B1.6).
    @ViewBuilder
    private func routeSection(_ store: CreateStore) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            SectionHeader(title: "Holes")
            FlowRow(spacing: TapSpacing.sm) {
                ForEach(Self.routePresets, id: \.0.rawValue) { preset, label in
                    TapChip(
                        title: label,
                        isSelected: store.routePreset == preset,
                        action: { store.setRoutePreset(preset) })
                }
            }
            .disabled(store.courseRouteLocked)
        }

        if store.permittedStartHoles.count > 1 {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                // Eighteen holes is a LIST, not a chip wall (the design rule in
                // `ios/AGENTS.md`): a collapsed field saying which hole, and the
                // route's permitted holes behind it. No search — eighteen rows
                // scroll in one flick — and each rotating choice says what it
                // costs (B3.7) as a row annotation.
                TapDropdown(
                    label: "Start hole",
                    placeholder: "Hole 1",
                    title: "Start hole",
                    selection: store.startHole,
                    groups: CreatePickerRows.startHoles(store.permittedStartHoles),
                    onSelect: { store.setStartHole($0) })
                    .disabled(store.courseRouteLocked)
                if !store.isPostingEligible {
                    // B3.7: the draft already says so; say it out loud rather
                    // than let a handicap record quietly not move.
                    Text("Starting on \(store.startHole) — this round won't count for handicap.")
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }

        // B9.3: a route refusal belongs on the control that can fix it — the
        // holes and the start hole, both of which live right here.
        ForEach(store.routeDiagnostics, id: \.self) { message in
            Text(message)
                .font(TapFont.ui(size: 12.8))
                .foregroundStyle(TapColors.danger)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    /// The round's two tee defaults (§4.4). Per-player overrides are drawn on
    /// the Players step; these are what a row starts on.
    @ViewBuilder
    private func teeDefaultsSection(_ store: CreateStore) -> some View {
        if store.loadingTees {
            ProgressView().frame(maxWidth: .infinity)
        } else if !store.tees.isEmpty {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                SectionHeader(title: "Tees")
                teeDefaultRow(store, gender: .m, label: "Men")
                teeDefaultRow(store, gender: .f, label: "Women")
            }
        }
    }

    private func teeDefaultRow(
        _ store: CreateStore,
        gender: PlayerGender,
        label: String
    ) -> some View {
        // ONE collapsed field per gender, opening ONE list in the §4.3 canon
        // order (B4.1). Not chips: a course can carry six tees, and two rows of
        // them per gender is the wall this step was rejected for. Partitioning
        // the list into rated and unrated blocks would re-order the picker
        // behind the sort's back — the user reads a tee list as a length
        // ordering, and a White-then-Red list that puts Yellow last because of
        // a missing rating row is a lie about the course.
        //
        // A tee with no rating for this gender is ANNOTATED IN WORDS and still
        // selectable (B4.13): on a course where nothing is rated for a gender,
        // an unselectable list is a dead end with no way out. Pick it and every
        // row of that gender says why (B4.11) — a stated problem the user can
        // act on, rather than a control that does nothing when tapped.
        TapDropdown(
            label: label,
            placeholder: "Choose tee",
            title: "\(label)'s tee",
            selection: store.defaultTeeId(for: gender),
            groups: CreatePickerRows.tees(store.tees, for: gender),
            onSelect: { store.setDefaultTee($0, for: gender) })
    }

    private static let routePresets: [(RoundRoundType, String)] = [
        (.full18, "Full 18"),
        (.front9, "Front 9"),
        (.back9, "Back 9"),
    ]

    // MARK: - Step 2 — players

    @ViewBuilder
    private func playerStep(_ store: CreateStore) -> some View {
        heading("Who's playing?", subtitle: playersSubtitle(store))

        ForEach(store.playerDiagnostics, id: \.self) { notice($0, tone: .danger) }

        VStack(spacing: TapSpacing.sm) {
            ForEach(Array(store.players.enumerated()), id: \.element.id) { index, row in
                playerCard(store, index: index, row: row)
            }
        }

        // B5.6/B8.2: signed out, the friends path is ABSENT — not a disabled
        // button that asks a no-login flow to log in.
        VStack(spacing: TapSpacing.sm) {
            if store.isSignedIn {
                Button {
                    friendsOpen = true
                } label: {
                    HStack(spacing: TapSpacing.sm) {
                        Image(systemName: "person.2")
                        Text("Add from friends")
                    }
                }
                .buttonStyle(.tap(.secondary, fillsWidth: true))
                .disabled(!store.canAddPlayer)

                if store.canAddOwner {
                    Button {
                        store.addOwner()
                    } label: {
                        HStack(spacing: TapSpacing.sm) {
                            Image(systemName: "person.crop.circle.badge.plus")
                            Text("Add me")
                        }
                    }
                    .buttonStyle(.tap(.secondary, fillsWidth: true))
                    .disabled(!store.canAddPlayer)
                }
            }

            Button {
                store.addPlayer()
            } label: {
                HStack(spacing: TapSpacing.sm) {
                    Image(systemName: "plus")
                    Text("Add guest")
                }
            }
            .buttonStyle(.tap(.secondary, fillsWidth: true))
            .disabled(!store.canAddPlayer)
        }
    }

    /// B5.28 makes the index part of a complete row, so the subtitle says so —
    /// promising "handicaps are optional" and then refusing to advance is the
    /// worst of both.
    private func playersSubtitle(_ store: CreateStore) -> String {
        let hcp = "Everyone needs a name and a handicap index."
        guard !store.formatSlots.isEmpty else { return hcp }
        let min = store.minPlayers
        if let max = store.maxPlayers, max == min {
            return "This round is played by exactly \(min). \(hcp)"
        }
        if min > 1 {
            return "This round needs at least \(min). \(hcp)"
        }
        return hcp
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
                    if row.nameLocked {
                        // B5.10: a friend's name is a fact about them, not a
                        // field on this round.
                        HStack(spacing: TapSpacing.xs) {
                            Image(systemName: "person.crop.circle.fill")
                                .foregroundStyle(TapColors.primary)
                            Text(row.name)
                                .font(TapFont.ui(size: 15.2, weight: .bold))
                                .foregroundStyle(TapColors.text)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        TextField(
                            "",
                            text: Self.rowText(store, id: row.id, \.name),
                            prompt: tapFieldPrompt("Player \(index + 1)"))
                            .textInputAutocapitalization(.words)
                            .autocorrectionDisabled()
                            .tapField()
                    }

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
                    // B5.15: the index is never text-editable — tapping it opens
                    // the pad, because "+2,4" is not typeable on a phone.
                    Button {
                        padRowId = row.id
                    } label: {
                        Text(row.handicapText.isEmpty ? "HCP" : row.handicapText)
                            .font(TapFont.ui(size: 15.2, weight: .bold))
                            .foregroundStyle(row.handicapText.isEmpty ? TapColors.textMuted : TapColors.text)
                            .monospacedDigit()
                            .frame(minWidth: 72, minHeight: 44)
                            .padding(.horizontal, TapSpacing.md)
                            .background(RoundedRectangle(cornerRadius: 10).fill(TapColors.btnBg))
                            .overlay(RoundedRectangle(cornerRadius: 10)
                                .strokeBorder(TapColors.border, lineWidth: 1))
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Handicap index for \(row.name.isEmpty ? "player \(index + 1)" : row.name)")

                    if row.genderLocked {
                        // B5.26: locked, and visibly so — a control that looks
                        // tappable and is not is worse than a label.
                        Text(row.gender == .m ? "Men" : "Women")
                            .font(TapFont.ui(size: 13.6, weight: .bold))
                            .foregroundStyle(TapColors.textMuted)
                            .padding(.vertical, TapSpacing.sm)
                            .padding(.horizontal, TapSpacing.lg)
                            .overlay(Capsule().strokeBorder(TapColors.border, lineWidth: 1))
                            .accessibilityLabel("\(row.gender == .m ? "Men" : "Women") — from their profile")
                    } else {
                        TapChip(
                            title: "Men",
                            isSelected: row.gender == .m,
                            action: { store.updatePlayer(id: row.id) { $0.gender = .m } })
                        TapChip(
                            title: "Women",
                            isSelected: row.gender == .f,
                            action: { store.updatePlayer(id: row.id) { $0.gender = .f } })
                    }
                    Spacer(minLength: 0)
                }

                teeControl(store, row: row)

                // §4.6 B4.9: the course handicap AND its arithmetic, so a
                // surprising number is self-explaining.
                if let line = store.courseHandicapLine(for: row) {
                    Text(line)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                if let issue = store.rowIssue(row), !row.name.isEmpty {
                    Text(issue)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.danger)
                        .fixedSize(horizontal: false, vertical: true)
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

    /// B4.6/B4.13: this row's own tee, chosen from the §4.3-sorted list — every
    /// tee listed, including the ones with no rating for this player's gender,
    /// which are marked rather than hidden.
    private func teeControl(_ store: CreateStore, row: CreateStore.PlayerRow) -> some View {
        let current = store.tee(for: row)
        return TapDropdown(
            label: "Tee",
            placeholder: "Pick a tee",
            title: "Tee",
            selection: store.teeId(for: row),
            groups: CreatePickerRows.tees(store.tees, for: row.gender),
            // Whether this row follows its gender default or was overridden is
            // part of the answer (B4.7) — a row reading just "Röd" cannot be
            // told from one the user set by hand.
            selectedRow: current.map { tee in
                TapDropdownRow(
                    value: tee.id,
                    title: tee.name,
                    marker: row.teeOverridden ? nil : "Default",
                    annotation: TeeOrder.hasRating(tee, for: row.gender)
                        ? nil
                        : TapDropdownAnnotation(
                            CreatePickerRows.noRatingText(for: row.gender), tone: .danger))
            },
            extra: row.teeOverridden
                ? TapDropdownAction(title: "Follow the default") {
                    store.clearPlayerTeeOverride(rowId: row.id)
                }
                : nil,
            onSelect: { store.setPlayerTee(rowId: row.id, teeId: $0) })
            .disabled(store.tees.isEmpty)
    }

    // MARK: - Step 3 — formats

    @ViewBuilder
    private func formatStep(_ store: CreateStore) -> some View {
        heading(
            "What are you playing?",
            subtitle: "Pick one game or several — they're scored side by side on the same round.")

        VStack(spacing: TapSpacing.sm) {
            ForEach(store.catalog.presets(), id: \.id) { descriptor in
                gameCard(store, descriptor: descriptor)
            }
        }

        // B6.10: the way out of the curated grid, and the only thing that opens
        // the advanced surface on a round that has not needed it.
        Button {
            store.addCustomSlot()
        } label: {
            HStack(spacing: TapSpacing.sm) {
                Image(systemName: "slider.horizontal.3")
                Text("Custom game")
            }
        }
        .buttonStyle(.tap(.secondary, fillsWidth: true))

        if !store.formatSlots.isEmpty {
            VStack(alignment: .leading, spacing: TapSpacing.sm) {
                SectionHeader(title: "This round", count: "\(store.formatSlots.count)")
                ForEach(Array(store.formatSlots.enumerated()), id: \.element.id) { index, slot in
                    slotPanel(store, index: index, slot: slot)
                }
            }
        }
    }

    private func gameCard(_ store: CreateStore, descriptor: FormatDescriptor) -> some View {
        let selected = store.isPicked(descriptor.id)
        // B6.5: a game the roster cannot play is DISABLED with its reason, not
        // hidden — and picking it never edits the roster behind the user.
        let issue = store.eligibilityIssue(for: descriptor.id)
        return Button {
            store.toggleFormat(descriptor.id)
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
                    if let issue {
                        Text(issue)
                            .font(TapFont.ui(size: 12.8))
                            .foregroundStyle(TapColors.danger)
                    }
                }
                .padding(TapSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
                .opacity(issue == nil ? 1 : 0.55)
            }
        }
        .buttonStyle(.plain)
        .disabled(issue != nil && !selected)
    }

    /// One format the round will be scored under. Its diagnostics live here,
    /// keyed by the slot's own index — which is the wire's index too (B9.2), so
    /// a refusal about the second game never appears under the first.
    private func slotPanel(
        _ store: CreateStore,
        index: Int,
        slot: CreateStore.FormatSlot
    ) -> some View {
        TapCard {
            VStack(alignment: .leading, spacing: TapSpacing.md) {
                HStack(alignment: .firstTextBaseline, spacing: TapSpacing.sm) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(store.catalog.label(slot.formatId) ?? slot.formatId)
                            .font(TapFont.display(size: 17.6, weight: .semibold))
                            .foregroundStyle(TapColors.text)
                        Text(store.catalog.shapeText(slot.formatId))
                            .font(TapFont.ui(size: 12.8, weight: .medium))
                            .foregroundStyle(TapColors.accent)
                    }
                    Spacer(minLength: 0)
                    if slot.isCustom {
                        Text("CUSTOM")
                            .font(TapFont.ui(size: 10.4, weight: .bold))
                            .tracking(0.6)
                            .foregroundStyle(TapColors.accent)
                    }
                    Button {
                        store.removeSlot(id: slot.id)
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(TapColors.textMuted)
                            .frame(width: 44, height: 44)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Remove \(store.catalog.label(slot.formatId) ?? slot.formatId)")
                }

                // B6.7: exactly the knobs the descriptor declared, with exactly
                // its option sets — never a hardcoded list.
                if let fields = store.catalog.byId(slot.formatId)?.configFields, !fields.isEmpty {
                    ForEach(fields, id: \.key) { field in
                        configField(store, slot: slot, field: field)
                    }
                }

                if slot.isCustom || store.showFlexible {
                    customControls(store, slot: slot)
                }

                ForEach(store.slotDiagnostics(index: index), id: \.self) { message in
                    Text(message)
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.danger)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(TapSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    /// B6.11: the custom slot's own surface — the full catalog (including the
    /// formats that have no card), the allowance, and which players it scores.
    @ViewBuilder
    private func customControls(_ store: CreateStore, slot: CreateStore.FormatSlot) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.sm) {
            // §0 B0.2/B0.4: the full catalog is a long list of long labels, so
            // it is the same collapsed field the course, the start hole and the
            // tees use — not a bare `Menu`, which drew the WORD "Format" rather
            // than the format, hid the answer behind a tap, and shared none of
            // the dropdown's anatomy (44pt, checkmark on the selection, shape
            // line under each row).
            TapDropdown(
                label: "Format",
                placeholder: "Choose format",
                title: "Format",
                selection: slot.formatId,
                groups: CreatePickerRows.formats(store.catalog.descriptors, catalog: store.catalog),
                onSelect: { store.setSlotFormat(id: slot.id, formatId: $0) })

            HStack(spacing: TapSpacing.md) {
                HStack(spacing: TapSpacing.xs) {
                    Text("Allowance")
                        .font(TapFont.ui(size: 12.8, weight: .medium))
                        .foregroundStyle(TapColors.textMuted)
                    TextField(
                        "",
                        text: Binding(
                            get: { store.slot(id: slot.id)?.allowanceText ?? "100" },
                            set: { store.setSlotAllowance(id: slot.id, text: $0) }),
                        prompt: tapFieldPrompt("100"))
                        .keyboardType(.numberPad)
                        .tapField()
                        .frame(maxWidth: 84)
                    Text("%")
                        .font(TapFont.ui(size: 12.8))
                        .foregroundStyle(TapColors.textMuted)
                }
                Spacer(minLength: 0)
            }

            // Who this game scores. A side format scores sides only, so the
            // individual list would be a lie — it is not offered.
            if !store.catalog.isSideFormat(slot.formatId), !store.filledPlayers.isEmpty {
                Text("Scores")
                    .font(TapFont.ui(size: 12.8, weight: .medium))
                    .foregroundStyle(TapColors.textMuted)
                FlowRow(spacing: TapSpacing.sm) {
                    ForEach(store.filledPlayers, id: \.id) { row in
                        TapChip(
                            title: row.name,
                            isSelected: store.isSubjectPlayer(slotId: slot.id, rowId: row.id),
                            tone: .accent,
                            action: {
                                store.setSubjectPlayer(
                                    slotId: slot.id,
                                    rowId: row.id,
                                    included: !store.isSubjectPlayer(slotId: slot.id, rowId: row.id))
                            })
                    }
                }
            }
        }
    }

    /// A knob the FORMAT declared. Generic by construction — the key, the
    /// options and their labels all come off the descriptor, so a format that
    /// grows an option needs no change here.
    private func configField(
        _ store: CreateStore,
        slot: CreateStore.FormatSlot,
        field: FormatConfigField
    ) -> some View {
        VStack(alignment: .leading, spacing: TapSpacing.xs) {
            Text(store.catalog.configLabel(field.labels))
                .font(TapFont.ui(size: 13.6, weight: .medium))
                .foregroundStyle(TapColors.textMuted)
            FlowRow(spacing: TapSpacing.sm) {
                ForEach(field.options, id: \.value) { option in
                    TapChip(
                        title: store.catalog.configLabel(option.labels),
                        isSelected: (slot.config[field.key] ?? field.`default`) == option.value,
                        tone: .accent,
                        action: { store.setConfig(slotId: slot.id, key: field.key, value: option.value) })
                }
            }
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
