import { expect, test } from 'bun:test';
import { LandingService } from '../../src/landing/landing.service';

// `clear()` is what makes a sign-out visible on the landing. Signing out while
// already on '/' does NOT remount the landing — the route signal never changes,
// so `render()` (and its `loadMine`/`loadDevice` call) never runs again. Without
// this the screen keeps the signed-in shape with an empty list.

test('clear() drops the signed-in lists', () => {
    const svc = new LandingService();
    svc.mine.set({ produced: [], created: [] });
    svc.mineLoading.set(true);

    svc.clear();

    expect(svc.mine.get()).toBeNull();
    expect(svc.myRounds.get()).toEqual([]);
    expect(svc.newRounds.get()).toEqual([]);
    expect(svc.mineLoading.get()).toBe(false);
    expect(svc.mineError.get()).toBeNull();
});

// The identity strip binds `ProfileService.player` — the shell's one copy of
// the signed-in player, cleared by the profile service's own sign-out path —
// so there is deliberately no landing-owned player state to test here.

test('clear() re-reads the device list, so the anonymous landing has rows again', () => {
    const svc = new LandingService();
    // Stale value from a previous logged-out session, now out of date.
    svc.deviceRounds.set([
        {
            token: 'gone',
            courseName: 'Stale',
            status: 'active',
            completedAt: null,
            lastSeenAt: '2026-07-05T10:00:00.000Z',
        },
    ]);

    svc.clear();

    // Re-read from device storage (absent here → empty), never left untouched.
    expect(svc.deviceRounds.get().some((r) => r.token === 'gone')).toBe(false);
});
