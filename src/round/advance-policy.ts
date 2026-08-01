// Score entry's ADVANCE POLICY — the pure state machine behind the on-course
// keypad (`src/round/score-entry.component.ts`).
//
// N4 prerequisite: the carousel physics, keypad chrome and meta chips are free
// to differ per platform, but "where does the cursor go after an entry" is
// domain policy and must be identical on web and iOS. This module is that
// policy: plain data in, a decision out. No DOM, no framework, no signals, no
// imports — the whole file is portable to Swift line for line, and
// `tests/round/advance-policy.test.ts` is the spec it is written against.
//
// The web component's behaviour as of the extraction is the specification.
// Anything surprising below is deliberate and marked QUIRK — reproduce it,
// don't "fix" it, or the two clients disagree about what a tap does.
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
//     (`RoundViewService.finishFlowOpen` / `RoundStore.finishFlowPresented`).
//  3. `holeComplete` must schedule the jump on a timer of `delayMs`, keeping
//     at most one timer alive (clear any pending one first), and at fire time
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

/** Delay between "hole done" confirmation and the auto-jump to the next hole. */
export const HOLE_ADVANCE_DELAY_MS = 700;

/** One ball (a seat: single player or a team) in the current playing group. */
export interface BallState {
    /**
     * Phase 5.5 unclaimed placeholder seat. It cannot be scored (the server
     * 409s `seat_unclaimed`), so it is excluded from the "is this hole already
     * complete" question and a key press on it writes nothing.
     */
    pending: boolean;
    /** Has a stored strokes value on the CURRENT hole (`null` → false). */
    scored: boolean;
}

/** The hole the keypad is currently on. */
export interface HoleRef {
    /** `playHoleId` — identity, used to detect a hole change during the pause. */
    id: string;
    /** Display label ("7", "7b" on a repeated route occurrence) for the toast. */
    label: string;
}

/**
 * Everything the policy is allowed to know. All plain data: the caller
 * snapshots it from wherever its state lives (signals on web, observable state
 * on iOS) immediately before asking for a decision.
 */
export interface AdvanceState {
    /** Balls in the group, in display order — the order the cursor walks. */
    balls: readonly BallState[];
    /**
     * Index into `balls` of the ball the keypad is aimed at.
     *
     * PORTING: `currentBallIndex` is NOT guaranteed in range — an empty group
     * or a stale cursor after the group shrank both produce an out-of-bounds
     * value, and `advance` relies on the lookup failing to emit `noop`. In
     * TypeScript `balls[i]` on a bad index (including a negative one) is
     * `undefined` and the guard handles it; in Swift the equivalent subscript
     * TRAPS. A Swift port must bounds-check explicitly —
     * `balls.indices.contains(currentBallIndex) ? balls[currentBallIndex] : nil`
     * — rather than subscripting directly.
     */
    currentBallIndex: number;
    /** The current hole, or `null` when the group has no itinerary yet. */
    currentHole: HoleRef | null;
    /** Index of `currentHole` in the group's played order. */
    holeIndex: number;
    /** Number of holes in the group's played order. */
    holeCount: number;
    /**
     * Snapshot taken when the keypad ARRIVED on this hole (see
     * `isHoleCompleteOnEntry`): true = the player came back to correct, not to
     * enter, and nothing auto-advances for the rest of this visit.
     */
    holeCompleteOnEntry: boolean;
    /** The hole collects extra info (GIR/fairway) → a real score opens stats. */
    collectsStats: boolean;
}

/** The keypad interaction being resolved. */
export type EntryEvent =
    /**
     * A score key: 1-9, the 10+ stepper's ✓, `0` (pick up) or `null` (clear).
     */
    | { kind: 'score'; value: number | null }
    /** The stats screen's "Next ›" / "Done ›" button. */
    | { kind: 'statsDone' };

/** What the UI should do after the decision's `write` (if any) is persisted. */
export type AdvanceMove =
    /** Nothing to act on (no hole, or no ball under the cursor). */
    | { kind: 'noop' }
    /** Correction mode, or an entry that deliberately parks the cursor. */
    | { kind: 'stay' }
    /** Aim the keypad at another ball on the same hole. */
    | { kind: 'moveToBall'; ballIndex: number }
    /** Show the stats screen for the ball just scored; it advances later. */
    | { kind: 'openStats' }
    /**
     * Every ball on this hole is done and there is a next hole: show `toast`,
     * then after `delayMs` move to `toHoleIndex` — but ONLY if the keypad is
     * still on `fromHoleId` (a manual swipe during the pause cancels the jump).
     * On arrival the cursor resets to ball 0 and `holeCompleteOnEntry` is
     * recomputed for the new hole, which is what stops the advance chain when
     * the next hole was already scored ahead of time.
     */
    | { kind: 'holeComplete'; toast: string; fromHoleId: string; toHoleIndex: number; delayMs: number }
    /** Last hole finished: show `toast` and close the keypad. */
    | { kind: 'roundComplete'; toast: string };

/** The score to persist before executing `move`. */
export interface ScoreWrite {
    ballIndex: number;
    holeId: string;
    /** Strokes; `0` = picked up, `null` = clear back to no result. */
    value: number | null;
    /**
     * Send the full metadata snapshot with this write. False for a clear —
     * clearing a hole carries no metadata; a real or pickup score carries the
     * COMPLETE toggle snapshot so the latest event's blob is authoritative.
     */
    withMetadata: boolean;
}

