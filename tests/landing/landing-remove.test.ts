import { beforeEach, expect, mock, test } from 'bun:test';
import { ApiError } from '@basics/core/client/api-error';
import type { DashboardRoundEntry } from '../../src/api/dashboard.gen';

// A round the server does not have is the state a delete is asking for, so a
// 404 must finish the local half rather than refuse. Without this, a row left
// behind by a deleted round — or, on iOS, by a build that once pointed at a
// different backend — could never leave the landing: it 404'd on open AND on
// delete, which reads to the user as "purely local, undeletable".
let removeError: unknown = null;
let leaveResult: { ok: true; round: unknown } | { ok: false; diagnostics: { message: string }[] } = {
    ok: true,
    round: {},
};
const calls: { token: string }[] = [];

const apiMock = {
    friendlyRounds: {
        remove: async (input: { token: string }) => {
            calls.push(input);
            if (removeError) throw removeError;
            return {};
        },
        leave: async (_input: { token: string }) => leaveResult,
    },
};

mock.module('../../src/api', () => ({ api: apiMock }));

const { LandingService } = await import('../../src/landing/landing.service');

beforeEach(() => {
    removeError = null;
    leaveResult = { ok: true, round: {} };
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

test('leaving removes only the caller\'s dashboard row', async () => {
    const svc = new LandingService();
    const produced: DashboardRoundEntry[] = [
        { round: { id: 'r1' } as never, ballIds: [], slots: [], shareToken: 'tok-1' },
    ];
    svc.mine.set({ produced, created: [] });

    expect(await svc.leave('tok-1', 'r1')).toEqual({ ok: true });
    expect(svc.mine.get()?.produced).toEqual([]);
    expect(svc.mine.get()?.created).toEqual([]);
});

test('a leave refusal keeps the row and returns the server explanation', async () => {
    const svc = new LandingService();
    const produced: DashboardRoundEntry[] = [
        { round: { id: 'r1' } as never, ballIds: [], slots: [], shareToken: 'tok-1' },
    ];
    svc.mine.set({ produced, created: [] });
    leaveResult = { ok: false, diagnostics: [{ message: 'This team scores together.' }] };

    expect(await svc.leave('tok-1', 'r1')).toEqual({
        ok: false,
        message: 'This team scores together.',
    });
    expect(svc.mine.get()?.produced).toEqual(produced);
});
