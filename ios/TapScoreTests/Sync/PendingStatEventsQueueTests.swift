import XCTest

@testable import TapScore

/// The stats queue's three invariants, pinned the same way the score queue's
/// are: on disk before the attempt, one entry per key with the latest value,
/// and an id that never changes once minted.
final class PendingStatEventsQueueTests: XCTestCase {
    private var fileURL: URL!

    override func setUp() {
        super.setUp()
        fileURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("stat-queue-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("pending-stat-events.v1.json")
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: fileURL.deletingLastPathComponent())
        super.tearDown()
    }

    /// `id-1`, `id-2`, … so a test can name the id it expects.
    private func sequentialIDs() -> PendingStatEventsQueue.IDProvider {
        let counter = Counter()
        return { counter.next() }
    }

    private final class Counter: @unchecked Sendable {
        private let lock = NSLock()
        private var n = 0
        func next() -> String {
            lock.lock()
            defer { lock.unlock() }
            n += 1
            return "id-\(n)"
        }
    }

    private func makeQueue(now: Date = Date(timeIntervalSince1970: 1_800_000_000))
        -> PendingStatEventsQueue
    {
        PendingStatEventsQueue(fileURL: fileURL, now: now, idProvider: sequentialIDs())
    }

    private let now = Date(timeIntervalSince1970: 1_800_000_000)

    // MARK: - Persist on attempt

    func testEnqueueWritesToDiskBeforeAnythingIsPosted() async {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: "1", now: now)

