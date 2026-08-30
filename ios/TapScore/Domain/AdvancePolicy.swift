// Score entry's ADVANCE POLICY — the pure state machine behind the on-course
// keypad. Swift port of `src/round/advance-policy.ts`; the two files are meant
// to be read side by side, so the structure, the ordering and the doc comments
// follow the TypeScript line for line.
//
// The web component's behaviour is the specification. Anything surprising below
// is deliberate and marked QUIRK — reproduce it, don't "fix" it, or the two
// clients disagree about what a tap does.
//
// Pure by construction: value types only, no Foundation, no clock, no
// randomness, total functions. `AdvanceState` stays a plain local struct (it
// mirrors the TS `AdvanceState`, not a wire shape — nothing here is generated).
//
// ---------------------------------------------------------------------------
// CALLER CONTRACT
// ---------------------------------------------------------------------------
// The decision is only half the behaviour; the executor owes the policy these
// side effects. A client that skips one is not a port, it is a different app.
//
//  1. `statsDone` is raised BY the stats sheet, and the sheet must be closed
//     BEFORE the event is dispatched — not in reaction to the returned move.
//     The policy can answer `stay`/`noop`, which touches nothing, so a sheet
//     left open on those branches would never close.
//  2. `roundComplete` must close the keypad (the whole modal), not just park
//     the cursor. There is no further hole to aim at. As of the finish flow
//     (2026-08-01) it must then OPEN the fullscreen finish prompt
//     (`RoundStore.finishFlowPresented` / `RoundViewService.finishFlowOpen`).
//  3. `holeComplete` must schedule the jump on a timer of `delayMs`, keeping
//     at most one timer alive (cancel any pending one first), and at fire time
//     must re-check that the keypad is STILL on `fromHoleId`; if it moved
//     (manual chevron/swipe during the pause) the jump is abandoned entirely.
//     Any manual hole navigation must likewise cancel a pending timer — after
//     the user moves and comes back, the stale-hole guard would pass again.
//  4. `toHoleIndex` is computed against the played order as it was at DECISION
//     time and must be clamped against the LIVE played order when the timer
//     fires; the itinerary can change during the pause.
//  5. On `holeComplete` the toast is flashed FIRST, synchronously, before the
//     timer is scheduled — the confirmation is what the delay exists to show.
//     On `roundComplete` the toast is deliberately NOT flashed: the fullscreen
//     finish prompt (#2) is the confirmation, and a toast under it would be
//     invisible. The decision still carries the toast so the policy stays
//     presentation-agnostic.
//  6. After a jump lands, reset the cursor to ball 0 and re-run
//     `isHoleCompleteOnEntry` for the new hole, storing it as the visit's
//     `holeCompleteOnEntry`. That re-snapshot is what stops the advance chain
//     on a hole that was already scored ahead of time.
//  7. A landed jump must then CLOSE the keypad, leaving the round's score view
//     visible with the group now standing on the next hole. The hole is
//     finished, so the next thing the group looks at is the result, not an
//     empty keypad aimed at a hole nobody has played yet. This closes only on
//     the AUTO-advance: correction mode answers `stay` (contract: a return
//     visit never jumps holes), so re-entering a score on an already-scored
//     hole leaves the keypad exactly where it is.

/// Delay between "hole done" confirmation and the auto-jump to the next hole.
///
/// Milliseconds, matching the TS constant. Convert at the call site (a Swift
/// timer wants seconds) rather than changing the unit here — the number is part
/// of the cross-client spec.
let HOLE_ADVANCE_DELAY_MS: Int = 700

/// One ball (a seat: single player or a team) in the current playing group.
struct BallState: Sendable, Equatable {
    /// Phase 5.5 unclaimed placeholder seat. It cannot be scored (the server
    /// 409s `seat_unclaimed`), so it is excluded from the "is this hole already
    /// complete" question and a key press on it writes nothing.
    var pending: Bool
    /// Has a stored strokes value on the CURRENT hole (`nil` → false).
    var scored: Bool

