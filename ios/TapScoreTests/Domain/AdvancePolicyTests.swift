import XCTest
@testable import TapScore

// ===========================================================================
// SCORE ENTRY ADVANCE POLICY — EXECUTABLE SPECIFICATION (Swift port)
// ---------------------------------------------------------------------------
// A line-for-line port of `tests/round/advance-policy.test.ts`, kept DIFFABLE
// side by side with it: same section headers, same order, same test wording in
// the `///` above each method. If a case is added on either side, add it here
// too — the whole point is that the web keypad and the iOS keypad answer the
// same question the same way.
//
// The QUIRK-tagged cases pin behaviour that looks wrong but is the shipped web
// behaviour — reproduce them.
//
// Vocabulary:
//   ball        = one scoring seat in the playing group (a player or a team)
//   pending     = an unclaimed placeholder seat; can never be scored
//   entry mode  = the hole had gaps on arrival → entries auto-advance
//   correction  = the hole was already complete on arrival → nothing moves
// ===========================================================================

/// TS: `const ball = (scored = false, pending = false) => ({ scored, pending })`
private func ball(_ scored: Bool = false, _ pending: Bool = false) -> BallState {
    BallState(scored: scored, pending: pending)
}

/// A 4-ball group, mid-round (hole 3 of 18), entry mode, no stats.
///
/// TS spreads a `Partial<AdvanceState>` over the base; Swift has no spread, so
/// each field is an optional override parameter with the base value as its
/// default. `currentHole` needs the double-optional dance (`.some(nil)` is a
/// meaningful override) — hence the explicit `holeOverridden` flag.
private func state(
    balls: [BallState]? = nil,
    currentBallIndex: Int? = nil,
    currentHole: HoleRefState? = nil,
    clearHole: Bool = false,
    holeIndex: Int? = nil,
    holeCount: Int? = nil,
    holeCompleteOnEntry: Bool? = nil,
    collectsStats: Bool? = nil
) -> AdvanceState {
    AdvanceState(
        balls: balls ?? [ball(), ball(), ball(), ball()],
        currentBallIndex: currentBallIndex ?? 0,
        currentHole: clearHole ? nil : (currentHole ?? HoleRefState(id: "ph-3", label: "3")),
        holeIndex: holeIndex ?? 2,
        holeCount: holeCount ?? 18,
        holeCompleteOnEntry: holeCompleteOnEntry ?? false,
        collectsStats: collectsStats ?? false
    )
}

private let SCORE_4 = EntryEvent.score(value: 4)

final class AdvancePolicyTests: XCTestCase {

    // -----------------------------------------------------------------------
    // 1. The write: what gets persisted, and with what metadata
    //    describe('the score write')
    // -----------------------------------------------------------------------

    /// a numeric score writes strokes for the selected ball on the current hole
    func test_write_numericScoreWritesStrokesForSelectedBallOnCurrentHole() {
        let d = advance(state(currentBallIndex: 1), SCORE_4)
        XCTAssertEqual(
            d.write,
            ScoreWrite(ballIndex: 1, holeId: "ph-3", value: 4, withMetadata: true)
        )
    }

    /// pick up writes 0 — a real entry, not an absence
    func test_write_pickUpWritesZero() {
        let d = advance(state(), .score(value: 0))
        XCTAssertEqual(d.write?.value, 0)
        XCTAssertEqual(d.write?.withMetadata, true)
    }

    /// clear writes null and carries NO metadata snapshot
    func test_write_clearWritesNilAndCarriesNoMetadata() {
        // Clearing a hole must not persist stale GIR/fairway toggles; a real or
        // pickup score always carries the complete snapshot so the latest
        // event's blob is authoritative.
        let d = advance(state(), .score(value: nil))
        XCTAssertEqual(
            d.write,
            ScoreWrite(ballIndex: 0, holeId: "ph-3", value: nil, withMetadata: false)
        )
    }

    /// the stats screen’s Next writes nothing (the score is already in)
    func test_write_statsDoneWritesNothing() {
        let d = advance(state(), .statsDone)
        XCTAssertNil(d.write)
    }

