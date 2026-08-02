import XCTest

@testable import TapScore

/// The capture rules, with no store, no network and no view in the way: which
/// prompts a hole asks, how one answer changes that set, and what a closed step
/// owes the server.
final class StatPromptsTests: XCTestCase {

    private func modules(
        tee: Bool = false,
        approach: Bool = false,
        putting: Bool = false,
        shortGame: Bool = false,
        penalties: Bool = false,
        recovery: Bool = false
    ) -> StatModules {
        StatModules(
            tee: tee, approach: approach, putting: putting, shortGame: shortGame,
            penalties: penalties, recovery: recovery)
    }

    private func step(
        _ m: StatModules,
        par: Double = 4,
        hole: Double = 1,
        persisted: [StatEventKey: String] = [:]
    ) -> StatStep {
        StatStep(modules: m, par: par, holeNumber: hole, persisted: persisted)
    }

    private func keys(_ s: StatStep) -> [StatEventKey] { s.prompts.map(\.key) }

    // MARK: - Module → prompt mapping

    func testEachModuleContributesItsOwnKeys() {
        XCTAssertEqual(keys(step(modules(tee: true))), [.teeResult])
        XCTAssertEqual(keys(step(modules(approach: true))), [.gir])
        XCTAssertEqual(keys(step(modules(putting: true))), [.firstPutt, .putts])
        XCTAssertEqual(keys(step(modules(penalties: true))), [.penalties])
    }

    func testModulesOffAskNothing() {
        XCTAssertTrue(step(modules()).isEmpty)
    }

    /// Short game and recovery are conditional, so their module alone never puts
    /// a prompt on the card — the condition has to be met too.
    func testConditionalModulesAloneAskNothing() {
        XCTAssertTrue(step(modules(shortGame: true)).isEmpty)
        XCTAssertTrue(step(modules(recovery: true)).isEmpty)
    }

    func testPromptsComeInShotOrder() {
        var s = step(
            modules(
                tee: true, approach: true, putting: true, shortGame: true, penalties: true,
                recovery: true),
            par: 4)
        s.answer(.teeResult, value: "trouble")
        s.answer(.gir, value: "0")
        // The penalty is ANSWERED, not merely offered: `penalty_source` hangs
        // off a non-zero penalty, so leaving it unanswered would leave the
        // eleventh prompt contradicted and the order assertion below untrue.
        s.step(.penalties, by: 1)
        // The worst case wave 4 names: eleven inputs on a par 4.
        XCTAssertEqual(
            keys(s),
            [
                .teeResult, .teeMissDir, .recoveryOk, .gir, .greenMissDir,
                .shortGameDifficulty, .shortGameStrokes, .firstPutt, .putts, .penalties,
                .penaltySource,
            ])
        // …and that worst case IS the vocabulary's own order, so a key added to
        // `StatVocabulary.order` cannot silently render out of shot order.
        XCTAssertEqual(keys(s), StatVocabulary.order)
    }

    // MARK: - Par gating

    func testTeeResultIsNotAskedOnAPar3() {
        let all = modules(tee: true, approach: true, putting: true)
        XCTAssertEqual(keys(step(all, par: 3)), [.gir, .firstPutt, .putts])
        XCTAssertEqual(keys(step(all, par: 4)).first, .teeResult)
        XCTAssertEqual(keys(step(all, par: 5)).first, .teeResult)
    }

    /// The gate is the same `appliesWhen` evaluation the format layer uses, not
    /// a second hardcoded par rule.
    func testTheParGateIsTheSharedPredicate() {
        XCTAssertFalse(MetadataAppliesRule.evaluate(StatVocabulary.teeApplies, par: 3, hole: 1))
        XCTAssertTrue(MetadataAppliesRule.evaluate(StatVocabulary.teeApplies, par: 4, hole: 1))
        XCTAssertTrue(MetadataAppliesRule.evaluate(nil, par: 3, hole: 1))
        XCTAssertFalse(
            MetadataAppliesRule.evaluate(MetadataApplies(holes: [2, 3]), par: 4, hole: 1))
        // Every present clause must hold.
        XCTAssertFalse(
            MetadataAppliesRule.evaluate(
                MetadataApplies(minPar: 4, maxPar: 4), par: 5, hole: 1))
    }

