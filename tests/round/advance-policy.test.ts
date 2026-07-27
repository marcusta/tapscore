import { describe, expect, test } from 'bun:test';
import {
    HOLE_ADVANCE_DELAY_MS,
    advance,
    hasMoreUnscored,
    isHoleCompleteOnEntry,
    type AdvanceState,
    type BallState,
} from '../../src/round/advance-policy';

// ===========================================================================
// SCORE ENTRY ADVANCE POLICY — EXECUTABLE SPECIFICATION
// ---------------------------------------------------------------------------
// N4 prerequisite. This file is the shared spec for the web keypad
// (`src/round/score-entry.component.ts`) and the forthcoming Swift client:
// the iOS advance policy is written against these cases, not against the
// TypeScript source. Every decision branch the policy can emit has at least
// one named test below, and the QUIRK-tagged ones pin behaviour that looks
// wrong but is the shipped web behaviour — reproduce them.
//
// Vocabulary:
//   ball        = one scoring seat in the playing group (a player or a team)
//   pending     = an unclaimed placeholder seat; can never be scored
//   entry mode  = the hole had gaps on arrival → entries auto-advance
//   correction  = the hole was already complete on arrival → nothing moves
// ===========================================================================

const ball = (scored = false, pending = false): BallState => ({ scored, pending });

/** A 4-ball group, mid-round (hole 3 of 18), entry mode, no stats. */
function state(over: Partial<AdvanceState> = {}): AdvanceState {
    return {
        balls: [ball(), ball(), ball(), ball()],
        currentBallIndex: 0,
        currentHole: { id: 'ph-3', label: '3' },
        holeIndex: 2,
        holeCount: 18,
        holeCompleteOnEntry: false,
        collectsStats: false,
        ...over,
    };
}

const SCORE_4 = { kind: 'score', value: 4 } as const;

// ---------------------------------------------------------------------------
// 1. The write: what gets persisted, and with what metadata
// ---------------------------------------------------------------------------

