import XCTest
@testable import TapScore

/// The offline queue's three load-bearing properties, mirroring
/// `src/round/pending-queue.ts`: persist before the attempt, coalesce per cell
/// with latest-wins, and keep `clientEventId` stable so a replay dedupes
/// server-side instead of double-scoring a hole.
final class PendingScoreQueueTests: XCTestCase {
    private var fileURL: URL!

    override func setUp() {
        super.setUp()
        fileURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("tapscore-tests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("pending-scores.v1.json")
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: fileURL.deletingLastPathComponent())
        fileURL = nil
        super.tearDown()
    }

    /// Deterministic ids: `id-1`, `id-2`, … so assertions can name them.
    private func sequentialIDs() -> @Sendable () -> String {
        let counter = Counter()
        return { "id-\(counter.next())" }
    }

    private final class Counter: @unchecked Sendable {
        private let lock = NSLock()
        private var value = 0
        func next() -> Int {
            lock.lock()
            defer { lock.unlock() }
            value += 1
            return value
        }
    }

    private func makeQueue(now: Date = Date()) -> PendingScoreQueue {
        PendingScoreQueue(fileURL: fileURL, now: now, idProvider: sequentialIDs())
    }

    // MARK: - Persist before attempt

    func testEnqueuePersistsBeforeTheNetworkAttemptAndSurvivesAKill() async throws {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: 4, eventType: .scoreEntered
        )
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h2",
            strokes: 3, eventType: .scoreEntered
        )

        // No ack — the app dies here, mid-attempt. A fresh actor over the same
        // file is exactly what the next launch builds.
        let reloaded = PendingScoreQueue(fileURL: fileURL, idProvider: sequentialIDs())
        let replay = await reloaded.pending(for: "tok")

        XCTAssertEqual(replay.map(\.playHoleId), ["h1", "h2"], "Replay is FIFO.")
        XCTAssertEqual(replay.map(\.clientEventId), ["id-1", "id-2"])
        XCTAssertEqual(replay.first?.strokes, 4)
    }

    func testAckRemovesTheEntryFromDiskToo() async throws {
        let queue = makeQueue()
        let write = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: 4, eventType: .scoreEntered
        )

        await queue.ack(write.clientEventId)

        let reloaded = PendingScoreQueue(fileURL: fileURL, idProvider: sequentialIDs())
        let count = await reloaded.count
        XCTAssertEqual(count, 0, "An acked write must not replay on the next launch.")
    }

    func testAckOfAStaleIdIsANoOp() async throws {
        let queue = makeQueue()
        let first = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: 4, eventType: .scoreEntered
        )
        // The user corrects the score while the first attempt is still in
        // flight; the late success ack for the superseded attempt arrives.
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: 5, eventType: .scoreEntered
        )

        await queue.ack(first.clientEventId)

        let pending = await queue.pending(for: "tok")
        XCTAssertEqual(
            pending.map(\.strokes), [5],
            "A stale ack must not dequeue the newer intended value."
        )
    }

    // MARK: - Coalescing

    func testCoalescesPerCellLatestWinsKeepingQueuePosition() async throws {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: 4, eventType: .scoreEntered
        )
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h2",
            strokes: 3, eventType: .scoreEntered
        )
        // Three more edits to the SAME cell as the first entry.
        for strokes in [5.0, 6.0, 7.0] {
            _ = await queue.enqueue(
                token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
                strokes: strokes, eventType: .scoreEntered
            )
        }

        let pending = await queue.pending(for: "tok")

        XCTAssertEqual(pending.count, 2, "At most one entry per (ball, hole) cell.")
        XCTAssertEqual(pending.map(\.playHoleId), ["h1", "h2"], "First-touch position is kept.")
        XCTAssertEqual(pending.first?.strokes, 7, "Latest wins.")
    }

    func testCoalescingDistinguishesBallsHolesAndTokens() async throws {
        let queue = makeQueue()
        for (token, ball, hole) in [
            ("tok", "b1", "h1"), ("tok", "b2", "h1"), ("tok", "b1", "h2"), ("other", "b1", "h1"),
        ] {
            _ = await queue.enqueue(
                token: token, roundId: "r1", ballId: ball, playHoleId: hole,
                strokes: 4, eventType: .scoreEntered
            )
        }

        let mine = await queue.pending(for: "tok")
        let theirs = await queue.pending(for: "other")

        XCTAssertEqual(mine.count, 3)
        XCTAssertEqual(theirs.count, 1, "Another round's leftovers never leak into this one.")
    }

    // MARK: - Idempotency across replays

    func testClientEventIdIsGeneratedOnceAndSurvivesReplay() async throws {
        let queue = makeQueue()
        let write = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: nil, eventType: .scoreCleared
        )

        let firstReplay = await PendingScoreQueue(fileURL: fileURL, idProvider: sequentialIDs())
            .pending(for: "tok")
        let secondReplay = await PendingScoreQueue(fileURL: fileURL, idProvider: sequentialIDs())
            .pending(for: "tok")

        XCTAssertEqual(firstReplay.first?.clientEventId, write.clientEventId)
        XCTAssertEqual(secondReplay.first?.clientEventId, write.clientEventId)

        let input = try XCTUnwrap(firstReplay.first).appendInput
        XCTAssertEqual(input.clientEventId, write.clientEventId, "The server dedupes on this.")
        XCTAssertEqual(input.roundId, "r1")
        XCTAssertNil(input.strokes, "A cleared score posts a null, not a zero.")
        XCTAssertEqual(input.eventType, .scoreCleared)
        XCTAssertTrue(input.metadata.isAbsent, "Absent ≠ null on this wire.")
    }

    // MARK: - Metadata

    private static let metadata: TriState<[String: JSONValue]> = .value([
        "source": .string("watch"),
        "confidence": .number(0.5),
    ])

    func testEnqueuedMetadataRidesAlongOnTheReplayedBody() async throws {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: 4, eventType: .scoreEntered, metadata: Self.metadata
        )

        // The next launch replays from disk — the body it posts must be the
        // body that was enqueued, metadata included. A metadata-less replay
        // would supersede the cell with a poorer event than the user entered.
        let reloaded = await PendingScoreQueue(fileURL: fileURL, idProvider: sequentialIDs())
            .pending(for: "tok")
        let replayed = try XCTUnwrap(reloaded.first)
        let body = try JSONSerialization.jsonObject(
            with: JSONEncoder().encode(replayed.appendInput)
        ) as? [String: Any]

        let posted = try XCTUnwrap(body?["metadata"] as? [String: Any])
        XCTAssertEqual(posted["source"] as? String, "watch")
        XCTAssertEqual(posted["confidence"] as? Double, 0.5)
    }

    func testExplicitNullMetadataStaysNullAndAbsentStaysAbsentAcrossDisk() async throws {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: 4, eventType: .scoreEntered, metadata: .null
        )
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h2",
            strokes: 4, eventType: .scoreEntered
        )

        let replayed = await PendingScoreQueue(fileURL: fileURL, idProvider: sequentialIDs())
            .pending(for: "tok")

        XCTAssertEqual(replayed[0].metadata, .null, "An explicit null must not decay to absent.")
        XCTAssertTrue(replayed[1].metadata.isAbsent, "Absent ≠ null on this wire.")
        let nulled = try JSONSerialization.jsonObject(
            with: JSONEncoder().encode(replayed[0].appendInput)
        ) as? [String: Any]
        XCTAssertTrue(nulled?["metadata"] is NSNull, "Null posts the key with a null.")
        let absent = try JSONSerialization.jsonObject(
            with: JSONEncoder().encode(replayed[1].appendInput)
        ) as? [String: Any]
        XCTAssertNil(absent?["metadata"], "Absent posts no key at all.")
    }

    func testCoalescingReplacesTheOlderEntrysMetadata() async throws {
        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: 4, eventType: .scoreEntered, metadata: Self.metadata
        )
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: 5, eventType: .scoreEntered,
            metadata: .value(["source": .string("manual")])
        )

        let pending = await queue.pending(for: "tok")

        XCTAssertEqual(pending.count, 1)
        XCTAssertEqual(
            pending.first?.metadata,
            .value(["source": .string("manual")]),
            "Latest-wins replaces metadata wholesale; it never merges the two."
        )
    }

    // MARK: - Hygiene

    func testStaleEntriesArePrunedWhenTheQueueIsLOADED() async throws {
        let now = Date()
        let fifteenDaysAgo = now.addingTimeInterval(-15 * 24 * 60 * 60)
        // Both enqueues happen in the PAST, so nothing is pruned on the way in
        // — this test is about the load-time pass and nothing else.
        let queue = makeQueue(now: fifteenDaysAgo)
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "old",
            strokes: 4, eventType: .scoreEntered, now: fifteenDaysAgo
        )
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "fresh",
            // Two days ago: 13 days newer than `old`, so `old` is still fresh
            // *relative to this enqueue* and survives the enqueue-time pass.
            strokes: 4, eventType: .scoreEntered, now: now.addingTimeInterval(-2 * 24 * 60 * 60)
        )
        let beforeReload = await queue.pending(for: "tok")
        XCTAssertEqual(
            beforeReload.map(\.playHoleId), ["old", "fresh"],
            "Precondition: both entries are still on disk when the app dies."
        )

        let reloaded = PendingScoreQueue(fileURL: fileURL, now: now, idProvider: sequentialIDs())
        let pending = await reloaded.pending(for: "tok")

        XCTAssertEqual(pending.map(\.playHoleId), ["fresh"], "14 days old is dropped at load.")

        // And the prune is written through, not just applied in memory.
        let onDisk = PendingScoreQueue(fileURL: fileURL, now: now, idProvider: sequentialIDs())
        let stillGone = await onDisk.count
        XCTAssertEqual(stillGone, 1)
    }

    func testTheCapDropsTheOLDESTEntriesAndKeepsTheNewest() async throws {
        let queue = makeQueue()
        for hole in 1...(PendingScoreQueue.maxEntries + 5) {
            _ = await queue.enqueue(
                token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h\(hole)",
                strokes: 4, eventType: .scoreEntered
            )
        }

        let pending = await queue.pending(for: "tok")

        XCTAssertEqual(pending.count, PendingScoreQueue.maxEntries)
        XCTAssertEqual(
            pending.first?.playHoleId, "h6",
            "The five oldest are the ones dropped — a queue that shed its newest writes would lose the score just entered."
        )
        XCTAssertEqual(pending.last?.playHoleId, "h205")
    }

    // MARK: - Forget

    func testForgetDropsOnlyThatRoundsEntriesAndPersistsTheDrop() async throws {
        let queue = makeQueue()
        for token in ["gone", "kept"] {
            _ = await queue.enqueue(
                token: token, roundId: "r-\(token)", ballId: "b1", playHoleId: "h1",
                strokes: 4, eventType: .scoreEntered
            )
        }

        await queue.forget(token: "gone")

        let reloaded = PendingScoreQueue(fileURL: fileURL, idProvider: sequentialIDs())
        let survivors = await reloaded.all()
        XCTAssertEqual(survivors.map(\.token), ["kept"], "A deleted round must not replay on relaunch.")

        // Forgetting a token with nothing queued must not disturb the rest.
        await queue.forget(token: "never-seen")
        let after = await queue.all()
        XCTAssertEqual(after.map(\.token), ["kept"])
    }

    // MARK: - Corrupt storage

    func testOneUnreadableEntryIsDroppedWithoutTakingTheGoodOnesWithIt() async throws {
        let queue = makeQueue()
        for hole in ["h1", "h2"] {
            _ = await queue.enqueue(
                token: "tok", roundId: "r1", ballId: "b1", playHoleId: hole,
                strokes: 4, eventType: .scoreEntered
            )
        }

        // Splice one unreadable element into the middle of the persisted array,
        // the way a schema change or a partial rewrite would.
        let raw = try JSONSerialization.jsonObject(with: Data(contentsOf: fileURL))
        var array = try XCTUnwrap(raw as? [Any])
        array.insert(["token": "tok", "nonsense": true], at: 1)
        try JSONSerialization.data(withJSONObject: array).write(to: fileURL)

        let reloaded = PendingScoreQueue(fileURL: fileURL, idProvider: sequentialIDs())
        let pending = await reloaded.pending(for: "tok")

        XCTAssertEqual(
            pending.map(\.playHoleId), ["h1", "h2"],
            "A single bad entry must not cost a whole round's unsent scores."
        )
        // The salvage is written back, so the bad entry is not re-parsed forever.
        let rewritten = try JSONSerialization.jsonObject(with: Data(contentsOf: fileURL)) as? [Any]
        XCTAssertEqual(rewritten?.count, 2)
    }

    func testACorruptFileStartsEmptyRatherThanBreakingScoreEntry() async throws {
        try FileManager.default.createDirectory(
            at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true
        )
        try Data("{ this is not the queue".utf8).write(to: fileURL)

        let queue = makeQueue()
        _ = await queue.enqueue(
            token: "tok", roundId: "r1", ballId: "b1", playHoleId: "h1",
            strokes: 4, eventType: .scoreEntered
        )

        let count = await queue.count
        XCTAssertEqual(count, 1)
        let persistError = await queue.lastPersistError
        XCTAssertNil(persistError)
    }
}
