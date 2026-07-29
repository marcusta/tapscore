import Foundation

/// Persistent queue of unacknowledged player-stat writes — `PendingScoreQueue`'s
/// sibling, holding the same three properties for the same reasons:
///
/// 1. **Persist on attempt, remove on ack.** Answers are written to disk before
///    the POST leaves, so a hole captured in a dead zone survives a relaunch.
/// 2. **Coalesce per key, latest wins.** At most one entry per
///    `(token, playHoleId, playerId, key)`. `stat_events` is an append log the
///    server projects last-write-wins per key, so an intermediate answer is
///    disposable; only the final one has to arrive. A coalesced entry keeps its
///    first-touch queue position and takes the new value, id and timestamp.
/// 3. **`clientEventId` is minted ONCE, at enqueue**, and replayed verbatim.
///    The server dedupes on it, so a replay of an event that already landed is
///    a no-op rather than a second row.
///
/// The one real difference from scores is the unit of transmission: stats are
/// batched. Nothing posts per tap — the step accumulates answers and hands the
/// whole hole over when it closes — so the queue is drained as one request
/// carrying every pending item for the round, which is exactly the shape
/// `POST /friendly-rounds/stat-events` takes.
struct PendingStatEvent: Codable, Sendable, Equatable {
    /// The share token whose round this belongs to — the write credential, and
    /// the filter that stops another round's leftovers leaking into this one.
    let token: String
    let playHoleId: String
    let playerId: String
    let key: StatEventKey
    /// `nil` is an explicit clear (`value: null` on the wire), not an omission.
    /// Unlike score metadata this needs no `TriState`: there is no third state —
    /// a key the golfer never touched is simply not queued.
    let value: String?
    let clientEventId: String
    let queuedAt: Date

    init(
        token: String,
        playHoleId: String,
        playerId: String,
        key: StatEventKey,
        value: String?,
        clientEventId: String,
        queuedAt: Date
    ) {
        self.token = token
        self.playHoleId = playHoleId
        self.playerId = playerId
        self.key = key
        self.value = value
        self.clientEventId = clientEventId
        self.queuedAt = queuedAt
    }

    /// One item of the batch body, built from the generated input type so a
    /// contract change surfaces as a compile error here. The generated encoder
    /// writes an explicit JSON null for a nil `value`, which is what makes a
    /// clear distinguishable from an omitted key.
    var item: PlayerStatsAppendEventsInputItemsItem {
        PlayerStatsAppendEventsInputItemsItem(
            playHoleId: playHoleId,
            playerId: playerId,
            key: key,
            value: value,
            clientEventId: clientEventId)
    }
}

