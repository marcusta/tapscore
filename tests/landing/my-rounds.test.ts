import { expect, test } from 'bun:test';
import { buildMyRounds, roleLabel } from '../../src/landing/my-rounds';
import type { FriendlyRound, Round } from '../../src/api/friendly-rounds.gen';

// Pure merge of dashboard.myRounds (produced + created) into the deduped
// landing "My rounds" list, incl. the token join for produced-only entries
// (the dashboard's produced half carries no share token — see the client-side
// join note in landing.service).

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

test('created-only and produced-only rounds both surface, newest first', () => {
    const out = buildMyRounds(
        [{ round: round('r1', '2026-07-01') }],
        [listItem('r2', '2026-07-02', 'tok-2')],
        [listItem('r1', '2026-07-01', 'tok-1'), listItem('r2', '2026-07-02', 'tok-2')],
    );
    expect(out.map((e) => e.round.id)).toEqual(['r2', 'r1']);
    expect(out[0]).toMatchObject({ token: 'tok-2', played: false, created: true });
    expect(out[1]).toMatchObject({ token: 'tok-1', played: true, created: false });
});

test('a round both created and played dedupes to ONE entry with both flags', () => {
    const out = buildMyRounds(
        [{ round: round('r1', '2026-07-01') }],
        [listItem('r1', '2026-07-01', 'tok-1')],
        [],
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ token: 'tok-1', played: true, created: true });
});

test('produced rounds join their token from the public list; unjoinable ⇒ null token', () => {
    const out = buildMyRounds(
        [{ round: round('r1', '2026-07-01') }, { round: round('r2', '2026-07-02') }],
        [],
        [listItem('r1', '2026-07-01', 'tok-1')],
    );
    expect(out.find((e) => e.round.id === 'r1')!.token).toBe('tok-1');
    expect(out.find((e) => e.round.id === 'r2')!.token).toBeNull();
});

test('same-date rounds order stably by id', () => {
    const out = buildMyRounds(
        [{ round: round('b', '2026-07-01') }, { round: round('a', '2026-07-01') }],
        [],
        [],
    );
    expect(out.map((e) => e.round.id)).toEqual(['a', 'b']);
});

test('duplicate produced entries (one ball per row upstream) collapse to one', () => {
    const out = buildMyRounds(
        [{ round: round('r1', '2026-07-01') }, { round: round('r1', '2026-07-01') }],
        [],
        [],
    );
    expect(out).toHaveLength(1);
});

test('roleLabel spells the combined role', () => {
    expect(roleLabel({ played: true, created: false })).toBe('Played');
    expect(roleLabel({ played: false, created: true })).toBe('Created');
    expect(roleLabel({ played: true, created: true })).toBe('Played · Created');
});