    /// Recovery hangs off the tee prompt, so a par 3 cannot reach it at all.
    func testRecoveryIsUnreachableOnAPar3() {
        var s = step(modules(tee: true, recovery: true), par: 3)
        s.answer(.teeResult, value: "trouble")
        XCTAssertTrue(s.isEmpty)
    }

    // MARK: - Answer-dependent visibility

    func testShortGameAppearsOnlyWhenGIRIsAnsweredMiss() {
        var s = step(modules(approach: true, shortGame: true))
        XCTAssertEqual(keys(s), [.gir], "unanswered GIR says nothing about the short game")
        s.answer(.gir, value: "1")
        XCTAssertEqual(keys(s), [.gir])
        s.answer(.gir, value: "0")
        XCTAssertEqual(keys(s), [.gir, .greenMissDir, .shortGameDifficulty, .shortGameStrokes])
    }

    func testRecoveryAppearsOnlyAfterTrouble() {
        var s = step(modules(tee: true, recovery: true))
        XCTAssertEqual(keys(s), [.teeResult])
        s.answer(.teeResult, value: "fairway")
        XCTAssertEqual(keys(s), [.teeResult])
        s.answer(.teeResult, value: "trouble")
        XCTAssertEqual(keys(s), [.teeResult, .teeMissDir, .recoveryOk])
    }

    /// Hiding a revealed prompt DISCARDS its answer. A mis-tap that opened the
    /// short-game row must not leave its answer behind in the batch.
    func testHidingAPromptDiscardsItsAnswer() {
        var s = step(modules(approach: true, shortGame: true))
        s.answer(.gir, value: "0")
        s.answer(.shortGameDifficulty, value: "hard")
        XCTAssertEqual(s.value(of: .shortGameDifficulty), "hard")

        s.answer(.gir, value: "1")
        XCTAssertNil(s.value(of: .shortGameDifficulty))
        XCTAssertEqual(s.batch, [StatBatchItem(key: .gir, value: "1")])
    }

    /// Same discard, but the hidden key was already stored server-side: then the
    /// discard has to travel as an explicit clear, or the ghost row survives.
    func testHidingAStoredPromptClearsItOnTheServer() {
        var s = step(
            modules(approach: true, shortGame: true),
            persisted: [.gir: "0", .shortGameDifficulty: "hard"])
        XCTAssertEqual(keys(s), [.gir, .greenMissDir, .shortGameDifficulty, .shortGameStrokes])

        s.answer(.gir, value: "1")
        XCTAssertEqual(keys(s), [.gir])
        XCTAssertEqual(
            s.batch,
            [
                StatBatchItem(key: .gir, value: "1"),
                StatBatchItem(key: .shortGameDifficulty, value: nil),
            ])
    }

    /// A step whose stored state is already inconsistent (a short-game answer
    /// with GIR hit) cleans itself up on open rather than rendering an
    /// impossible row.
    func testAnImpossibleStoredCombinationIsPrunedOnOpen() {
        let s = step(
            modules(approach: true, shortGame: true),
            persisted: [.gir: "1", .shortGameDifficulty: "hard"])
        XCTAssertEqual(keys(s), [.gir])
        XCTAssertEqual(s.batch, [StatBatchItem(key: .shortGameDifficulty, value: nil)])
    }

    /// The other kind of hidden. A module the player stopped tracking (or a hole
    /// shape that cannot ask) makes the question UNASKABLE — it says nothing
    /// about the stored answer, so nothing is cleared. Emitting a clear here
    /// would delete history on a config change, and would queue a batch the
    /// server may refuse, blocking every later stat behind it.
    func testATurnedOffModuleKeepsItsStoredValue() {
        let s = step(
            modules(approach: true),
            persisted: [.gir: "0", .shortGameDifficulty: "hard", .penalties: "2"])
        XCTAssertEqual(keys(s), [.gir, .greenMissDir])
        XCTAssertTrue(s.batch.isEmpty, "module off is unreadable, not wrong")
    }

