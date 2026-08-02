import XCTest
@testable import TapScore

/// Pins `DeviceRoundsStore` — the anonymous landing's only data source, and
/// therefore the thing that decides whether a signed-out user can find the
/// round they were scoring five minutes ago.
///
/// Runs against a throwaway `UserDefaults` suite: no shared state with the app
/// or with the other suites.
final class DeviceRoundsStoreTests: XCTestCase {
    private var defaults: UserDefaults!
    private var suiteName: String!

    override func setUpWithError() throws {
        try super.setUpWithError()
        suiteName = "tapscore.tests.device-rounds.\(UUID().uuidString)"
        defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        defaults = nil
        suiteName = nil
        super.tearDown()
    }

    private func store(cap: Int = deviceRoundsCap) -> DeviceRoundsStore {
        DeviceRoundsStore(defaults: defaults, cap: cap)
    }

    private func date(_ iso: String) -> Date {
        DeviceRoundsStore.isoFormatter.date(from: iso)!
    }

    // MARK: - Record

    func testRecordPutsTheNewestSightingFirst() {
        let store = store()

        store.recordOpen(token: "a", courseName: "Linköpings GK", now: date("2026-07-27T10:00:00Z"))
        store.recordOpen(token: "b", courseName: "Vreta Kloster", now: date("2026-07-27T11:00:00Z"))

        XCTAssertEqual(store.all().map(\.token), ["b", "a"])
    }

    func testReopeningDedupesByTokenAndBumpsToFront() {
        let store = store()
        store.recordOpen(token: "a", now: date("2026-07-27T10:00:00Z"))
        store.recordOpen(token: "b", now: date("2026-07-27T11:00:00Z"))

        store.recordOpen(token: "a", now: date("2026-07-27T12:00:00Z"))

        XCTAssertEqual(store.all().map(\.token), ["a", "b"], "A token must never appear twice.")
        XCTAssertEqual(store.round(for: "a")?.lastSeenAt, "2026-07-27T12:00:00Z")
    }

    // MARK: - Status updates and enrichment

    func testUnknownMetadataDoesNotEraseAnEarlierSighting() {
        let store = store()
        store.recordOpen(
            token: "a",
            courseName: "Linköpings GK",
            status: .active,
            date: "2026-07-27",
            now: date("2026-07-27T10:00:00Z")
        )

        // The deep-link path knows the token and nothing else. It must record
        // the open without blanking the row the preview already filled in.
        store.recordOpen(token: "a", now: date("2026-07-27T12:00:00Z"))

        let entry = store.round(for: "a")
        XCTAssertEqual(entry?.courseName, "Linköpings GK")
        XCTAssertEqual(entry?.status, .active)
        XCTAssertEqual(entry?.date, "2026-07-27")
        XCTAssertEqual(entry?.lastSeenAt, "2026-07-27T12:00:00Z", "The sighting time still moves.")
    }

    func testStatusUpdateCarriesCompletedAtAndReopenClearsIt() {
        let store = store()
        store.recordOpen(token: "a", status: .active, now: date("2026-07-27T10:00:00Z"))

        store.recordOpen(
            token: "a",
            status: .complete,
            completedAt: "2026-07-27T11:30:00Z",
            now: date("2026-07-27T11:31:00Z")
        )
        XCTAssertEqual(store.round(for: "a")?.status, .complete)
        XCTAssertEqual(store.round(for: "a")?.completedAt, "2026-07-27T11:30:00Z")

        // Friendly rounds reopen. A stale completedAt would keep the row in
        // "Recently finished" while the round is live again.
        store.recordOpen(token: "a", status: .active, now: date("2026-07-27T12:00:00Z"))
        XCTAssertEqual(store.round(for: "a")?.status, .active)
        XCTAssertNil(store.round(for: "a")?.completedAt)
    }

    func testACompletionTimeWithNoStatusImpliesComplete() {
        let store = store()
        store.recordOpen(token: "a", status: .active, now: date("2026-07-27T10:00:00Z"))

        // A caller holding a completion time knows the round finished; dropping
        // it would leave the row sitting in Ongoing.
        store.recordOpen(token: "a", completedAt: "2026-07-27T11:30:00Z", now: date("2026-07-27T11:31:00Z"))

        XCTAssertEqual(store.round(for: "a")?.status, .complete)
        XCTAssertEqual(store.round(for: "a")?.completedAt, "2026-07-27T11:30:00Z")
    }

    func testAnExplicitNonCompleteStatusBeatsACompletionTimeInTheSameCall() {
        let store = store()

        store.recordOpen(
            token: "a",
            status: .active,
            completedAt: "2026-07-27T11:30:00Z",
            now: date("2026-07-27T12:00:00Z")
        )

        XCTAssertEqual(store.round(for: "a")?.status, .active, "The explicit status wins.")
        XCTAssertNil(store.round(for: "a")?.completedAt, "…and the contradicted time goes with it.")
    }

    // MARK: - Cap

    func testCapEvictsTheLeastRecentlySeenRound() {
        let store = store(cap: 3)
        for (index, token) in ["a", "b", "c"].enumerated() {
            store.recordOpen(token: token, now: date("2026-07-27T1\(index):00:00Z"))
        }

        store.recordOpen(token: "d", now: date("2026-07-27T14:00:00Z"))

        XCTAssertEqual(store.all().map(\.token), ["d", "c", "b"], "'a' was the oldest sighting.")
    }

