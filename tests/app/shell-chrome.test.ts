import { expect, test } from 'bun:test';
import { showsAccountMenu, showsDock, showsPlayPill } from '../../src/app/shell-chrome';

// The shell's chrome rule. The account menu is hosted by the app shell, NOT by
// the landing, so it has to be present on every main screen — that is the whole
// point of moving it up — and absent exactly where the dock is.

test('the account menu is on every main screen, signed in or out', () => {
    for (const route of ['/', '/friends', '/competitions', '/competition', '/profile', '/history']) {
        expect(showsAccountMenu(route)).toBe(true);
    }
});

test('the account menu is hidden on /login and /round', () => {
    expect(showsAccountMenu('/login')).toBe(false);
    expect(showsAccountMenu('/round')).toBe(false);
});

test('an unknown route still gets chrome (it falls back to the landing)', () => {
    expect(showsAccountMenu('/nope')).toBe(true);
});

test('the Play pill renders signed OUT too — anonymous play is core', () => {
    expect(showsPlayPill('/')).toBe(true);
    expect(showsPlayPill('/friends')).toBe(true);
});

test('the Play pill is absent where the chrome is, and on the create screen itself', () => {
    expect(showsPlayPill('/login')).toBe(false);
    expect(showsPlayPill('/round')).toBe(false);
    expect(showsPlayPill('/create')).toBe(false);
});

test('the dock follows the same routes but additionally needs a session', () => {
    expect(showsDock('/', true)).toBe(true);
    expect(showsDock('/friends', true)).toBe(true);
    expect(showsDock('/', false)).toBe(false);
    expect(showsDock('/login', true)).toBe(false);
    expect(showsDock('/round', true)).toBe(false);
});