    // -----------------------------------------------------------------------
    // 2. Nothing to act on
    //    describe('degenerate states')
    // -----------------------------------------------------------------------

    /// no hole (group has no itinerary yet) → noop, no write
    func test_degenerate_noHoleIsNoop() {
        let d = advance(state(clearHole: true), SCORE_4)
        XCTAssertEqual(d, AdvanceDecision(write: nil, move: .noop))
    }

    /// cursor points past the end of the ball list → noop, no write
    func test_degenerate_cursorPastEndIsNoop() {
        let d = advance(state(currentBallIndex: 9), SCORE_4)
        XCTAssertEqual(d, AdvanceDecision(write: nil, move: .noop))
    }

    /// a NEGATIVE cursor index → noop, no write
    func test_degenerate_negativeCursorIsNoop() {
        // Same guard as the past-the-end case, pinned separately because the
        // two clients get here differently: TS returns `undefined` for any bad
        // index, while this port must bounds-check (a raw subscript traps).
        let d = advance(state(currentBallIndex: -1), SCORE_4)
        XCTAssertEqual(d, AdvanceDecision(write: nil, move: .noop))
    }

    /// QUIRK: statsDone needs only a hole, not a ball under the cursor
    func test_degenerate_QUIRK_statsDoneNeedsOnlyAHole() {
        // Unlike a score event, the stats screen's Next does not re-check the
        // cursor; with a hole present it advances normally.
        let d = advance(state(currentBallIndex: 9), .statsDone)
        guard case .moveToBall = d.move else {
            return XCTFail("expected moveToBall, got \(d.move)")
        }
    }

    /// statsDone with no hole → noop
    func test_degenerate_statsDoneWithNoHoleIsNoop() {
        let d = advance(state(clearHole: true), .statsDone)
        XCTAssertEqual(d.move, .noop)
    }

    // -----------------------------------------------------------------------
    // 3. Mid-hole ball ordering — one wrap-around pass, starting after the cursor
    //    describe('ball ordering within a hole')
    // -----------------------------------------------------------------------

    /// advances to the next unscored ball AFTER the cursor
    func test_order_advancesToNextUnscoredAfterCursor() {
        let d = advance(
            state(balls: [ball(true), ball(false), ball(false), ball(false)], currentBallIndex: 0),
            SCORE_4
        )
        XCTAssertEqual(d.move, .moveToBall(ballIndex: 1))
    }

    /// skips balls that already have a score
    func test_order_skipsScoredBalls() {
        let d = advance(
            state(balls: [ball(), ball(), ball(true), ball(false)], currentBallIndex: 1),
            SCORE_4
        )
        XCTAssertEqual(d.move, .moveToBall(ballIndex: 3))
    }

    /// wraps to the START of the list when everything after the cursor is scored
    func test_order_wrapsToStart() {
        // Entering out of order (tap the 3rd player first) must still collect
        // the players sitting before the cursor before calling the hole done.
        let d = advance(
            state(balls: [ball(false), ball(true), ball(true), ball(true)], currentBallIndex: 2),
            SCORE_4
        )
        XCTAssertEqual(d.move, .moveToBall(ballIndex: 0))
    }

    /// the wrap never revisits the current ball
    func test_order_wrapNeverRevisitsCurrentBall() {
        // Only ball 1 (the cursor) is unscored → the scan finds nobody and the
        // hole is treated as done.
        let d = advance(
            state(balls: [ball(true), ball(false), ball(true)], currentBallIndex: 1),
            SCORE_4
        )
        guard case .holeComplete = d.move else {
            return XCTFail("expected holeComplete, got \(d.move)")
        }
    }

