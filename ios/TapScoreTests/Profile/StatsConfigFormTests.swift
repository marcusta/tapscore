import XCTest
@testable import TapScore

/// The Statistics section's decisions, without a view or a server.
///
/// The two rules worth pinning here are the ones the server enforces with a
/// 409: short game cannot outlive putting, recovery cannot outlive tee. The
/// client mirrors them so a legal tap never becomes a failed request — and the
/// mirror is one-directional, which is the other half of the contract.
final class StatsConfigFormTests: XCTestCase {
    private static func form(
        enabled: Bool = true,
        tee: Bool = false,
        approach: Bool = false,
        putting: Bool = false,
        shortGame: Bool = false,
        penalties: Bool = false,
        recovery: Bool = false
    ) -> StatsConfigForm {
        StatsConfigForm(
            enabled: enabled, tee: tee, approach: approach, putting: putting,
            shortGame: shortGame, penalties: penalties, recovery: recovery)
    }

    // MARK: - Shape

    func testTheWireSnapshotCarriesEverySwitch() {
        let input = Self.form(enabled: true, tee: true, putting: true, shortGame: true).input

        XCTAssertEqual(input.enabled, true)
        XCTAssertEqual(input.tee, true)
        XCTAssertEqual(input.putting, true)
        XCTAssertEqual(input.shortGame, true)
        XCTAssertEqual(input.approach, false)
        XCTAssertEqual(input.penalties, false)
        XCTAssertEqual(input.recovery, false)
    }

    func testAServerConfigBecomesTheFormItDescribes() {
        let config = PlayerStatsConfig(
            playerId: "p-1", enabled: true, tee: true, approach: false, putting: true,
            shortGame: true, penalties: false, recovery: true,
            updatedAt: "2026-07-29T09:00:00.000Z")

        let form = StatsConfigForm(config)

        XCTAssertEqual(form, Self.form(
            enabled: true, tee: true, putting: true, shortGame: true, recovery: true))
    }

    func testTheModuleRowsAreInCaptureOrder() {
        XCTAssertEqual(
            StatsModule.allCases.map(\.title),
            ["Tee shots", "Greens in regulation", "Putting", "Short game",
             "Penalties", "Recovery"])
    }

    // MARK: - Dependencies

    func testADependentIsLockedAndAnnotatedWhileItsPrerequisiteIsOff() {
        let form = Self.form(enabled: true)

        XCTAssertTrue(form.isLocked(.shortGame))
        XCTAssertEqual(form.annotation(.shortGame), "Needs Putting")
        XCTAssertTrue(form.isLocked(.recovery))
        XCTAssertEqual(form.annotation(.recovery), "Needs Tee shots")
        // The three with no prerequisite are actionable and say nothing.
        for module in [StatsModule.tee, .approach, .putting, .penalties] {
            XCTAssertFalse(form.isLocked(module), module.rawValue)
            XCTAssertNil(form.annotation(module), module.rawValue)
        }
    }

    func testAMetPrerequisiteUnlocksItsDependentAndDropsTheAnnotation() {
        let form = Self.form(enabled: true, tee: true, putting: true)

        XCTAssertFalse(form.isLocked(.shortGame))
        XCTAssertNil(form.annotation(.shortGame))
        XCTAssertFalse(form.isLocked(.recovery))
        XCTAssertNil(form.annotation(.recovery))
    }

    /// THE RULE THIS TYPE EXISTS FOR: the pair the server 409s on is never
    /// built. Turning the prerequisite off takes the dependent with it.
    func testTurningAPrerequisiteOffTakesItsDependentDown() {
        let start = Self.form(
            enabled: true, tee: true, putting: true, shortGame: true, recovery: true)

        let withoutPutting = start.setting(.putting, to: false)
        XCTAssertFalse(withoutPutting.shortGame)
        XCTAssertTrue(withoutPutting.recovery, "the other pair is untouched")

        let withoutTee = start.setting(.tee, to: false)
        XCTAssertFalse(withoutTee.recovery)
        XCTAssertTrue(withoutTee.shortGame, "the other pair is untouched")
    }

    /// And the mirror is ONE-directional. Enabling putting must not enable
    /// short game: nobody asked for it, and the server's own rule is "refuse,
    /// never repair" for exactly this reason.
    func testTurningAPrerequisiteOnLeavesItsDependentAlone() {
        let next = Self.form(enabled: true).setting(.putting, to: true)

        XCTAssertTrue(next.putting)
        XCTAssertFalse(next.shortGame)
        XCTAssertFalse(next.isLocked(.shortGame), "but it is now actionable")
    }

    func testADependentCanBeTurnedOnOnceItsPrerequisiteIs() {
        let next = Self.form(enabled: true, putting: true).setting(.shortGame, to: true)

        XCTAssertTrue(next.shortGame)
        XCTAssertTrue(next.putting)
    }

    // MARK: - Master switch

    /// Spec §3: `enabled: false` preserves the module selection. The rows go
    /// dead, the values stay — turning stats back on is not starting over.
    func testTheMasterSwitchLocksEveryRowWithoutClearingIt() {
        let on = Self.form(
            enabled: true, tee: true, putting: true, shortGame: true, recovery: true)

        let off = on.settingEnabled(false)

        XCTAssertFalse(off.enabled)
        XCTAssertTrue(off.tee)
        XCTAssertTrue(off.shortGame)
        XCTAssertTrue(off.recovery)
        XCTAssertTrue(StatsModule.allCases.allSatisfy(off.isLocked))
        XCTAssertEqual(off.settingEnabled(true), on, "and back again, unchanged")
    }

    /// A locked row still reports its stored value. `isOn` is what the server
    /// holds; `isLocked` is only about the tap.
    func testALockedRowStillShowsItsStoredValue() {
        let off = Self.form(enabled: false, tee: true, putting: true, shortGame: true)

        XCTAssertTrue(off.isOn(.shortGame))
        XCTAssertTrue(off.isLocked(.shortGame))
        // While the master is off, an unmet-dependency annotation would be a
        // second explanation for a state the master switch already explains.
        XCTAssertNil(StatsConfigForm.allOff.annotation(.shortGame))
    }

    func testTheDefaultIsEverythingOff() {
        XCTAssertEqual(
            StatsConfigForm.allOff,
            Self.form(enabled: false))
        XCTAssertTrue(StatsModule.allCases.allSatisfy { !StatsConfigForm.allOff.isOn($0) })
    }
}