    func testAParThreeKeepsAStoredTeeResult() {
        let s = step(
            modules(tee: true, putting: true, recovery: true),
            par: 3,
            persisted: [.teeResult: "trouble", .recoveryOk: "1"])
        XCTAssertEqual(keys(s), [.firstPutt, .putts])
        XCTAssertTrue(
            s.batch.isEmpty, "a par 3 cannot ask the question, so it cannot answer it")
    }

    /// …and the draft half is still dropped, so an answer typed before a config
    /// change does not sneak out under a prompt that is no longer on the card.
    func testATurnedOffModuleStillDropsItsDraft() {
        var s = step(modules(approach: true, penalties: true))
        s.step(.penalties, by: 1)
        XCTAssertEqual(s.batch, [StatBatchItem(key: .penalties, value: "1")])

        s.refresh(modules: modules(approach: true), persisted: [:])
        XCTAssertTrue(s.batch.isEmpty)
    }

    // MARK: - Tri-state

    func testUntouchedKeysEmitNothing() {
        let s = step(modules(tee: true, approach: true, putting: true, penalties: true))
        XCTAssertFalse(s.prompts.isEmpty)
        XCTAssertEqual(s.batch, [], "unanswered is not false — it is no event at all")
        XCTAssertFalse(s.isAnswered(.gir))
        XCTAssertFalse(s.isAnswered(.penalties))
    }

    func testReSelectingTheSameOptionDeselectsIt() {
        var s = step(modules(approach: true))
        s.answer(.gir, value: "1")
        XCTAssertEqual(s.value(of: .gir), "1")
        s.answer(.gir, value: nil)
        XCTAssertNil(s.value(of: .gir))
        XCTAssertEqual(s.batch, [], "it was never stored, so there is nothing to clear")
    }

    func testDeselectingAStoredAnswerBatchesAClear() {
        var s = step(modules(approach: true), persisted: [.gir: "1"])
        XCTAssertTrue(s.isAnswered(.gir))
        s.answer(.gir, value: nil)
        XCTAssertNil(s.value(of: .gir))
        XCTAssertEqual(s.batch, [StatBatchItem(key: .gir, value: nil)])
    }

    func testReAnsweringTheStoredValueSendsNothing() {
        var s = step(modules(approach: true), persisted: [.gir: "1"])
        s.answer(.gir, value: "0")
        s.answer(.gir, value: "1")
        XCTAssertEqual(s.value(of: .gir), "1")
        XCTAssertEqual(s.batch, [], "a revisit that changes nothing must post nothing")
    }

    func testAnswersOnHiddenPromptsAreRefused() {
        var s = step(modules(approach: true, shortGame: true))
        s.answer(.shortGameDifficulty, value: "hard")
        XCTAssertNil(s.value(of: .shortGameDifficulty))
        XCTAssertEqual(s.batch, [])
    }

    // MARK: - Steppers

    func testPuttsStepperClampsAtZeroAndThree() {
        var s = step(modules(putting: true))
        s.step(.putts, by: -1)
        XCTAssertEqual(s.value(of: .putts), "0", "any nudge answers the key, floor included")
        for _ in 0..<10 { s.step(.putts, by: 1) }
        XCTAssertEqual(s.value(of: .putts), "3")
        XCTAssertEqual(StatVocabulary.stepperText(3, max: 3), "3+")
        XCTAssertEqual(StatVocabulary.stepperText(2, max: 3), "2")
    }

    func testPenaltiesStepperIsUnbounded() {
        var s = step(modules(penalties: true))
        for _ in 0..<5 { s.step(.penalties, by: 1) }
        XCTAssertEqual(s.value(of: .penalties), "5")
        XCTAssertEqual(StatVocabulary.stepperText(5, max: nil), "5")
        s.step(.penalties, by: -10)
        XCTAssertEqual(s.value(of: .penalties), "0")
    }

    func testSteppingBackToTheStoredValueSendsNothing() {
        var s = step(modules(putting: true), persisted: [.putts: "2"])
        s.step(.putts, by: 1)
        XCTAssertEqual(s.batch, [StatBatchItem(key: .putts, value: "3")])
        s.step(.putts, by: -1)
        XCTAssertEqual(s.batch, [])
    }

    // MARK: - Wire vocabulary

