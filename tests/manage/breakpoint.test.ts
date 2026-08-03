import '@basics/core/happy-dom';
import { afterEach, expect, test } from 'bun:test';
import {
    SHELL_MEDIA_NARROW,
    SHELL_MEDIA_WIDE,
    SHELL_WIDE_MIN,
    TABLE_MEDIA_NARROW,
    TABLE_MEDIA_WIDE,
    TABLE_WIDE_MIN,
    mediaSignal,
} from '../../manage/breakpoint';

// The two width questions, and the signal the table collapses on.

test('the table stacks before the shell collapses, because the sidebar spends width', () => {
    // At viewport 900 the sidebar appears and the content column DROPS to
    // ~604px; the table breakpoint has to sit below that discontinuity or a
    // table would stack and unstack on the way past it.
    expect(TABLE_WIDE_MIN).toBeLessThan(SHELL_WIDE_MIN);
    // The floor it protects: viewport − page padding at the table breakpoint is
    // no worse than the content column at the shell breakpoint. The sidebar era
    // pays the WIDER padding (--manage-page-pad-wide, 32 a side) as well as the
    // 232px sidebar, which is what makes the drop 604 and not 620.
    const contentAtTableMin = TABLE_WIDE_MIN - 2 * 16;
    const contentAtShellMin = SHELL_WIDE_MIN - 232 - 2 * 32;
    expect(contentAtShellMin).toBe(604);
    expect(contentAtTableMin).toBeGreaterThanOrEqual(contentAtShellMin);
});

test('the wide and narrow arms of each question meet without a gap or an overlap', () => {
    expect(SHELL_MEDIA_WIDE).toBe(`(min-width: ${SHELL_WIDE_MIN}px)`);
    expect(SHELL_MEDIA_NARROW).toBe(`(max-width: ${SHELL_WIDE_MIN - 0.02}px)`);
    expect(TABLE_MEDIA_WIDE).toBe(`(min-width: ${TABLE_WIDE_MIN}px)`);
    expect(TABLE_MEDIA_NARROW).toBe(`(max-width: ${TABLE_WIDE_MIN - 0.02}px)`);
});

const realMatchMedia = globalThis.matchMedia;
afterEach(() => {
    globalThis.matchMedia = realMatchMedia;
});

test('mediaSignal starts at the current match and follows changes until disposed', () => {
    let handler: ((e: { matches: boolean }) => void) | null = null;
    let removed = false;
    globalThis.matchMedia = ((query: string) => ({
        media: query,
        matches: true,
        addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => { handler = fn; },
        removeEventListener: () => { removed = true; },
    })) as unknown as typeof globalThis.matchMedia;

    const media = mediaSignal(TABLE_MEDIA_NARROW);
    expect(media.value.get()).toBe(true);

    handler!({ matches: false });
    expect(media.value.get()).toBe(false);

    media.dispose();
    expect(removed).toBe(true);
});

test('without matchMedia the answer is "wide" — desktop-first, never a broken layout', () => {
    // A non-DOM realm (a server-side render, a unit test) must not throw.
    (globalThis as { matchMedia?: unknown }).matchMedia = undefined;

    const media = mediaSignal(TABLE_MEDIA_NARROW);
    expect(media.value.get()).toBe(false);
    expect(() => media.dispose()).not.toThrow();
});
