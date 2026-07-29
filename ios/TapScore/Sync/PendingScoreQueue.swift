import Foundation

/// Persistent queue of unacknowledged score writes — the Swift image of
/// `src/round/pending-queue.ts` (2.7c), with the same three load-bearing
/// properties:
///
/// 1. **Persist on attempt, remove on ack.** `enqueue` writes to disk BEFORE
///    the caller touches the network. A score entered in a dead zone otherwise
///    lives only in an optimistic overlay, and the next launch drops it
///    silently — the failure mode this whole type exists to prevent.
/// 2. **Coalesce per cell, latest wins.** At most one entry per
///    `(token, ballId, playHoleId)`. The score event log is last-write-wins per
///    cell, so intermediate values entered while offline are disposable; only
///    the final intended state has to reach the server. A coalesced entry keeps
///    its original queue position (first-touch FIFO) and takes the newest
///    payload, id and timestamp — so an ack for the superseded attempt can no
///    longer dequeue the newer intended value.
/// 3. **`clientEventId` is generated ONCE, at enqueue**, and re-sent verbatim on
///    every replay. The server dedupes on it per round, so replaying an event
///    that already landed is a no-op instead of a duplicate score. Generating a
///    fresh id per attempt would turn every retry into a new event.
///
/// Storage is a JSON file in Application Support, written atomically: a
/// half-written queue after a kill would be worse than no queue. Application
/// Support (not Caches) because the OS may evict Caches under pressure, and an
/// evicted queue is a lost score.
///
/// Hygiene, applied on load and on every enqueue: entries older than 14 days
/// are pruned (a two-week-old half-round is stale, and its round may be gone),
/// and the queue is capped at 200, dropping the oldest beyond the cap.

/// One unacknowledged score write, exactly as it must be re-posted.
struct PendingScoreWrite: Codable, Sendable, Equatable {
    /// The share token whose round this belongs to. Entries are filtered by it
    /// so leftovers from another round never leak into this one's cells.
    let token: String
    let roundId: String
    let ballId: String
    let playHoleId: String
    /// `Double?` rather than `Int?` to match the generated
    /// `ScoreEventsAppendInput.strokes` exactly — a cleared score is nil.
    let strokes: Double?
    let eventType: ScoreEventEventType
    /// Original id — reused on replay so the server dedupes instead of
    /// duplicating. Never regenerated for an existing intent.
    let clientEventId: String
    /// Free-form per-event metadata, typed exactly as the generated
    /// `ScoreEventsAppendInput.metadata` (`metadata?: Record<string, unknown> | null`
    /// in `src/round/pending-queue.ts`). It is `TriState` and not a plain
    /// optional because absent and null are different on this wire, and a
    /// replay that dropped it would supersede the cell with a metadata-less
    /// event — the write that reaches the server must carry what the caller
    /// enqueued, not a lossy copy of it.
    let metadata: TriState<[String: JSONValue]>
    /// When the write was (last) enqueued; drives pruning.
    let queuedAt: Date

    init(
        token: String,
        roundId: String,
        ballId: String,
        playHoleId: String,
        strokes: Double?,
        eventType: ScoreEventEventType,
        clientEventId: String,
        metadata: TriState<[String: JSONValue]> = .absent,
        queuedAt: Date
    ) {
        self.token = token
        self.roundId = roundId
        self.ballId = ballId
        self.playHoleId = playHoleId
        self.strokes = strokes
        self.eventType = eventType
        self.clientEventId = clientEventId
        self.metadata = metadata
        self.queuedAt = queuedAt
    }

    /// The body for `POST /api/score-events`, built from the generated input
    /// type so a contract change shows up as a compile error here.
    var appendInput: ScoreEventsAppendInput {
        ScoreEventsAppendInput(
            roundId: roundId,
            ballId: ballId,
            playHoleId: playHoleId,
            strokes: strokes,
            eventType: eventType,
            clientEventId: clientEventId,
            metadata: metadata
        )
    }

    // MARK: - Codable
    //
    // Hand-written for one reason: `TriState` is deliberately not `Codable`
    // (absent-vs-null is a property of the *container*, not of a value), so the
    // three-way key handling is spelled out here exactly as the generator
    // spells it in `ScoreEventsAppendInput` — absent writes no key, null writes
    // an explicit null. Everything else is the synthesised behaviour.