    /// QUIRK: clearing a score still reports the hole done
    func test_order_QUIRK_clearingStillReportsHoleDone() {
        // The scan never re-examines the current ball, so a clear on the last
        // gap completes the hole even though that ball now has no score. This
        // is the shipped behaviour — the player is expected to be correcting.
        let d = advance(
            state(balls: [ball(true), ball(true), ball(false)], currentBallIndex: 2),
            .score(value: nil)
        )
        XCTAssertNil(d.write?.value ?? nil)
        XCTAssertNotNil(d.write)
        guard case .holeComplete = d.move else {
            return XCTFail("expected holeComplete, got \(d.move)")
        }
    }

    /// single-ball group: every entry completes the hole immediately
    func test_order_singleBallGroupCompletesImmediately() {
        let d = advance(state(balls: [ball()], currentBallIndex: 0), SCORE_4)
        guard case .holeComplete = d.move else {
            return XCTFail("expected holeComplete, got \(d.move)")
        }
    }

    // -----------------------------------------------------------------------
    // 4. Hole completion, the delayed jump, and the last hole
    //    describe('hole and round completion')
    // -----------------------------------------------------------------------

    /// last ball scored mid-round → toast, then a delayed jump to the next hole
    func test_completion_lastBallMidRoundSchedulesJump() {
        let d = advance(
            state(
                balls: [ball(true), ball(false)],
                currentBallIndex: 1,
                holeIndex: 2,
                holeCount: 18
            ),
            SCORE_4
        )
        XCTAssertEqual(
            d.move,
            .holeComplete(
                toast: "Hole 3 done",
                fromHoleId: "ph-3",
                toHoleIndex: 3,
                delayMs: HOLE_ADVANCE_DELAY_MS
            )
        )
    }

    /// the toast uses the occurrence LABEL, not the index (repeated routes)
    func test_completion_toastUsesOccurrenceLabel() {
        // A 9-hole course played twice shows "7b" on the second lap; the
        // itinerary index and the printed hole number are different things.
        let d = advance(
            state(
                balls: [ball()],
                currentHole: HoleRefState(id: "ph-16", label: "7b"),
                holeIndex: 15,
                holeCount: 18
            ),
            SCORE_4
        )
        guard case .holeComplete(let toast, let fromHoleId, let toHoleIndex, _) = d.move else {
            return XCTFail("expected holeComplete, got \(d.move)")
        }
        XCTAssertEqual(toast, "Hole 7b done")
        XCTAssertEqual(fromHoleId, "ph-16")
        XCTAssertEqual(toHoleIndex, 16)
    }

    /// fromHoleId is the hole that completed — the caller cancels the jump if it moved
    func test_completion_fromHoleIdIsTheCompletedHole() {
        // The 700ms pause is interruptible: a manual swipe during it must not
        // yank the player to the wrong hole. The policy hands out the identity
        // to compare against; the caller does the comparing.
        let d = advance(
            state(balls: [ball()], currentHole: HoleRefState(id: "ph-9", label: "9")),
            SCORE_4
        )
        guard case .holeComplete(_, let fromHoleId, _, _) = d.move else {
            return XCTFail("expected holeComplete, got \(d.move)")
        }
        XCTAssertEqual(fromHoleId, "ph-9")
    }

    /// LAST hole complete → round complete, and the keypad closes (no jump)
    func test_completion_lastHoleEndsTheRound() {
        let d = advance(
            state(
                balls: [ball(true), ball(false)],
                currentBallIndex: 1,
                holeIndex: 17,
                holeCount: 18
            ),
            SCORE_4
        )
        XCTAssertEqual(d.move, .roundComplete(toast: "Round complete"))
    }

    /// a one-hole itinerary is immediately the last hole
    func test_completion_oneHoleItineraryIsTheLastHole() {
        let d = advance(state(balls: [ball()], holeIndex: 0, holeCount: 1), SCORE_4)
        guard case .roundComplete = d.move else {
            return XCTFail("expected roundComplete, got \(d.move)")
        }
    }

    /// QUIRK: an empty ball list completes the hole
    func test_completion_QUIRK_emptyBallListCompletesTheHole() {
        // No balls means no gaps, so the scan falls straight through. Harmless
        // in practice (the keypad is unreachable without balls) but pinned so
        // the two clients do the same thing.
        let d = advance(state(balls: [], currentBallIndex: 0), .statsDone)
        guard case .holeComplete = d.move else {
            return XCTFail("expected holeComplete, got \(d.move)")
        }
    }

