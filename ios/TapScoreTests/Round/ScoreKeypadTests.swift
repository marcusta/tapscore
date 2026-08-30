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

// ===========================================================================
// THE CAPTURE CARD'S FOLD
// ---------------------------------------------------------------------------
// `StatStep.shortGameDisclosure` says whether the pair MAY fold; `ShortGameFold`
// says which visits have already opened it, and lays out the card that follows.
// Unfolding is remembered per (ball, hole) FOR THE ROUND: coming back to a card
// that was opened finds it still open.
// ===========================================================================

final class ShortGameFoldTests: XCTestCase {
    private let visit = VisitKey(playerId: "p-1", playHoleId: "ph-1")

    private func prompts(_ keys: [StatEventKey]) -> [StatPrompt] {
        keys.map {
            StatPrompt(key: $0, label: StatVocabulary.label(for: $0), control: .segments([]))
        }
    }

    /// `none` and `expanded` draw the rows whatever the view thinks.
    func testOnlyCollapsedEverFolds() {
        let fold = ShortGameFold()
        XCTAssertFalse(fold.isFolded(disclosure: .none, visit: visit))
        XCTAssertFalse(fold.isFolded(disclosure: .expanded, visit: visit))
        XCTAssertTrue(fold.isFolded(disclosure: .collapsed, visit: visit))
    }

    func testOpeningUnfoldsThisVisit() {
        var fold = ShortGameFold()
        fold.open(visit)
        XCTAssertFalse(fold.isFolded(disclosure: .collapsed, visit: visit))
    }

    /// Another player, and another hole, are other visits — those still fold.
    func testAnotherVisitIsStillFolded() {
        var fold = ShortGameFold()
        fold.open(visit)
        let nextPlayer = VisitKey(playerId: "p-2", playHoleId: "ph-1")
        let nextHole = VisitKey(playerId: "p-1", playHoleId: "ph-2")
        XCTAssertTrue(fold.isFolded(disclosure: .collapsed, visit: nextPlayer))
        XCTAssertTrue(fold.isFolded(disclosure: .collapsed, visit: nextHole))
    }

    /// The memory is a SET, and it keeps every visit: leaving a card and coming
    /// back to it finds it open, which is what the golfer left behind.
    func testAnOpenedVisitStaysOpenAfterVisitingOthers() {
        var fold = ShortGameFold()
        fold.open(visit)
        fold.open(VisitKey(playerId: "p-2", playHoleId: "ph-1"))
        fold.open(VisitKey(playerId: "p-1", playHoleId: "ph-2"))
        XCTAssertFalse(
            fold.isFolded(disclosure: .collapsed, visit: visit),
            "the first card was opened and nothing since has closed it")
    }

    /// A missing player or hole is still ONE key, not a key that matches everything.
    func testAnEmptyVisitDoesNotCollideWithARealOne() {
        XCTAssertNotEqual(VisitKey(playerId: nil, playHoleId: nil), visit)
        var fold = ShortGameFold()
        fold.open(VisitKey(playerId: nil, playHoleId: nil))
        XCTAssertTrue(fold.isFolded(disclosure: .collapsed, visit: visit))
    }

    /// Both short-game rows fold, and nothing else does.
    func testFoldedKeysAreThePair() {
        XCTAssertEqual(ShortGameFold.foldedKeys, [.shortGameDifficulty, .shortGameStrokes])
        XCTAssertFalse(ShortGameFold.foldedKeys.contains(.gir))
        XCTAssertFalse(ShortGameFold.foldedKeys.contains(.greenMissDir))
    }

    // MARK: The card

    /// Folded: ONE disclosure row REPLACES the pair, in the pair's own place —
    /// not beside them, and not two of it.
    func testTheDisclosureReplacesThePairInPlace() {
        let card = ShortGameFold().visible(
            prompts([.gir, .greenMissDir, .shortGameDifficulty, .shortGameStrokes, .putts]),
            disclosure: .collapsed, visit: visit)
        XCTAssertEqual(
            card,
            [
                .prompt(prompts([.gir])[0]),
                .prompt(prompts([.greenMissDir])[0]),
                .shortGameDisclosure,
                .prompt(prompts([.putts])[0]),
            ])
        XCTAssertEqual(card.filter { $0 == .shortGameDisclosure }.count, 1)
    }

    /// Unfolded, by any route: every prompt, no disclosure row.
    func testAnUnfoldedCardIsJustThePrompts() {
        let all = prompts([.gir, .shortGameDifficulty, .shortGameStrokes, .putts])
        var fold = ShortGameFold()
        for disclosure in [StatStep.ShortGameDisclosure.none, .expanded] {
            XCTAssertEqual(
                fold.visible(all, disclosure: disclosure, visit: visit), all.map { .prompt($0) })
        }
        fold.open(visit)
        XCTAssertEqual(
            fold.visible(all, disclosure: .collapsed, visit: visit), all.map { .prompt($0) })
    }

    /// Rows carry stable ids, so the `ForEach` does not re-identify the card
    /// when the pair folds or unfolds.
    func testRowIdentity() {
        XCTAssertEqual(ShortGameFold.Row.shortGameDisclosure.id, "short-game-disclosure")
        XCTAssertEqual(ShortGameFold.Row.prompt(prompts([.putts])[0]).id, "putts")
    }
}

final class StatCaptureCopyTests: XCTestCase {
    /// The trigger is a word, not a glyph (`docs/design-guidelines.md` §4).
    func testTheDisclosureTriggerIsWorded() {
        XCTAssertEqual(StatCaptureCopy.addShortGame, "Add short game")
        XCTAssertFalse(StatCaptureCopy.addShortGame.contains("›"))
    }

    /// A prompt with a label speaks its label.
    func testALabelledPromptKeepsItsLabel() {
        let prompt = StatPrompt(key: .firstPutt, label: "First putt", control: .segments([]))
        XCTAssertEqual(StatCaptureCopy.name(prompt), "First putt")
    }

    /// `first_putt_m` renders headless on purpose, so every non-visual surface
    /// — VoiceOver, the explainer sheet — needs this name instead of "".
    func testTheHeadlessMetreRowStillHasAName() {
        let prompt = StatPrompt(
            key: .firstPuttM, label: StatVocabulary.label(for: .firstPuttM),
            control: .segments([]))
        XCTAssertTrue(prompt.label.isEmpty, "the model ships it label-less")
        XCTAssertEqual(StatCaptureCopy.name(prompt), "First putt, exact")
    }

    /// No prompt reaches the explainer sheet without a title.
    func testEveryPromptHasANonEmptyName() {
        for key in StatVocabulary.order {
            let prompt = StatPrompt(
                key: key, label: StatVocabulary.label(for: key), control: .segments([]))
            XCTAssertFalse(
                StatCaptureCopy.name(prompt).isEmpty, "\(key.rawValue) would be an untitled card")
        }
    }
}