describe('the score write', () => {
    test('a numeric score writes strokes for the selected ball on the current hole', () => {
        const d = advance(state({ currentBallIndex: 1 }), SCORE_4);
        expect(d.write).toEqual({ ballIndex: 1, holeId: 'ph-3', value: 4, withMetadata: true });
    });

    test('pick up writes 0 — a real entry, not an absence', () => {
        const d = advance(state(), { kind: 'score', value: 0 });
        expect(d.write?.value).toBe(0);
        expect(d.write?.withMetadata).toBe(true);
    });

    test('clear writes null and carries NO metadata snapshot', () => {
        // Clearing a hole must not persist stale GIR/fairway toggles; a real or
        // pickup score always carries the complete snapshot so the latest
        // event's blob is authoritative.
        const d = advance(state(), { kind: 'score', value: null });
        expect(d.write).toEqual({ ballIndex: 0, holeId: 'ph-3', value: null, withMetadata: false });
    });

    test('the stats screen’s Next writes nothing (the score is already in)', () => {
        const d = advance(state(), { kind: 'statsDone' });
        expect(d.write).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 2. Nothing to act on
// ---------------------------------------------------------------------------

describe('degenerate states', () => {
    test('no hole (group has no itinerary yet) → noop, no write', () => {
        const d = advance(state({ currentHole: null }), SCORE_4);
        expect(d).toEqual({ write: null, move: { kind: 'noop' } });
    });

    test('cursor points past the end of the ball list → noop, no write', () => {
        const d = advance(state({ currentBallIndex: 9 }), SCORE_4);
        expect(d).toEqual({ write: null, move: { kind: 'noop' } });
    });

    test('a NEGATIVE cursor index → noop, no write', () => {
        // Same guard as the past-the-end case, pinned separately because the
        // two clients get here differently: TS returns `undefined` for any bad
        // index, while a Swift port must bounds-check (a raw subscript traps).
        const d = advance(state({ currentBallIndex: -1 }), SCORE_4);
        expect(d).toEqual({ write: null, move: { kind: 'noop' } });
    });

    test('QUIRK: statsDone needs only a hole, not a ball under the cursor', () => {
        // Unlike a score event, the stats screen's Next does not re-check the
        // cursor; with a hole present it advances normally.
        const d = advance(state({ currentBallIndex: 9 }), { kind: 'statsDone' });
        expect(d.move.kind).toBe('moveToBall');
    });

    test('statsDone with no hole → noop', () => {
        const d = advance(state({ currentHole: null }), { kind: 'statsDone' });
        expect(d.move).toEqual({ kind: 'noop' });
    });
});

// ---------------------------------------------------------------------------
// 3. Mid-hole ball ordering — one wrap-around pass, starting after the cursor
// ---------------------------------------------------------------------------

describe('ball ordering within a hole', () => {
    test('advances to the next unscored ball AFTER the cursor', () => {
        const d = advance(
            state({ balls: [ball(true), ball(false), ball(false), ball(false)], currentBallIndex: 0 }),
            SCORE_4,
        );
        expect(d.move).toEqual({ kind: 'moveToBall', ballIndex: 1 });
    });

    test('skips balls that already have a score', () => {
        const d = advance(
            state({ balls: [ball(), ball(), ball(true), ball(false)], currentBallIndex: 1 }),
            SCORE_4,
        );
        expect(d.move).toEqual({ kind: 'moveToBall', ballIndex: 3 });
    });

    test('wraps to the START of the list when everything after the cursor is scored', () => {
        // Entering out of order (tap the 3rd player first) must still collect
        // the players sitting before the cursor before calling the hole done.
        const d = advance(
            state({ balls: [ball(false), ball(true), ball(true), ball(true)], currentBallIndex: 2 }),
            SCORE_4,
        );
        expect(d.move).toEqual({ kind: 'moveToBall', ballIndex: 0 });
    });

    test('the wrap never revisits the current ball', () => {
        // Only ball 1 (the cursor) is unscored → the scan finds nobody and the
        // hole is treated as done.
        const d = advance(
            state({ balls: [ball(true), ball(false), ball(true)], currentBallIndex: 1 }),
            SCORE_4,
        );
        expect(d.move.kind).toBe('holeComplete');
    });

    test('QUIRK: clearing a score still reports the hole done', () => {
        // The scan never re-examines the current ball, so a clear on the last
        // gap completes the hole even though that ball now has no score. This
        // is the shipped behaviour — the player is expected to be correcting.
        const d = advance(
            state({ balls: [ball(true), ball(true), ball(false)], currentBallIndex: 2 }),
            { kind: 'score', value: null },
        );
        expect(d.write?.value).toBeNull();
        expect(d.move.kind).toBe('holeComplete');
    });

    test('single-ball group: every entry completes the hole immediately', () => {
        const d = advance(state({ balls: [ball()], currentBallIndex: 0 }), SCORE_4);
        expect(d.move.kind).toBe('holeComplete');
    });
});

// ---------------------------------------------------------------------------
// 4. Hole completion, the delayed jump, and the last hole
// ---------------------------------------------------------------------------

describe('hole and round completion', () => {
    test('last ball scored mid-round → toast, then a delayed jump to the next hole', () => {
        const d = advance(
            state({ balls: [ball(true), ball(false)], currentBallIndex: 1, holeIndex: 2, holeCount: 18 }),
            SCORE_4,
        );
        expect(d.move).toEqual({
            kind: 'holeComplete',
            toast: 'Hole 3 done',
            fromHoleId: 'ph-3',
            toHoleIndex: 3,
            delayMs: HOLE_ADVANCE_DELAY_MS,
        });
    });

    test('the toast uses the occurrence LABEL, not the index (repeated routes)', () => {
        // A 9-hole course played twice shows "7b" on the second lap; the
        // itinerary index and the printed hole number are different things.
        const d = advance(
            state({
                balls: [ball()],
                currentHole: { id: 'ph-16', label: '7b' },
                holeIndex: 15,
                holeCount: 18,
            }),
            SCORE_4,
        );
        expect(d.move).toMatchObject({ toast: 'Hole 7b done', fromHoleId: 'ph-16', toHoleIndex: 16 });
    });

    test('fromHoleId is the hole that completed — the caller cancels the jump if it moved', () => {
        // The 700ms pause is interruptible: a manual swipe during it must not
        // yank the player to the wrong hole. The policy hands out the identity
        // to compare against; the caller does the comparing.
        const d = advance(state({ balls: [ball()], currentHole: { id: 'ph-9', label: '9' } }), SCORE_4);
        expect(d.move).toMatchObject({ fromHoleId: 'ph-9' });
    });

    test('LAST hole complete → round complete, and the keypad closes (no jump)', () => {
        const d = advance(
            state({ balls: [ball(true), ball(false)], currentBallIndex: 1, holeIndex: 17, holeCount: 18 }),
            SCORE_4,
        );
        expect(d.move).toEqual({ kind: 'roundComplete', toast: 'Round complete' });
    });

    test('a one-hole itinerary is immediately the last hole', () => {
        const d = advance(state({ balls: [ball()], holeIndex: 0, holeCount: 1 }), SCORE_4);
        expect(d.move.kind).toBe('roundComplete');
    });

    test('QUIRK: an empty ball list completes the hole', () => {
        // No balls means no gaps, so the scan falls straight through. Harmless
        // in practice (the keypad is unreachable without balls) but pinned so
        // the two clients do the same thing.
        const d = advance(state({ balls: [], currentBallIndex: 0 }), { kind: 'statsDone' });
        expect(d.move.kind).toBe('holeComplete');
    });

    test('…but a SCORE event on an empty ball list is a noop', () => {
        // The companion to the case above: the quirk is an asymmetry between
        // the two events, not a claim that an empty group completes holes. A
        // score event needs a ball under the cursor and there is none, so it
        // never reaches the scan that statsDone falls through.
        const d = advance(state({ balls: [], currentBallIndex: 0 }), SCORE_4);
        expect(d).toEqual({ write: null, move: { kind: 'noop' } });
    });
});

// ---------------------------------------------------------------------------
// 5. Correction mode — a return visit to an already-complete hole
// ---------------------------------------------------------------------------

describe('correction mode (holeCompleteOnEntry)', () => {
    test('an entry on an already-complete hole writes but does NOT move', () => {
        // Several corrections on one hole must not fight the advance logic: no
        // ball hop, no hole jump, for the whole visit.
        const d = advance(
            state({ balls: [ball(true), ball(true)], currentBallIndex: 0, holeCompleteOnEntry: true }),
            SCORE_4,
        );
        expect(d.write).toMatchObject({ ballIndex: 0, value: 4 });
        expect(d.move).toEqual({ kind: 'stay' });
    });

    test('correction mode survives a clear+re-enter within the visit', () => {
        // The flag is a snapshot of ARRIVAL, never recomputed per entry, so
        // clearing a score mid-visit does not flip back to entry mode.
        const cleared = state({
            balls: [ball(true), ball(false)],
            currentBallIndex: 1,
            holeCompleteOnEntry: true,
        });
        expect(advance(cleared, SCORE_4).move).toEqual({ kind: 'stay' });
    });

    test('statsDone in correction mode stays put too', () => {
        const d = advance(state({ holeCompleteOnEntry: true }), { kind: 'statsDone' });
        expect(d).toEqual({ write: null, move: { kind: 'stay' } });
    });

    test('correction mode does not suppress the stats detour', () => {
        // A corrected real score still opens the stats screen so GIR/fairway
        // can be fixed too; its Next then stays put.
        const d = advance(state({ collectsStats: true, holeCompleteOnEntry: true }), SCORE_4);
        expect(d.move).toEqual({ kind: 'openStats' });
    });
});

// ---------------------------------------------------------------------------
// 6. The stats detour (holes that collect GIR/fairway)
// ---------------------------------------------------------------------------

describe('stats-collecting holes', () => {
    test('a real score (> 0) opens the stats screen instead of advancing', () => {
        const d = advance(state({ collectsStats: true }), SCORE_4);
        expect(d.write).toMatchObject({ value: 4, withMetadata: true });
        expect(d.move).toEqual({ kind: 'openStats' });
    });

    test('pick up (0) skips the stats screen and advances immediately', () => {
        // 0 is not a played-out hole; there is no GIR to record.
        const d = advance(state({ collectsStats: true }), { kind: 'score', value: 0 });
        expect(d.move).toEqual({ kind: 'moveToBall', ballIndex: 1 });
    });

    test('clear skips the stats screen and advances immediately', () => {
        const d = advance(state({ collectsStats: true }), { kind: 'score', value: null });
        expect(d.move).toEqual({ kind: 'moveToBall', ballIndex: 1 });
    });

    test('the stats screen’s Next performs the advance the score deferred', () => {
        // Continuation of the case above: the score is stored, the cursor is
        // still on ball 0, and Next resumes the normal ball scan.
        const after = state({ collectsStats: true, balls: [ball(true), ball(), ball(), ball()] });
        expect(advance(after, { kind: 'statsDone' }).move).toEqual({ kind: 'moveToBall', ballIndex: 1 });
    });

    test('the stats screen’s Next on the last gap completes the hole', () => {
        const after = state({
            collectsStats: true,
            balls: [ball(true), ball(true)],
            currentBallIndex: 1,
        });
        expect(advance(after, { kind: 'statsDone' }).move).toMatchObject({ kind: 'holeComplete' });
    });

    test('a strokes-only hole never opens stats', () => {
        const d = advance(state({ collectsStats: false }), SCORE_4);
        expect(d.move.kind).toBe('moveToBall');
    });
});

// ---------------------------------------------------------------------------
// 7. Pending (unclaimed placeholder) seats
// ---------------------------------------------------------------------------

describe('pending seats', () => {
    test('a key press on a pending seat writes NOTHING and advances past it', () => {
        // The server 409s `seat_unclaimed`, so queueing the write would only
        // produce a failure the player cannot act on.
        const d = advance(
            state({ balls: [ball(false, true), ball(false), ball(false)], currentBallIndex: 0 }),
            SCORE_4,
        );
        expect(d.write).toBeNull();
        expect(d.move).toEqual({ kind: 'moveToBall', ballIndex: 1 });
    });

    test('a key press on a pending seat in correction mode stays put', () => {
        const d = advance(
            state({ balls: [ball(false, true), ball(true)], currentBallIndex: 0, holeCompleteOnEntry: true }),
            SCORE_4,
        );
        expect(d).toEqual({ write: null, move: { kind: 'stay' } });
    });

    test('QUIRK: the ball scan does NOT skip pending seats — the cursor lands on one', () => {
        // Only the hole-complete question ignores pending seats; the scan
        // treats an unscored pending seat as a normal landing spot, and the
        // next key press there simply advances again (see the case above).
        const d = advance(
            state({ balls: [ball(), ball(false, true), ball(true)], currentBallIndex: 0 }),
            SCORE_4,
        );
        expect(d.move).toEqual({ kind: 'moveToBall', ballIndex: 1 });
    });
});

// ---------------------------------------------------------------------------
// 8. isHoleCompleteOnEntry — the arrival snapshot that picks the mode
// ---------------------------------------------------------------------------

describe('isHoleCompleteOnEntry (evaluated on every keypad arrival)', () => {
    const hole = { id: 'ph-3', label: '3' };

    test('every scoreable ball scored → correction mode', () => {
        expect(isHoleCompleteOnEntry({ balls: [ball(true), ball(true)], currentHole: hole })).toBe(true);
    });

    test('one gap → entry mode', () => {
        expect(isHoleCompleteOnEntry({ balls: [ball(true), ball(false)], currentHole: hole })).toBe(false);
    });

    test('an unscored PENDING seat does not hold the hole open', () => {
        // A placeholder seat can never be scored, so a hole whose only gap is
        // a pending seat still counts as complete.
        expect(
            isHoleCompleteOnEntry({ balls: [ball(true), ball(false, true)], currentHole: hole }),
        ).toBe(true);
    });

    test('a hole with ONLY pending seats is not complete (stays in entry mode)', () => {
        expect(isHoleCompleteOnEntry({ balls: [ball(false, true)], currentHole: hole })).toBe(false);
    });

    test('an empty group is not complete', () => {
        expect(isHoleCompleteOnEntry({ balls: [], currentHole: hole })).toBe(false);
    });

    test('no hole is never complete', () => {
        expect(isHoleCompleteOnEntry({ balls: [ball(true)], currentHole: null })).toBe(false);
    });

    test('the auto-jump lands in correction mode when the next hole was scored ahead', () => {
        // This is what stops a runaway advance chain: after the jump the caller
        // re-snapshots, and a pre-scored hole parks the player there.
        const arrived = { balls: [ball(true), ball(true)], currentHole: { id: 'ph-4', label: '4' } };
        expect(isHoleCompleteOnEntry(arrived)).toBe(true);
        expect(advance({ ...state(), ...arrived, holeCompleteOnEntry: true }, SCORE_4).move).toEqual({
            kind: 'stay',
        });
    });
});

// ---------------------------------------------------------------------------
// 9. hasMoreUnscored — label only ("Next ›" vs "Done ›")
// ---------------------------------------------------------------------------

describe('hasMoreUnscored (stats button label)', () => {
    test('true while another ball on the hole is unscored', () => {
        expect(
            hasMoreUnscored({
                balls: [ball(true), ball(false)],
                currentBallIndex: 0,
                currentHole: { id: 'ph-3', label: '3' },
            }),
        ).toBe(true);
    });

    test('false when the current ball is the only gap', () => {
        expect(
            hasMoreUnscored({
                balls: [ball(true), ball(false)],
                currentBallIndex: 1,
                currentHole: { id: 'ph-3', label: '3' },
            }),
        ).toBe(false);
    });

    test('QUIRK: a pending seat counts as "more unscored"', () => {
        expect(
            hasMoreUnscored({
                balls: [ball(true), ball(false, true)],
                currentBallIndex: 0,
                currentHole: { id: 'ph-3', label: '3' },
            }),
        ).toBe(true);
    });

    test('false with no hole', () => {
        expect(hasMoreUnscored({ balls: [ball()], currentBallIndex: 0, currentHole: null })).toBe(false);
    });
});
