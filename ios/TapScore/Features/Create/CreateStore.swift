import Foundation
import Observation

/// The create flow's whole state machine — course, players, formats, submit.
///
/// It is the native image of `src/create/setup.service.ts` for the FRIENDLY
/// path this client offers: no competitions, no playing groups. A round holds
/// MANY format slots (spec §6.2 B6.3) and the teams behind them are ROUND-level,
/// shared between games, exactly as the web shares them. Everything it decides
/// that could be decided wrong lives in pure types it calls (`FormatCatalog`,
/// `CreateDraftBuilder`, `CreateDiagnostics`, `HandicapInput`, `HandicapPad`,
/// `FriendsPicker`, `TeeOrder`), so the parity that matters — the JSON the
/// server receives — is pinned by tests with no view and no network.
///
/// Three contracts are load-bearing:
///
///  1. **Guest ids are minted once.** A row that already minted a guest keeps
///     its id across retries, so a refused draft re-submitted after a fix does
///     not leave a trail of orphan guest players. (The web mints per fresh row
///     because its rows are discarded on success; this flow can be retried in
///     place, so the id is cached.)
///  2. **A refusal is never bare.** Every non-ok create carries
///     `CompilerDiagnostics`; they are bucketed by structured index onto the
///     step — and now the SLOT — that can fix them, never rendered as
///     "something went wrong".
///  3. **Slot order is wire order.** `formatSlots[i]` becomes `formats[i]`, so
///     a diagnostic's `formatIndex`/`slotIndex` names a card the user can see.
@MainActor
@Observable
final class CreateStore {
    // MARK: - Steps

    /// Spec §1.2 B1.1: **Course → Players → Format**, in that order, with the
    /// route and the tee defaults folded into Course and submit living on
    /// Format. The raw values ARE the order — `stepBar` and the gate below
    /// both index by them.
    enum Step: Int, CaseIterable, Sendable, Equatable {
        case course
        case players
        case format

        var title: String {
            switch self {
            case .course: "Course"
            case .players: "Players"
            case .format: "Format"
            }
        }
    }

    /// One roster row. `guestPlayerId` is filled in the first time this row is
    /// submitted and reused thereafter (see contract 1).
    struct PlayerRow: Identifiable, Sendable, Equatable {
        let id: UUID
        var name: String
        var handicapText: String
        var gender: PlayerGender
        var guestPlayerId: String?
        /// Set for a row that plays as a REAL player — the signed-in owner or a
        /// friend picked from the list. No guest is minted for it (B5.10).
        var playerId: String?
        /// The tee this row plays off, set ONLY when the user chose it (spec
        /// §4.5 B4.7). A row that has not been overridden carries `nil` and
        /// reads its tee off the gender default, which is what makes B4.4 and
        /// B4.5 — "follow the default until you don't" — fall out rather than
        /// needing to be re-derived on every change.
        var teeId: String?
        /// The identity behind this row told us its gender, so the control is
        /// LOCKED (B5.26). The web's `genderKnown`: a friend's gender is a fact
        /// about them, not a setting on this round, and letting the round
        /// silently disagree with the profile is how a player ends up scored
        /// off a rating row that is not theirs.
        var genderLocked: Bool
        /// A friend's (or the owner's) name is not this round's to edit (B5.10).
        var nameLocked: Bool

        var teeOverridden: Bool { teeId != nil }
        /// True when the row plays as somebody with an account.
        var isIdentified: Bool { playerId != nil }

        init(
            id: UUID = UUID(),
            name: String = "",
            handicapText: String = "",
            gender: PlayerGender = .m,
            guestPlayerId: String? = nil,
            playerId: String? = nil,
            teeId: String? = nil,
            genderLocked: Bool = false,
            nameLocked: Bool = false
        ) {
            self.id = id
            self.name = name
            self.handicapText = handicapText
            self.gender = gender
            self.guestPlayerId = guestPlayerId
            self.playerId = playerId
            self.teeId = teeId
            self.genderLocked = genderLocked
            self.nameLocked = nameLocked
        }
    }

    /// One format the round is played under. The client-side half of a draft
    /// `formats[]` entry (web: `FormatSlotForm`).
    ///
    /// `isCustom` is the web's "no owning game card". It changes two things and
    /// only two: the card grid does not show the slot as picked, and the slot
    /// is seeded with NO balls — a custom slot scores whoever is ticked, it does
    /// not mint sides behind the user's back (web: `addFormatSlot` vs
    /// `pickGame`). Everything else — allowance, knobs, subjects — is editable
    /// on either kind once the advanced surface is open.
    struct FormatSlot: Identifiable, Sendable, Equatable {
        let id: UUID
        var formatId: String
        /// The allowance AS TYPED, like the web's `allowancePct: string`.
        /// Keeping the text (rather than a number) is what lets the field be
        /// emptied mid-edit without the draft briefly claiming 0% — the same
        /// reason the web keeps it a string and parses at build time.
        var allowanceText: String
        var config: [String: String]
        var isCustom: Bool
        /// Roster ROWS the user ticked out of this slot's individual subjects
        /// (B6.11). Keyed by row id rather than position so removing a row
        /// above cannot silently exclude a different player.
        var excludedRowIds: Set<UUID>

        init(
            id: UUID = UUID(),
            formatId: String,
            allowanceText: String = "100",
            config: [String: String] = [:],
            isCustom: Bool = false,
            excludedRowIds: Set<UUID> = []
        ) {
            self.id = id
            self.formatId = formatId
            self.allowanceText = allowanceText
            self.config = config
            self.isCustom = isCustom
            self.excludedRowIds = excludedRowIds
        }