    /// …but a SCORE event on an empty ball list is a noop
    func test_completion_scoreEventOnEmptyBallListIsNoop() {
        // The companion to the case above: the quirk is an asymmetry between
        // the two events, not a claim that an empty group completes holes. A
        // score event needs a ball under the cursor and there is none, so it
        // never reaches the scan that statsDone falls through.
        let d = advance(state(balls: [], currentBallIndex: 0), SCORE_4)
        XCTAssertEqual(d, AdvanceDecision(write: nil, move: .noop))
    }

    // -----------------------------------------------------------------------
    // 5. Correction mode — a return visit to an already-complete hole
    //    describe('correction mode (holeCompleteOnEntry)')
    // -----------------------------------------------------------------------

    /// an entry on an already-complete hole writes but does NOT move
    func test_correction_writesButDoesNotMove() {
        // Several corrections on one hole must not fight the advance logic: no
        // ball hop, no hole jump, for the whole visit.
        let d = advance(
            state(
                balls: [ball(true), ball(true)],
                currentBallIndex: 0,
                holeCompleteOnEntry: true
            ),
            SCORE_4
        )
        XCTAssertEqual(d.write?.ballIndex, 0)
        XCTAssertEqual(d.write?.value, 4)
        XCTAssertEqual(d.move, .stay)
    }

    /// correction mode survives a clear+re-enter within the visit
    func test_correction_survivesClearAndReenter() {
        // The flag is a snapshot of ARRIVAL, never recomputed per entry, so
        // clearing a score mid-visit does not flip back to entry mode.
        let cleared = state(
            balls: [ball(true), ball(false)],
            currentBallIndex: 1,
            holeCompleteOnEntry: true
        )
        XCTAssertEqual(advance(cleared, SCORE_4).move, .stay)
    }

    /// statsDone in correction mode stays put too
    func test_correction_statsDoneStaysPut() {
        let d = advance(state(holeCompleteOnEntry: true), .statsDone)
        XCTAssertEqual(d, AdvanceDecision(write: nil, move: .stay))
    }

    /// correction mode does not suppress the stats detour
    func test_correction_doesNotSuppressStatsDetour() {
        // A corrected real score still opens the stats screen so GIR/fairway
        // can be fixed too; its Next then stays put.
        let d = advance(state(holeCompleteOnEntry: true, collectsStats: true), SCORE_4)
        XCTAssertEqual(d.move, .openStats)
    }

    // -----------------------------------------------------------------------
    // 6. The stats detour (holes that collect GIR/fairway)
    //    describe('stats-collecting holes')
    // -----------------------------------------------------------------------

    /// a real score (> 0) opens the stats screen instead of advancing
    func test_stats_realScoreOpensStats() {
        let d = advance(state(collectsStats: true), SCORE_4)
        XCTAssertEqual(d.write?.value, 4)
        XCTAssertEqual(d.write?.withMetadata, true)
        XCTAssertEqual(d.move, .openStats)
    }

    /// pick up (0) skips the stats screen and advances immediately
    func test_stats_pickUpSkipsStats() {
        // 0 is not a played-out hole; there is no GIR to record.
        let d = advance(state(collectsStats: true), .score(value: 0))
        XCTAssertEqual(d.move, .moveToBall(ballIndex: 1))
    }

    /// clear skips the stats screen and advances immediately
    func test_stats_clearSkipsStats() {
        let d = advance(state(collectsStats: true), .score(value: nil))
        XCTAssertEqual(d.move, .moveToBall(ballIndex: 1))
    }

    /// the stats screen’s Next performs the advance the score deferred
    func test_stats_nextPerformsTheDeferredAdvance() {
        // Continuation of the case above: the score is stored, the cursor is
        // still on ball 0, and Next resumes the normal ball scan.
        let after = state(balls: [ball(true), ball(), ball(), ball()], collectsStats: true)
        XCTAssertEqual(advance(after, .statsDone).move, .moveToBall(ballIndex: 1))
    }

