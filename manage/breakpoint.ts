// The two width questions Manage asks, named once so no screen re-decides
// them in an ad-hoc `@media` (spec §2.5 — "one breakpoint, not three", per
// question).
//
// They are SEPARATE questions and get separate names even while they hold the
// same number today:
//
//  - the SHELL question is "does the sidebar fit beside the content, or does
//    navigation have to become a drawer";
//  - the TABLE question is "does this row fit as columns, or does it have to
//    stack into a card".
//
// A table inside the content column has less room than the viewport suggests,
// and a future wide table may want to stack before the shell collapses. Naming
// them apart means that change is a one-line edit here rather than a hunt
// through every screen for which 900 meant what.
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
 * sidebar is a fixed 232px (`--manage-sidebar-width`) plus the page padding on
 * both sides of the content, so at 900 the content column still gets
 * 900 − 232 − 2×24 ≈ 620px, which is a readable five-to-six-column table. At
 * 640 the same arithmetic leaves ~360px — the sidebar would be eating a third
 * of the viewport to show two words, and every table would be horizontally
 * scrolling behind it.
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
 * Table stacking. Re-exports the shell number for now — T3 owns the shared
 * responsive table and may move it independently; when it does, only these
 * three lines change.
 */
export const TABLE_WIDE_MIN = SHELL_WIDE_MIN;

/** Real columns. */
export const TABLE_MEDIA_WIDE = `(min-width: ${TABLE_WIDE_MIN}px)`;

/** Rows stack into cards. */
export const TABLE_MEDIA_NARROW = `(max-width: ${TABLE_WIDE_MIN - 0.02}px)`;