        XCTAssertTrue(FileManager.default.fileExists(atPath: fileURL.path))
        // A fresh queue over the same file sees it — the relaunch path.
        let reloaded = PendingStatEventsQueue(fileURL: fileURL, now: now)
        let pending = await reloaded.pending(for: "tok-1")
        XCTAssertEqual(pending.count, 1)
        XCTAssertEqual(pending.first?.key, .gir)
        XCTAssertEqual(pending.first?.value, "1")
        XCTAssertEqual(pending.first?.clientEventId, "id-1")
    }

    func testABatchIsQueuedInOrder() async {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1",
            batch: [
                StatBatchItem(key: .teeResult, value: "trouble"),
                StatBatchItem(key: .gir, value: "0"),
                StatBatchItem(key: .putts, value: "2"),
            ],
            now: now)
        let pending = await queue.pending(for: "tok-1")
        XCTAssertEqual(pending.map(\.key), [.teeResult, .gir, .putts])
        XCTAssertEqual(pending.map(\.clientEventId), ["id-1", "id-2", "id-3"])
    }

    // MARK: - Coalescing

    func testTwoAnswersForOneKeyCoalesceToTheLatest() async {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .putts, value: "1", now: now)
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .putts, value: "3", now: now)

        let pending = await queue.pending(for: "tok-1")
        XCTAssertEqual(pending.count, 1)
        XCTAssertEqual(pending.first?.value, "3")
        XCTAssertEqual(pending.first?.clientEventId, "id-2")
    }

    func testCoalescingIsPerKeyPerHolePerPlayer() async {
        let queue = makeQueue()
        for (hole, player, key) in [
            ("ph-1", "p-1", StatEventKey.gir), ("ph-1", "p-1", .putts),
            ("ph-2", "p-1", .gir), ("ph-1", "p-2", .gir),
        ] {
            _ = await queue.enqueue(
                token: "tok-1", playHoleId: hole, playerId: player, key: key, value: "1", now: now)
        }
        let count = await queue.count
        XCTAssertEqual(count, 4, "different holes, players and keys are different entries")
    }

    func testCoalescingKeepsFirstTouchPosition() async {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: "0", now: now)
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .putts, value: "2", now: now)
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: "1", now: now)

        let pending = await queue.pending(for: "tok-1")
        XCTAssertEqual(pending.map(\.key), [.gir, .putts])
        XCTAssertEqual(pending.first?.value, "1")
    }

    /// A clear coalesces like any other answer — the LAST intent wins, and a
    /// nil value is that intent, not the absence of one.
    func testAClearSupersedesAnUnsentValue() async {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: "1", now: now)
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: nil, now: now)

        let pending = await queue.pending(for: "tok-1")
        XCTAssertEqual(pending.count, 1)
        XCTAssertNil(pending.first?.value)
    }

    // MARK: - The wire

    /// Absent and null are different on this endpoint: null CLEARS. A queued
    /// clear must encode as an explicit JSON null, not a missing key.
    func testAClearEncodesAsAnExplicitNull() async throws {
        let queue = makeQueue()
        let event = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: nil, now: now)
        let body = PlayerStatsAppendEventsInput(token: "tok-1", items: [event.item])
        let json = String(decoding: try JSONEncoder().encode(body), as: UTF8.self)
        XCTAssertTrue(json.contains("\"value\":null"), json)

        let set = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-2", playerId: "p-1", key: .gir, value: "1", now: now)
        let setJSON = String(
            decoding: try JSONEncoder().encode(
                PlayerStatsAppendEventsInput(token: "tok-1", items: [set.item])), as: UTF8.self)
        XCTAssertTrue(setJSON.contains("\"value\":\"1\""), setJSON)
    }

    func testTheItemCarriesTheQueuedIdentity() async {
        let queue = makeQueue()
        let event = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-7", playerId: "p-9", key: .firstPutt,
            value: "over_8m", now: now)
        XCTAssertEqual(event.item.playHoleId, "ph-7")
        XCTAssertEqual(event.item.playerId, "p-9")
        XCTAssertEqual(event.item.key, .firstPutt)
        XCTAssertEqual(event.item.value, "over_8m")
        XCTAssertEqual(event.item.clientEventId, "id-1")
    }

    // MARK: - Ack and replay

    func testAckDropsOnlyTheConfirmedEntries() async {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1",
            batch: [
                StatBatchItem(key: .gir, value: "1"), StatBatchItem(key: .putts, value: "2"),
            ], now: now)
        await queue.ack(["id-1"])

        let pending = await queue.pending(for: "tok-1")
        XCTAssertEqual(pending.map(\.key), [.putts])
    }

    /// The id is minted once and replayed verbatim, so a replay of an event that
    /// actually landed dedupes server-side instead of appending a second one.
    func testAnIdSurvivesAReplayAndAStaleAckMatchesNothing() async {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: "0", now: now)
        let first = await queue.pending(for: "tok-1")
        let second = await queue.pending(for: "tok-1")
        XCTAssertEqual(first.map(\.clientEventId), second.map(\.clientEventId))

        // A superseding answer takes a new id; the old one is stale.
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: "1", now: now)
        await queue.ack(["id-1"])
        let pending = await queue.pending(for: "tok-1")
        XCTAssertEqual(pending.count, 1, "a stale ack must not dequeue the newer intent")
        XCTAssertEqual(pending.first?.value, "1")
    }

    func testEntriesAreFilteredByToken() async {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: "1", now: now)
        _ = await queue.enqueue(
            token: "tok-2", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: "0", now: now)

        let mine = await queue.pending(for: "tok-1")
        XCTAssertEqual(mine.count, 1)
        XCTAssertEqual(mine.first?.value, "1")

        await queue.forget(token: "tok-1")
        let left = await queue.all()
        XCTAssertEqual(left.map(\.token), ["tok-2"])
    }

    // MARK: - Hygiene and salvage

    func testEntriesOlderThanTwoWeeksArePrunedOnLoad() async {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: "1", now: now)

        let later = now.addingTimeInterval(PendingStatEventsQueue.maxAge + 60)
        let reloaded = PendingStatEventsQueue(fileURL: fileURL, now: later)
        let count = await reloaded.count
        XCTAssertEqual(count, 0)
    }

    func testCorruptStorageStartsEmptyInsteadOfBreakingCapture() async {
        try? FileManager.default.createDirectory(
            at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? Data("not json at all".utf8).write(to: fileURL)

        let queue = makeQueue()
        let count = await queue.count
        XCTAssertEqual(count, 0)
        _ = await queue.enqueue(
            token: "tok-1", playHoleId: "ph-1", playerId: "p-1", key: .gir, value: "1", now: now)
        let after = await queue.count
        XCTAssertEqual(after, 1)
    }

    /// One unreadable element must cost exactly itself.
    func testOneUnreadableEntryDoesNotCostTheRest() async {
        try? FileManager.default.createDirectory(
            at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        let good = """
            [{"token":"tok-1","playHoleId":"ph-1","playerId":"p-1","key":"gir","value":"1",
              "clientEventId":"id-9","queuedAt":\(now.timeIntervalSinceReferenceDate)},
             {"nonsense":true}]
            """
        try? Data(good.utf8).write(to: fileURL)

        let queue = makeQueue()
        let pending = await queue.pending(for: "tok-1")
        XCTAssertEqual(pending.count, 1)
        XCTAssertEqual(pending.first?.clientEventId, "id-9")
    }
}
