import { expect, test } from 'bun:test';
import { buildMyRounds, roleLabel } from '../../src/landing/my-rounds';
import type { FriendlyRound, Round } from '../../src/api/friendly-rounds.gen';

// Pure merge of dashboard.myRounds (produced + created) into the deduped
// landing "My rounds" list. Both halves now carry their own share token —
// produced entries are server-joined against `friendly_rounds` — so this is
// a straight merge/dedupe with no client-side token join.

function round(id: string, date: string): Round {
    return { id, date } as unknown as Round;
}

function friendly(roundId: string, token: string): FriendlyRound {
    return {
        id: `fr-${roundId}`,
        roundId,
        shareToken: token,
        creatorPlayerId: null,
        createdAt: '2026-01-01T00:00:00Z',
    };
}

function listItem(id: string, date: string, token: string) {
    return { friendlyRound: friendly(id, token), round: round(id, date) };
}

function produced(id: string, date: string, shareToken: string | null) {
    return { round: round(id, date), shareToken };
}

test('created-only and produced-only rounds both surface, newest first', () => {
    const out = buildMyRounds(
        [produced('r1', '2026-07-01', 'tok-1')],
        [listItem('r2', '2026-07-02', 'tok-2')],
    );
    expect(out.map((e) => e.round.id)).toEqual(['r2', 'r1']);
    expect(out[0]).toMatchObject({ token: 'tok-2', played: false, created: true });
    expect(out[1]).toMatchObject({ token: 'tok-1', played: true, created: false });
});

test('a round both created and played dedupes to ONE entry with both flags', () => {
    const out = buildMyRounds(
        [produced('r1', '2026-07-01', 'tok-1')],
        [listItem('r1', '2026-07-01', 'tok-1')],
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ token: 'tok-1', played: true, created: true });
});

test('produced rounds carry their own token; no wrapper ⇒ null token', () => {
    const out = buildMyRounds(
        [produced('r1', '2026-07-01', 'tok-1'), produced('r2', '2026-07-02', null)],
        [],
    );
    expect(out.find((e) => e.round.id === 'r1')!.token).toBe('tok-1');
    expect(out.find((e) => e.round.id === 'r2')!.token).toBeNull();
});

test('same-date rounds order stably by id', () => {
    const out = buildMyRounds(
        [produced('b', '2026-07-01', null), produced('a', '2026-07-01', null)],
        [],
    );
    expect(out.map((e) => e.round.id)).toEqual(['a', 'b']);
});

test('duplicate produced entries (one ball per row upstream) collapse to one', () => {
    const out = buildMyRounds(
        [produced('r1', '2026-07-01', 'tok-1'), produced('r1', '2026-07-01', 'tok-1')],
        [],
    );
    expect(out).toHaveLength(1);
});

test('roleLabel spells the combined role', () => {
    expect(roleLabel({ played: true, created: false })).toBe('Played');
    expect(roleLabel({ played: false, created: true })).toBe('Created');
    expect(roleLabel({ played: true, created: true })).toBe('Played · Created');
});
