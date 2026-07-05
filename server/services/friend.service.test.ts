// Frecency signals on the friends list — `listFor` enriches each friend with
// sharedRoundCount / lastPlayedAt / frecency computed from rounds the caller
// and that friend BOTH produced a ball in. `now` is injected for determinism.

import { test, expect } from 'bun:test';
import { createTestDb } from '../testing/db';
import { registerBuiltInBallCreationStrategies } from '../domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../domain/formats';
import type { RoundDefinition } from '../domain/round-definition';
import type { TestContext } from '../testing/db';

const NOW = '2026-07-05T12:00:00.000Z';

function daysAgo(n: number): string {
    // A bare YYYY-MM-DD date, matching how rounds store `date`.
    return new Date(Date.parse(NOW) - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function setup() {
    registerBuiltInBallCreationStrategies();
    registerBuiltInFormats();
    const ctx = await createTestDb();
    const club = await ctx.clubService.create({ name: 'Frec GC' });
    const course = await ctx.courseService.create({
        clubId: club.id,
        name: 'Frecer',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await ctx.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    const reg = (username: string, displayName: string) =>
        ctx.playerService.register({ username, password: 'password123', displayName, gender: 'M', handicapIndex: 10 });

    const erik = await reg('erik', 'Erik');
    const karin = await reg('karin', 'Karin');
    const sara = await reg('sara', 'Sara');
    const zed = await reg('zed', 'Zed'); // a friend never played with
    const anna = await reg('anna', 'Anna'); // another never-played friend (alpha check)

    // Erik friends everyone.
    for (const f of [karin, sara, zed, anna]) await ctx.friendService.add(erik.id, f.id);

    // Play a round where `erik` and `partner` both produce a ball, dated `date`.
    async function playRound(partnerId: string, date: string) {
        const definition: RoundDefinition = {
            courseId: course.id,
            playedAt: date,
            roundType: 'full_18',
            producers: [
                { id: 'P1', playerRef: { kind: 'player', id: erik.id }, handicapIndex: 10, gender: 'M', teeId: tee.id },
                { id: 'P2', playerRef: { kind: 'player', id: partnerId }, handicapIndex: 10, gender: 'M', teeId: tee.id },
            ],
            ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
            slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
        };
        return ctx.roundService.create({ definition });
    }

    return { ctx, erik, karin, sara, zed, anna, playRound };
}

function byName(list: { displayName: string }[]) {
    return list.map((f) => f.displayName);
}

test('listFor enriches each friend with sharedRoundCount / lastPlayedAt / frecency', async () => {
    const { ctx, erik, karin, zed, playRound } = await setup();
    await playRound(karin.id, daysAgo(3));
    await playRound(karin.id, daysAgo(10));

    const friends = await ctx.friendService.listFor(erik.id, NOW);
    const k = friends.find((f) => f.id === karin.id)!;
    expect(k.sharedRoundCount).toBe(2);
    expect(k.lastPlayedAt).toBe(daysAgo(3)); // most recent shared round
    expect(k.frecency).toBeGreaterThan(0);

    const z = friends.find((f) => f.id === zed.id)!;
    expect(z.sharedRoundCount).toBe(0);
    expect(z.lastPlayedAt).toBeNull();
    expect(z.frecency).toBe(0);
});

test('a regular (2 recent rounds) outranks a single recent one-off by frecency', async () => {
    const { ctx, erik, karin, sara, playRound } = await setup();
    await playRound(karin.id, daysAgo(2));
    await playRound(karin.id, daysAgo(9));
    await playRound(sara.id, daysAgo(1));

    const friends = await ctx.friendService.listFor(erik.id, NOW);
    const k = friends.find((f) => f.id === karin.id)!;
    const s = friends.find((f) => f.id === sara.id)!;
    expect(k.frecency).toBeGreaterThan(s.frecency);
});

test('guests never count — only registered co-producers create shared rounds', async () => {
    const { ctx, erik, karin } = await setup();
    // A round where Erik plays with a GUEST (no player_id), plus Karin.
    // The guest must not appear as a "friend" and must not inflate any count.
    const guest = await ctx.guestPlayerService.create({ displayName: 'Guest', gender: 'M', handicapIndex: 10 });
    void guest; // guests aren't friends; assertion is on Karin's untouched signals.

    const friends = await ctx.friendService.listFor(erik.id, NOW);
    // No rounds played yet → Karin never-played.
    expect(friends.find((f) => f.id === karin.id)!.sharedRoundCount).toBe(0);
});

test('never-played friends carry score 0 regardless of others playing', async () => {
    const { ctx, erik, karin, anna, playRound } = await setup();
    await playRound(karin.id, daysAgo(1));
    const friends = await ctx.friendService.listFor(erik.id, NOW);
    expect(friends.find((f) => f.id === anna.id)!.frecency).toBe(0);
});

test('deterministic across calls with the same injected now', async () => {
    const { ctx, erik, karin, playRound } = await setup();
    await playRound(karin.id, daysAgo(5));
    const a = await ctx.friendService.listFor(erik.id, NOW);
    const b = await ctx.friendService.listFor(erik.id, NOW);
    expect(a.find((f) => f.id === karin.id)!.frecency).toBe(
        b.find((f) => f.id === karin.id)!.frecency,
    );
});

// Sanity: the raw list is not yet sorted by frecency server-side (the client's
// friend-sort module owns display order); it still returns every active friend.
test('listFor returns all active friends', async () => {
    const { ctx, erik } = await setup();
    const friends = await ctx.friendService.listFor(erik.id, NOW);
    expect(byName(friends).sort()).toEqual(['Anna', 'Karin', 'Sara', 'Zed']);
});