        /// The number that reaches the wire. Web: `parsePct` — a leading
        /// integer, and 100 for anything that is not one (including the empty
        /// field the user is halfway through retyping).
        var allowancePct: Double {
            let digits = allowanceText.prefix { $0.isNumber }
            return Double(digits) ?? 100
        }
    }

    /// One club's courses, in the order the server listed them. Spec §2.2
    /// B2.1/B2.2: the client groups, it does not re-sort.
    struct CourseGroup: Identifiable, Sendable, Equatable {
        var id: String { clubId }
        var clubId: String
        var clubName: String
        var courses: [SetupCourse]
    }

    // MARK: - Dependencies

    private let api: TapScoreAPI

    init(api: TapScoreAPI) {
        self.api = api
    }

    // MARK: - Catalog state

    private(set) var loading = false
    private(set) var loadError: String?
    private(set) var clubs: [Club] = []
    private(set) var courses: [SetupCourse] = []
    private(set) var tees: [Tee] = []
    private(set) var catalog = FormatCatalog()
    private(set) var loadingTees = false

    // MARK: - Selections

    var step: Step = .course
    var courseSearch = ""
    private(set) var clubId: String?
    private(set) var courseId: String?
    /// The round's two tee defaults (spec §4.4 B4.2). Every roster row that has
    /// not been explicitly overridden plays off the one for its gender.
    private(set) var maleTeeId: String?
    private(set) var femaleTeeId: String?
    /// The played-holes preset — `full_18` / `front_9` / `back_9`. Never
    /// `custom_holes`: that is how a rotated start is ENCODED on the wire
    /// (spec §3.2 B3.5/B3.6), not something the user picks.
    private(set) var routePreset: RoundRoundType = .full18
    private(set) var startHole: Int = 1
    /// The round's formats, in the order they were added — which is the order
    /// they reach the wire (contract 3).
    private(set) var formatSlots: [FormatSlot] = []
    /// The advanced (flexible) surface has been asked for. Web: `customOpen`.
    private(set) var customOpen = false
    /// One row, added to by hand. Spec §5.4 B5.3: never a bank of empty rows.
    private(set) var players: [PlayerRow] = [PlayerRow()]

    // MARK: - Identity

    /// The signed-in player, when there is one. Nil ⇒ signed out, and then the
    /// friends path does not exist at all (B8.2/B8.3) — not "exists but asks
    /// you to log in", which would put an auth wall inside a no-login flow.
    private(set) var owner: Player?
    var isSignedIn: Bool { owner != nil }

    private(set) var friends: [FriendProfile] = []
    private(set) var loadingFriends = false
    private(set) var friendsError: String?
    /// The picker's query. Public so the sheet can bind straight to it.
    var friendSearch = ""

    // MARK: - Submit state

    private(set) var submitting = false
    private(set) var submitError: String?
    private(set) var diagnostics: [CompilerDiagnostic] = []
    /// The roster row behind each `producers[i]` of the attempt those
    /// `diagnostics` came back from, i.e. `builtRowIds[i]` is the row that
    /// became producer `i`.
    ///
    /// It exists because the two indexings differ: producers are built from
    /// `filledPlayers`, so a blank row anywhere above shifts every producer
    /// index below it away from its roster position. Bucketing a refusal by
    /// roster index would then hang "this player needs a name" under the wrong
    /// player — the one thing a per-row diagnostic must never do.
    private(set) var builtRowIds: [UUID] = []
    /// The share token of the round this flow created — the flow's one output.
    private(set) var createdToken: String?
    /// The created round itself, so the shell's device-recent row is complete
    /// the moment it is recorded (same metadata `JoinView` hands over).
    private(set) var createdRound: Round?

    /// What the shell needs to open the new round: the token plus the metadata
    /// that fills its recent-rounds row.
    var openRequest: RoundOpenRequest? {
        guard let createdToken else { return nil }
        return RoundOpenRequest(
            token: createdToken,
            courseName: createdRound?.courseNameSnapshot ?? selectedCourse?.name,
            status: createdRound.flatMap { DeviceRoundStatus(rawValue: $0.status.rawValue) } ?? .notStarted,
            completedAt: createdRound?.completedAt,
            date: createdRound?.date)
    }

    var builder: CreateDraftBuilder { CreateDraftBuilder(catalog: catalog) }

    // MARK: - Loading

    /// Everything the flow needs before it can ask anything: the clubs, their
    /// courses, and the server's format catalog. One pass, because a create
    /// flow that reveals its steps one network call at a time feels broken on
    /// a phone.
    func load() async {
        guard !loading else { return }
        loading = true
        loadError = nil
        defer { loading = false }
        do {
            async let clubs = api.send(SetupEndpoints.clubs)
            async let courses = api.send(SetupEndpoints.courses)
            async let formats = api.send(SetupEndpoints.formats)
            self.clubs = try await clubs
            self.courses = try await courses
            self.catalog = FormatCatalog(descriptors: try await formats)
            ensureDefaultGame()
        } catch {
            loadError = Self.message(for: error, fallback: "Couldn't load courses. Check the connection and try again.")
        }
    }

    /// Spec §6.2 B6.2 (web: `ensureDefaultGame`): the flow opens on ONE slot —
    /// everyone-for-themselves when the server offers it, else the first card,
    /// else the first descriptor. Only ever when the round has no slots, so a
    /// reload cannot mint a second identical leaderboard.
    private func ensureDefaultGame() {
        guard formatSlots.isEmpty else { return }
        if catalog.byId("stableford_individual") != nil {
            addCardSlot("stableford_individual")
            if !formatSlots.isEmpty { return }
        }
        if let first = catalog.presets().first ?? catalog.descriptors.first {
            addCardSlot(first.id)
        }
    }

