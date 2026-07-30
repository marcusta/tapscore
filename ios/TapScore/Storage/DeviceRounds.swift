import Foundation

/// A round this device has created or opened — the Swift image of
/// `src/landing/device-rounds.ts`.
///
/// The anonymous front door has no identity, so it has no server dashboard.
/// What it has is *this device's* history: every round opened here is recorded
/// locally, and the landing renders that list with exactly the same partition
/// the signed-in list uses. Losing it costs nothing — the rounds live
/// server-side and reappear the next time their link is opened.
///
/// Wire-compatible field names and status spellings with the web module on
/// purpose: the two stores are never synced, but keeping one vocabulary means
/// the landing partition, the status chips and the docs read the same on both
/// clients.
struct DeviceRound: Codable, Sendable, Equatable, Identifiable {
    /// The round's share token — also the identity of the entry. It is the
    /// round's write credential: never log it, never put it in analytics.
    let token: String
    /// Course name for the row label; `""` when unknown at record time (a
    /// cold deep-link tap knows the token and nothing else until the preview
    /// fetch lands).
    var courseName: String
    /// The organizer's name for the round, when it has one. Nil ⇒ the row
    /// labels itself with the course, which is what every entry written before
    /// round names existed decodes as.
    var name: String?
    /// Lifecycle status at last sighting — drives the landing partition.
    var status: DeviceRoundStatus
    /// ISO time the round finished, when known. Lets the anonymous landing
    /// apply the same trailing "recently finished" window as the signed-in one.
    var completedAt: String?
    /// The round's date (`yyyy-MM-dd`), when known.
    var date: String?
    /// ISO time this round was last opened on this device — the ongoing-sort
    /// key and the recency signal the cap evicts against.
    var lastSeenAt: String

    var id: String { token }

    init(
        token: String,
        courseName: String = "",
        name: String? = nil,
        status: DeviceRoundStatus = .notStarted,
        completedAt: String? = nil,
        date: String? = nil,
        lastSeenAt: String
    ) {
        self.token = token
        self.courseName = courseName
        self.name = name
        self.status = status
        self.completedAt = completedAt
        self.date = date
        self.lastSeenAt = lastSeenAt
    }
}

/// Round lifecycle, spelled exactly as the server sends it (`not_started`),
/// so a stored blob and an API payload never disagree about the same state.
enum DeviceRoundStatus: String, Codable, Sendable, Equatable, CaseIterable {
    case notStarted = "not_started"
    case active = "active"
    case complete = "complete"

    /// Short label for the row chip.
    var label: String {
        switch self {
        case .notStarted: "Not started"
        case .active: "Live"
        case .complete: "Finished"
        }
    }
}

/// Keep the most-recent N; older sightings fall off. Mirrors
/// `DEVICE_ROUNDS_CAP` in the web module.
let deviceRoundsCap = 50

/// Device-local recent-rounds list.
///
/// **`UserDefaults`, deliberately** — the same call `ResultCursorStore` makes,
/// for the same reason. `ios/AGENTS.md` puts *credentials* in the Keychain;
/// this list holds share tokens the holder already possesses (they arrived in a
/// link this device opened), it grants nothing new, and the landing reads it
/// synchronously on every appearance. What it must not do is leak into a log.
///
/// Lock rather than actor: reads happen while a view body is being assembled.
final class DeviceRoundsStore: @unchecked Sendable {
    static let storageKey = "tapscore.device-rounds.v1"

    private let defaults: UserDefaults
    private let cap: Int
    private let lock = NSLock()

    init(defaults: UserDefaults = .standard, cap: Int = deviceRoundsCap) {
        self.defaults = defaults
        self.cap = cap
    }

    /// The list, most-recently-seen first. A corrupt or foreign blob reads as
    /// empty rather than crashing the landing.
    func all() -> [DeviceRound] {
        lock.lock()
        defer { lock.unlock() }
        return read()
    }

    /// The stored entry for a token, or nil.
    func round(for token: String) -> DeviceRound? {
        lock.lock()
        defer { lock.unlock() }
        return read().first { $0.token == token }
    }

    /// Upsert a sighting, returning the new list.
    ///
    /// Deduped by token: an existing entry is replaced and bumped to the front,
    /// so the cap evicts the least-recently-seen round (LRU), never the one the
    /// user just opened.
    @discardableResult
    func record(_ entry: DeviceRound) -> [DeviceRound] {
        lock.lock()
        defer { lock.unlock() }
        let rest = read().filter { $0.token != entry.token }
        let next = Array(([entry] + rest).prefix(cap))
        write(next)
        return next
    }

