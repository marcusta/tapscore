import XCTest

@testable import TapScore

/// The explainer table is copy, so the test is a copy test: every key has one,
/// none is empty, and the two that carry the most weight are pinned verbatim
/// against the spec. The TypeScript twin asserts the same key list and the same
/// strings — if the two ever disagree, one of them is wrong.
final class StatExplainersTests: XCTestCase {

    /// Total over the vocabulary. A key added to `StatEventKey` and forgotten
    /// here would otherwise reach the sheet as an empty card.
    func testEveryKeyHasANonEmptyExplainer() {
        for key in StatVocabulary.order {
            let text = StatExplainers.explainer(key)
            XCTAssertFalse(text.isEmpty, "\(key.rawValue) has no explainer")
            XCTAssertFalse(
                text.contains(key.rawValue), "\(key.rawValue) leaks its wire key into the copy")
        }
    }

    /// The table's own key set, not just the ones the order walks — the two
    /// must be the same set, and the TS twin asserts this list.
    func testTheTableCoversExactlyTheVocabulary() {
        XCTAssertEqual(Set(StatExplainers.table.keys), Set(StatVocabulary.order))
        XCTAssertEqual(StatExplainers.table.count, 12)
    }

    /// Recovery is the one the owner named first: if anything ships partial,
    /// this ships. Pinned verbatim.
    func testRecoveryIsPinnedVerbatim() {
        XCTAssertEqual(
            StatExplainers.explainer(.recoveryOk),
            "Did the very next shot get you back to a normal position: fairway, green, or a "
                + "clear approach? Say yes even if the hole still ended badly. This is about the "
                + "recovery shot, not the score.")
    }

    func testTheWave4KeysArePinnedVerbatim() {
        XCTAssertEqual(
            StatExplainers.explainer(.teeMissDir),
            "Which side the ball finished, looking down the hole from the tee. Only asked when "
                + "the drive left the fairway. Over a few rounds this is what separates a one-way "
                + "miss from a two-way one.")
        XCTAssertEqual(
            StatExplainers.explainer(.greenMissDir),
            "Which way you missed, seen from where you played the approach. Long is past the "
                + "flag, short is in front of it. Left and right are exactly that. On green "
                + "means the ball reached the green, just one shot too late to count as hit.")
        XCTAssertEqual(
            StatExplainers.explainer(.shortGameStrokes),
            "How many shots it took to get from off the green onto it. One is the normal answer "
                + "and is already filled in — only change it if you needed more.")
        XCTAssertEqual(
            StatExplainers.explainer(.penaltySource),
            "Which shot cost you the stroke. If a hole cost you more than one, pick the shot "
                + "that did the most damage.")
    }

    /// The sheet is the delivery, and it takes the prompts the step is actually
    /// showing — so a hidden prompt cannot explain itself.
    func testTheSheetExplainsOnlyTheVisiblePrompts() {
        var step = StatStep(
            modules: StatModules(
                tee: true, approach: true, putting: false, shortGame: true, penalties: false,
                recovery: false),
            par: 4, holeNumber: 1)
        step.answer(.gir, value: "0")
        let titles = step.prompts.map(\.key)
        XCTAssertEqual(
            titles, [.teeResult, .gir, .greenMissDir, .shortGameDifficulty, .shortGameStrokes])
        for key in titles {
            XCTAssertFalse(StatExplainers.explainer(key).isEmpty)
        }
    }
}
