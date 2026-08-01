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
        /// The display name the guest identity behind this row currently has
        /// server-side — hydrated from the round's balls in edit mode, stamped
        /// at mint time for a row minted mid-edit. `saveEdits` compares it to
        /// the trimmed `name` and renames the stored guest through the
        /// token-scoped rename endpoint when they differ; the draft itself
        /// carries only the guest REF, so without this the rename would be
        /// silently dropped. Nil on rows that are not renameable this way
        /// (real players, create-mode rows with no round token yet).
        var guestOriginalName: String?
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
        /// The `producers[].producerDefId` this row IS, when the row came from a
        /// stored draft. It is what a scored ball is addressed by and what the
        /// server's `producer_has_scores` guard reads, so it survives hydrate →
        /// edit → save verbatim. Nil on a row added in this session — the edit
        /// path mints one before submitting.
        var producerDefId: String?

        var teeOverridden: Bool { teeId != nil }
        /// True when the row plays as somebody with an account.
        var isIdentified: Bool { playerId != nil }

        init(
            id: UUID = UUID(),
            name: String = "",
            handicapText: String = "",
            gender: PlayerGender = .m,
            guestPlayerId: String? = nil,
            guestOriginalName: String? = nil,
            playerId: String? = nil,
            teeId: String? = nil,
            genderLocked: Bool = false,
            nameLocked: Bool = false,
            producerDefId: String? = nil
        ) {
            self.id = id
            self.name = name
            self.handicapText = handicapText
            self.gender = gender
            self.guestPlayerId = guestPlayerId
            self.guestOriginalName = guestOriginalName
            self.playerId = playerId
            self.teeId = teeId
            self.genderLocked = genderLocked
            self.nameLocked = nameLocked
            self.producerDefId = producerDefId
        }
    }

    /// A group of roster rows who share ONE physical ball — a scramble pair, a
    /// foursome (proposal `docs/proposals/ball-teams-composition.md`).
    ///
    /// Round-level, never per game: pair up once in the Players step and every
    /// game of the round ranks the same two team-balls. It becomes a
    /// `single_ball` entry in the draft's `teams[]`, which is the same document
    /// field the web's flexible editor writes — so this is a second way to say
    /// an existing thing, not a new concept on the wire.
    ///
    /// Not to be confused with a `multi_ball` SIDE, which is derived from a
    /// game's ball assignment and never hand-built here.
    struct BallTeam: Identifiable, Sendable, Equatable {
        let id: UUID
        /// Roster row ids, in SEEDING ORDER — playing handicap ascending, which
        /// is the order the allowance recipe is indexed by (position 1 = lowest
        /// handicap). Re-sorted on every re-seed.
        var memberRowIds: [UUID]
        /// A `FormationCatalog` id — `scramble` / `foursomes` / `greensomes`.
        /// Never `custom`: that formation has no recipe and no bounds, and it
        /// is reachable only from the web flexible editor.
        var formationId: String
        /// A member's allowance % was edited by hand, so seeding stops for
        /// good: "defaults are computed, overrides are sticky". A team hydrated
        /// from a stored draft is ALWAYS customized — its percentages were
        /// frozen by whoever set the round up, and re-deriving them from a
        /// recipe would silently rewrite somebody's scorecard.
        var customized: Bool
        /// Row id → allowance %. Seeded from the formation's recipe.
        var pctByRow: [UUID: Double]
        /// Row id → what the user has TYPED into the allowance field, kept
        /// exactly as typed. The field cannot be backed by `pctByRow` alone:
        /// re-deriving the text from the number on every read snaps a blanked
        /// box straight back to its old value (so it can never be retyped), and
        /// truncates a hydrated 62.5 the moment anything else on the card
        /// changes. Text in, number out — the same split `handicapText` uses.
        var pctTextByRow: [UUID: String]
        /// The stored `teams[].id` this team round-trips as, and its stored
        /// label. Edit mode only; nil for a team paired up in this session.
        /// They exist so a save REPLACES the stored team in place rather than
        /// dropping it and minting a differently-identified one.
        var sourceTeamId: String?
        var sourceLabel: String?

        init(
            id: UUID = UUID(),
            memberRowIds: [UUID] = [],
            formationId: String,
            customized: Bool = false,
            pctByRow: [UUID: Double] = [:],
            pctTextByRow: [UUID: String] = [:],
            sourceTeamId: String? = nil,
            sourceLabel: String? = nil
        ) {
            self.id = id
            self.memberRowIds = memberRowIds
            self.formationId = formationId
            self.customized = customized
            self.pctByRow = pctByRow
            self.pctTextByRow = pctTextByRow
            self.sourceTeamId = sourceTeamId
            self.sourceLabel = sourceLabel
        }

        /// The allowance actually applied to a member: what they typed when it
        /// parses to a number, the seeded percentage otherwise.
        ///
        /// Clamped HERE rather than while typing, so a half-typed "1000" is not
        /// rewritten under the caret. A share of a handicap larger than the
        /// handicap is not a thing to express on this card; the web flexible
        /// editor is where exotic percentages live.
        func allowance(_ rowId: UUID) -> Double? {
            if let typed = pctTextByRow[rowId], let pct = HandicapInput.parse(typed) {
                return Swift.min(Swift.max(pct, 0), 100)
            }
            return pctByRow[rowId]
        }

        /// A shared ball needs at least a pair — the same liveness rule the
        /// draft applies (`Composition.liveTeams`, web `isTeamLive`). A
        /// half-built team of one is not a ball; its member is still their own.
        var isLive: Bool { memberRowIds.count >= 2 }
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
        /// The entry of the LOADED draft's `formats[]` this slot was hydrated
        /// from (edit mode only). It is what lets a save CARRY a slot's stored
        /// shape — subjects, ball sources, a split allowance — rather than
        /// rebuild it from controls that cannot express it. Nil on a slot added
        /// in this session, which has nothing to carry.
        var sourceIndex: Int?

        init(
            id: UUID = UUID(),
            formatId: String,
            allowanceText: String = "100",
            config: [String: String] = [:],
            isCustom: Bool = false,
            excludedRowIds: Set<UUID> = [],
            sourceIndex: Int? = nil
        ) {
            self.id = id
            self.formatId = formatId
            self.allowanceText = allowanceText
            self.config = config
            self.isCustom = isCustom
            self.excludedRowIds = excludedRowIds
            self.sourceIndex = sourceIndex
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
    /// The shared-ball formations and their seeding recipes. Fetched with the
    /// format catalog, and EMPTY when that fetch failed — in which case ball
    /// teams simply cannot be built this session (there is no local fallback
    /// table; see `FormationCatalog`).
    private(set) var formations = FormationCatalog()
    private(set) var loadingTees = false

    // MARK: - Selections

    var step: Step = .course
    /// What the organizer calls this round. The FIRST question of the flow,
    /// pre-filled with `DefaultRoundName` so the common case is "accept it and
    /// move on" — it is a LABEL for telling rounds apart in the list, never an
    /// identifier, so it is neither required nor unique. Trimmed at the wire,
    /// never here: trimming as the user types eats the space between two words.
    var roundName = ""
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
    private(set) var routePreset: RoundType = .full18
    private(set) var startHole: Int = 1
    /// The round's formats, in the order they were added — which is the order
    /// they reach the wire (contract 3).
    private(set) var formatSlots: [FormatSlot] = []
    /// The advanced (flexible) surface has been asked for. Web: `customOpen`.
    private(set) var customOpen = false
    /// One row, added to by hand. Spec §5.4 B5.3: never a bank of empty rows.
    private(set) var players: [PlayerRow] = [PlayerRow()]
    /// The round's shared balls, in the order they were built — which is the
    /// order they take their positional `Team A/B…` labels in.
    private(set) var ballTeams: [BallTeam] = []
    /// In EDIT mode, the stored `teams[]` ids `EditDraftHydration` took over —
    /// the exact set `saveEdits` is allowed to replace. Every other stored team
    /// passes through untouched, whatever it looks like from here.
    private(set) var managedTeamIds: Set<String> = []
    /// A new team defaults to the last formation chosen, which covers
    /// "everyone plays scramble" with no extra concept (proposal §Seeding).
    private var lastFormationId: String?

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
            name: createdRound?.name,
            status: createdRound.flatMap { DeviceRoundStatus(rawValue: $0.status.rawValue) } ?? .notStarted,
            completedAt: createdRound?.completedAt,
            date: createdRound?.date)
    }

    var builder: CreateDraftBuilder {
        CreateDraftBuilder(catalog: catalog, formations: formations)
    }

    // MARK: - Edit mode

    /// Why a round the flow was asked to edit cannot be edited. All three are
    /// dead ends with a way back, never a form the user can fill in and have
    /// refused (spec B3).
    enum EditBlockedReason: Sendable, Equatable {
        case roundComplete
        case noStoredDraft
        case openSeats

        var message: String {
            switch self {
            case .roundComplete:
                "This round is complete — its setup can no longer be edited."
            case .noStoredDraft:
                "This round didn't come from the setup wizard, so it can't be edited here."
            case .openSeats:
                "This round has open seats waiting to be claimed — the wizard cannot edit it yet."
            }
        }
    }

    /// The share token of the round being edited. Nil ⇒ this is a create flow.
    /// NEVER logged: the token is the round's write credential.
    private(set) var editToken: String?
    /// The draft this edit started from — the document a save REPLACES, and so
    /// the source of every field the flow does not surface (B7).
    private(set) var loadedDraft: CompetitionsCreateRoundOutputOkDraft?
    private(set) var editHydrated = false
    private(set) var editBlockedReason: EditBlockedReason?
    /// The round has scores, so the course and the route are settled (B4).
    private(set) var hasScores = false
    /// The edit was accepted by the server.
    private(set) var editSaved = false

    var isEditing: Bool { editToken != nil }

    /// B4: the two controls a scored round cannot move. Everything else — the
    /// roster, the tees, the formats — stays editable.
    var courseRouteLocked: Bool { isEditing && hasScores }

    static let courseRouteLockNotice =
        "Scores have been recorded — the course and route are locked for this round."

    // MARK: - Loading

    /// Seeds the name field with today's default ("Game 30 Jul 2026" / "Spel
    /// …"), stepped past whatever the caller already has on this device so two
    /// rounds on one day do not read as the same round in the list.
    ///
    /// Create mode only, and only while the field is untouched: hydrating an
    /// edit must show the round's stored name, and a user who typed one must
    /// not have it replaced by a later call.
    func seedDefaultName(existing: [String], now: Date = Date(), locale: Locale = .current) {
        guard roundName.isEmpty else { return }
        roundName = DefaultRoundName.make(on: now, locale: locale, existing: existing)
    }

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
            // The one OPTIONAL fetch of the flow. Shared balls are an addition
            // to a create flow that has always worked without them, so a
            // catalog that will not load must not take the whole flow down with
            // it — the section is simply unavailable (`ballTeamsAvailable`).
            async let formations = api.send(SetupEndpoints.formations)
            self.clubs = try await clubs
            self.courses = try await courses
            self.catalog = FormatCatalog(descriptors: try await formats)
            self.formations = FormationCatalog(descriptors: (try? await formations) ?? [])
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
        // B4: a scored round's course is settled. The control is drawn disabled
        // too, but refusing the write means a stale tap cannot move a round
        // whose balls are already addressed to this course's tees.
        guard !courseRouteLocked else { return }
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
            // The course (and so every course handicap) has changed under the
            // roster; untouched shared balls re-order and re-seed.
            reseedBallTeams()
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
        // Every non-overridden row of that gender just moved tee, and with it
        // its course handicap — which is the order shared balls seed by.
        reseedBallTeams()
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

    // MARK: - Ball teams

    /// The Players-step section can be offered at all: the server told us what
    /// the formations are.
    var ballTeamsAvailable: Bool { formations.isAvailable }

    /// The team this row shares a ball with, or nil when it plays its own.
    func ballTeam(containing rowId: UUID) -> BallTeam? {
        ballTeams.first { $0.memberRowIds.contains(rowId) }
    }

    /// Rows on their own ball — the ones a new team can still be built from.
    var unpairedPlayers: [PlayerRow] {
        let paired = Set(ballTeams.flatMap(\.memberRowIds))
        return players.filter { !paired.contains($0.id) }
    }

    /// The formation a brand-new first team opens on. Scramble, because it is
    /// the shared ball people actually turn up wanting to play; the catalog's
    /// own first entry is whatever sorts first by id (Foursomes), which is an
    /// alphabet, not an intention.
    private static let openingFormationId = "scramble"

    /// Start a shared ball. Nil when the catalog never loaded, or when the id
    /// is not one of its formations — `custom` included, deliberately.
    @discardableResult
    func addBallTeam(formationId: String? = nil) -> UUID? {
        let opening = formations.byId(Self.openingFormationId)?.id
        let id = formationId ?? lastFormationId ?? opening ?? formations.descriptors.first?.id
        guard let id, formations.byId(id) != nil else { return nil }
        lastFormationId = id
        let team = BallTeam(formationId: id)
        ballTeams.append(team)
        return team.id
    }

    func removeBallTeam(id: UUID) {
        ballTeams.removeAll { $0.id == id }
    }

    /// Put a row on a shared ball. Refused — rather than silently clamped —
    /// when the formation is full (a foursome takes no third player) or the row
    /// already shares a different ball. Returns whether it happened, so the
    /// caller does not have to re-derive the rule to know.
    @discardableResult
    func addBallTeamMember(rowId: UUID, to teamId: UUID) -> Bool {
        guard let at = ballTeams.firstIndex(where: { $0.id == teamId }),
              players.contains(where: { $0.id == rowId }),
              ballTeam(containing: rowId) == nil,
              let size = formations.size(ballTeams[at].formationId),
              ballTeams[at].memberRowIds.count < size.max
        else { return false }
        ballTeams[at].memberRowIds.append(rowId)
        reseedBallTeams()
        return true
    }

    func removeBallTeamMember(rowId: UUID, from teamId: UUID) {
        guard let at = ballTeams.firstIndex(where: { $0.id == teamId }) else { return }
        ballTeams[at].memberRowIds.removeAll { $0 == rowId }
        ballTeams[at].pctByRow.removeValue(forKey: rowId)
        ballTeams[at].pctTextByRow.removeValue(forKey: rowId)
        reseedBallTeams()
    }

    /// Change a team's formation. Refused when the current membership does not
    /// fit the new bounds — three players cannot become a foursome, and
    /// dropping one of them to make it fit is not this control's decision.
    @discardableResult
    func setBallTeamFormation(_ formationId: String, teamId: UUID) -> Bool {
        guard let at = ballTeams.firstIndex(where: { $0.id == teamId }),
              formations.byId(formationId) != nil,
              formations.fits(formationId, memberCount: ballTeams[at].memberRowIds.count)
                  || ballTeams[at].memberRowIds.count < 2
        else { return false }
        ballTeams[at].formationId = formationId
        lastFormationId = formationId
        // A formation change re-seeds an untouched team — the recipe IS the
        // formation, so keeping foursomes' 50/50 under greensomes would be the
        // one number the user did not choose and cannot explain.
        reseedBallTeams()
        return true
    }

    /// Override one member's allowance, as TYPED. Sticky by design: from here
    /// on the team's numbers are the user's, and no membership or handicap
    /// change re-seeds over them (proposal §Seeding semantics).
    ///
    /// Every keystroke lands, including the empty string — a box being cleared
    /// on the way to a new number has to be able to look cleared. The seeded
    /// number underneath is what a blank still counts as until a digit replaces
    /// it, so no member is ever silently scored at 0%.
    func setBallTeamAllowanceText(_ text: String, rowId: UUID, teamId: UUID) {
        guard let at = ballTeams.firstIndex(where: { $0.id == teamId }),
              ballTeams[at].memberRowIds.contains(rowId)
        else { return }
        ballTeams[at].customized = true
        ballTeams[at].pctTextByRow[rowId] = text
    }

    /// Recompute every untouched team's member order and percentages.
    ///
    /// Runs on any change that can move them — membership, handicap, gender,
    /// tee, the round's tee defaults — because the recipe is indexed by PLAYING
    /// HANDICAP position, so a handicap edit can reorder a team that nobody
    /// touched. A customized team is left alone except for bookkeeping: rows
    /// that left the roster leave the team, and a member with no number yet
    /// still gets one (a blank allowance is not an override, it is a gap).
    func reseedBallTeams() {
        let byRow = Dictionary(uniqueKeysWithValues: players.map { ($0.id, $0) })
        for index in ballTeams.indices {
            var team = ballTeams[index]
            team.memberRowIds.removeAll { byRow[$0] == nil }
            let members = Set(team.memberRowIds)
            team.pctByRow = team.pctByRow.filter { members.contains($0.key) }
            team.pctTextByRow = team.pctTextByRow.filter { members.contains($0.key) }

            if !team.customized {
                // Playing handicap ASCENDING, ties broken by roster position so
                // the order is stable rather than dependent on sort internals.
                let position = Dictionary(
                    uniqueKeysWithValues: players.enumerated().map { ($1.id, $0) })
                team.memberRowIds.sort { lhs, rhs in
                    let l = byRow[lhs].map(seedingKey) ?? (1, 0)
                    let r = byRow[rhs].map(seedingKey) ?? (1, 0)
                    if l.0 != r.0 { return l.0 < r.0 }
                    if l.1 != r.1 { return l.1 < r.1 }
                    return (position[lhs] ?? 0) < (position[rhs] ?? 0)
                }
                team.pctByRow = [:]
                team.pctTextByRow = [:]
            }

            let recipe = formations.allowances(team.formationId, memberCount: team.memberRowIds.count)
            for (at, rowId) in team.memberRowIds.enumerated() where team.pctByRow[rowId] == nil {
                // 100 is the fallback for a size the formation has no recipe
                // for — the neutral allowance, and the one a stroke-play round
                // would have used anyway.
                team.pctByRow[rowId] = recipe.map { $0[at] } ?? 100
            }
            ballTeams[index] = team
        }
    }

    /// The number a team's members are ordered by: the COURSE handicap when the
    /// course and the row's tee make one derivable, and the raw index
    /// otherwise — a roster whose course is not picked yet still has to sort,
    /// and the index is the same ordering as long as everyone plays one tee.
    func seedingHandicap(_ row: PlayerRow) -> Double {
        let index = HandicapInput.parse(row.handicapText) ?? 0
        if let derivation = CourseHandicap.derive(
            index: index, tee: tee(for: row), gender: row.gender) {
            return Double(derivation.value)
        }
        return index
    }

    /// The sort key behind that number, with the one thing the number alone
    /// cannot say: whether it is a COURSE handicap at all.
    ///
    /// A row whose course handicap is not derivable falls back to the raw
    /// index, which on nearly every course is the SMALLER number — so ordering
    /// on it alone would sort the unknown row to the front and hand it the
    /// formation's top allowance slot (scramble's 35%). Unknowns sort LAST
    /// instead: the lowest allowance is the conservative place for a row we
    /// cannot yet measure, and the order settles itself the moment a tee lands.
    private func seedingKey(_ row: PlayerRow) -> (Int, Double) {
        let index = HandicapInput.parse(row.handicapText) ?? 0
        guard let derivation = CourseHandicap.derive(
            index: index, tee: tee(for: row), gender: row.gender)
        else { return (1, index) }
        return (0, Double(derivation.value))
    }

    /// The ball teams as the DRAFT BUILDER speaks them: roster indices over
    /// `filledPlayers`, keyed `1…n` so they take the first `Team A/B…` letters.
    ///
    /// A team whose members have all been removed or blanked out disappears
    /// here rather than reaching pre-flight as an empty complaint; a team of
    /// one survives, because that one IS a complaint.
    func ballTeamComposition(rows: [PlayerRow]) -> [CreateDraftBuilder.Composition.Team] {
        let indexByRow = Dictionary(uniqueKeysWithValues: rows.enumerated().map { ($1.id, $0) })
        var out: [CreateDraftBuilder.Composition.Team] = []
        for team in ballTeams {
            let members = team.memberRowIds.compactMap { indexByRow[$0] }
            guard !members.isEmpty else { continue }
            out.append(CreateDraftBuilder.Composition.Team(
                key: out.count + 1,
                kind: .singleBall,
                formation: team.formationId,
                members: members,
                pctByPlayer: Dictionary(
                    uniqueKeysWithValues: members.map { ($0, team.allowance(rows[$0].id) ?? 100) })))
        }
        return out
    }

    /// The round's BALL ROSTER — one ball per live shared team, one per player
    /// on their own. What format cards are judged against once teams exist.
    var ballUnits: [CreateDraftBuilder.BallUnit] {
        let rows = filledPlayers
        return CreateDraftBuilder.ballUnits(
            rosterCount: rows.count, ballTeams: ballTeamComposition(rows: rows))
    }

    /// The round has at least one live shared ball, so the ball roster and the
    /// player roster are different things.
    var hasBallTeams: Bool { ballUnits.contains { $0.teamKey != nil } }

    /// Combined playing handicap of a shared ball: `round(Σ memberCH × pct%)`
    /// (proposal, "Team row states the consequence in plain words"). Nil while
    /// a member's course handicap cannot be derived — the honest answer, rather
    /// than a total that quietly counts them as scratch.
    func combinedHandicap(_ team: BallTeam) -> Int? {
        guard !team.memberRowIds.isEmpty else { return nil }
        var total = 0.0
        for rowId in team.memberRowIds {
            guard let row = player(id: rowId),
                  let derivation = CourseHandicap.derive(
                    index: HandicapInput.parse(row.handicapText),
                    tee: tee(for: row),
                    gender: row.gender)
            else { return nil }
            total += Double(derivation.value) * (team.allowance(rowId) ?? 100) / 100
        }
        return Int((total).rounded())
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
    func setRoutePreset(_ preset: RoundType) {
        guard !courseRouteLocked else { return }
        guard preset != routePreset else { return }
        routePreset = preset
        let holes = permittedStartHoles
        if !holes.contains(startHole) { startHole = holes.first ?? 1 }
    }

    func setStartHole(_ hole: Int) {
        guard !courseRouteLocked else { return }
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
        boundsRefusal(id, voice: .card)
    }

    /// Which surface is doing the refusing. The two say the same fact in
    /// different grammar: the card is a fragment under a title that already
    /// names the game, the footer gate is a whole sentence that has to name it.
    enum RefusalVoice { case card, gate }

    /// The ONE place a bounds refusal becomes a sentence.
    ///
    /// Card and gate must count the same thing or they contradict each other on
    /// screen — four players with a pair among them had the card saying "needs
    /// at least 4 players on their own balls" while the footer said "needs 4
    /// players", two sentences about two different rosters. What differs is
    /// only the tail: the card EXPLAINS (who it cannot reach), the gate COUNTS
    /// DOWN (how far off the round still is).
    func boundsRefusal(_ id: String, voice: RefusalVoice) -> String? {
        let fit = self.fit(id)
        // A side format counts INDIVIDUALS, so once players are sharing a ball
        // the bare noun is read against the roster on screen and lands as a
        // lie. Naming the two rosters apart is what makes the refusal
        // actionable: unpair someone, or add a player.
        let sharing = sharedBallPlayerCount(id) ?? 0
        let noun = sharing > 0 ? "players on their own balls" : fit.noun
        let aside = sharing > 0 ? " — \(sharing) are sharing balls" : ""
        let game = catalog.label(id) ?? "This game"

        if fit.available < fit.min {
            switch voice {
            case .card: return "needs at least \(fit.min) \(noun)\(aside)"
            case .gate:
                return "\(game) needs \(fit.min) \(noun) — "
                    + "\(fit.min - fit.available) more to go."
            }
        }
        if let max = fit.max, fit.available > max {
            switch voice {
            case .card: return "seats at most \(max) \(noun)\(aside)"
            case .gate:
                return "\(game) seats \(max) \(noun) — remove \(fit.available - max)."
            }
        }
        return nil
    }

    /// How many players this format cannot reach because they are on a shared
    /// ball — 0 when the distinction does not apply (no live shared ball, or a
    /// ball format, which is judged on the ball roster and so loses nobody).
    ///
    /// Never 1: `CreateDraftBuilder.ballUnits` only groups a team of two or
    /// more, so a shared ball always costs at least a pair.
    private func sharedBallPlayerCount(_ id: String) -> Int? {
        guard catalog.isSideFormat(id) else { return nil }
        let units = ballUnits
        guard units.contains(where: { $0.teamKey != nil }) else { return nil }
        return filledPlayers.count - units.filter { $0.teamKey == nil }.count
    }

    /// What a format's bounds are measured against, and what the round has of
    /// it right now.
    ///
    /// With no shared balls this is the roster, exactly as it always was. Once
    /// players share a ball the question splits in two (proposal, "Format card
    /// eligibility derives from the resulting ball roster"):
    ///
    /// - A BALL format is contested between balls, so it is judged on the ball
    ///   roster against `minBalls`/`maxBalls`. Four players as two scramble
    ///   pairs are two balls: match play fits.
    /// - A SIDE format is built from players on their own ball — a shared
    ///   ball's members are not available to it (v1; see
    ///   `CreateDraftBuilder.seedGame(formatId:units:existingTeams:)`) — so it
    ///   is judged on the remaining individuals against the unchanged player
    ///   bounds. Six players with two of them paired leaves Taliban its four.
    ///
    /// Ball formats keep the PLAYER bounds while no ball is shared, because
    /// those bounds are the tighter and more meaningful statement for a plain
    /// roster: Köpenhamnare is 3 balls and up to 10 per ball, so its ball bound
    /// would seat thirty players.
    private func fit(_ id: String) -> (available: Int, min: Int, max: Int?, noun: String) {
        let units = ballUnits
        guard units.contains(where: { $0.teamKey != nil }) else {
            return (
                max(filledPlayers.count, 0),
                catalog.minPlayers(for: id),
                catalog.maxPlayers(for: id),
                "players")
        }
        if catalog.isSideFormat(id) {
            return (
                units.filter { $0.teamKey == nil }.count,
                catalog.minPlayers(for: id),
                catalog.maxPlayers(for: id),
                "players")
        }
        // Clamped by the format's own ceiling, because the SEED is clamped
        // (`CreateDraftBuilder.seedGame`): a ball past the ceiling sits out, the
        // way a surplus player already does on a plain roster. Comparing the
        // raw count would refuse a five-player Köpenhamnare the moment two of
        // its players paired up — a refusal with nothing to act on, since the
        // roster was already two balls over and perfectly legal.
        let max = catalog.maxBalls(for: id)
        return (
            Swift.min(units.count, max ?? units.count),
            catalog.minBalls(for: id),
            max,
            "balls")
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
        let shared = ballTeamComposition(rows: rows)
        let units = CreateDraftBuilder.ballUnits(rosterCount: rows.count, ballTeams: shared)
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
                    existingTeams: teams,
                    units: units)
            }
            game.allowancePct = slot.allowancePct
            game.config = slot.config
            game.excludedPlayers = Set(slot.excludedRowIds.compactMap { indexByRow[$0] })
            out.append(game)
            teams = builder.compose(games: out, rosterCount: rows.count, ballTeams: shared).teams
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
        guard let bound = formatSlots.compactMap({ catalog.maxPlayers(for: $0.formatId) }).min()
        else { return nil }
        // Players sharing a ball do not spend a seat: a ball format seats
        // BALLS, and a side format seats the players still on their own ball.
        // Without this the roster cap would forbid adding the very players a
        // pairing is about to absorb — Taliban would refuse a fifth player on
        // a round where two of the four already share a ball.
        return bound + ballTeams.filter(\.isLive).reduce(0) { $0 + $1.memberRowIds.count }
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
        // …and so would a seat on a shared ball. Re-seeding drops it and
        // re-derives the remaining members' allowances for their new size.
        reseedBallTeams()
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
        // A handicap, gender or tee edit moves the playing handicap this row
        // is seeded by, and the recipe is indexed by that order.
        reseedBallTeams()
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
        for team in ballTeams where !team.memberRowIds.isEmpty && !team.isLive {
            return "A shared ball needs two players — add a partner, or remove the team."
        }
        // Built by the same function the card's own eligibility line is, so the
        // gate and the card can never disagree about what is being counted.
        for slot in formatSlots {
            if let refusal = boundsRefusal(slot.formatId, voice: .gate) { return refusal }
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
        let shared = ballTeamComposition(rows: rows)

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
        let local = builder.preflight(games: built, players: players, ballTeams: shared)
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
                        displayName: players[i].name,
                        gender: row.gender,
                        handicapIndex: .value(players[i].handicapIndex)))
                updatePlayer(id: row.id) { $0.guestPlayerId = guest.id }
                players[i].ref = .guest(guest.id)
            }

            let draft = builder.draft(
                courseId: courseId,
                route: route,
                games: built,
                players: players,
                ballTeams: shared,
                name: roundName)
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

    // MARK: - Edit mode — load

    /// Open an existing round's setup for editing (spec B2; web:
    /// `SetupService.loadForEdit`).
    ///
    /// The order is the web's and it matters: the catalog and the stored draft
    /// first (the draft decides which course's tees are even worth asking for),
    /// then the courses and that course's tees, then the round's balls — which
    /// are the ONLY place a producer's display name lives, the draft carrying
    /// nothing but an identity ref.
    ///
    /// Every step is a hard requirement. A half-hydrated form is worse than an
    /// error: it looks like a setup the user can save, and saving it would
    /// replace the stored draft with the parts that happened to load.
    func loadForEdit(token: String) async {
        guard !loading else { return }
        loading = true
        loadError = nil
        editBlockedReason = nil
        editHydrated = false
        editSaved = false
        editToken = token
        defer { loading = false }
        do {
            async let formats = api.send(SetupEndpoints.formats)
            async let courses = api.send(SetupEndpoints.courses)
            async let loadedFormations = api.send(SetupEndpoints.formations)
            let setup = try await api.send(
                FriendlyRoundsEndpoints.setup,
                FriendlyRoundsByTokenInput(token: token))
            self.catalog = FormatCatalog(descriptors: try await formats)
            self.courses = try await courses
            self.formations = FormationCatalog(descriptors: (try? await loadedFormations) ?? [])

            guard case .editable(let editable) = setup else {
                if case .notEditable(let blocked) = setup {
                    editBlockedReason = blocked.reason == .roundComplete ? .roundComplete : .noStoredDraft
                }
                return
            }
            // B3's client-side rule: a seat nobody has claimed has no roster row
            // to hydrate into, so the wizard says so rather than inventing one.
            guard !EditDraftHydration.hasPlaceholderSeat(editable.draft) else {
                editBlockedReason = .openSeats
                return
            }

            let balls = try await api.send(
                FriendlyRoundsEndpoints.balls,
                FriendlyRoundsByTokenInput(token: token))
            var nameByDefId: [String: String] = [:]
            for ball in balls {
                for player in ball.players { nameByDefId[player.producerDefId] = player.displayName }
            }

            hasScores = editable.hasScores
            loadedDraft = editable.draft

            // The tees BEFORE the prefill: `loadTees` re-defaults the round's
            // tees and the start hole, which would otherwise land on top of the
            // values just hydrated from the draft.
            courseId = editable.draft.courseId
            clubId = self.courses.first { $0.id == editable.draft.courseId }?.clubId
            await loadTees(courseId: editable.draft.courseId)
            if loadError != nil { return }

            let prefill = EditDraftHydration.prefill(
                draft: editable.draft,
                formations: formations
            ) { defId in
                nameByDefId[defId] ?? ""
            }
            roundName = editable.draft.name ?? ""
            routePreset = prefill.preset
            startHole = prefill.startHole
            players = prefill.players
            formatSlots = prefill.slots
            ballTeams = prefill.ballTeams
            managedTeamIds = prefill.managedTeamIds
            lastFormationId = prefill.ballTeams.last?.formationId
            // A stored draft records composition, not the cards behind it, so
            // the flexible surface is what can actually describe it.
            customOpen = true
            editHydrated = true
        } catch {
            loadError = Self.message(for: error, fallback: "Couldn't load this round's setup. Try again.")
        }
    }

    // MARK: - Edit mode — save

    /// Replace the round's stored setup (spec B6). Returns true when the server
    /// accepted it.
    ///
    /// Same order as `submit()` — every local check before the first request —
    /// and the same guest contract. What differs is the document: it is
    /// ASSEMBLED against the loaded draft (`EditDraftAssembler`), never rebuilt,
    /// because `editSetup` is a full-document replace and this flow cannot say
    /// everything a draft can (B7).
    @discardableResult
    func saveEdits() async -> Bool {
        guard let token = editToken, let loaded = loadedDraft, let courseId,
              !formatSlots.isEmpty, !submitting else { return false }
        submitting = true
        submitError = nil
        diagnostics = []
        defer { submitting = false }

        let rows = filledPlayers
        builtRowIds = rows.map(\.id)

        var players = rows.map { row in
            CreateDraftBuilder.Player(
                name: row.name.trimmingCharacters(in: .whitespacesAndNewlines),
                handicapText: row.handicapText,
                handicapIndex: HandicapInput.parse(row.handicapText) ?? 0,
                teeId: teeId(for: row) ?? "",
                gender: row.gender,
                ref: row.playerId.map { .player($0) } ?? .guest(row.guestPlayerId ?? ""))
        }

        // B9.7 again: a refusal the flow can see coming costs zero requests —
        // including the guest mint. The SUBJECT checks `submit()` runs are
        // deliberately not run here; an edited round's subjects come off the
        // stored draft, not off ball composition this flow can see.
        let local = builder.preflightPlayers(players)
            + builder.preflightBallTeams(ballTeamComposition(rows: rows))
        if !local.isEmpty {
            diagnostics = local
            return false
        }

        do {
            for (i, row) in rows.enumerated() {
                guard row.playerId == nil, row.guestPlayerId == nil else { continue }
                let guest = try await api.send(
                    GuestPlayersEndpoints.create,
                    GuestPlayersCreateInput(
                        displayName: players[i].name,
                        gender: row.gender,
                        handicapIndex: .value(players[i].handicapIndex)))
                // The baseline rides the cached id: a save refused and retried
                // after a further rename must rename, not silently re-submit.
                updatePlayer(id: row.id) {
                    $0.guestPlayerId = guest.id
                    $0.guestOriginalName = guest.displayName
                }
                players[i].ref = .guest(guest.id)
            }

            // An EXISTING guest whose name drifted from the hydrated baseline:
            // the draft carries only the guest REF, so the rename must go
            // through the token-scoped rename endpoint or it is silently
            // dropped. BEFORE `editSetup` — its recompile re-snapshots names.
            for row in rows {
                guard let guestId = row.guestPlayerId, let original = row.guestOriginalName
                else { continue }
                let newName = row.name.trimmingCharacters(in: .whitespacesAndNewlines)
                guard newName != original else { continue }
                _ = try await api.send(
                    FriendlyRoundsEndpoints.renameGuest,
                    FriendlyRoundsRenameGuestInput(
                        token: token,
                        guestPlayerId: guestId,
                        displayName: newName))
                updatePlayer(id: row.id) { $0.guestOriginalName = newName }
            }

            let defIds = assignDefIds(rows: rows)
            let defIdByRow = Dictionary(uniqueKeysWithValues: zip(rows.map(\.id), defIds))
            let producers = zip(defIds, players).map { defId, player in
                EditDraftAssembler.Producer(
                    producerDefId: defId,
                    handicapIndex: player.handicapIndex,
                    teeId: player.teeId,
                    gender: player.gender,
                    ref: player.ref)
            }
            let slots = formatSlots.map { slot in
                EditDraftAssembler.Slot(
                    sourceIndex: slot.sourceIndex,
                    formatId: slot.formatId,
                    allowanceText: slot.allowanceText,
                    config: slot.config,
                    excludedDefIds: Set(slot.excludedRowIds.compactMap { defIdByRow[$0] }))
            }
            // Nil, not empty, when the formation catalog never loaded: the
            // teams could not be hydrated either, so an empty list would read
            // as "the user removed them" and delete a stored pairing this
            // session was never able to show.
            let teams: [EditDraftAssembler.BallTeam]? = formations.isAvailable
                ? ballTeams.compactMap { team in
                    let members = team.memberRowIds.compactMap { rowId in
                        defIdByRow[rowId].map {
                            EditDraftAssembler.BallTeam.Member(
                                producerDefId: $0, allowancePct: team.allowance(rowId) ?? 100)
                        }
                    }
                    guard members.count >= 2 else { return nil }
                    return EditDraftAssembler.BallTeam(
                        id: team.sourceTeamId,
                        label: team.sourceLabel,
                        formation: team.formationId,
                        members: members)
                }
                : nil
            let draft = EditDraftAssembler(catalog: catalog, formations: formations).draft(
                replacing: loaded,
                courseId: courseId,
                route: route,
                producers: producers,
                slots: slots,
                ballTeams: teams,
                managedTeamIds: managedTeamIds,
                name: roundName)

            // The one shape the server rejects as a bare 400 rather than a
            // diagnostic (`subjects minItems 1`), caught here so it reads as a
            // sentence on the card it belongs to.
            let empty = draft.formats.indices.filter { draft.formats[$0].subjects?.isEmpty == true }
            if !empty.isEmpty {
                diagnostics = empty.map { index in
                    CompilerDiagnostic(
                        code: "no_subjects",
                        message: builder.noSubjectsMessage(formatId: draft.formats[index].formatId),
                        path: "formats[\(index)]",
                        formatIndex: Double(index))
                }
                return false
            }

            let result = try await api.send(
                FriendlyRoundsEndpoints.editSetup,
                FriendlyRoundsEditSetupInput(
                    token: token,
                    draft: draft,
                    clientEventId: UUID().uuidString))
            switch result {
            case .notOk(let refusal):
                diagnostics = refusal.diagnostics
                if refusal.diagnostics.isEmpty {
                    submitError = "The server refused this setup but didn't say why. Try again."
                }
                return false
            case .ok:
                editSaved = true
                return true
            }
        } catch {
            submitError = Self.message(for: error, fallback: "Could not save the round. Try again.")
            return false
        }
    }

    /// The def-id each roster row submits as: the one it was loaded with, or a
    /// fresh one for a row added during this edit.
    ///
    /// Minted ids are cached on the row for the same reason guest ids are — a
    /// save refused by the server and retried after a fix must submit the SAME
    /// ids, or every ball the first attempt would have created is addressed
    /// differently the second time. The `p-` prefix keeps a new row from ever
    /// colliding with the `p1…pn` a created round's producers carry.
    private func assignDefIds(rows: [PlayerRow]) -> [String] {
        var used = Set(rows.compactMap(\.producerDefId))
        for producer in loadedDraft?.producers ?? [] {
            if case .playerRef(let p) = producer { used.insert(p.producerDefId) }
        }
        var out: [String] = []
        var counter = 1
        for row in rows {
            if let existing = row.producerDefId {
                out.append(existing)
                continue
            }
            while used.contains("p-\(counter)") { counter += 1 }
            let minted = "p-\(counter)"
            used.insert(minted)
            out.append(minted)
            updatePlayer(id: row.id) { $0.producerDefId = minted }
        }
        return out
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

// MARK: - The default name

/// The name a round gets when the organizer does not care to pick one:
/// `"Game 30 Jul 2026"`, or `"Spel 30 juli 2026"` on a Swedish device.
///
/// Pure, so the two things that can be wrong about it — the localisation and
/// the de-duplication — are testable without a view, a clock or a network.
///
/// Both halves follow the device locale: the word, because "Game" in a
/// Swedish app is jarring, and the date, because `2026-07-30` and `Jul 30,
/// 2026` are the same day written for different readers. Nothing about this
/// travels to other viewers — the resulting name is stored as plain text, so
/// a round named on a Swedish phone keeps its Swedish name everywhere, which
/// is correct: it is what the organizer called it.
enum DefaultRoundName {
    /// The default for `date`, stepped with a `(2)`, `(3)`, … suffix until it
    /// is not one of `existing`.
    ///
    /// The suffix is cosmetic. Round names are NOT unique and nothing enforces
    /// it: `existing` is only the names this device happens to know about, and
    /// two people creating rounds on the same day will happily land on the
    /// same string. The suffix exists so a list of one player's own rounds
    /// reads as distinct rows, nothing more.
    static func make(on date: Date = Date(), locale: Locale = .current, existing: [String] = []) -> String {
        let base = "\(prefix(for: locale)) \(formatted(date, locale: locale))"
        let taken = Set(
            existing
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
                .filter { !$0.isEmpty })
        guard taken.contains(base.lowercased()) else { return base }
        // Bounded: a device that somehow holds 99 same-day rounds gets a
        // repeat rather than a hang.
        for n in 2...99 {
            let candidate = "\(base) (\(n))"
            if !taken.contains(candidate.lowercased()) { return candidate }
        }
        return base
    }

    /// Swedish gets "Spel"; every other language falls back to English. Two
    /// words is the whole vocabulary — this is a label, not a localisation
    /// project, and a real `Localizable.strings` table can replace it the day
    /// the app ships more languages.
    static func prefix(for locale: Locale) -> String {
        locale.language.languageCode?.identifier == "sv" ? "Spel" : "Game"
    }

    /// Medium style, matching the round header's date line, so the default
    /// name and the header agree about how a date looks.
    static func formatted(_ date: Date, locale: Locale) -> String {
        let formatter = DateFormatter()
        formatter.locale = locale
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
}