    /// Record an open of `token` with whatever is known right now.
    ///
    /// Called at the moment navigation pushes the round screen — including the
    /// deep-link path, where course name and status are not known yet. Nil
    /// arguments do NOT erase what a previous sighting stored, so the cheap
    /// token-only record from a cold tap is later enriched by the preview fetch
    /// instead of being overwritten by it.
    ///
    /// Status and `completedAt` are one fact, not two, and the rule is stated
    /// here because callers pass them from different places:
    ///
    /// - A `completedAt` with no `status` **implies `.complete`** — a caller
    ///   holding a completion time knows the round finished, and silently
    ///   dropping it would leave the row in Ongoing.
    /// - An explicit `status` always wins. A non-complete one clears
    ///   `completedAt`, including a completion time passed in the same call:
    ///   friendly rounds reopen, and a stale time would keep a live round
    ///   parked in "Recently finished".
    @discardableResult
    func recordOpen(
        token: String,
        courseName: String? = nil,
        name: String? = nil,
        status: DeviceRoundStatus? = nil,
        completedAt: String? = nil,
        date: String? = nil,
        now: Date = Date()
    ) -> [DeviceRound] {
        let existing = round(for: token)
        // An explicit status wins; otherwise a completion time is itself the
        // statement that the round is done.
        let resolvedStatus = status
            ?? (completedAt != nil ? .complete : nil)
            ?? existing?.status
            ?? .notStarted
        let entry = DeviceRound(
            token: token,
            courseName: courseName ?? existing?.courseName ?? "",
            // Same enrich-never-blank rule as the course name: a caller that
            // does not know the round's name keeps the one already stored.
            // The cost is that clearing a name on another surface leaves this
            // row labelled until the next sighting that knows better.
            name: name ?? existing?.name,
            status: resolvedStatus,
            // A round that is no longer complete (reopened) must lose its
            // completion time, so an explicit non-complete status clears it.
            completedAt: resolvedStatus == .complete
                ? (completedAt ?? existing?.completedAt)
                : nil,
            date: date ?? existing?.date,
            lastSeenAt: Self.isoFormatter.string(from: now)
        )
        return record(entry)
    }

    /// Drop a round from this device's list. Local only — the round itself is
    /// untouched server-side, and opening its link again re-adds it.
    @discardableResult
    func remove(token: String) -> [DeviceRound] {
        lock.lock()
        defer { lock.unlock() }
        let existing = read()
        let next = existing.filter { $0.token != token }
        if next.count != existing.count { write(next) }
        return next
    }

    /// Wipes the list (test housekeeping; no UI affordance).
    func clear() {
        lock.lock()
        defer { lock.unlock() }
        defaults.removeObject(forKey: Self.storageKey)
    }

    // MARK: - Storage

    /// Decodes the stored list, salvaging per entry.
    ///
    /// One unreadable entry — a field added by a newer build, a half-written
    /// blob — must not cost the user their whole landing, so entries are
    /// validated one by one and the bad ones dropped, exactly as `jsonListCodec`
    /// does on the web (`src/device-store.ts`). A payload that is not an array
    /// at all still reads as empty.
    private func read() -> [DeviceRound] {
        guard let data = defaults.data(forKey: Self.storageKey) else { return [] }
        let decoder = JSONDecoder()
        if let entries = try? decoder.decode([DeviceRound].self, from: data) { return entries }
        guard let salvaged = try? decoder.decode([SalvagedRound].self, from: data) else { return [] }
        return salvaged.compactMap(\.entry)
    }

    /// Decodes an element without failing the array: a bad entry becomes nil.
    private struct SalvagedRound: Decodable {
        let entry: DeviceRound?

        init(from decoder: Decoder) throws {
            entry = try? DeviceRound(from: decoder)
        }
    }

    private func write(_ entries: [DeviceRound]) {
        guard let data = try? JSONEncoder().encode(entries) else { return }
        defaults.set(data, forKey: Self.storageKey)
    }

    /// ISO-8601 with fractional seconds off — the spelling the server uses for
    /// `completedAt`, so both timestamps parse with one formatter.
    /// `nonisolated(unsafe)`: `ISO8601DateFormatter` is documented as safe to
    /// use concurrently once configured, and this one is configured here and
    /// never mutated again.
    nonisolated(unsafe) static let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}