export interface AdvanceDecision {
    write: ScoreWrite | null;
    move: AdvanceMove;
}

/**
 * Was the hole ALREADY fully scored at the moment the keypad arrived on it?
 *
 * Called on every arrival — opening the keypad from a score circle, the header
 * chevrons, and the post-completion auto-jump — and the result is held for the
 * whole visit as `AdvanceState.holeCompleteOnEntry`. It is deliberately NOT
 * recomputed after each entry: clearing and re-entering a score during a
 * correction visit keeps correction mode, so several fixes on one hole don't
 * fight the advance logic.
 *
 * Pending (unclaimed) seats are excluded — they can never be scored, so a hole
 * whose only gap is a pending seat still counts as complete. A hole with no
 * scoreable balls at all is NOT complete (`balls.length > 0` guard), which
 * keeps an empty group in entry mode.
 */
export function isHoleCompleteOnEntry(state: Pick<AdvanceState, 'balls' | 'currentHole'>): boolean {
    if (!state.currentHole) return false;
    const scoreable = state.balls.filter((b) => !b.pending);
    return scoreable.length > 0 && scoreable.every((b) => b.scored);
}

/**
 * Is any OTHER ball on this hole still unscored? Drives the stats screen's
 * button label ("Next ›" vs "Done ›") only — never the movement itself.
 * Pending seats count as unscored here (QUIRK, matches the web component).
 */
export function hasMoreUnscored(
    state: Pick<AdvanceState, 'balls' | 'currentBallIndex' | 'currentHole'>,
): boolean {
    if (!state.currentHole) return false;
    return state.balls.some((b, i) => i !== state.currentBallIndex && !b.scored);
}

/**
 * The movement half of the policy: where the cursor goes once the current ball
 * is considered handled.
 *
 * Ball order is a single wrap-around pass starting AFTER the cursor:
 * `cur+1 … last`, then `0 … cur-1`. The current ball is never revisited, so
 * whether the entry that triggered this left it scored is irrelevant — QUIRK:
 * clearing a score therefore still reports the hole done if every other ball
 * has one.
 *
 * Pending seats are NOT skipped by this scan (QUIRK): a pending seat with no
 * score is a legitimate landing spot, and a key press there simply advances
 * again. Only `isHoleCompleteOnEntry` ignores them.
 *
 * With no unscored ball left the hole is done: the last hole ends the round
 * (close the keypad), any other hole schedules the delayed jump.
 */
function moveAfterHandled(state: AdvanceState): AdvanceMove {
    const hole = state.currentHole;
    if (!hole) return { kind: 'noop' };

    const balls = state.balls;
    const cur = state.currentBallIndex;
    for (let i = cur + 1; i < balls.length; i++) if (!balls[i]!.scored) return { kind: 'moveToBall', ballIndex: i };
    for (let i = 0; i < cur; i++) if (!balls[i]!.scored) return { kind: 'moveToBall', ballIndex: i };

    if (state.holeIndex >= state.holeCount - 1) {
        return { kind: 'roundComplete', toast: 'Round complete' };
    }
    return {
        kind: 'holeComplete',
        toast: `Hole ${hole.label} done`,
        fromHoleId: hole.id,
        // In range by construction (we are not on the last hole). The caller
        // still clamps at jump time, because the itinerary can change during
        // the pause.
        toHoleIndex: state.holeIndex + 1,
        delayMs: HOLE_ADVANCE_DELAY_MS,
    };
}

/**
 * Resolve one keypad interaction: what to persist, and where to go next.
 *
 * Branch map (the web component's `commit()` / stats "Next"):
 *
 *  - no hole, or the cursor points at no ball (score events only) → `noop`
 *  - pending seat → no write; correction mode stays, otherwise advance past it
 *  - real score (> 0) on a stats-collecting hole → write, then `openStats`;
 *    the stats screen's `statsDone` performs the advance afterwards
 *  - anything else (clear, pickup, plain hole) → write, then advance
 *  - correction mode (`holeCompleteOnEntry`) → write, then `stay`; a return
 *    visit never hops balls and never jumps holes
 *
 * `statsDone` writes nothing (the score is already in) and advances unless the
 * visit is a correction. QUIRK: unlike a score event it does not require a
 * ball under the cursor, only a hole.
 */
export function advance(state: AdvanceState, entry: EntryEvent): AdvanceDecision {
    const hole = state.currentHole;

    if (entry.kind === 'statsDone') {
        if (state.holeCompleteOnEntry) return { write: null, move: { kind: 'stay' } };
        return { write: null, move: moveAfterHandled(state) };
    }

    const ball = state.balls[state.currentBallIndex];
    if (!hole || !ball) return { write: null, move: { kind: 'noop' } };

    if (ball.pending) {
        // Skip past an unclaimed seat instead of queueing a write that can
        // never land.
        if (state.holeCompleteOnEntry) return { write: null, move: { kind: 'stay' } };
        return { write: null, move: moveAfterHandled(state) };
    }

    const write: ScoreWrite = {
        ballIndex: state.currentBallIndex,
        holeId: hole.id,
        value: entry.value,
        withMetadata: entry.value !== null,
    };

    if (entry.value !== null && entry.value > 0 && state.collectsStats) {
        return { write, move: { kind: 'openStats' } };
    }
    if (state.holeCompleteOnEntry) return { write, move: { kind: 'stay' } };
    return { write, move: moveAfterHandled(state) };
}