    /// the stats screen’s Next on the last gap completes the hole
    func test_stats_nextOnLastGapCompletesTheHole() {
        let after = state(
            balls: [ball(true), ball(true)],
            currentBallIndex: 1,
            collectsStats: true
        )
        guard case .holeComplete = advance(after, .statsDone).move else {
            return XCTFail("expected holeComplete")
        }
    }

    /// a strokes-only hole never opens stats
    func test_stats_strokesOnlyHoleNeverOpensStats() {
        let d = advance(state(collectsStats: false), SCORE_4)
        guard case .moveToBall = d.move else {
            return XCTFail("expected moveToBall, got \(d.move)")
        }
    }

    // -----------------------------------------------------------------------
    // 7. Pending (unclaimed placeholder) seats
    //    describe('pending seats')
    // -----------------------------------------------------------------------

    /// a key press on a pending seat writes NOTHING and advances past it
    func test_pending_writesNothingAndAdvances() {
        // The server 409s `seat_unclaimed`, so queueing the write would only
        // produce a failure the player cannot act on.
        let d = advance(
            state(balls: [ball(false, true), ball(false), ball(false)], currentBallIndex: 0),
            SCORE_4
        )
        XCTAssertNil(d.write)
        XCTAssertEqual(d.move, .moveToBall(ballIndex: 1))
    }

    /// a key press on a pending seat in correction mode stays put
    func test_pending_inCorrectionModeStaysPut() {
        let d = advance(
            state(
                balls: [ball(false, true), ball(true)],
                currentBallIndex: 0,
                holeCompleteOnEntry: true
            ),
            SCORE_4
        )
        XCTAssertEqual(d, AdvanceDecision(write: nil, move: .stay))
    }

    /// QUIRK: the ball scan does NOT skip pending seats — the cursor lands on one
    func test_pending_QUIRK_scanDoesNotSkipPendingSeats() {
        // Only the hole-complete question ignores pending seats; the scan
        // treats an unscored pending seat as a normal landing spot, and the
        // next key press there simply advances again (see the case above).
        let d = advance(
            state(balls: [ball(), ball(false, true), ball(true)], currentBallIndex: 0),
            SCORE_4
        )
        XCTAssertEqual(d.move, .moveToBall(ballIndex: 1))
    }

    // -----------------------------------------------------------------------
    // 8. isHoleCompleteOnEntry — the arrival snapshot that picks the mode
    //    describe('isHoleCompleteOnEntry (evaluated on every keypad arrival)')
    // -----------------------------------------------------------------------

    private static let arrivalHole = HoleRefState(id: "ph-3", label: "3")

    /// every scoreable ball scored → correction mode
    func test_completeOnEntry_everyScoreableBallScored() {
        XCTAssertTrue(isHoleCompleteOnEntry(
            balls: [ball(true), ball(true)],
            currentHole: Self.arrivalHole
        ))
    }

    /// one gap → entry mode
    func test_completeOnEntry_oneGapIsEntryMode() {
        XCTAssertFalse(isHoleCompleteOnEntry(
            balls: [ball(true), ball(false)],
            currentHole: Self.arrivalHole
        ))
    }

    /// an unscored PENDING seat does not hold the hole open
    func test_completeOnEntry_pendingSeatDoesNotHoldTheHoleOpen() {
        // A placeholder seat can never be scored, so a hole whose only gap is
        // a pending seat still counts as complete.
        XCTAssertTrue(isHoleCompleteOnEntry(
            balls: [ball(true), ball(false, true)],
            currentHole: Self.arrivalHole
        ))
    }

    /// a hole with ONLY pending seats is not complete (stays in entry mode)
    func test_completeOnEntry_onlyPendingSeatsIsNotComplete() {
        XCTAssertFalse(isHoleCompleteOnEntry(
            balls: [ball(false, true)],
            currentHole: Self.arrivalHole
        ))
    }