    /// The friend roster (B5.6/B8.3). Signed out this is never called — the
    /// endpoint is 401-only, and firing it anyway would put a spurious auth
    /// failure in the logs of a flow that is designed to work logged out.
    func loadFriends() async {
        guard isSignedIn, !loadingFriends, friends.isEmpty else { return }
        loadingFriends = true
        friendsError = nil
        defer { loadingFriends = false }
        do {
            friends = try await api.send(FriendsEndpoints.list)
        } catch {
            friendsError = Self.message(for: error, fallback: "Couldn't load your friends.")
        }
    }

    // MARK: - Course step

    /// The whole course list, grouped by club, **in the server's order**.
    ///
    /// `GET /setup/courses` already sorts `clubs.name ASC, courses.name ASC`
    /// (spec §2.1), so the client's only job is to break that flat list at each
    /// club boundary. Re-sorting here would mean two orderings to keep in step
    /// and a client that silently disagrees with the server the day the server
    /// changes its mind (B2.2).
    func courseGroups() -> [CourseGroup] {
        var groups: [CourseGroup] = []
        for course in courses {
            if let last = groups.indices.last, groups[last].clubId == course.clubId {
                groups[last].courses.append(course)
            } else {
                groups.append(CourseGroup(
                    clubId: course.clubId,
                    clubName: clubName(course),
                    courses: [course]))
            }
        }
        return groups
    }