    /// The option values are the closed set the server accepts. A rename here
    /// is a 400 at capture time, so they are pinned.
    func testOptionValuesMatchTheServerVocabulary() {
        func values(_ key: StatEventKey) -> [String] {
            guard case .segments(let options) = StatVocabulary.control(for: key) else { return [] }
            return options.map(\.value)
        }
        XCTAssertEqual(values(.teeResult), ["fairway", "in_play", "trouble"])
        XCTAssertEqual(values(.gir), ["0", "1"])
        XCTAssertEqual(
            values(.firstPutt),
            ["inside_1m", "1_to_2m", "2_to_4m", "4_to_8m", "over_8m"])
        guard case .segments(let firstPutt) = StatVocabulary.control(for: .firstPutt) else {
            return XCTFail("First putt must stay a segmented row")
        }
        XCTAssertEqual(firstPutt.map(\.label), ["< 1m", "1–2m", "2–4m", "4–8m", "> 8m"])
        XCTAssertEqual(values(.shortGameDifficulty), ["standard", "hard", "bunker"])
        XCTAssertEqual(values(.teeMissDir), ["left", "right"])
        XCTAssertEqual(values(.greenMissDir), ["long", "short", "left", "right"])
        XCTAssertEqual(values(.penaltySource), ["tee", "approach", "short_or_green"])
        XCTAssertEqual(StatVocabulary.control(for: .shortGameStrokes), .stepper(min: 1, max: 5))
        XCTAssertEqual(values(.recoveryOk), ["0", "1"])
        XCTAssertEqual(StatVocabulary.control(for: .putts), .stepper(min: 0, max: 3))
        XCTAssertEqual(StatVocabulary.control(for: .penalties), .stepper(min: 0, max: nil))
    }

    // MARK: - Committing

    func testCommitFoldsTheDraftAndLeavesNothingOwing() {
        var s = step(modules(approach: true, putting: true), persisted: [.putts: "2"])
        s.answer(.gir, value: "0")
        s.step(.putts, by: -1)
        XCTAssertEqual(
            s.batch,
            [StatBatchItem(key: .gir, value: "0"), StatBatchItem(key: .putts, value: "1")])

        s.commitDraft()
        XCTAssertEqual(s.batch, [], "a committed step must not re-queue its own answers")
        XCTAssertEqual(s.value(of: .gir), "0")
        XCTAssertEqual(s.value(of: .putts), "1")
    }

    func testRefreshKeepsTheDraft() {
        var s = step(modules(approach: true, putting: true))
        s.answer(.gir, value: "0")
        s.refresh(modules: modules(approach: true, putting: true), persisted: [.putts: "2"])
        XCTAssertEqual(s.value(of: .gir), "0", "a load must not swallow an in-progress answer")
        XCTAssertEqual(s.value(of: .putts), "2")
        XCTAssertEqual(s.batch, [StatBatchItem(key: .gir, value: "0")])
    }

    func testRefreshPrunesPromptsAModuleChangeRemoved() {
        var s = step(modules(approach: true, shortGame: true))
        s.answer(.gir, value: "0")
        s.answer(.shortGameDifficulty, value: "hard")
        s.refresh(modules: modules(approach: true), persisted: [:])
        XCTAssertEqual(keys(s), [.gir, .greenMissDir])
        XCTAssertNil(s.value(of: .shortGameDifficulty))
    }

    // MARK: - Wave 4 keys: the three visibility states

    /// `tee_miss_dir` is asked on a drive that left the fairway, is
    /// CONTRADICTED by a fairway hit (so a stored side is cleared on the
    /// server), and is UNREADABLE with the tee module off (so a stored side
    /// stays put).
    func testTeeMissDirectionHasAllThreeStates() {
        var visible = step(modules(tee: true))
        visible.answer(.teeResult, value: "in_play")
        XCTAssertEqual(keys(visible), [.teeResult, .teeMissDir])

        var contradicted = step(modules(tee: true), persisted: [.teeMissDir: "left"])
        contradicted.answer(.teeResult, value: "fairway")
        XCTAssertEqual(keys(contradicted), [.teeResult])
        XCTAssertEqual(
            contradicted.batch,
            [
                StatBatchItem(key: .teeResult, value: "fairway"),
                StatBatchItem(key: .teeMissDir, value: nil),
            ],
            "a contradicted side must reach the server as an explicit clear")

        let unreadable = step(
            modules(putting: true), persisted: [.teeResult: "trouble", .teeMissDir: "left"])
        XCTAssertEqual(keys(unreadable), [.firstPutt, .putts])
        XCTAssertTrue(unreadable.batch.isEmpty, "module off is unreadable, not wrong")
    }