    /// an empty group is not complete
    func test_completeOnEntry_emptyGroupIsNotComplete() {
        XCTAssertFalse(isHoleCompleteOnEntry(balls: [], currentHole: Self.arrivalHole))
    }

    /// no hole is never complete
    func test_completeOnEntry_noHoleIsNeverComplete() {
        XCTAssertFalse(isHoleCompleteOnEntry(balls: [ball(true)], currentHole: nil))
    }

    /// the auto-jump lands in correction mode when the next hole was scored ahead
    func test_completeOnEntry_autoJumpLandsInCorrectionMode() {
        // This is what stops a runaway advance chain: after the jump the caller
        // re-snapshots, and a pre-scored hole parks the player there.
        let arrivedBalls = [ball(true), ball(true)]
        let arrivedHole = HoleRefState(id: "ph-4", label: "4")
        XCTAssertTrue(isHoleCompleteOnEntry(balls: arrivedBalls, currentHole: arrivedHole))

        let arrived = state(
            balls: arrivedBalls,
            currentHole: arrivedHole,
            holeCompleteOnEntry: true
        )
        XCTAssertEqual(advance(arrived, SCORE_4).move, .stay)
    }

    // -----------------------------------------------------------------------
    // 9. hasMoreUnscored — label only ("Next ›" vs "Done ›")
    //    describe('hasMoreUnscored (stats button label)')
    // -----------------------------------------------------------------------

    /// true while another ball on the hole is unscored
    func test_hasMoreUnscored_trueWhileAnotherBallIsUnscored() {
        XCTAssertTrue(hasMoreUnscored(
            balls: [ball(true), ball(false)],
            currentBallIndex: 0,
            currentHole: HoleRefState(id: "ph-3", label: "3")
        ))
    }

    /// false when the current ball is the only gap
    func test_hasMoreUnscored_falseWhenCurrentBallIsTheOnlyGap() {
        XCTAssertFalse(hasMoreUnscored(
            balls: [ball(true), ball(false)],
            currentBallIndex: 1,
            currentHole: HoleRefState(id: "ph-3", label: "3")
        ))
    }

    /// QUIRK: a pending seat counts as "more unscored"
    func test_hasMoreUnscored_QUIRK_pendingSeatCountsAsMoreUnscored() {
        XCTAssertTrue(hasMoreUnscored(
            balls: [ball(true), ball(false, true)],
            currentBallIndex: 0,
            currentHole: HoleRefState(id: "ph-3", label: "3")
        ))
    }

    /// false with no hole
    func test_hasMoreUnscored_falseWithNoHole() {
        XCTAssertFalse(hasMoreUnscored(balls: [ball()], currentBallIndex: 0, currentHole: nil))
    }

    // -----------------------------------------------------------------------
    // 10. Swift-only: the bounds-check the PORTING note demands.
    //     No TS counterpart — in TS a bad index is `undefined`, here it would
    //     TRAP, so the guard itself is worth pinning.
    // -----------------------------------------------------------------------

    /// the cursor read is total for every Int, including Int.min / Int.max
    func test_porting_ballUnderCursorIsTotal() {
        XCTAssertNil(state(currentBallIndex: Int.max).ballUnderCursor)
        XCTAssertNil(state(currentBallIndex: Int.min).ballUnderCursor)
        XCTAssertNil(state(balls: [], currentBallIndex: 0).ballUnderCursor)
        XCTAssertEqual(state(currentBallIndex: 3).ballUnderCursor, ball())
    }

    /// an out-of-range cursor never traps the ball scan either
    func test_porting_ballScanIsTotalForOutOfRangeCursors() {
        // `moveAfterHandled` is private; `statsDone` is the event that reaches
        // it without a cursor check (see the QUIRK above).
        for index in [Int.min, -5, -1, 4, 9, Int.max] {
            let d = advance(state(currentBallIndex: index), .statsDone)
            XCTAssertNotEqual(d.move, .noop, "cursor \(index) should still scan")
        }
    }
}
