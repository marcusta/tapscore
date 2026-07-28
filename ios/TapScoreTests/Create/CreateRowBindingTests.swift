import SwiftUI
import XCTest
@testable import TapScore

/// Pins the roster-row text bindings against the input-loss bug.
///
/// The obvious spelling captures the row VALUE that `body` was handed
/// (`get: { row.name }`). A `TextField` reads its binding far more often than a
/// SwiftUI body re-runs, so two keystrokes landing between re-evaluations meant
/// the second read still answered with the first character's snapshot: the
/// field snapped back and the keystroke was gone. Everything here is the
/// getter's obligation to resolve the row by ID, every time.
final class CreateRowBindingTests: XCTestCase {
    override func setUp() {
        super.setUp()
        RoundStubURLProtocol.reset()
        RoundStubURLProtocol.route("/setup/clubs", "[]")
        RoundStubURLProtocol.route("/setup/courses", "[]")
        RoundStubURLProtocol.route("/setup/formats", WebDraftFixtures.catalogJSON)
    }

    override func tearDown() {
        RoundStubURLProtocol.reset()
        super.tearDown()
    }

    /// THE regression. The binding is built ONCE — standing in for a body that
    /// has not re-run — and then written to several times in a row, as fast
    /// typing does. Every write must be readable through that same (stale)
    /// binding, and the last one must be what the store holds.
    @MainActor
    func testRapidWritesThroughOneBindingAllLand() async {
        let store = await loadedStore()
        let id = store.players[0].id
        // Captured before a single keystroke, and never rebuilt: exactly the
        // stale binding the bug depended on.
        let name = CreateRoundView.rowText(store, id: id, \.name)

        for text in ["A", "An", "Ann", "Anna"] {
            name.wrappedValue = text
            XCTAssertEqual(
                name.wrappedValue, text,
                "the field re-reads its binding between keystrokes; a stale read is a lost character")
        }
        XCTAssertEqual(store.players[0].name, "Anna")
    }

    /// The same for the handicap field, which is where a dropped character is
    /// worst: "18.4" losing its 4 is a valid number and a wrong scorecard.
    @MainActor
    func testHandicapWritesThroughOneBindingAllLand() async {
        let store = await loadedStore()
        let id = store.players[0].id
        let hcp = CreateRoundView.rowText(store, id: id, \.handicapText)

        for text in ["1", "18", "18,", "18,4"] {
            hcp.wrappedValue = text
            XCTAssertEqual(hcp.wrappedValue, text)
        }
        XCTAssertEqual(store.players[0].handicapText, "18,4")
        XCTAssertEqual(HandicapInput.parse(store.players[0].handicapText), 18.4)
    }

    /// A write to one row is invisible to another row's binding — the id, not
    /// the position, is what a binding addresses.
    @MainActor
    func testBindingsAddressRowsIndependently() async {
        let store = await loadedStore()
        let first = CreateRoundView.rowText(store, id: store.players[0].id, \.name)
        let second = CreateRoundView.rowText(store, id: store.players[1].id, \.name)

        first.wrappedValue = "Anna"
        second.wrappedValue = "Bert"

        XCTAssertEqual(first.wrappedValue, "Anna")
        XCTAssertEqual(second.wrappedValue, "Bert")
        XCTAssertEqual(store.players.map(\.name), ["Anna", "Bert"])
    }

    /// Rows shift when one above is removed. A binding held across that must
    /// still name the row it was made for, not whoever now sits at its index.
    @MainActor
    func testABindingSurvivesTheRowAboveItBeingRemoved() async {
        let store = await loadedStore()
        store.addPlayer()
        let third = CreateRoundView.rowText(store, id: store.players[2].id, \.name)
        third.wrappedValue = "Cleo"

        store.removePlayer(id: store.players[0].id)

        XCTAssertEqual(third.wrappedValue, "Cleo")
        third.wrappedValue = "Cleo B"
        XCTAssertEqual(store.players.last?.name, "Cleo B")
    }

    /// A binding onto a row that is gone reads empty and swallows writes,
    /// rather than resurrecting the row.
    @MainActor
    func testABindingOntoARemovedRowIsInert() async {
        let store = await loadedStore()
        store.addPlayer()
        let id = store.players[2].id
        let gone = CreateRoundView.rowText(store, id: id, \.name)
        gone.wrappedValue = "Cleo"

        store.removePlayer(id: id)
        XCTAssertEqual(gone.wrappedValue, "")

        gone.wrappedValue = "Cleo"
        XCTAssertEqual(store.players.count, 2)
        XCTAssertFalse(store.players.contains { $0.name == "Cleo" })
    }

    // MARK: - Fixtures

    @MainActor
    private func loadedStore() async -> CreateStore {
        let store = CreateStore(api: RoundStubURLProtocol.makeAPI())
        await store.load()
        return store
    }
}
