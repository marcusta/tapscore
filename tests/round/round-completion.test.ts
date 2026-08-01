import { expect, test } from 'bun:test';
import { missingScoresLine, unscoredCellCount } from '../../src/round/round-completion';
import type { RoundBall, RoundPlayingGroup } from '../../src/api/rounds.gen';

// The finish prompt's honesty check. `roundComplete` fires when the LAST hole
// fills in, not when every hole has — this count is what lets the prompt say
// so instead of letting an incomplete card get finished by reflex.

const ball = (id: string, pending = false): RoundBall =>
    ({ id, pending, players: [] }) as unknown as RoundBall;

const group = (ballIds: string[], holeIds: string[]): RoundPlayingGroup =>
    ({
        id: `g-${ballIds.join('-')}`,
        ballIds,
        playedOrder: holeIds.map((playHoleId) => ({ playHoleId })),
    }) as unknown as RoundPlayingGroup;

const scores = (filled: Record<string, string[]>) => (ballId: string, playHoleId: string) =>
    (filled[ballId] ?? []).includes(playHoleId) ? 4 : null;

test('a fully scored round has zero missing cells', () => {
    const count = unscoredCellCount({
        balls: [ball('a'), ball('b')],
        groups: [group(['a', 'b'], ['h1', 'h2'])],
        strokesFor: scores({ a: ['h1', 'h2'], b: ['h1', 'h2'] }),
    });
    expect(count).toBe(0);
});

test('counts every empty cell, per ball — a skipped hole for two balls is two cells', () => {
    const count = unscoredCellCount({
        balls: [ball('a'), ball('b')],
        groups: [group(['a', 'b'], ['h1', 'h2', 'h3'])],
        // Both balls skipped h2; ball b also missed h3.
        strokesFor: scores({ a: ['h1', 'h3'], b: ['h1'] }),
    });
    expect(count).toBe(3);
});

test('pending (unclaimed) seats are excluded — they can never be scored', () => {
    const count = unscoredCellCount({
        balls: [ball('a'), ball('seat', true)],
        groups: [group(['a', 'seat'], ['h1', 'h2'])],
        strokesFor: scores({ a: ['h1', 'h2'] }),
    });
    expect(count).toBe(0);
});

test('spans every playing group — another group still out on the course counts', () => {
    const count = unscoredCellCount({
        balls: [ball('a'), ball('b')],
        groups: [group(['a'], ['h1', 'h2']), group(['b'], ['h1', 'h2'])],
        // Group 1 done; group 2 has not scored a thing.
        strokesFor: scores({ a: ['h1', 'h2'] }),
    });
    expect(count).toBe(2);
});

test('the warning line is absent at zero and counts correctly above it', () => {
    expect(missingScoresLine(0)).toBeNull();
    expect(missingScoresLine(1)).toBe('1 score is still missing.');
    expect(missingScoresLine(5)).toBe('5 scores are still missing.');
});
