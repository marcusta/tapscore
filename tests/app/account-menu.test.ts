import { expect, test } from 'bun:test';
import {
    accountControl,
    accountInitials,
    accountMenuKinds,
    accountMenuRows,
} from '../../src/app/account-menu';

// The app shell's top-right account surface, as a pure model: which control
// shows, which rows the popover carries, and the avatar's initials. The
// component only binds these; nothing here touches a DOM.

const signedIn = {
    signedIn: true,
    displayName: 'Marcus Andersson',
    username: 'marcus',
    isSuperAdmin: false,
};

test('signed out: the control is Sign in and there is no menu', () => {
    const state = { signedIn: false, isSuperAdmin: false };
    expect(accountControl(state)).toBe('signin');
    expect(accountMenuRows(state)).toEqual([]);
});

test('signed in: avatar control, identity + Profile + Sign out (no Admin)', () => {
    expect(accountControl(signedIn)).toBe('avatar');
    expect(accountMenuKinds(signedIn)).toEqual(['identity', 'profile', 'signout']);

    const [identity] = accountMenuRows(signedIn);
    expect(identity).toEqual({
        kind: 'identity',
        displayName: 'Marcus Andersson',
        username: 'marcus',
    });
});

test('unscoped super_admin: Admin sits between Profile and Sign out', () => {
    const state = { ...signedIn, isSuperAdmin: true };
    expect(accountMenuKinds(state)).toEqual(['identity', 'profile', 'admin', 'signout']);
    // The whole ordered list, not just the kinds — labels and identity are part
    // of the contract the component binds on.
    expect(accountMenuRows(state)).toEqual([
        { kind: 'identity', displayName: 'Marcus Andersson', username: 'marcus' },
        { kind: 'profile', label: 'Profile' },
        { kind: 'admin', label: 'Admin' },
        { kind: 'signout', label: 'Sign out' },
    ]);
});

test('roles fetch failed (or non-admin): fails closed — no Admin row', () => {
    // A failed /me/roles leaves the grant list empty, which is `isSuperAdmin:
    // false` here. Hiding is UX; the server gates /api/admin/* regardless.
    expect(accountMenuKinds({ ...signedIn, isSuperAdmin: false })).not.toContain('admin');
});

test('identity falls back to the username while the profile is still loading', () => {
    const rows = accountMenuRows({ signedIn: true, displayName: null, username: 'marcus', isSuperAdmin: false });
    expect(rows[0]).toEqual({ kind: 'identity', displayName: 'marcus', username: 'marcus' });
});

test('initials: first + last word, single word, username fallback, placeholder', () => {
    expect(accountInitials('Marcus Andersson')).toBe('MA');
    expect(accountInitials('  ada   byron   lovelace ')).toBe('AL');
    expect(accountInitials('Marcus')).toBe('M');
    expect(accountInitials('', 'marcus')).toBe('M');
    expect(accountInitials(null, null)).toBe('•');
    expect(accountInitials('Åsa Öberg')).toBe('ÅÖ');
    // A whitespace-only display name is not a name — fall through to the
    // username, exactly as an empty one does.
    expect(accountInitials('   ', 'marcus')).toBe('M');
    expect(accountInitials('   ', null)).toBe('•');
});
