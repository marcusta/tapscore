// Parity ratchet for the client mirror of server/domain/handicap.ts.
//
// src/create/handicap.ts re-states the WHS arithmetic for display (the setup
// wizard's CH preview, the on-course per-hole stroke hint). The server stays
// the single source of truth — this sweep pins the mirror to it so a change
// on either side that forgets the other fails loudly.

import { expect, test } from 'bun:test';
import * as server from '../../server/domain/handicap';
import * as client from '../../src/create/handicap';

test('courseHandicap mirror matches the server formula across a sweep', () => {
    for (const handicapIndex of [-5, 0, 4.3, 11.7, 26.4, 54]) {
        for (const slope of [95, 113, 128, 155]) {
            for (const [courseRating, par] of [
                [68.2, 70],
                [72.0, 72],
                [74.6, 71],
            ] as const) {
                const input = { handicapIndex, slope, courseRating, par };
                expect(client.courseHandicap(input)).toBe(server.courseHandicap(input));
            }
        }
    }
});

test('strokesReceivedForStrokeIndex mirror matches the server across a sweep', () => {
    for (const cycle of [9, 18]) {
        for (let ph = -20; ph <= 60; ph++) {
            for (let si = 1; si <= cycle; si++) {
                expect(client.strokesReceivedForStrokeIndex(ph, si, cycle)).toBe(
                    server.strokesReceivedForStrokeIndex(ph, si, cycle),
                );
            }
        }
    }
});

test('strokesReceivedForStrokeIndex mirror: spot values', () => {
    // PH 16, cycle 18: the 16 lowest stroke indexes get one stroke.
    expect(client.strokesReceivedForStrokeIndex(16, 3, 18)).toBe(1);
    expect(client.strokesReceivedForStrokeIndex(16, 16, 18)).toBe(1);
    expect(client.strokesReceivedForStrokeIndex(16, 17, 18)).toBe(0);
    // Scratch gets nothing anywhere.
    expect(client.strokesReceivedForStrokeIndex(0, 1, 18)).toBe(0);
    // PH 20: a full extra stroke everywhere, plus one more on SI 1–2.
    expect(client.strokesReceivedForStrokeIndex(20, 2, 18)).toBe(2);
    expect(client.strokesReceivedForStrokeIndex(20, 10, 18)).toBe(1);
    // Plus handicap gives strokes back on the easiest holes.
    expect(client.strokesReceivedForStrokeIndex(-2, 18, 18)).toBe(-1);
    expect(client.strokesReceivedForStrokeIndex(-2, 16, 18)).toBe(0);
});