actor PendingStatEventsQueue {
    static let maxAge: TimeInterval = 14 * 24 * 60 * 60
    static let maxEntries = 500

    /// Injected so tests are deterministic; production is `UUID().uuidString`.
    typealias IDProvider = @Sendable () -> String

    private let fileURL: URL
    private let makeID: IDProvider
    private var entries: [PendingStatEvent] = []

    /// Last persistence failure, if any. Best effort — capture must never crash
    /// over a full disk — but a silent failure with no trace is undebuggable.
    private(set) var lastPersistError: String?

    init(
        fileURL: URL = PendingStatEventsQueue.defaultFileURL(),
        now: Date = Date(),
        idProvider: @escaping IDProvider = { UUID().uuidString }
    ) {
        self.fileURL = fileURL
        self.makeID = idProvider
        let (loaded, dropped) = Self.load(from: fileURL)
        let kept = Self.hygiene(loaded, now: now)
        self.entries = kept
        let changed = kept.count != loaded.count || dropped > 0
        self.lastPersistError = changed ? Self.write(kept, to: fileURL) : nil
    }

    static func defaultFileURL() -> URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first ?? URL(fileURLWithPath: NSTemporaryDirectory())
        return base
            .appendingPathComponent("tapscore", isDirectory: true)
            .appendingPathComponent("pending-stat-events.v1.json")
    }

    /// Queues one answer and returns it, **already on disk**.
    ///
    /// - Parameter clientEventId: normally omitted so the id is minted here,
    ///   once. Pass one only to re-queue an intent that already owns an id.
    @discardableResult
    func enqueue(
        token: String,
        playHoleId: String,
        playerId: String,
        key: StatEventKey,
        value: String?,
        clientEventId: String? = nil,
        now: Date = Date()
    ) -> PendingStatEvent {
        let event = PendingStatEvent(
            token: token,
            playHoleId: playHoleId,
            playerId: playerId,
            key: key,
            value: value,
            clientEventId: clientEventId ?? makeID(),
            queuedAt: now)
        if let index = entries.firstIndex(where: {
            $0.token == token && $0.playHoleId == playHoleId && $0.playerId == playerId
                && $0.key == key
        }) {
            entries[index] = event
        } else {
            entries.append(event)
        }
        entries = Self.hygiene(entries, now: now)
        persist()
        return event
    }

    /// Queues a whole step's batch in one pass, one disk write for the lot.
    @discardableResult
    func enqueue(
        token: String,
        playHoleId: String,
        playerId: String,
        batch: [StatBatchItem],
        now: Date = Date()
    ) -> [PendingStatEvent] {
        guard !batch.isEmpty else { return [] }
        var queued: [PendingStatEvent] = []
        for item in batch {
            let event = PendingStatEvent(
                token: token,
                playHoleId: playHoleId,
                playerId: playerId,
                key: item.key,
                value: item.value,
                clientEventId: makeID(),
                queuedAt: now)
            if let index = entries.firstIndex(where: {
                $0.token == token && $0.playHoleId == playHoleId && $0.playerId == playerId
                    && $0.key == item.key
            }) {
                entries[index] = event
            } else {
                entries.append(event)
            }
            queued.append(event)
        }
        entries = Self.hygiene(entries, now: now)
        persist()
        return queued
    }

    /// Drops the entries the server confirmed. Ids superseded by a coalescing
    /// re-answer match nothing, so a late ack cannot dequeue a newer intent.
    func ack(_ clientEventIds: [String]) {
        guard !clientEventIds.isEmpty else { return }
        let acked = Set(clientEventIds)
        let next = entries.filter { !acked.contains($0.clientEventId) }
        guard next.count != entries.count else { return }
        entries = next
        persist()
    }

    /// This round's pending answers, in first-touch queue order — the order they
    /// must be replayed in, since the server projects the batch in array order.
    func pending(for token: String) -> [PendingStatEvent] {
        entries.filter { $0.token == token }
    }

    func all() -> [PendingStatEvent] { entries }

    var count: Int { entries.count }

    func forget(token: String) {
        let next = entries.filter { $0.token != token }
        guard next.count != entries.count else { return }
        entries = next
        persist()
    }

    // MARK: - Storage

    private static func hygiene(_ entries: [PendingStatEvent], now: Date) -> [PendingStatEvent] {
        let fresh = entries.filter { now.timeIntervalSince($0.queuedAt) <= maxAge }
        return fresh.count > maxEntries ? Array(fresh.suffix(maxEntries)) : fresh
    }

    /// Decodes per entry, keeping every readable one — one entry mangled by a
    /// future schema change must not throw away a round of captured stats.
    private static func load(from url: URL) -> (events: [PendingStatEvent], dropped: Int) {
        guard let data = try? Data(contentsOf: url) else { return ([], 0) }
        guard let salvaged = try? JSONDecoder().decode([Salvaged].self, from: data) else {
            return ([], 0)
        }
        let events = salvaged.compactMap(\.event)
        return (events, salvaged.count - events.count)
    }

    private struct Salvaged: Decodable {
        let event: PendingStatEvent?

        init(from decoder: any Decoder) throws {
            event = try? PendingStatEvent(from: decoder)
        }
    }

    private func persist() {
        lastPersistError = Self.write(entries, to: fileURL)
    }

    /// Returns nil on success, or the failure description.
    private static func write(_ entries: [PendingStatEvent], to url: URL) -> String? {
        do {
            try FileManager.default.createDirectory(
                at: url.deletingLastPathComponent(),
                withIntermediateDirectories: true)
            try JSONEncoder().encode(entries).write(to: url, options: .atomic)
            return nil
        } catch {
            return error.localizedDescription
        }
    }
}
