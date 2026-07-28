import XCTest
@testable import TapScore

// ===========================================================================
// THE KEYPAD'S TWO TABLES
// ---------------------------------------------------------------------------
// The pad renders from `KeypadKey.pad` and commits through `KeypadKey.action`,
// and labels its digits with `ScoreKeyLabel.label(score:par:)`. Both are ports
// of the web's `src/round/score-entry.component.ts` (`scoreLabel`, and the
// `keysHost.appendChild(...)` block), and both are pinned here because a skin
// change is allowed to move every pixel on that screen and none of these
// values.
// ===========================================================================

final class ScoreKeyLabelTests: XCTestCase {
    /// Par 4 — the default hole, and the row of names the labels are named for.
    func testParFourLabels() {
        let par = 4
        XCTAssertEqual(ScoreKeyLabel.label(score: 1, par: par), "HIO")
        XCTAssertEqual(ScoreKeyLabel.label(score: 2, par: par), "EAGLE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 3, par: par), "BIRDIE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 4, par: par), "PAR")
        XCTAssertEqual(ScoreKeyLabel.label(score: 5, par: par), "BOGEY")
        XCTAssertEqual(ScoreKeyLabel.label(score: 6, par: par), "DOUBLE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 7, par: par), "TRIPLE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 8, par: par), "QUAD")
        XCTAssertEqual(ScoreKeyLabel.label(score: 9, par: par), "OTHER")
    }

    /// Par 3 — the whole ladder shifts down one, and `1` is a hole-in-one
    /// rather than the eagle the arithmetic would give.
    func testParThreeLabels() {
        let par = 3
        XCTAssertEqual(ScoreKeyLabel.label(score: 1, par: par), "HIO")
        XCTAssertEqual(ScoreKeyLabel.label(score: 2, par: par), "BIRDIE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 3, par: par), "PAR")
        XCTAssertEqual(ScoreKeyLabel.label(score: 4, par: par), "BOGEY")
        XCTAssertEqual(ScoreKeyLabel.label(score: 5, par: par), "DOUBLE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 6, par: par), "TRIPLE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 7, par: par), "QUAD")
        XCTAssertEqual(ScoreKeyLabel.label(score: 8, par: par), "OTHER")
    }

    /// Par 5 — the only par where `ALBA` is reachable with a digit key, and the
    /// one where the HIO rule visibly beats the arithmetic (`1` is four under).
    func testParFiveLabels() {
        let par = 5
        XCTAssertEqual(ScoreKeyLabel.label(score: 1, par: par), "HIO")
        XCTAssertEqual(ScoreKeyLabel.label(score: 2, par: par), "ALBA")
        XCTAssertEqual(ScoreKeyLabel.label(score: 3, par: par), "EAGLE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 4, par: par), "BIRDIE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 5, par: par), "PAR")
        XCTAssertEqual(ScoreKeyLabel.label(score: 6, par: par), "BOGEY")
        XCTAssertEqual(ScoreKeyLabel.label(score: 7, par: par), "DOUBLE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 8, par: par), "TRIPLE")
        XCTAssertEqual(ScoreKeyLabel.label(score: 9, par: par), "QUAD")
    }

    /// Par 6 exists on a few courses, and `1` there is five under — still HIO,
    /// never the `OTHER` the `d <= -4` cut-off would otherwise produce.
    func testHoleInOneBeatsTheOutOfRangeCutOff() {
        XCTAssertEqual(ScoreKeyLabel.label(score: 1, par: 6), "HIO")
        XCTAssertEqual(ScoreKeyLabel.label(score: 2, par: 6), "OTHER")
        XCTAssertEqual(ScoreKeyLabel.label(score: 3, par: 6), "ALBA")
    }

    /// Far over par is `OTHER`, not `+5` — the web stops naming at quad.
    func testFarOverParIsOther() {
        XCTAssertEqual(ScoreKeyLabel.label(score: 8, par: 3), "OTHER")
        XCTAssertEqual(ScoreKeyLabel.label(score: 9, par: 3), "OTHER")
        XCTAssertEqual(ScoreKeyLabel.label(score: 9, par: 4), "OTHER")
    }
}

final class KeypadKeyTests: XCTestCase {
    /// The web's order, three to a row: 1–9, then `10+`, clear, pick-up.
    func testPadOrder() {
        XCTAssertEqual(
            KeypadKey.pad,
            [
                .number(1), .number(2), .number(3),
                .number(4), .number(5), .number(6),
                .number(7), .number(8), .number(9),
                .extended, .clear, .pickUp,
            ]
        )
        XCTAssertEqual(KeypadKey.pad.count, 12)
    }

    /// A digit key commits exactly its digit.
    func testDigitKeysCommitTheirValue() {
        for value in 1...9 {
            XCTAssertEqual(KeypadKey.number(value).action, .commit(value))
        }
    }

    /// **Pick up commits `0`; clear commits `nil`.** They are different facts —
    /// a picked-up hole was played, a cleared one has no result — and the store
    /// turns the second into a `score_cleared` event. Swapping them is the one
    /// mistake this screen must never make.
    func testPickUpIsZeroAndClearIsNil() {
        XCTAssertEqual(KeypadKey.pickUp.action, .commit(0))
        XCTAssertEqual(KeypadKey.clear.action, .commit(nil))
        XCTAssertNotEqual(KeypadKey.pickUp.action, KeypadKey.clear.action)
    }

    /// `10+` writes nothing — it opens the stepper, which commits on ✓.
    func testExtendedKeyOpensTheStepperInsteadOfCommitting() {
        XCTAssertEqual(KeypadKey.extended.action, .openStepper)
    }

    /// Faces: the numerals the web prints on the three special keys.
    func testSpecialKeyFaces() {
        XCTAssertEqual(KeypadKey.extended.numeral, "10+")
        XCTAssertEqual(KeypadKey.clear.numeral, "✕")
        XCTAssertEqual(KeypadKey.pickUp.numeral, "0")
        XCTAssertEqual(KeypadKey.number(7).numeral, "7")
    }

    /// Captions: digits are par-relative, the specials are fixed, `10+` has none.
    func testCaptions() {
        XCTAssertEqual(KeypadKey.number(3).caption(par: 3), "PAR")
        XCTAssertEqual(KeypadKey.number(3).caption(par: 4), "BIRDIE")
        XCTAssertEqual(KeypadKey.extended.caption(par: 4), "")
        XCTAssertEqual(KeypadKey.clear.caption(par: 4), "CLEAR")
        XCTAssertEqual(KeypadKey.pickUp.caption(par: 4), "PICK UP")
    }
}