    /// The grouped list narrowed by the search box (spec §2.2 B2.4): a course
    /// survives when its OWN name or its CLUB's name contains the query, case-
    /// and diacritic-insensitively — so `linkoping` finds
    /// `Linköpings Golfklubb` — and a club header survives only if one of its
    /// courses did.
    func filteredCourseGroups() -> [CourseGroup] {
        let query = courseSearch.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return courseGroups() }
        return courseGroups().compactMap { group in
            if Self.matches(group.clubName, query) { return group }
            let hits = group.courses.filter { Self.matches($0.name, query) }
            return hits.isEmpty ? nil : CourseGroup(
                clubId: group.clubId,
                clubName: group.clubName,
                courses: hits)
        }
    }

    /// The course picker is being opened.
    ///
    /// The query belongs to the OPEN list, not to the flow: it survives the
    /// sheet only because the binding does. Reopening on a query typed two
    /// steps ago showed a list filtered down to one club — or B2.5's "No
    /// courses match “vreta”" over a course the user had already picked — as
    /// though the flow had made a choice on their behalf. Nothing else is
    /// reset: this is a search box being cleared, not a selection being
    /// dropped.
    func beginCourseSearch() {
        courseSearch = ""
    }

    /// Case- and diacritic-insensitive containment, against a FIXED locale so
    /// the search behaves the same on a Swedish phone and an English one.
    static func matches(_ haystack: String, _ needle: String) -> Bool {
        haystack.range(
            of: needle,
            options: [.caseInsensitive, .diacriticInsensitive],
            range: nil,
            locale: Locale(identifier: "sv_SE")) != nil
    }

    /// The club's own name when the club list carries it, else the name the
    /// course record already denormalises.
    private func clubName(_ course: SetupCourse) -> String {
        clubs.first { $0.id == course.clubId }?.name ?? course.clubName
    }

    func courses(inClub clubId: String) -> [SetupCourse] {
        courses.filter { $0.clubId == clubId }
    }

    var selectedCourse: SetupCourse? { courses.first { $0.id == courseId } }

    /// Narrow the flow to one club.
    ///
    /// The grouped selector's club names are HEADERS, not controls (B2.1), so
    /// nothing in this flow calls it today — it exists for a caller that offers
    /// a club as a whole. It deliberately does NOT pick a single-course club's
    /// course: an auto-selection nobody asked for is a course change the user
    /// did not make, and B2.10 makes a course change reset the route.
    func selectClub(_ id: String) {
        guard clubId != id else { return }
        clubId = id
        // Picking a different club invalidates the course under it, and the
        // tees under that — a stale tee id would be submitted against a course
        // it does not belong to.
        clearCourseSelection()
    }

    /// Spec §2.6 B2.10: a course change resets the route, the start hole and
    /// the tees — AND NOTHING ELSE. The roster, its names, indices and genders
    /// all survive, because a user correcting the course they picked has not
    /// changed their mind about who is playing.
    func selectCourse(_ id: String) async {
        guard courseId != id else { return }
        courseId = id
        clubId = courses.first { $0.id == id }?.clubId ?? clubId
        clearCourseSelection(keepingCourse: true)
        await loadTees(courseId: id)
    }

    private func clearCourseSelection(keepingCourse: Bool = false) {
        if !keepingCourse { courseId = nil }
        maleTeeId = nil
        femaleTeeId = nil
        tees = []
        routePreset = .full18
        startHole = permittedStartHoles.first ?? 1
        // Overrides are NOT dropped here: which of them the new course can
        // still honour is only knowable once its tees have loaded, so that
        // decision lives in `loadTees` (B2.10).
    }

    /// B2.10, precisely: on a course change, a row is re-defaulted only when
    /// its overridden tee is ABSENT from the new course's list. Clearing every
    /// override instead would silently undo a deliberate per-row choice each
    /// time a user corrected the course they had picked — and on a course that
    /// carries the same tee, the override is still perfectly playable.
    private func dropOverridesAbsent(from tees: [Tee]) {
        let available = Set(tees.map(\.id))
        for index in players.indices {
            if let teeId = players[index].teeId, !available.contains(teeId) {
                players[index].teeId = nil
            }
        }
    }

    private func loadTees(courseId: String) async {
        loadingTees = true
        // The flow-wide notice is shared with `load()`, so a tee failure that
        // is not retried leaves it on screen over a course step that is now
        // perfectly fine. Clear it going in and coming out of a good fetch:
        // the banner must describe the CURRENT state of the flow, not the worst
        // thing that ever happened to it.
        loadError = nil
        defer { loadingTees = false }
        do {
            let loaded = try await api.send(
                SetupEndpoints.teesByCourse,
                CourseRouteTemplatesListByCourseInput(courseId: courseId))
            // A late response for a course the user already moved off must not
            // fill the picker with the wrong tees.
            guard self.courseId == courseId else { return }
            tees = TeeOrder.sorted(loaded)
            dropOverridesAbsent(from: tees)
            maleTeeId = TeeOrder.defaultTee(in: tees, for: .m)?.id
            femaleTeeId = TeeOrder.defaultTee(in: tees, for: .f)?.id
            startHole = permittedStartHoles.first ?? 1
            loadError = nil
        } catch {
            guard self.courseId == courseId else { return }
            // No tee list at all ⇒ no override can be shown to belong to this
            // course, so none survives: a stale id must never reach the wire.
            dropOverridesAbsent(from: [])
            loadError = Self.message(for: error, fallback: "Couldn't load tees for that course.")
        }
    }

    // MARK: - Tees

    /// The round default for a gender (spec §4.4 B4.2).
    func defaultTeeId(for gender: PlayerGender) -> String? {
        gender == .m ? maleTeeId : femaleTeeId
    }

    /// Changing a default moves every row of that gender that was still
    /// following it — and no row the user has overridden (B4.4). That falls out
    /// of storing the override rather than the resolved value: a non-overridden
    /// row holds `nil` and simply reads the new default.
    func setDefaultTee(_ id: String, for gender: PlayerGender) {
        if gender == .m { maleTeeId = id } else { femaleTeeId = id }
    }

    /// The tee a row actually plays off: its override, or its gender's default
    /// (B4.5 — a gender change re-defaults a row that was never overridden).
    func teeId(for row: PlayerRow) -> String? {
        row.teeId ?? defaultTeeId(for: row.gender)
    }

    func tee(for row: PlayerRow) -> Tee? {
        teeId(for: row).flatMap { id in tees.first { $0.id == id } }
    }

    /// Setting a row's tee marks it overridden for good (B4.7).
    func setPlayerTee(rowId: UUID, teeId: String) {
        updatePlayer(id: rowId) { $0.teeId = teeId }
    }

    /// Drop a row's override so it follows its gender's default again.
    func clearPlayerTeeOverride(rowId: UUID) {
        updatePlayer(id: rowId) { $0.teeId = nil }
    }

    /// Spec §4.7 B4.11: the row-scoped reason a tee cannot be played by this
    /// player, in the user's vocabulary and naming no uuid. `nil` when the row
    /// is fine — including when it has no tee yet, which is a different
    /// complaint.
    func teeRatingIssue(for row: PlayerRow) -> String? {
        guard let tee = tee(for: row) else { return nil }
        guard !TeeOrder.hasRating(tee, for: row.gender) else { return nil }
        return "\(tee.name) has no rating for \(row.gender == .m ? "men" : "women") — pick another tee."
    }

    /// Spec §4.6 B4.9/B4.10: the course handicap and the arithmetic behind it,
    /// or nil when a piece is missing (which B4.11 explains instead).
    func courseHandicapLine(for row: PlayerRow) -> String? {
        let text = row.handicapText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty,
              let derivation = CourseHandicap.derive(
                index: HandicapInput.parse(row.handicapText),
                tee: tee(for: row),
                gender: row.gender)
        else { return nil }
        return CourseHandicap.line(derivation, indexText: text)
    }

    // MARK: - Route and start hole

    /// The course's own holes, ascending. Never a hardcoded 1…18 (B3.2): a
    /// nine-hole course must not be offered eighteen.
    var courseHoles: [Int] {
        (selectedCourse?.holes.map { Int($0.holeNumber) } ?? []).sorted()
    }

    var permittedStartHoles: [Int] {
        CreateDraftBuilder.Route.holes(for: routePreset, courseHoles: courseHoles)
    }

    /// The route as the builder wants it. With no course loaded the hole set is
    /// empty, which encodes as the bare preset — the same thing an unrotated
    /// route sends.
    var route: CreateDraftBuilder.Route {
        CreateDraftBuilder.Route(
            preset: routePreset,
            holes: permittedStartHoles,
            startHole: startHole)
    }

    /// Spec §3.2 B3.4: a preset change keeps the start hole when the new hole
    /// set still contains it, otherwise falls to that set's first hole.
    func setRoutePreset(_ preset: RoundRoundType) {
        guard preset != routePreset else { return }
        routePreset = preset
        let holes = permittedStartHoles
        if !holes.contains(startHole) { startHole = holes.first ?? 1 }
    }

    func setStartHole(_ hole: Int) {
        guard permittedStartHoles.contains(hole) || permittedStartHoles.isEmpty else { return }
        startHole = hole
    }

    /// B3.7: the draft already says `postingEligible: false` for a rotated
    /// route; this is what lets the UI say it out loud instead of the user
    /// finding out from a handicap record that never moved.
    var isPostingEligible: Bool { route.isPostingEligible }

    var courseStepComplete: Bool { courseId != nil }

    // MARK: - Format step

    /// The slot a card is currently picked as, if any. A CUSTOM slot on the
    /// same format does not light the card — the card owns a game, the custom
    /// slot owns itself (web: `isGamePicked` reads `picked`, not `formatSlots`).
    func cardSlot(_ formatId: String) -> FormatSlot? {
        formatSlots.first { $0.formatId == formatId && !$0.isCustom }
    }

    func isPicked(_ formatId: String) -> Bool { cardSlot(formatId) != nil }

    /// Card tap. Games are ADDITIVE (B6.3): a card not picked appends a slot, a
    /// picked one removes its slot (B6.4) — including the last, which then
    /// blocks submit with §6.9's sentence rather than silently refusing the tap.
    func toggleFormat(_ formatId: String) {
        if let slot = cardSlot(formatId) {
            removeSlot(id: slot.id)
        } else {
            addCardSlot(formatId)
        }
    }

    private func addCardSlot(_ formatId: String) {
        guard catalog.byId(formatId) != nil else { return }
        // An ineligible card is drawn disabled with its reason (B6.5); refusing
        // the write too means a stale tap can never sneak a slot the roster
        // cannot fill into the draft.
        guard eligibilityIssue(for: formatId) == nil || formatSlots.isEmpty else { return }
        formatSlots.append(FormatSlot(
            formatId: formatId,
            config: catalog.byId(formatId)?.defaults.formatConfig ?? [:]))
        clearSlotDiagnostics()
    }

    /// Spec §6.3 B6.10 (web: `addCustomGame`): a slot for the first descriptor
    /// **nothing is already playing**, plus the advanced surfaces.
    ///
    /// Seeding with the bare default would mint a second `stableford_individual`
    /// on a fresh round and ship two identical leaderboards — which is why the
    /// web looks for a free format rather than reusing `addFormatSlot`'s
    /// default, and why this does too.
    func addCustomSlot() {
        customOpen = true
        let taken = Set(formatSlots.map(\.formatId))
        let fresh = catalog.descriptors.first { !taken.contains($0.id) }
            ?? catalog.descriptors.first
        guard let fresh else { return }
        formatSlots.append(FormatSlot(
            formatId: fresh.id,
            config: fresh.defaults.formatConfig ?? [:],
            isCustom: true))
        clearSlotDiagnostics()
    }

    func removeSlot(id: UUID) {
        formatSlots.removeAll { $0.id == id }
        clearSlotDiagnostics()
    }

    /// B6.6: a format change RE-SEEDS the config from the new format's own
    /// defaults. Carrying the old keys across would put a knob the new strategy
    /// never declared into the draft, and the server would refuse it by name.
    func setSlotFormat(id: UUID, formatId: String) {
        updateSlot(id: id) { slot in
            slot.formatId = formatId
            slot.config = self.catalog.byId(formatId)?.defaults.formatConfig ?? [:]
        }
    }

    func setSlotAllowance(id: UUID, text: String) {
        updateSlot(id: id) { $0.allowanceText = text }
    }

    func setConfig(slotId: UUID, key: String, value: String) {
        updateSlot(id: slotId) { $0.config[key] = value }
    }

    /// B6.11: tick a player in or out of ONE slot's individual subjects. Other
    /// slots are untouched — that is the whole point of a per-slot subject list.
    func setSubjectPlayer(slotId: UUID, rowId: UUID, included: Bool) {
        updateSlot(id: slotId) { slot in
            if included { slot.excludedRowIds.remove(rowId) } else { slot.excludedRowIds.insert(rowId) }
        }
    }

    func isSubjectPlayer(slotId: UUID, rowId: UUID) -> Bool {
        !(slot(id: slotId)?.excludedRowIds.contains(rowId) ?? false)
    }

    func slot(id: UUID) -> FormatSlot? { formatSlots.first { $0.id == id } }

    private func updateSlot(id: UUID, _ mutate: (inout FormatSlot) -> Void) {
        guard let index = formatSlots.firstIndex(where: { $0.id == id }) else { return }
        mutate(&formatSlots[index])
        // B9.9: the user has just edited the thing a refusal pointed at.
        clearSlotDiagnostics()
    }

    /// B6.14: the advanced surfaces stay hidden until something needs them —
    /// the default path is cards only.
    var showFlexible: Bool { customOpen || formatSlots.contains(where: \.isCustom) }

    /// Spec §6.2 B6.5: why this format cannot be played by the CURRENT roster,
    /// or nil when it can. The card is rendered disabled with this beneath it,
    /// never hidden — an unavailable game the user cannot see is an unavailable
    /// game they cannot understand.
    func eligibilityIssue(for id: String) -> String? {
        let filled = max(filledPlayers.count, 0)
        let min = catalog.minPlayers(for: id)
        if filled < min { return "needs at least \(min) players" }
        if let max = catalog.maxPlayers(for: id), filled > max {
            return "seats at most \(max) players"
        }
        return nil
    }

    /// The picked games as the builder sees them — format, balls, who is on
    /// which ball, and which players this slot leaves out.
    ///
    /// Built in SLOT ORDER against a growing team list, which is what
    /// reproduces the web's "set your pairs up once" behavior: the second side
    /// game adopts the first's sides rather than minting a parallel pairing
    /// (web: `pickGame` reads `this.teams` as it stands at pick time).
    var games: [CreateDraftBuilder.Game] {
        let rows = filledPlayers
        let indexByRow = Dictionary(uniqueKeysWithValues: rows.enumerated().map { ($1.id, $0) })
        let builder = self.builder
        var out: [CreateDraftBuilder.Game] = []
        var teams: [CreateDraftBuilder.Composition.Team] = []
        for slot in formatSlots {
            var game: CreateDraftBuilder.Game
            if slot.isCustom {
                // A custom slot has no balls of its own: it scores the ticked
                // players and whatever teams the round already has. Seeding it
                // like a card would invent sides the user never asked for.
                game = CreateDraftBuilder.Game(
                    formatId: slot.formatId,
                    ballCount: 0,
                    ballByPlayer: [:])
            } else {
                game = builder.seedGame(
                    formatId: slot.formatId,
                    rosterCount: rows.count,
                    existingTeams: teams)
            }
            game.allowancePct = slot.allowancePct
            game.config = slot.config
            game.excludedPlayers = Set(slot.excludedRowIds.compactMap { indexByRow[$0] })
            out.append(game)
            teams = builder.compose(games: out, rosterCount: rows.count).teams
        }
        return out
    }

    var formatStepComplete: Bool { !formatSlots.isEmpty }

    // MARK: - Players step

    /// The roster bounds every picked format agrees on: the widest floor and
    /// the tightest ceiling. A round playing two games has to satisfy both.
    var minPlayers: Int {
        max(1, formatSlots.map { catalog.minPlayers(for: $0.formatId) }.max() ?? 1)
    }

    var maxPlayers: Int? {
        formatSlots.compactMap { catalog.maxPlayers(for: $0.formatId) }.min()
    }

    var canAddPlayer: Bool {
        guard let maxPlayers else { return players.count < FormatCatalog.maxTeamSize * 4 }
        return players.count < maxPlayers
    }

    func addPlayer() {
        guard canAddPlayer else { return }
        players.append(PlayerRow())
    }

    /// Drops a roster row. Never the last one — a create flow with no player
    /// rows offers nothing to do.
    ///
    /// A row that already minted a guest player (contract 1) takes its
    /// `guestPlayerId` with it, so that guest is left ORPHANED server-side: it
    /// exists, unclaimed, attached to no round. That is deliberate and it is
    /// the cheap direction of the trade — a guest row is a name and a handicap,
    /// nothing that costs anything to leave lying around, whereas asking the
    /// server to delete it would mean a DELETE this flow can only fire
    /// optimistically (the user may be offline, may background the app) and
    /// whose failure would have to be shown to somebody who has just removed a
    /// player and quite reasonably considers the matter closed.
    func removePlayer(id: UUID) {
        guard players.count > 1 else { return }
        players.removeAll { $0.id == id }
        // A subject tick for a player who is gone would otherwise sit in the
        // slot forever, invisible, ready to exclude whoever inherits the id.
        for index in formatSlots.indices { formatSlots[index].excludedRowIds.remove(id) }
    }

    /// The row with this id, or nil once it has been removed. The read half of
    /// `updatePlayer` — a view binding must resolve the CURRENT row rather than
    /// close over the value it was handed when the body last ran.
    func player(id: UUID) -> PlayerRow? {
        players.first { $0.id == id }
    }

    func updatePlayer(id: UUID, _ mutate: (inout PlayerRow) -> Void) {
        guard let index = players.firstIndex(where: { $0.id == id }) else { return }
        mutate(&players[index])
        // B9.9: a refusal that pointed at this row is now stale.
        clearRowDiagnostics(id)
    }

    /// Tell the flow who is signed in — or that nobody is.
    ///
    /// Spec B5.1: signed in, the roster starts as exactly ONE row, the owner.
    /// That is not "prefill row 1 if it happens to be blank": the whole
    /// starting roster is the owner, because the overwhelmingly common round is
    /// "me and whoever I add next", and a flow that opens on an empty row makes
    /// every single user type their own name.
    func setOwner(_ player: Player?) {
        owner = player
        guard let player, players.count == 1, players[0].name.isEmpty, players[0].playerId == nil
        else { return }
        players[0] = row(forPlayerId: player.id,
                         name: player.displayName,
                         handicapIndex: player.handicapIndex,
                         gender: player.gender,
                         keeping: players[0].id)
    }

    /// B5.12: the owner is offered only while they are not already playing.
    var canAddOwner: Bool {
        guard let owner else { return false }
        return !players.contains { $0.playerId == owner.id }
    }

    func addOwner() {
        guard let owner, canAddOwner, canAddPlayer else { return }
        players.append(row(forPlayerId: owner.id,
                           name: owner.displayName,
                           handicapIndex: owner.handicapIndex,
                           gender: owner.gender))
    }

    /// B5.10: a friend arrives as a row that already knows who it is — real
    /// player id, read-only name, their index, their gender (locked when the
    /// profile knows it). Idempotent (B5.11): a friend already playing is a
    /// no-op, and the picker does not offer them in the first place.
    func addFriend(_ friend: FriendProfile) {
        guard canAddPlayer, !players.contains(where: { $0.playerId == friend.id }) else { return }
        players.append(row(forPlayerId: friend.id,
                           name: friend.displayName,
                           handicapIndex: friend.handicapIndex,
                           gender: friend.gender))
    }

    /// The one shape an identified row has, wherever it came from.
    private func row(
        forPlayerId id: String,
        name: String,
        handicapIndex: Double?,
        gender: PlayerGender?,
        keeping rowId: UUID? = nil
    ) -> PlayerRow {
        PlayerRow(
            id: rowId ?? UUID(),
            name: name,
            handicapText: handicapIndex.map { HandicapInput.format($0) } ?? "",
            // Unknown gender defaults to M and stays EDITABLE (B5.10) — a
            // default nobody can correct is worse than no default.
            gender: gender ?? .m,
            playerId: id,
            genderLocked: gender != nil,
            nameLocked: true)
    }

    /// The picker, as a value: who is offered, in what order, filtered by the
    /// current query (B5.7/B5.8/B5.11).
    var friendsPicker: FriendsPicker {
        FriendsPicker(
            friends: friends,
            excludedPlayerIds: Set(players.compactMap(\.playerId)),
            query: friendSearch)
    }

    /// Rows with a name — the ones that will become producers.
    var filledPlayers: [PlayerRow] {
        players.filter { !$0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }

    /// Spec §5.9 B5.28: why THIS row is not ready, in the user's vocabulary.
    /// The gate below uses the same text so the two can never say different
    /// things.
    ///
    /// A row is complete only with a **parseable** index — B5.28 says so, and
    /// §9.1's `missing_index` is the web's own pre-check for the blank field.
    /// The keypad may still be dismissed empty (B5.21); that clears the value,
    /// it does not make the round submittable with an index nobody stated. The
    /// alternative — scratch by default — is a wrong scorecard that looks like
    /// a right one, and every stroke of it is silently wrong.
    ///
    /// The sentences come from `CreateDraftBuilder` so the local gate and the
    /// pre-flight refusal are literally the same text.
    func rowIssue(_ row: PlayerRow) -> String? {
        let name = row.name.trimmingCharacters(in: .whitespacesAndNewlines)
        if name.isEmpty { return "Name required." }
        if row.handicapText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return CreateDraftBuilder.missingIndexMessage(name: name)
        }
        if HandicapInput.parse(row.handicapText) == nil {
            return CreateDraftBuilder.invalidIndexMessage(name: name)
        }
        if teeId(for: row) == nil { return "\(name) has no tee — pick one." }
        if let issue = teeRatingIssue(for: row) { return issue }
        return nil
    }

    /// Spec §5.10 B5.29/B5.30: why the Players step cannot be left forward.
    var rosterBlocker: String? {
        if filledPlayers.isEmpty { return "Add at least one player." }
        for row in players {
            if let issue = rowIssue(row) { return issue }
        }
        return nil
    }

    /// Spec §1.2 B1.2/B1.3: why THIS step cannot be left forward, or nil when
    /// it can. The advance control is disabled with this as its reason — never
    /// a silent no-op.
    func advanceBlocker(from step: Step) -> String? {
        switch step {
        case .course: courseId == nil ? "Pick a course first." : nil
        case .players: rosterBlocker
        case .format: blocker
        }
    }

    /// Why the flow cannot submit yet, or nil when it can. One sentence, in the
    /// vocabulary of the step it belongs to.
    var blocker: String? {
        guard courseId != nil else { return "Pick a course first." }
        if let rosterBlocker { return rosterBlocker }
        // B6.9 — removing the last slot is allowed, and this is what says so.
        guard !formatSlots.isEmpty else { return "Add at least one format." }
        let filled = filledPlayers.count
        for slot in formatSlots {
            let name = catalog.label(slot.formatId) ?? "This game"
            let min = catalog.minPlayers(for: slot.formatId)
            if filled < min {
                return "\(name) needs \(min) players — \(min - filled) more to go."
            }
            if let max = catalog.maxPlayers(for: slot.formatId), filled > max {
                return "\(name) seats \(max) players — remove \(filled - max)."
            }
        }
        return nil
    }

    var canSubmit: Bool { blocker == nil && !submitting }

    // MARK: - Submit

    /// Pre-flight, mint the guests, build the draft, POST it. Returns the new
    /// round's share token, or nil when the flow refused or the server did.
    ///
    /// The ORDER is contractual (B9.7): every local check runs before the first
    /// network call, so a refusal the flow could see coming costs zero
    /// requests. Minting first — as this did — left a trail of orphan guest
    /// players behind a submit that was never going to be posted, one pair per
    /// attempt, for a mistake the client had already spotted.
    @discardableResult
    func submit() async -> String? {
        guard let courseId, !formatSlots.isEmpty, !submitting else { return nil }
        submitting = true
        submitError = nil
        diagnostics = []
        builtRowIds = []
        defer { submitting = false }

        let rows = filledPlayers
        // Producer i came from this row. Recorded BEFORE anything can fail, so
        // a refusal always has a mapping to bucket by.
        builtRowIds = rows.map(\.id)
        // Captured BEFORE the guest round-trips: `games` reads `filledPlayers`,
        // and a roster edited mid-flight must not renumber the balls under the
        // draft that is already being built.
        let built = self.games

        // The producers as far as the CLIENT can resolve them. Everything
        // pre-flight judges — name, index, tee, gender — is already known
        // locally; only the identity reference needs the network, and a row
        // still waiting for its guest carries an empty one, which pre-flight
        // does not look at.
        var players = rows.map { row in
            CreateDraftBuilder.Player(
                name: row.name.trimmingCharacters(in: .whitespacesAndNewlines),
                handicapText: row.handicapText,
                handicapIndex: HandicapInput.parse(row.handicapText) ?? 0,
                // Per PRODUCER, never round-level (spec §4.5 B4.8): the row's
                // own override, or its gender's default.
                teeId: teeId(for: row) ?? "",
                gender: row.gender,
                ref: row.playerId.map { .player($0) } ?? .guest(row.guestPlayerId ?? ""))
        }

        // B9.7: a client-side refusal makes NO network request — not even the
        // guest mint, which would otherwise be the one side effect of a submit
        // that never happened.
        let local = builder.preflight(games: built, players: players)
        if !local.isEmpty {
            diagnostics = local
            return nil
        }

        do {
            for (i, row) in rows.enumerated() {
                // Contract 1: a row that already minted a guest keeps its id,
                // so a retry after a SERVER refusal does not orphan the first.
                guard row.playerId == nil, row.guestPlayerId == nil else { continue }
                let guest = try await api.send(
                    GuestPlayersEndpoints.create,
                    GuestPlayersCreateInput(
                        handicapIndex: .value(players[i].handicapIndex),
                        displayName: players[i].name,
                        gender: row.gender))
                updatePlayer(id: row.id) { $0.guestPlayerId = guest.id }
                players[i].ref = .guest(guest.id)
            }

            let draft = builder.draft(
                courseId: courseId,
                route: route,
                games: built,
                players: players)
            let result = try await api.send(
                FriendlyRoundsEndpoints.create,
                FriendlyRoundsCreateInput(draft: draft))
            switch result {
            case .notOk(let refusal):
                diagnostics = refusal.diagnostics
                // Contract 2 has a floor. A refusal that carries NO diagnostics
                // would otherwise render as nothing at all: the Create button
                // un-busies, the screen does not move, and the flow looks
                // broken rather than refused. The server should never do this —
                // when it does, say so plainly instead of saying nothing.
                if refusal.diagnostics.isEmpty {
                    submitError = "The server refused this setup but didn't say why. Try again."
                }
                return nil
            case .ok(let ok):
                createdRound = ok.round
                createdToken = ok.friendlyRound.shareToken
                return ok.friendlyRound.shareToken
            }
        } catch {
            submitError = Self.message(for: error, fallback: "Could not create the round. Try again.")
            return nil
        }
    }

    // MARK: - Diagnostics for the view

    /// The refusals that belong to format slot `index` — which is the same
    /// index the wire uses (contract 3), so `formatIndex`/`slotIndex` lands on
    /// the card the user is looking at without anybody parsing a `path`.
    func slotDiagnostics(index: Int) -> [String] {
        CreateDiagnostics.forFormatCard(diagnostics, index: index).map(humanize)
    }

    /// The Players step's BANNER — producer-scoped refusals that no visible row
    /// is already showing inline.
    ///
    /// Every row renders its own (B9.1), so a banner over the same list would
    /// say each of them twice: once at the top, once under the player it is
    /// about. What can only appear here is a producer index the current roster
    /// no longer maps to — a row removed since the attempt — which would
    /// otherwise vanish entirely.
    var playerDiagnostics: [String] {
        let rendered = Set(players.compactMap { builtRowIds.firstIndex(of: $0.id) })
        return CreateDiagnostics.forPlayers(diagnostics, excludingRows: rendered).map(humanize)
    }

    /// Spec §9.2 B9.3: refusals about the ROUTE, rendered on the Course step
    /// where the route and the start hole live.
    var routeDiagnostics: [String] {
        CreateDiagnostics.forRoute(diagnostics).map(humanize)
    }

    /// The refusals that belong under roster row `id`.
    ///
    /// Keyed by ROW, not by roster position: `producers[i]` counts only the
    /// filled rows, so a blank row above shifts the numbering. `builtRowIds`
    /// is the map back, recorded by the attempt these diagnostics came from —
    /// which is also why a row added or removed since that attempt simply has
    /// no diagnostics rather than inheriting somebody else's.
    func playerDiagnostics(rowId id: UUID) -> [String] {
        guard let index = builtRowIds.firstIndex(of: id) else { return [] }
        return CreateDiagnostics.forPlayerRow(diagnostics, index: index).map(humanize)
    }

    var generalDiagnostics: [String] {
        CreateDiagnostics.general(diagnostics).map(humanize)
    }

    /// The step a refusal belongs to — what the flow jumps back to so the user
    /// lands where the fix is. Earliest step first (B9.7).
    var diagnosticsStep: Step? {
        stepsWithErrors.min { $0.rawValue < $1.rawValue }
    }

    /// Spec §9.2 B9.8: which steps carry a refusal, so an error on a step the
    /// user has navigated away from is still discoverable from the step bar.
    var stepsWithErrors: Set<Step> {
        var out: Set<Step> = []
        // B9.3: the route lives on the Course step, so a route refusal marks
        // COURSE — the step whose controls can actually fix it.
        if !CreateDiagnostics.forRoute(diagnostics).isEmpty { out.insert(.course) }
        if !CreateDiagnostics.forPlayers(diagnostics).isEmpty { out.insert(.players) }
        if diagnostics.contains(where: { CreateDiagnostics.formatCardIndex($0) != nil }) {
            out.insert(.format)
        }
        return out
    }

    /// B9.9 — the user has edited a slot, so every slot-scoped refusal from the
    /// previous attempt is stale. Cleared as a group rather than per index:
    /// adding or removing a slot RENUMBERS the rest, so keeping the others
    /// would re-point them at cards they were never about.
    private func clearSlotDiagnostics() {
        guard !diagnostics.isEmpty else { return }
        diagnostics.removeAll { CreateDiagnostics.formatCardIndex($0) != nil }
    }

    private func clearRowDiagnostics(_ id: UUID) {
        guard !diagnostics.isEmpty, let index = builtRowIds.firstIndex(of: id) else { return }
        diagnostics.removeAll { $0.path?.hasPrefix("producers[\(index)]") == true }
    }

    private func humanize(_ d: CompilerDiagnostic) -> String {
        CreateDiagnostics.humanize(d) { [catalog] id in catalog.label(id) }
    }

    private static func message(for error: any Error, fallback: String) -> String {
        switch error {
        case APIError.unauthorized: "Your session expired — sign in again."
        case APIError.server(_, let message?): message
        default: fallback
        }
    }
}