    func testGreenMissDirectionHasAllThreeStates() {
        var visible = step(modules(approach: true))
        visible.answer(.gir, value: "0")
        XCTAssertEqual(keys(visible), [.gir, .greenMissDir])

        var contradicted = step(modules(approach: true), persisted: [.greenMissDir: "long"])
        contradicted.answer(.gir, value: "1")
        XCTAssertEqual(keys(contradicted), [.gir])
        XCTAssertEqual(
            contradicted.batch,
            [
                StatBatchItem(key: .gir, value: "1"),
                StatBatchItem(key: .greenMissDir, value: nil),
            ])

        let unreadable = step(modules(putting: true), persisted: [.greenMissDir: "long"])
        XCTAssertTrue(unreadable.batch.isEmpty)
    }

    /// The counter shares the difficulty's gate exactly — it is asked whenever
    /// there was a short-game shot, not once a difficulty has been picked.
    func testShortGameStrokesHasAllThreeStates() {
        var visible = step(modules(approach: true, shortGame: true))
        visible.answer(.gir, value: "0")
        XCTAssertEqual(keys(visible), [.gir, .greenMissDir, .shortGameDifficulty, .shortGameStrokes])

        var contradicted = step(
            modules(approach: true, shortGame: true), persisted: [.shortGameStrokes: "2"])
        contradicted.answer(.gir, value: "1")
        XCTAssertEqual(keys(contradicted), [.gir])
        XCTAssertEqual(
            contradicted.batch,
            [
                StatBatchItem(key: .gir, value: "1"),
                StatBatchItem(key: .shortGameStrokes, value: nil),
            ])

        let unreadable = step(
            modules(approach: true), persisted: [.gir: "0", .shortGameStrokes: "2"])
        XCTAssertEqual(keys(unreadable), [.gir, .greenMissDir])
        XCTAssertTrue(unreadable.batch.isEmpty)
    }

    /// `penalty_source` hangs off a NON-ZERO penalty: an unanswered or zeroed
    /// penalty contradicts it, which is why the shot-order test has to answer
    /// the penalty to see all eleven prompts.
    func testPenaltySourceHasAllThreeStates() {
        var visible = step(modules(penalties: true))
        visible.step(.penalties, by: 1)
        XCTAssertEqual(keys(visible), [.penalties, .penaltySource])

        XCTAssertEqual(
            keys(step(modules(penalties: true))), [.penalties],
            "an unanswered penalty count says nothing about a source")

        var contradicted = step(
            modules(penalties: true), persisted: [.penalties: "1", .penaltySource: "tee"])
        contradicted.answer(.penalties, value: "0")
        XCTAssertEqual(keys(contradicted), [.penalties])
        XCTAssertEqual(
            contradicted.batch,
            [
                StatBatchItem(key: .penalties, value: "0"),
                StatBatchItem(key: .penaltySource, value: nil),
            ])

        let unreadable = step(
            modules(putting: true), persisted: [.penalties: "1", .penaltySource: "tee"])
        XCTAssertTrue(unreadable.batch.isEmpty)
    }

    // MARK: - Derived GIR (§3.4b)

    private func girStep(
        par: Double = 4, strokes: Int?, putts: String?, persistedGir: String? = nil,
        firstPutt: String? = nil
    ) -> StatStep {
        var persisted: [StatEventKey: String] = [:]
        if let putts { persisted[.putts] = putts }
        if let persistedGir { persisted[.gir] = persistedGir }
        if let firstPutt { persisted[.firstPutt] = firstPutt }
        return StatStep(
            modules: modules(approach: true, putting: true, shortGame: true), par: par,
            holeNumber: 1, persisted: persisted, strokes: strokes)
    }

