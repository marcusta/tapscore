import { test, expect } from 'bun:test';
import { toIsoUtc } from './time';

test('SQLite space format → ISO Z with milliseconds', () => {
    expect(toIsoUtc('2026-04-20 08:59:04')).toBe('2026-04-20T08:59:04.000Z');
});

test('SQLite format with fractional seconds → preserved', () => {
    expect(toIsoUtc('2026-04-20 08:59:04.123')).toBe('2026-04-20T08:59:04.123Z');
});

test('already ISO with Z passes through', () => {
    expect(toIsoUtc('2026-04-20T08:59:04.000Z')).toBe('2026-04-20T08:59:04.000Z');
});

test('already ISO with offset passes through', () => {
    expect(toIsoUtc('2026-04-20T08:59:04+02:00')).toBe('2026-04-20T08:59:04+02:00');
});

test('Date.parse succeeds on the normalised output', () => {
    const normalised = toIsoUtc('2026-04-20 08:59:04');
    expect(Number.isNaN(Date.parse(normalised))).toBe(false);
});

test('unrecognised format is left alone (caller decides)', () => {
    expect(toIsoUtc('some junk')).toBe('some junk');
});
