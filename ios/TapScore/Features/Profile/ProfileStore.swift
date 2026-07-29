import Foundation
import Observation

/// The signed-in player's own profile, mirroring `src/profile/profile.service.ts`.
///
/// Three editable facts and one append-only chain, and the split between them is
/// the whole shape of this store:
///
/// - **Gender and home club save on tap**, through `POST /players/me/profile`,
///   whose input is two `TriState`s. The one that was NOT touched must be
///   `.absent` — `.null` would clear the other column, so a home-club pick would
///   silently wipe the gender that "Add me" depends on during round setup. That
///   is why there is no single `saveProfile(gender:homeClubId:)` here: one
///   function taking both invites a caller to pass `nil` for "unchanged".
/// - **The handicap index posts to `/players/me/handicap`** and then FORCE
///   RELOADS, because the server appends a `handicap_history` row as a side
///   effect. Patching `player.handicapIndex` locally would leave the chain on
///   screen one entry behind the number above it.
///
/// Name editing does not exist: the server has no endpoint for it, so
/// `displayName` / `username` are a read-only header, exactly as on the web.
@MainActor
@Observable
final class ProfileStore {
    /// Where the first load got to. `notAuthorized` is a state rather than a
    /// message, for the same reason `AdminStore` gives it one: every endpoint
    /// here is session-scoped, so a dead bearer is a fact about the session and
    /// not a failure the user can retry into working.
    enum Phase: Equatable {
        case loading
        case ready
        case notAuthorized
        case failed(String)
    }

    /// Which control has a save in flight. One value for all of them, because
    /// the UI disables ALL of them while any save runs (web parity) — two of
    /// these at once would be two writes racing over the same `Player`.
    ///
    /// `stats` writes a different row than the other three (`player_stats_config`,
    /// not `players`), but it joins the same lock rather than getting its own:
    /// one screen, one save at a time is the rule the user can see, and a
    /// second in-flight state would mean two spinners and two disabled sets.
    enum SaveTarget: Equatable {
        case gender
        case homeClub
        case handicap
        case stats
    }

    /// The rejection copy for an out-of-range index, character for character the
    /// web's (`profile.component.ts`). Typographic quotes included: they are what
    /// the string says, and a straight-quote variant would be a second wording.
    static let outOfRangeMessage =
        "Enter an index between +10 and 54 (use “+” for a plus handicap)."

    /// Prefix for `refreshError` — the state where the index POST landed but the
    /// follow-up reload did not. Deliberately NOT worded as a failed save: the
    /// save succeeded, and copy that says otherwise invites a retry that appends
    /// a duplicate row to an append-only chain.
    static let savedButStalePrefix = "Saved — but reloading the profile failed: "

    /// Accepted index range, in STORED notation — a plus handicap is negative,
    /// so "+10" is -10. Same bounds as the web's `idx < -10 || idx > 54`.
    static let lowerBound = -10.0
    static let upperBound = 54.0

    private(set) var phase: Phase = .loading
    private(set) var player: Player?
    private(set) var history: [HandicapEntry] = []
    private(set) var clubs: [Club] = []

    /// The Statistics section's server truth — what the last successful GET or
    /// PUT returned. The section renders from THIS and never from a local
    /// mirror of the switches, which is what makes a failed save revert: the
    /// toggle is a computed view of the row the server holds, so a PUT that did
    /// not land leaves it where it was.
    private(set) var statsConfig: StatsConfigForm = .allOff

    private(set) var saving: SaveTarget?

    // Errors are PER SURFACE, unlike the web's single shared `saveError` string
    // rendered under all three cards. A club save that failed has nothing to say
    // under the gender control, and the web showing it there is a bug worth not
    // porting.
    private(set) var genderError: String?
    private(set) var clubError: String?
    private(set) var handicapError: String?
    private(set) var statsError: String?

    /// Set when a handicap save SUCCEEDED but the forced reload after it failed.
    /// A separate slot from `handicapError` because the two states demand
    /// opposite user reactions: a failed save is retried, a failed refresh must
    /// not be — the server already holds the new index and history row.
    private(set) var refreshError: String?

