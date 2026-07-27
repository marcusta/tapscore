import XCTest
@testable import TapScore

/// Cursor persistence: LRU order, the 50-entry cap, and survival across a
/// restart (a fresh store over the same defaults, which is what a relaunch is).
final class ResultCursorStoreTests: XCTestCase {
    private var defaults: UserDefaults!
    private var suiteName: String!

    override func setUp() {
        super.setUp()
        suiteName = "tapscore.tests.cursors.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        defaults = nil
        suiteName = nil
        super.tearDown()
    }

    func testRemembersAndReadsBackACursor() {
        let store = ResultCursorStore(defaults: defaults)

        store.remember(token: "tok", cursor: "evt-1")

        XCTAssertEqual(store.cursor(for: "tok"), "evt-1")
        XCTAssertNil(store.cursor(for: "unknown"))
    }

    func testSurvivesARelaunch() {
        ResultCursorStore(defaults: defaults).remember(token: "tok", cursor: "evt-1")

        let afterRelaunch = ResultCursorStore(defaults: defaults)

        XCTAssertEqual(afterRelaunch.cursor(for: "tok"), "evt-1")
    }

    func testRewritingATokenDedupesAndBumpsItToTheFront() {
        let store = ResultCursorStore(defaults: defaults)

        store.remember(token: "a", cursor: "1")
        store.remember(token: "b", cursor: "2")
        store.remember(token: "a", cursor: "3")

        XCTAssertEqual(store.all().map(\.token), ["a", "b"], "One entry per token, newest first.")
        XCTAssertEqual(store.cursor(for: "a"), "3")
    }

    func testCapEvictsTheLeastRecentlyActiveRound() {
        let store = ResultCursorStore(defaults: defaults)

        for index in 1...(resultCursorsCap + 10) {
            store.remember(token: "tok-\(index)", cursor: "evt-\(index)")
        }

        let all = store.all()
        XCTAssertEqual(resultCursorsCap, 50)
        XCTAssertEqual(all.count, resultCursorsCap)
        XCTAssertEqual(all.first?.token, "tok-60", "Most recent first.")
        XCTAssertNil(store.cursor(for: "tok-1"), "The oldest fell off; that costs one refetch.")
        XCTAssertEqual(store.cursor(for: "tok-11"), "evt-11", "The 50 most recent survive.")
    }

    func testTouchingAnOldTokenSavesItFromEviction() {
        let store = ResultCursorStore(defaults: defaults)
        for index in 1...resultCursorsCap {
            store.remember(token: "tok-\(index)", cursor: "evt-\(index)")
        }

        store.remember(token: "tok-1", cursor: "evt-1b") // Still being scored.
        store.remember(token: "fresh", cursor: "evt-x")

        XCTAssertEqual(store.cursor(for: "tok-1"), "evt-1b")
        XCTAssertNil(store.cursor(for: "tok-2"), "LRU evicts by last write, not by first.")
    }

    func testForgetDropsOneTokenAndIsANoOpWhenAbsent() {
        let store = ResultCursorStore(defaults: defaults)
        store.remember(token: "a", cursor: "1")
        store.remember(token: "b", cursor: "2")

        store.forget(token: "a")
        store.forget(token: "missing")

        XCTAssertNil(store.cursor(for: "a"))
        XCTAssertEqual(store.all().map(\.token), ["b"])
    }

    func testACorruptBlobStartsOverInsteadOfCrashing() {
        defaults.set(Data("not json".utf8), forKey: ResultCursorStore.storageKey)
        let store = ResultCursorStore(defaults: defaults)

        XCTAssertTrue(store.all().isEmpty)
        store.remember(token: "a", cursor: "1")
        XCTAssertEqual(store.cursor(for: "a"), "1")
    }
}