    func testReopeningAnOldRoundSavesItFromEviction() {
        let store = store(cap: 3)
        for (index, token) in ["a", "b", "c"].enumerated() {
            store.recordOpen(token: token, now: date("2026-07-27T1\(index):00:00Z"))
        }

        store.recordOpen(token: "a", now: date("2026-07-27T14:00:00Z"))
        store.recordOpen(token: "d", now: date("2026-07-27T15:00:00Z"))

        XCTAssertEqual(store.all().map(\.token), ["d", "a", "c"], "LRU, not insertion order.")
    }

    // MARK: - Remove

    func testRemoveDropsOnlyTheNamedToken() {
        let store = store()
        store.recordOpen(token: "a", now: date("2026-07-27T10:00:00Z"))
        store.recordOpen(token: "b", now: date("2026-07-27T11:00:00Z"))

        XCTAssertEqual(store.remove(token: "a").map(\.token), ["b"])
        XCTAssertNil(store.round(for: "a"))
    }

    func testRemovingAnAbsentTokenIsANoOp() {
        let store = store()
        store.recordOpen(token: "a", now: date("2026-07-27T10:00:00Z"))

        XCTAssertEqual(store.remove(token: "zzz").map(\.token), ["a"])
    }

    // MARK: - Persistence

    func testTheListSurvivesANewStoreOverTheSameDefaults() {
        store().recordOpen(
            token: "a",
            courseName: "Linköpings GK",
            status: .complete,
            completedAt: "2026-07-27T11:30:00Z",
            date: "2026-07-27",
            now: date("2026-07-27T12:00:00Z")
        )

        let reloaded = store().all()

        XCTAssertEqual(
            reloaded,
            [
                DeviceRound(
                    token: "a",
                    courseName: "Linköpings GK",
                    status: .complete,
                    completedAt: "2026-07-27T11:30:00Z",
                    date: "2026-07-27",
                    lastSeenAt: "2026-07-27T12:00:00Z"
                )
            ],
            "Every field must round-trip; a lossy encode would silently blank the landing."
        )
    }

    func testACorruptBlobReadsAsEmptyRatherThanCrashing() {
        defaults.set(Data("not json".utf8), forKey: DeviceRoundsStore.storageKey)

        XCTAssertEqual(store().all(), [])

        // …and the store recovers by writing over it.
        store().recordOpen(token: "a", now: date("2026-07-27T10:00:00Z"))
        XCTAssertEqual(store().all().map(\.token), ["a"])
    }

    func testOneUnreadableEntryDoesNotCostTheWholeList() {
        // Mirrors `jsonListCodec` on the web: entries are validated one by one,
        // so a half-written or foreign entry drops and the rest still render.
        let json = """
        [
          {"token":"a","courseName":"Linköpings GK","status":"active","lastSeenAt":"2026-07-27T10:00:00Z"},
          {"token":"broken"},
          {"nonsense":true},
          {"token":"b","courseName":"","status":"not_started","lastSeenAt":"2026-07-27T09:00:00Z"}
        ]
        """
        defaults.set(Data(json.utf8), forKey: DeviceRoundsStore.storageKey)

        let entries = store().all()

        XCTAssertEqual(entries.map(\.token), ["a", "b"])
        XCTAssertEqual(entries[0].courseName, "Linköpings GK", "Salvaged entries keep every field.")
    }

    func testANonArrayPayloadStillReadsAsEmpty() {
        defaults.set(Data(#"{"token":"a"}"#.utf8), forKey: DeviceRoundsStore.storageKey)

        XCTAssertEqual(store().all(), [])
    }

    // MARK: - Per-server namespacing

    func testTwoBackendsKeepSeparateLists() {
        // The bug this pins: a round created against the dev server used to
        // stay on the landing after the build was pointed back at prod, where
        // its token 404s on open and on delete.
        let dev = DeviceRoundsStore(configuration: .dev, defaults: defaults)
        let prod = DeviceRoundsStore(configuration: .production, defaults: defaults)

        dev.recordOpen(token: "local-only", courseName: "Linköpings GK")

        XCTAssertEqual(dev.all().map(\.token), ["local-only"])
        XCTAssertEqual(prod.all(), [], "A dev-server round is not a prod round.")
    }

    func testTheKeyNamesHostPortAndPath() {
        // Prod is not at the domain root, so the path is part of the
        // deployment's identity — two apps under one host must not share a list.
        XCTAssertEqual(
            DeviceRoundsStore.storageKey(for: .dev),
            "tapscore.device-rounds.v1.localhost-3030-api")
        XCTAssertEqual(
            DeviceRoundsStore.storageKey(for: .production),
            "tapscore.device-rounds.v1.app.swedenindoorgolf.se-tapscore-api")
    }

    func testStatusSpellingMatchesTheWire() {
        // `not_started` is the server's spelling. A Swift-flavoured
        // "notStarted" in the JSON would make the stored blob and an API
        // payload disagree about the same state.
        XCTAssertEqual(DeviceRoundStatus.notStarted.rawValue, "not_started")
        XCTAssertEqual(DeviceRoundStatus.active.rawValue, "active")
        XCTAssertEqual(DeviceRoundStatus.complete.rawValue, "complete")
    }
}
