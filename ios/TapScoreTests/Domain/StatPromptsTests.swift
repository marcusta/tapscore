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
        // The worst case the proposal names: seven inputs on a par 4.
        XCTAssertEqual(
            keys(s),
            [.teeResult, .recoveryOk, .gir, .shortGameDifficulty, .firstPutt, .putts, .penalties])
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
        XCTAssertEqual(keys(s), [.gir, .shortGameDifficulty])
    }

    func testRecoveryAppearsOnlyAfterTrouble() {
        var s = step(modules(tee: true, recovery: true))
        XCTAssertEqual(keys(s), [.teeResult])
        s.answer(.teeResult, value: "fairway")
        XCTAssertEqual(keys(s), [.teeResult])
        s.answer(.teeResult, value: "trouble")
        XCTAssertEqual(keys(s), [.teeResult, .recoveryOk])
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
        XCTAssertEqual(keys(s), [.gir, .shortGameDifficulty])

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
        XCTAssertEqual(keys(s), [.gir])
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
        XCTAssertEqual(values(.shortGameDifficulty), ["standard", "hard"])
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
        XCTAssertEqual(keys(s), [.gir])
        XCTAssertNil(s.value(of: .shortGameDifficulty))
    }
}