    init(scored: Bool = false, pending: Bool = false) {
        self.scored = scored
        self.pending = pending
    }
}

/// The hole the keypad is currently on.
struct HoleRefState: Sendable, Equatable {
    /// `playHoleId` — identity, used to detect a hole change during the pause.
    var id: String
    /// Display label ("7", "7b" on a repeated route occurrence) for the toast.
    var label: String

    init(id: String, label: String) {
        self.id = id
        self.label = label
    }
}

/// Everything the policy is allowed to know. All plain data: the caller
/// snapshots it from wherever its state lives (signals on web, observable state
/// on iOS) immediately before asking for a decision.
struct AdvanceState: Sendable, Equatable {
    /// Balls in the group, in display order — the order the cursor walks.
    var balls: [BallState]
    /// Index into `balls` of the ball the keypad is aimed at.
    ///
    /// PORTING: `currentBallIndex` is NOT guaranteed in range — an empty group
    /// or a stale cursor after the group shrank both produce an out-of-bounds
    /// value, and `advance` relies on the lookup failing to emit `noop`. In
    /// TypeScript `balls[i]` on a bad index (including a negative one) is
    /// `undefined` and the guard handles it; in Swift the equivalent subscript
    /// TRAPS. Every read below goes through `ballUnderCursor` / an explicit
    /// `indices.contains` check — never a raw subscript.
    var currentBallIndex: Int
    /// The current hole, or `nil` when the group has no itinerary yet.
    var currentHole: HoleRefState?
    /// Index of `currentHole` in the group's played order.
    var holeIndex: Int
    /// Number of holes in the group's played order.
    var holeCount: Int
    /// Snapshot taken when the keypad ARRIVED on this hole (see
    /// `isHoleCompleteOnEntry`): true = the player came back to correct, not to
    /// enter, and nothing auto-advances for the rest of this visit.
    var holeCompleteOnEntry: Bool
    /// The hole collects extra info (GIR/fairway) → a real score opens stats.
    var collectsStats: Bool

    init(
        balls: [BallState],
        currentBallIndex: Int,
        currentHole: HoleRefState?,
        holeIndex: Int,
        holeCount: Int,
        holeCompleteOnEntry: Bool,
        collectsStats: Bool
    ) {
        self.balls = balls
        self.currentBallIndex = currentBallIndex
        self.currentHole = currentHole
        self.holeIndex = holeIndex
        self.holeCount = holeCount
        self.holeCompleteOnEntry = holeCompleteOnEntry
        self.collectsStats = collectsStats
    }

    /// Bounds-checked cursor read (see the PORTING note on `currentBallIndex`).
    /// This is the Swift image of TS's `balls[i]` → `T | undefined`.
    var ballUnderCursor: BallState? {
        balls.indices.contains(currentBallIndex) ? balls[currentBallIndex] : nil
    }
}

/// The keypad interaction being resolved.
enum EntryEvent: Sendable, Equatable {
    /// A score key: 1-9, the 10+ stepper's ✓, `0` (pick up) or `nil` (clear).
    case score(value: Int?)
    /// The stats screen's "Next ›" / "Done ›" button.
    case statsDone
}

/// What the UI should do after the decision's `write` (if any) is persisted.
enum AdvanceMove: Sendable, Equatable {
    /// Nothing to act on (no hole, or no ball under the cursor).
    case noop
    /// Correction mode, or an entry that deliberately parks the cursor.
    case stay
    /// Aim the keypad at another ball on the same hole.
    case moveToBall(ballIndex: Int)
    /// Show the stats screen for the ball just scored; it advances later.
    case openStats
    /// Every ball on this hole is done and there is a next hole: show `toast`,
    /// then after `delayMs` move to `toHoleIndex` — but ONLY if the keypad is
    /// still on `fromHoleId` (a manual swipe during the pause cancels the jump).
    /// On arrival the cursor resets to ball 0 and `holeCompleteOnEntry` is
    /// recomputed for the new hole, which is what stops the advance chain when
    /// the next hole was already scored ahead of time.
    case holeComplete(toast: String, fromHoleId: String, toHoleIndex: Int, delayMs: Int)
    /// Last hole finished: show `toast` and close the keypad.
    case roundComplete(toast: String)
}

