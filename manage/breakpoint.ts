import { Signal } from '@basics/core/client/core';

// The two width questions Manage asks, named once so no screen re-decides
// them in an ad-hoc `@media` (spec §2.5 — "one breakpoint, not three", per
// question).
//
// They are SEPARATE questions with separate answers:
//
//  - the SHELL question is "does the sidebar fit beside the content, or does
//    navigation have to become a drawer" — 900;
//  - the TABLE question is "does this row fit as columns, or does it have to
//    stack into a card" — 660.
//
// They differ because the sidebar SPENDS content width: a table has less room
// at viewport 900 (sidebar era) than at 899 (drawer era). The derivation is
// under `TABLE_WIDE_MIN`. Naming them apart is what lets either move without a
// hunt through every screen for which 900 meant what.
//
// Each constant ships as BOTH a number and a prebuilt media-query string: the
// number is what a `matchMedia` or a layout calculation needs, the string is
// what a `static styles` block interpolates. A screen that builds its own
// `(min-width: ${N}px)` from the number is doing it wrong — the off-by-one
// between the wide and narrow arms lives here, once.

/**
 * Shell collapse. Above this the sidebar is persistent; below it, top bar +
 * drawer.
 *
 * 900px, deliberately — 640 was the tempting number and it is too narrow. The
 * sidebar is a fixed 232px (`--manage-sidebar-width`), and the sidebar era also
 * spends the WIDER page padding (`--manage-page-pad-wide`, 32px a side, not the
 * drawer era's 16), so at 900 the content column still gets
 * 900 − 232 − 2×32 = 604px — measured — which is a readable five-to-six-column
 * table. At 640 the same arithmetic leaves 344px: the sidebar would be eating a
 * third of the viewport to show two words, and every table would be
 * horizontally scrolling behind it.
 *
 * It also falls in a quiet gap between real devices: phones (≤ 430) and iPad
 * portrait (768) get the drawer, iPad landscape (1024) and every laptop get
 * the sidebar. No common device sits on the line.
 */
export const SHELL_WIDE_MIN = 900;

/** Sidebar layout applies. */
export const SHELL_MEDIA_WIDE = `(min-width: ${SHELL_WIDE_MIN}px)`;

/**
 * Top bar + drawer layout applies. `.02` rather than `- 1` so a fractional
 * viewport width (browser zoom, some Android devices) cannot fall through both
 * arms and leave the shell with no navigation at all.
 */
export const SHELL_MEDIA_NARROW = `(max-width: ${SHELL_WIDE_MIN - 0.02}px)`;

/**
 * Table stacking — "does a row fit as columns, or does it have to become a
 * card". 660px, and deliberately NOT the shell's 900.
 *
 * The figure that decides this is the width of the CONTENT COLUMN, not of the
 * viewport, and the two do not move together: the sidebar appears at 900, so
 * the content column JUMPS DOWN there. At viewport 899 a table has
 * 899 − 2×16 = 867px; at 900 it has 900 − 232 − 2×32 = 604px, the sidebar and
 * the wider padding arriving together. Read as one curve — all four figures
 * measured, not derived — the content column is:
 *
 *   viewport 660 → 628px   (drawer era: viewport − 2×16 page padding)
 *   viewport 899 → 867px
 *   viewport 900 → 604px   (sidebar era: − 232 sidebar − 2×32 page padding)
 *   viewport 1200 → 904px
 *
 * So 604px is the floor across everything at or above 660 — the same
 * "readable five-to-six-column table" figure `SHELL_WIDE_MIN` was chosen to
 * protect. Below 660 no layout can supply it, and that is exactly where a row
 * has to stack. Anything higher would stack tables on an iPad in portrait
 * (768 → 736px of column) for no reason; anything lower would keep columns
 * where they cannot fit.
 *
 * A table with genuinely many columns — a hole grid — does not stack at all;
 * it scrolls inside its own box (`scrollBox()` in `ui/recipes.ts`), which is a
 * different answer to a different question.
 */
export const TABLE_WIDE_MIN = 660;

/** Real columns. Also the width at which form fields may pair up (§2.5). */
export const TABLE_MEDIA_WIDE = `(min-width: ${TABLE_WIDE_MIN}px)`;

/** Rows stack into cards. `.02` for the same reason as the shell arms above. */
export const TABLE_MEDIA_NARROW = `(max-width: ${TABLE_WIDE_MIN - 0.02}px)`;

/**
 * A media query as a signal, so a component can render DIFFERENT DOM at the
 * two widths rather than only different CSS.
 *
 * The responsive table needs this because "are we narrow" is not always a
 * question about the VIEWPORT. The layout it drives is a `data-layout`
 * attribute, so a table sitting inside an already-narrow panel — a drawer, a
 * split pane, a half-width column — can be handed its own `narrow` signal and
 * stack while the viewport is wide, which a plain `@media` cannot express. It
 * also makes the collapse testable without a layout engine: stub
 * `globalThis.matchMedia`, or pass the signal directly.
 *
 * Returns the signal and its disposer; call the disposer from the owner's
 * `track()`. Where `matchMedia` does not exist (a non-DOM test realm), the
 * signal stays `false` — wide, i.e. the desktop-first default.
 */
export function mediaSignal(query: string): { value: Signal<boolean>; dispose: () => void } {
    const value = new Signal(false);
    const mm = typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia(query) : null;
    if (!mm) return { value, dispose: () => {} };

    value.set(mm.matches);
    const onChange = (e: MediaQueryListEvent): void => value.set(e.matches);
    mm.addEventListener('change', onChange);
    return { value, dispose: () => mm.removeEventListener('change', onChange) };
}