    enum CodingKeys: String, CodingKey {
        case token, roundId, ballId, playHoleId, strokes, eventType
        case clientEventId, metadata, queuedAt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.token = try c.decode(String.self, forKey: .token)
        self.roundId = try c.decode(String.self, forKey: .roundId)
        self.ballId = try c.decode(String.self, forKey: .ballId)
        self.playHoleId = try c.decode(String.self, forKey: .playHoleId)
        self.strokes = try c.decodeIfPresent(Double.self, forKey: .strokes)
        self.eventType = try c.decode(ScoreEventEventType.self, forKey: .eventType)
        self.clientEventId = try c.decode(String.self, forKey: .clientEventId)
        if c.contains(.metadata) {
            self.metadata = try c.decodeNil(forKey: .metadata)
                ? .null
                : .value(try c.decode([String: JSONValue].self, forKey: .metadata))
        } else {
            self.metadata = .absent
        }
        self.queuedAt = try c.decode(Date.self, forKey: .queuedAt)
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(token, forKey: .token)
        try c.encode(roundId, forKey: .roundId)
        try c.encode(ballId, forKey: .ballId)
        try c.encode(playHoleId, forKey: .playHoleId)
        try c.encode(strokes, forKey: .strokes)
        try c.encode(eventType, forKey: .eventType)
        try c.encode(clientEventId, forKey: .clientEventId)
        switch metadata {
        case .absent: break
        case .null: try c.encodeNil(forKey: .metadata)
        case .value(let v): try c.encode(v, forKey: .metadata)
        }
        try c.encode(queuedAt, forKey: .queuedAt)
    }
}