    func testDerivedGirIsPendingWhenTheScoreCanAnswerAndNobodyHas() {
        let s = girStep(strokes: 5, putts: "2")
        XCTAssertEqual(s.derivedGirState, .pending)
        XCTAssertEqual(s.derivedGir, "0", "5 − 2 = 3 shots to a par 4 green is a miss")
        XCTAssertEqual(girStep(strokes: 4, putts: "2").derivedGir, "1")
    }

    func testDerivedGirIsIdleWithNothingToDeriveFrom() {
        XCTAssertEqual(girStep(strokes: nil, putts: "2").derivedGirState, .idle)
        XCTAssertEqual(girStep(strokes: 5, putts: nil).derivedGirState, .idle)
        // A holed-out-from-off-the-green hole with a putt bucket recorded is
        // incoherent, so the derivation refuses rather than guessing.
        XCTAssertEqual(
            girStep(strokes: 4, putts: "0", firstPutt: "1_to_2m").derivedGirState, .idle)
        // …and the coherent version of the same hole IS a miss: a chip-in
        // missed the green.
        XCTAssertEqual(girStep(strokes: 3, putts: "0").derivedGir, "0")
    }

    func testDerivedGirAgreesOrDisagreesWithAStoredAnswer() {
        XCTAssertEqual(girStep(strokes: 4, putts: "2", persistedGir: "1").derivedGirState, .persisted)
        XCTAssertEqual(girStep(strokes: 5, putts: "2", persistedGir: "1").derivedGirState, .disagree)
        // Disagreement changes NOTHING: the stored answer stays authoritative
        // and nothing is queued.
        let disagreeing = girStep(strokes: 5, putts: "2", persistedGir: "1")
        XCTAssertEqual(disagreeing.value(of: .gir), "1")
        XCTAssertTrue(disagreeing.batch.isEmpty)
    }

    func testAManualTapBeforeCloseWins() {
        var s = girStep(strokes: 5, putts: "2")
        XCTAssertEqual(s.derivedGirState, .pending)
        s.answer(.gir, value: "1")
        XCTAssertEqual(s.derivedGirState, .manual)
        XCTAssertFalse(s.materialiseDerivedGir(), "a manual answer is never overwritten")
        XCTAssertEqual(s.value(of: .gir), "1")
        // The lock survives a refresh — a load landing under an open card must
        // not un-decide what the golfer decided.
        s.refresh(modules: modules(approach: true, putting: true, shortGame: true), persisted: [:])
        XCTAssertEqual(s.derivedGirState, .manual)
    }

    /// Un-answering is as deliberate as answering: "do not fill this in" locks
    /// too, so a cleared GIR does not silently come back on close.
    func testClearingGirLocksItAsFirmlyAsAnsweringIt() {
        var s = girStep(strokes: 5, putts: "2", persistedGir: "1")
        s.answer(.gir, value: nil)
        XCTAssertEqual(s.derivedGirState, .manual)
        XCTAssertFalse(s.materialiseDerivedGir())
    }

    func testMaterialisingOnCloseRevealsTheMissFollowUps() {
        var s = girStep(strokes: 5, putts: "2")
        XCTAssertEqual(keys(s), [.gir, .firstPutt, .putts], "nothing is revealed at render time")
        XCTAssertTrue(s.materialiseDerivedGir())
        XCTAssertEqual(s.value(of: .gir), "0")
        XCTAssertEqual(
            keys(s), [.gir, .greenMissDir, .shortGameDifficulty, .shortGameStrokes, .firstPutt, .putts])
        XCTAssertEqual(s.batch, [StatBatchItem(key: .gir, value: "0")])
        XCTAssertFalse(s.materialiseDerivedGir(), "materialising twice must not re-queue")
    }

    /// A derived HIT contradicts a stored short-game answer, and the clear
    /// travels — the same path a manual tap takes.
    func testMaterialisingAHitContradictsAStoredShortGameAnswer() {
        var s = StatStep(
            modules: modules(approach: true, putting: true, shortGame: true), par: 4,
            holeNumber: 1, persisted: [.putts: "2", .shortGameDifficulty: "hard"], strokes: 4)
        XCTAssertTrue(s.materialiseDerivedGir())
        XCTAssertEqual(
            s.batch,
            [
                StatBatchItem(key: .gir, value: "1"),
                StatBatchItem(key: .shortGameDifficulty, value: nil),
            ])
    }
}
