import { beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';

// A round the server does not have is the state a delete is asking for, so a
// 404 must finish the local half rather than refuse. Without this, a row left
// behind by a deleted round — or, on iOS, by a build that once pointed at a
// different backend — could never leave the landing: it 404'd on open AND on
// delete, which reads to the user as "purely local, undeletable".
let removeError: unknown = null;
const calls: { token: string }[] = [];

const apiMock = {
    friendlyRounds: {
        remove: async (input: { token: string }) => {
            calls.push(input);
            if (removeError) throw removeError;
            return {};
        },
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { LandingService } = await import('../../src/landing/landing.service');

beforeEach(() => {
    removeError = null;
    calls.length = 0;
});

test('a 404 delete still clears the row — the round is already gone', async () => {
    const svc = new LandingService();
    svc.deviceRounds.set([
        {
            token: 'ghost',
            courseName: 'Linköpings GK',
            status: 'active',
            completedAt: null,
            lastSeenAt: '2026-08-01T10:00:00.000Z',
        },
    ]);
    removeError = new ApiError(404, 'Round not found');

    expect(await svc.remove('ghost', 'r1')).toBe(true);
    expect(svc.deviceRounds.get().some((r) => r.token === 'ghost')).toBe(false);
});

test('any other failure leaves the row alone', async () => {
    const svc = new LandingService();
    svc.deviceRounds.set([
        {
            token: 'kept',
            courseName: 'Linköpings GK',
            status: 'active',
            completedAt: null,
            lastSeenAt: '2026-08-01T10:00:00.000Z',
        },
    ]);
    removeError = new ApiError(500, 'boom');

    expect(await svc.remove('kept', 'r1')).toBe(false);
    expect(svc.deviceRounds.get().some((r) => r.token === 'kept')).toBe(true);
});
