import Foundation

/// Device-local result cursors, keyed by share token — the Swift image of
/// `src/round/result-cursor-store.ts`.
///
/// A cursor is the round's `latestEventId`: the value the SSE stream sets as
/// `id:`, and the value a cursored `result` response carries back. Persisting
/// it means a client that reconnects — or, on iOS, one the OS suspended and
/// later resumed — can ask the stream for everything after what it last saw
/// instead of starting cold.
///
/// **Storage is `UserDefaults`, deliberately.** `ios/AGENTS.md` says the bearer
/// token belongs in the Keychain and never in `UserDefaults`; that rule is
/// about *credentials*. A cursor is a cache key: it is an opaque event id,
/// scoped to a share token the holder already has, it grants nothing on its
/// own, and losing it costs exactly one full result fetch. Putting it in the
/// Keychain would buy no secrecy and would make every read a syscall on the
/// scoring path.
///
/// Like the web module this is **not** fed back into `result(cursor:)` on a
/// cold load — an `unchanged: true` reply with nothing in memory would blank
/// the board. It is read for the SSE `since` parameter, and written through
/// when a result response (or a live frame) carries a newer `latestEventId`.
struct ResultCursorEntry: Codable, Sendable, Equatable {
    let token: String
    let cursor: String
}

/// Keep the most recent N rounds' cursors; older ones fall off the end.
let resultCursorsCap = 50

/// Thread-safe by lock rather than by actor: every call is a few hundred bytes
/// of JSON, and the SSE client needs `cursor(for:)` synchronously while
/// building a request. An actor would make that an await on the scoring path
/// for no benefit.
final class ResultCursorStore: @unchecked Sendable {
    static let storageKey = "tapscore.result-cursors.v1"

    private let defaults: UserDefaults
    private let cap: Int
    private let lock = NSLock()

    init(defaults: UserDefaults = .standard, cap: Int = resultCursorsCap) {
        self.defaults = defaults
        self.cap = cap
    }

    /// All stored cursors, most-recently-written first.
    func all() -> [ResultCursorEntry] {
        lock.lock()
        defer { lock.unlock() }
        return read()
    }

    /// The persisted cursor for a token, or nil when none is stored.
    func cursor(for token: String) -> String? {
        lock.lock()
        defer { lock.unlock() }
        return read().first { $0.token == token }?.cursor
    }

    /// Persists the cursor for a token. Deduped by token and bumped to the
    /// front, so the cap evicts the least-recently-active round (LRU).
    @discardableResult
    func remember(token: String, cursor: String) -> [ResultCursorEntry] {
        lock.lock()
        defer { lock.unlock() }
        let rest = read().filter { $0.token != token }
        let next = Array(([ResultCursorEntry(token: token, cursor: cursor)] + rest).prefix(cap))
        write(next)
        return next
    }

    /// Drops a token's cursor (housekeeping on round delete). No-op when absent.
    @discardableResult
    func forget(token: String) -> [ResultCursorEntry] {
        lock.lock()
        defer { lock.unlock() }
        let existing = read()
        let next = existing.filter { $0.token != token }
        if next.count != existing.count { write(next) }
        return next
    }

    // MARK: - Storage

    private func read() -> [ResultCursorEntry] {
        guard let data = defaults.data(forKey: Self.storageKey) else { return [] }
        // A corrupt or foreign blob starts the list over rather than crashing
        // the round screen — the cost is one refetch.
        return (try? JSONDecoder().decode([ResultCursorEntry].self, from: data)) ?? []
    }

    private func write(_ entries: [ResultCursorEntry]) {
        guard let data = try? JSONEncoder().encode(entries) else { return }
        defaults.set(data, forKey: Self.storageKey)
    }
}