/// The score to persist before executing `move`.
struct ScoreWrite: Sendable, Equatable {
    var ballIndex: Int
    var holeId: String
    /// Strokes; `0` = picked up, `nil` = clear back to no result.
    var value: Int?
    /// Send the full metadata snapshot with this write. False for a clear —
    /// clearing a hole carries no metadata; a real or pickup score carries the
    /// COMPLETE toggle snapshot so the latest event's blob is authoritative.
    var withMetadata: Bool

    init(ballIndex: Int, holeId: String, value: Int?, withMetadata: Bool) {
        self.ballIndex = ballIndex
        self.holeId = holeId
        self.value = value
        self.withMetadata = withMetadata
    }
}

struct AdvanceDecision: Sendable, Equatable {
    var write: ScoreWrite?
    var move: AdvanceMove

    init(write: ScoreWrite?, move: AdvanceMove) {
        self.write = write
        self.move = move
    }
}

/// Was the hole ALREADY fully scored at the moment the keypad arrived on it?
///
/// Called on every arrival — opening the keypad from a score circle, the header
/// chevrons, and the post-completion auto-jump — and the result is held for the
/// whole visit as `AdvanceState.holeCompleteOnEntry`. It is deliberately NOT
/// recomputed after each entry: clearing and re-entering a score during a
/// correction visit keeps correction mode, so several fixes on one hole don't
/// fight the advance logic.
///
/// Pending (unclaimed) seats are excluded — they can never be scored, so a hole
/// whose only gap is a pending seat still counts as complete. A hole with no
/// scoreable balls at all is NOT complete (`isEmpty` guard), which keeps an
/// empty group in entry mode.
///
/// Takes the two fields it reads rather than a whole `AdvanceState`: the TS
/// signature is `Pick<AdvanceState, 'balls' | 'currentHole'>`, and the caller
/// computes this BEFORE it has a complete state to hand over.
func isHoleCompleteOnEntry(balls: [BallState], currentHole: HoleRefState?) -> Bool {
    guard currentHole != nil else { return false }
    let scoreable = balls.filter { !$0.pending }
    return !scoreable.isEmpty && scoreable.allSatisfy(\.scored)
}

/// Convenience overload for callers that already hold a full state.
func isHoleCompleteOnEntry(_ state: AdvanceState) -> Bool {
    isHoleCompleteOnEntry(balls: state.balls, currentHole: state.currentHole)
}

/// Is any OTHER ball on this hole still unscored? Drives the stats screen's
/// button label ("Next ›" vs "Done ›") only — never the movement itself.
/// Pending seats count as unscored here (QUIRK, matches the web component).
func hasMoreUnscored(balls: [BallState], currentBallIndex: Int, currentHole: HoleRefState?) -> Bool {
    guard currentHole != nil else { return false }
    return balls.enumerated().contains { i, b in i != currentBallIndex && !b.scored }
}

/// Convenience overload for callers that already hold a full state.
func hasMoreUnscored(_ state: AdvanceState) -> Bool {
    hasMoreUnscored(
        balls: state.balls,
        currentBallIndex: state.currentBallIndex,
        currentHole: state.currentHole
    )
}