actor PendingScoreQueue {
    static let maxAge: TimeInterval = 14 * 24 * 60 * 60
    static let maxEntries = 200

    /// Injected so tests are deterministic; production is `UUID().uuidString`.
    typealias IDProvider = @Sendable () -> String

    private let fileURL: URL
    private let makeID: IDProvider
    private var entries: [PendingScoreWrite] = []

    /// Last persistence failure, if any. Persistence is best effort — score
    /// entry must never crash over a full disk — but a silent failure with no
    /// trace at all is undebuggable.
    private(set) var lastPersistError: String?

    /// - Parameters:
    ///   - fileURL: defaults to `Application Support/tapscore/pending-scores.v1.json`.
    ///   - now: injectable clock for the hygiene pass at load.
    init(
        fileURL: URL = PendingScoreQueue.defaultFileURL(),
        now: Date = Date(),
        idProvider: @escaping IDProvider = { UUID().uuidString }
    ) {
        self.fileURL = fileURL
        self.makeID = idProvider
        let (loaded, dropped) = Self.load(from: fileURL)
        // Prune before anything can read stale leftovers.
        let kept = Self.hygiene(loaded, now: now)
        self.entries = kept
        // `Self.write` rather than `persist()`: a non-async actor init cannot
        // call an isolated method, so the file work is a static that both
        // paths share. Unreadable entries are rewritten away too — otherwise
        // they are re-parsed and re-dropped on every launch, forever.
        let changed = kept.count != loaded.count || dropped > 0
        self.lastPersistError = changed ? Self.write(kept, to: fileURL) : nil
    }

    static func defaultFileURL() -> URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first ?? URL(fileURLWithPath: NSTemporaryDirectory())
        return base
            .appendingPathComponent("tapscore", isDirectory: true)
            .appendingPathComponent("pending-scores.v1.json")
    }

    /// Queues a write and returns it, **already on disk**. Call this before the
    /// network attempt, then `ack(_:)` when the server confirms.
    ///
    /// Coalesces on `(token, ballId, playHoleId)`: an existing entry for the
    /// cell keeps its queue position and takes the new payload — strokes,
    /// event type, **metadata** and a new id — wholesale. Latest-wins means the
    /// newest intent replaces the older one entirely; carrying a superseded
    /// entry's metadata forward would post a mixture nobody ever entered.
    ///
    /// - Parameter clientEventId: normally omitted — property 3 above is that
    ///   the id is minted here, once. Pass one ONLY to re-queue an intent that
    ///   already has an id and lost its entry (the retry path, whose whole
    ///   point is that the re-send must dedupe against the attempt that may
    ///   have landed). Passing a fresh id there would turn a retry into a
    ///   second score event.
    @discardableResult
    func enqueue(
        token: String,
        roundId: String,
        ballId: String,
        playHoleId: String,
        strokes: Double?,
        eventType: ScoreEventEventType,
        metadata: TriState<[String: JSONValue]> = .absent,
        clientEventId: String? = nil,
        now: Date = Date()
    ) -> PendingScoreWrite {
        let write = PendingScoreWrite(
            token: token,
            roundId: roundId,
            ballId: ballId,
            playHoleId: playHoleId,
            strokes: strokes,
            eventType: eventType,
            clientEventId: clientEventId ?? makeID(),
            metadata: metadata,
            queuedAt: now
        )
        if let index = entries.firstIndex(where: {
            $0.token == token && $0.ballId == ballId && $0.playHoleId == playHoleId
        }) {
            entries[index] = write
        } else {
            entries.append(write)
        }
        entries = Self.hygiene(entries, now: now)
        persist()
        return write
    }

    /// Drops the entry with this exact `clientEventId` (server ack). A stale id
    /// — one already replaced by a coalescing re-edit — matches nothing: no-op.
    func ack(_ clientEventId: String) {
        let next = entries.filter { $0.clientEventId != clientEventId }
        guard next.count != entries.count else { return }
        entries = next
        persist()
    }

    /// This round's pending writes, in queue (first-touch) order — the order
    /// they must be replayed in.
    func pending(for token: String) -> [PendingScoreWrite] {
        entries.filter { $0.token == token }
    }

    /// Every pending write, all rounds, in queue order.
    func all() -> [PendingScoreWrite] { entries }

    var count: Int { entries.count }

    /// Drops a round's entries wholesale (round deleted).
    func forget(token: String) {
        let next = entries.filter { $0.token != token }
        guard next.count != entries.count else { return }
        entries = next
        persist()
    }

    // MARK: - Storage

    private static func hygiene(_ entries: [PendingScoreWrite], now: Date) -> [PendingScoreWrite] {
        let fresh = entries.filter { now.timeIntervalSince($0.queuedAt) <= maxAge }
        return fresh.count > maxEntries ? Array(fresh.suffix(maxEntries)) : fresh
    }

    /// Decodes **per entry**, keeping every readable one and dropping only the
    /// entries it cannot read — the web queue's `filter(isPendingScoreEvent)`.
    /// All-or-nothing decoding would let one entry mangled by a future schema
    /// change (or a partially rewritten file) throw away a whole round's worth
    /// of unsent scores, which is the exact loss this type exists to prevent.
    /// A file that is not even an array of objects still starts empty, rather
    /// than breaking score entry until the app is deleted.
    private static func load(from url: URL) -> (writes: [PendingScoreWrite], dropped: Int) {
        guard let data = try? Data(contentsOf: url) else { return ([], 0) }
        guard let salvaged = try? JSONDecoder().decode([Salvaged].self, from: data) else {
            return ([], 0)
        }
        let writes = salvaged.compactMap(\.write)
        return (writes, salvaged.count - writes.count)
    }

    /// One array element that decodes to a write, or to nothing. The unkeyed
    /// container advances past the element either way, so a bad entry costs
    /// exactly itself.
    private struct Salvaged: Decodable {
        let write: PendingScoreWrite?

        init(from decoder: any Decoder) throws {
            write = try? PendingScoreWrite(from: decoder)
        }
    }

    private func persist() {
        lastPersistError = Self.write(entries, to: fileURL)
    }

    /// Returns nil on success, or the failure description.
    private static func write(_ entries: [PendingScoreWrite], to url: URL) -> String? {
        do {
            try FileManager.default.createDirectory(
                at: url.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            // `.atomic` writes a temp file and renames — a kill mid-write
            // leaves the previous queue intact, never a truncated one.
            try JSONEncoder().encode(entries).write(to: url, options: .atomic)
            return nil
        } catch {
            return error.localizedDescription
        }
    }
}
