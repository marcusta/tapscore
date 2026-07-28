import { expect, test } from 'bun:test';
import { signOutSequence, type SignOutContext } from '../../src/auth/sign-out';

// Signing out is a sequence, not a call: log out FIRST, then drop every cached
// identity-shaped slice, then go home. The landing clear is the one that is
// easy to forget — signing out while already on '/' never remounts the landing,
// so nothing else would reset its lists.

function ctx() {
    const log: string[] = [];
    const clearable = (name: string) => ({ clear: () => void log.push(name) });
    const c: SignOutContext = {
        auth: {
            logout: async () => {
                log.push('logout');
            },
        },
        profile: clearable('profile'),
        friends: clearable('friends'),
        admins: clearable('admins'),
        landing: clearable('landing'),
        navigate: (path) => void log.push(`navigate ${path}`),
    };
    return { c, log };
}

test('logs out, clears every service, then lands on /', async () => {
    const { c, log } = ctx();
    await signOutSequence(c);
    expect(log).toEqual([
        'logout',
        'profile',
        'friends',
        'admins',
        'landing',
        'navigate /',
    ]);
});

test('the landing is cleared — a sign-out from / must not leave stale state', async () => {
    const { c, log } = ctx();
    await signOutSequence(c);
    expect(log).toContain('landing');
    // …and only after the session is actually gone, so an in-flight load can't
    // repopulate what we just cleared.
    expect(log.indexOf('landing')).toBeGreaterThan(log.indexOf('logout'));
});

test('nothing is cleared before logout resolves', async () => {
    const { c, log } = ctx();
    let release = () => {};
    c.auth.logout = () =>
        new Promise<void>((resolve) => {
            release = resolve;
        });
    const done = signOutSequence(c);
    expect(log).toEqual([]);
    release();
    await done;
    expect(log).toEqual(['profile', 'friends', 'admins', 'landing', 'navigate /']);
});