/// The movement half of the policy: where the cursor goes once the current ball
/// is considered handled.
///
/// Ball order is a single wrap-around pass starting AFTER the cursor:
/// `cur+1 … last`, then `0 … cur-1`. The current ball is never revisited, so
/// whether the entry that triggered this left it scored is irrelevant — QUIRK:
/// clearing a score therefore still reports the hole done if every other ball
/// has one.
///
/// Pending seats are NOT skipped by this scan (QUIRK): a pending seat with no
/// score is a legitimate landing spot, and a key press there simply advances
/// again. Only `isHoleCompleteOnEntry` ignores them.
///
/// With no unscored ball left the hole is done: the last hole ends the round
/// (close the keypad), any other hole schedules the delayed jump.
///
/// PORTING: both loops filter `balls.indices` rather than counting over
/// `cur + 1 ..< count` / `0 ..< cur`. `currentBallIndex` is not guaranteed in
/// range, and those forms would either build an invalid range (`0 ..< -1`
/// traps) or overflow on `Int.max + 1`. TS's `for` loops simply don't execute
/// on a bad bound; this form is the total equivalent.
private func moveAfterHandled(_ state: AdvanceState) -> AdvanceMove {
    guard let hole = state.currentHole else { return .noop }

    let balls = state.balls
    let cur = state.currentBallIndex
    for i in balls.indices where i > cur {
        if !balls[i].scored { return .moveToBall(ballIndex: i) }
    }
    for i in balls.indices where i < cur {
        if !balls[i].scored { return .moveToBall(ballIndex: i) }
    }

    if state.holeIndex >= state.holeCount - 1 {
        return .roundComplete(toast: "Round complete")
    }
    return .holeComplete(
        toast: "Hole \(hole.label) done",
        fromHoleId: hole.id,
        // In range by construction (we are not on the last hole). The caller
        // still clamps at jump time, because the itinerary can change during
        // the pause.
        toHoleIndex: state.holeIndex + 1,
        delayMs: HOLE_ADVANCE_DELAY_MS
    )
}

/// Resolve one keypad interaction: what to persist, and where to go next.
///
/// Branch map (the web component's `commit()` / stats "Next"):
///
///  - no hole, or the cursor points at no ball (score events only) → `noop`
///  - pending seat → no write; correction mode stays, otherwise advance past it
///  - real score (> 0) on a stats-collecting hole → write, then `openStats`;
///    the stats screen's `statsDone` performs the advance afterwards
///  - anything else (clear, pickup, plain hole) → write, then advance
///  - correction mode (`holeCompleteOnEntry`) → write, then `stay`; a return
///    visit never hops balls and never jumps holes
///
/// `statsDone` writes nothing (the score is already in) and advances unless the
/// visit is a correction. QUIRK: unlike a score event it does not require a
/// ball under the cursor, only a hole.
///
/// PORTING: the event is destructured with an EXHAUSTIVE `switch`, one arm per
/// `EntryEvent` case, not a `guard case .score` whose `else` silently means
/// "statsDone". A third event added to the enum must be an unhandled-case
/// compile error here — falling into the stats branch would give it the
/// advance-without-writing behaviour by accident.
func advance(_ state: AdvanceState, _ entry: EntryEvent) -> AdvanceDecision {
    let hole = state.currentHole

    let entryValue: Int?
    switch entry {
    case .statsDone:
        // Writes nothing — the score is already in. QUIRK: needs a hole, but
        // unlike a score event it does NOT need a ball under the cursor.
        if state.holeCompleteOnEntry { return AdvanceDecision(write: nil, move: .stay) }
        return AdvanceDecision(write: nil, move: moveAfterHandled(state))
    case .score(let value):
        entryValue = value
    }

    // Bounds-checked: a stale or negative cursor must answer `noop`, not trap.
    let ball = state.ballUnderCursor
    guard let hole, let ball else { return AdvanceDecision(write: nil, move: .noop) }

    if ball.pending {
        // Skip past an unclaimed seat instead of queueing a write that can
        // never land.
        if state.holeCompleteOnEntry { return AdvanceDecision(write: nil, move: .stay) }
        return AdvanceDecision(write: nil, move: moveAfterHandled(state))
    }

    let write = ScoreWrite(
        ballIndex: state.currentBallIndex,
        holeId: hole.id,
        value: entryValue,
        withMetadata: entryValue != nil
    )

    if let v = entryValue, v > 0, state.collectsStats {
        return AdvanceDecision(write: write, move: .openStats)
    }
    if state.holeCompleteOnEntry { return AdvanceDecision(write: write, move: .stay) }
    return AdvanceDecision(write: write, move: moveAfterHandled(state))
}
