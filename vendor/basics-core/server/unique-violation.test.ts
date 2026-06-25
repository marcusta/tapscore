import { test, expect } from 'bun:test';
import { Hono } from 'hono';
import { mount } from './mount';
import { UniqueViolationError, parseUniqueViolation } from './unique-violation';

test('parseUniqueViolation extracts table + column from bun-sqlite message', () => {
    const uv = parseUniqueViolation(new Error('UNIQUE constraint failed: clubs.name'));
    expect(uv).not.toBeNull();
    expect(uv!.table).toBe('clubs');
    expect(uv!.column).toBe('name');
});

test('parseUniqueViolation handles composite keys (returns first column)', () => {
    const uv = parseUniqueViolation(
        new Error('UNIQUE constraint failed: score_events.round_id, score_events.client_event_id'),
    );
    expect(uv).not.toBeNull();
    expect(uv!.table).toBe('score_events');
    expect(uv!.column).toBe('round_id');
});

test('parseUniqueViolation returns null for unrelated errors', () => {
    expect(parseUniqueViolation(new Error('something else'))).toBeNull();
    expect(parseUniqueViolation('not an error')).toBeNull();
});

test('mount translates an explicit UniqueViolationError throw to 409', async () => {
    const app = new Hono();
    mount(app, '/api', {
        explode: {
            method: 'POST',
            path: '/boom',
            fn: () => {
                throw new UniqueViolationError('clubs', 'name');
            },
        },
    });
    const res = await app.fetch(
        new Request('http://localhost/api/boom', { method: 'POST' }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Unique constraint');
    expect(body.details[0]).toEqual({
        path: '/name',
        message: 'clubs.name must be unique',
    });
});

test('mount auto-translates a raw "UNIQUE constraint failed" Error to 409', async () => {
    const app = new Hono();
    mount(app, '/api', {
        explode: {
            method: 'POST',
            path: '/boom',
            fn: () => {
                throw new Error('UNIQUE constraint failed: clubs.name');
            },
        },
    });
    const res = await app.fetch(
        new Request('http://localhost/api/boom', { method: 'POST' }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Unique constraint');
});
