import { expect, test } from 'bun:test';
import { newToYou } from '../../src/landing/new-rounds';
import type { MyRoundEntry } from '../../src/landing/my-rounds';
import type { Round } from '../../src/api/friendly-rounds.gen';

// "New — you were added": friend-added (produced but not created), unseen
// rounds — the highlight strip's source. Pure filter over the already-merged
// dashboard list, so "created by me" is read off the reliable `created` flag
// (the produced payload carries no creator id).

function round(id: string, date: string): Round {
    return { id, date } as unknown as Round;
}

function entry(
    id: string,
    date: string,
    over: Partial<Pick<MyRoundEntry, 'played' | 'created' | 'token'>> = {},
): MyRoundEntry {
    return {
        round: round(id, date),
        token: `tok-${id}`,
        played: true,
        created: false,
        ...over,
    };
}

const NONE: ReadonlySet<string> = new Set();

test('includes a friend-added, unseen produced round', () => {
    const out = newToYou([entry('r1', '2026-07-01')], NONE);
    expect(out.map((e) => e.round.id)).toEqual(['r1']);
});

test('excludes a round the viewer created', () => {
    const out = newToYou(
        [entry('mine', '2026-07-02', { created: true }), entry('added', '2026-07-01')],
        NONE,
    );
    expect(out.map((e) => e.round.id)).toEqual(['added']);
});

test('excludes a round the viewer both created and played', () => {
    const out = newToYou([entry('r1', '2026-07-01', { played: true, created: true })], NONE);
    expect(out).toEqual([]);
});

test('excludes a round already seen on this device', () => {
    const out = newToYou([entry('r1', '2026-07-01'), entry('r2', '2026-07-02')], new Set(['r1']));
    expect(out.map((e) => e.round.id)).toEqual(['r2']);
});

test('excludes an entry the viewer does not produce (defensive)', () => {
    // created-only entries carry played:false — they are the viewer's OWN
    // creations they don't play, never "added by a friend".
    const out = newToYou([entry('r1', '2026-07-01', { played: false, created: true })], NONE);
    expect(out).toEqual([]);
});

test('sorts newest first, tie-broken by round id', () => {
    const out = newToYou(
        [
            entry('c', '2026-07-01'),
            entry('a', '2026-07-03'),
            entry('b', '2026-07-01'),
        ],
        NONE,
    );
    // 2026-07-03 first; then the two 07-01 rounds by id (b before c).
    expect(out.map((e) => e.round.id)).toEqual(['a', 'b', 'c']);
});

test('empty input → empty list', () => {
    expect(newToYou([], NONE)).toEqual([]);
});

test('does not mutate the input array', () => {
    const input = [entry('b', '2026-07-01'), entry('a', '2026-07-02')];
    const snapshot = input.map((e) => e.round.id);
    newToYou(input, NONE);
    expect(input.map((e) => e.round.id)).toEqual(snapshot);
});
