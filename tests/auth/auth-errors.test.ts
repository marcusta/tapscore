import { test, expect } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import { authErrorMessage } from '../../src/auth/auth-errors';

// The point of this module is that a USER error never reads as a server fault,
// so most of these assert the negative as well as the positive.

const blames = (msg: string) => /on our end|Cannot reach|took too long/.test(msg);

test('a wrong password reads as a credential problem, not a server error', () => {
    const msg = authErrorMessage(new ApiError(401, 'Unauthorized'), 'login');
    expect(msg).toBe('Wrong username or password.');
    expect(blames(msg)).toBe(false);
    // Must not leak which half was wrong (account enumeration).
    expect(msg.toLowerCase()).not.toContain('no such user');
});

test('a rate-limited sign-in says so instead of "Server error"', () => {
    const msg = authErrorMessage(new ApiError(429, 'Too many requests'), 'login');
    expect(msg).toContain('Too many sign-in attempts');
    expect(blames(msg)).toBe(false);
});

test('a taken username reads as a username problem on register only', () => {
    expect(authErrorMessage(new ApiError(409, 'Unique constraint'), 'register')).toBe(
        'That username is taken. Pick another one.',
    );
    // Same status on sign-in has no user-fixable meaning — falls back.
    expect(authErrorMessage(new ApiError(409, 'Unique constraint'), 'login')).toContain(
        'on our end',
    );
});

test('validation 400s name the offending field instead of "Validation failed"', () => {
    const err = (path: string) =>
        new ApiError(400, 'Validation failed', [{ path, message: 'x' }]);

    expect(authErrorMessage(err('/password'), 'register')).toBe(
        'Password must be at least 8 characters.',
    );
    expect(authErrorMessage(err('/username'), 'register')).toBe('Enter your username.');
    expect(authErrorMessage(err('/displayName'), 'register')).toBe('Enter a display name.');
    expect(authErrorMessage(err('/handicapIndex'), 'register')).toContain('must be a number');
    expect(authErrorMessage(err('/password'), 'login')).toBe('Enter your password.');

    // No details at all still beats echoing "Validation failed".
    const bare = authErrorMessage(new ApiError(400, 'Validation failed'), 'register');
    expect(bare).toBe('Check the details above and try again.');
    expect(bare).not.toContain('Validation failed');
});

test('an unknown home club points at the club field', () => {
    expect(authErrorMessage(new ApiError(404, 'club not found'), 'register')).toContain(
        'club is no longer available',
    );
});

test('genuine server and transport faults DO blame the server', () => {
    expect(authErrorMessage(new ApiError(500, 'Internal server error'), 'login')).toContain(
        'on our end',
    );
    expect(authErrorMessage(new Error('Request timeout'), 'login')).toContain('took too long');
    expect(authErrorMessage(new Error('Failed to fetch'), 'login')).toContain('Cannot reach');
    expect(authErrorMessage('not an error at all', 'login')).toContain('on our end');
});