    private let api: TapScoreAPI

    /// Called with every freshly saved `Player`, so `AppEnvironment` can replace
    /// the one `.signedIn` carries.
    ///
    /// A closure rather than a reference to the environment: the store then has
    /// no opinion about who is listening, and the test can assert the write-back
    /// happened without building an app environment. It is deliberately NOT an
    /// auth change — see `AppEnvironment.apply(profile:)`.
    private let onProfileUpdated: (@MainActor (Player) -> Void)?

    init(api: TapScoreAPI, onProfileUpdated: (@MainActor (Player) -> Void)? = nil) {
        self.api = api
        self.onProfileUpdated = onProfileUpdated
    }

    /// True while ANY save is in flight — what every control on the screen
    /// disables itself on.
    var isSaving: Bool { saving != nil }

    /// The clubs the picker offers, name-sorted. The server returns insertion
    /// order; a home-club list is read alphabetically or not at all.
    var sortedClubs: [Club] {
        clubs.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    // MARK: - Load

    /// `me` + the append-only history + the club list, in parallel — the web's
    /// `Promise.all` triple. They are independent reads and the screen draws
    /// nothing until all three land, so serialising them would triple the wait.
    ///
    /// Always forces. The web caches load-once-per-session because the service
    /// is a DI singleton shared with the create flow; this store is built per
    /// presentation of the sheet, so "already loaded" cannot happen.
    func load() async {
        phase = .loading
        refreshError = nil
        statsError = nil
        do {
            async let me = api.send(PlayersEndpoints.me)
            async let chain = api.send(PlayersEndpoints.myHandicapHistory)
            async let clubList = api.send(ClubsEndpoints.list)
            // A fourth required read, on the same all-or-nothing terms as the
            // other three. `GET /players/me/stats-config` answers for a player
            // who has never configured anything — an absent row is the default
            // "off, nothing chosen" config, not a 404 — so there is no
            // never-configured branch to write here.
            async let config = api.send(PlayerStatsEndpoints.myConfig)
            let (loadedMe, loadedHistory, loadedClubs, loadedConfig) =
                try await (me, chain, clubList, config)
            // `/players/me` answers `null` for a request the server could not
            // attribute to a player. There is no profile to show and no error
            // worth wording — it is the same "this session may not read this"
            // that a 401 is.
            guard let loadedMe else {
                phase = .notAuthorized
                return
            }
            player = loadedMe
            history = loadedHistory
            clubs = loadedClubs
            statsConfig = StatsConfigForm(loadedConfig)
            phase = .ready
        } catch {
            phase = Self.phase(for: error)
        }
    }

    private static func phase(for error: any Error) -> Phase {
        switch error as? APIError {
        case .unauthorized:
            return .notAuthorized
        case let .server(code, _) where code == 403:
            return .notAuthorized
        default:
            return .failed(APIErrorCopy.short(error))
        }
    }

    // MARK: - Gender

    /// Save gender, or clear it with `nil`.
    ///
    /// `homeClubId` is `.absent`: this request must not carry an opinion about a
    /// column it is not editing.
    func saveGender(_ gender: PlayerGender?) async {
        guard saving == nil else { return }
        saving = .gender
        genderError = nil
        defer { saving = nil }
        do {
            let updated = try await api.send(
                PlayersEndpoints.updateProfile,
                PlayersUpdateProfileInput(
                    gender: gender.map { .value($0) } ?? .null,
                    homeClubId: .absent
                )
            )
            adopt(updated)
        } catch {
            genderError = APIErrorCopy.short(error)
        }
    }

    // MARK: - Home club

    /// Save the home club, or clear it with `nil`. `gender` is `.absent` — same
    /// rule, other direction.
    func saveHomeClub(_ homeClubId: String?) async {
        guard saving == nil else { return }
        saving = .homeClub
        clubError = nil
        defer { saving = nil }
        do {
            let updated = try await api.send(
                PlayersEndpoints.updateProfile,
                PlayersUpdateProfileInput(
                    gender: .absent,
                    homeClubId: homeClubId.map { .value($0) } ?? .null
                )
            )
            adopt(updated)
        } catch {
            clubError = APIErrorCopy.short(error)
        }
    }

    // MARK: - Handicap index

    /// Commit the keypad's text as a new index.
    ///
    /// Empty text is a NO-OP, deliberately: the pad commits an empty string to
    /// mean "cleared", and the profile has no way to clear a handicap — the
    /// endpoint takes a number and the history chain is append-only. The web
    /// behaves the same way (its Save button is disabled on an empty field), so
    /// this keeps the two clients agreeing about a value nobody can delete.
    ///
    /// On success the server has already appended the history row, so `me` and
    /// the chain are re-pulled rather than patched.
    func saveHandicap(text: String) async {
        guard saving == nil else { return }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        guard let value = HandicapInput.parse(trimmed),
              value >= Self.lowerBound,
              value <= Self.upperBound
        else {
            handicapError = Self.outOfRangeMessage
            return
        }
        saving = .handicap
        handicapError = nil
        refreshError = nil
        defer { saving = nil }
        do {
            _ = try await api.send(
                // No `effectiveDate`: the server dates the entry itself, and a
                // client clock is not the thing that should decide when a
                // handicap took effect.
                PlayersEndpoints.updateHandicap,
                PlayersUpdateHandicapInput(handicapIndex: value)
            )
        } catch {
            handicapError = APIErrorCopy.short(error)
            return
        }
        // The POST landed: from here on a failure is a REFRESH failure, never a
        // save failure. The web draws the same line — `saveIndex` reports the
        // POST through `saveError` and lets `load(true)` report through the
        // page-level error instead.
        do {
            async let me = api.send(PlayersEndpoints.me)
            async let chain = api.send(PlayersEndpoints.myHandicapHistory)
            async let clubList = api.send(ClubsEndpoints.list)
            let (loadedMe, loadedHistory, loadedClubs) = try await (me, chain, clubList)
            if let loadedMe {
                player = loadedMe
                onProfileUpdated?(loadedMe)
            }
            history = loadedHistory
            clubs = loadedClubs
        } catch {
            refreshError = Self.savedButStalePrefix + APIErrorCopy.short(error)
            // The index itself is known — the server accepted it — so the big
            // number moves even though the chain below is one entry behind.
            if var patched = player {
                patched.handicapIndex = value
                player = patched
                onProfileUpdated?(patched)
            }
        }
    }

    // MARK: - Statistics

    /// Save a whole stats configuration — one PUT per toggle tap, because the
    /// endpoint replaces the row wholesale and there is no per-module write.
    ///
    /// Callers pass a form built with `setting(_:to:)` / `settingEnabled(_:)`,
    /// which have already applied the dependency cascade, so a combination the
    /// server would 409 never leaves this device.
    ///
    /// DOWNSTREAM, and deliberately not handled here: the capture prompts read
    /// their modules LIVE from `GET /friendly-rounds/stats-configs` on the
    /// round token (spec §3, "read live at prompt time"), never from this
    /// screen's state. So a change made mid-round takes effect on the next
    /// hole's step with no cache to invalidate and no message to pass — and
    /// equally, nothing here can make an open round's step update on the spot.
    func saveStats(_ next: StatsConfigForm) async {
        guard saving == nil else { return }
        saving = .stats
        statsError = nil
        defer { saving = nil }
        do {
            statsConfig = StatsConfigForm(
                try await api.send(PlayerStatsEndpoints.putMyConfig, next.input))
        } catch {
            // `statsConfig` is untouched, so the switch the user just moved
            // snaps back to the row the server still holds. That IS the revert.
            statsError = APIErrorCopy.short(error)
        }
    }

    // MARK: - Write-back

    /// The full `Player` from a profile save goes to two places: this store, and
    /// the session state every other screen reads.
    private func adopt(_ updated: Player) {
        player = updated
        onProfileUpdated?(updated)
    }
}
