import { createTokens } from '@basics/core/client/core';
import { resolveTapscoreTokens } from '../src/theme-tokens';

// Tapscore Manage's theme entry. The palette is the SHARED one — same brass
// `accent`, same fairway-green action tokens, same terracotta `danger`, same
// radius and typography as the player app (docs/proposals/manage-ui.md §2.4).
// Manage is a different audience and a different layout language, not a
// different brand, so nothing below repaints anything: the additions are
// vocabulary the player app has no use for.
//
// Importing this module installs the theme (`createTokens` injects the
// `<style>`); `main.ts` imports it for the side effect, then `di.get(Theme)`
// flips `data-theme` on <html> from prefers-color-scheme + localStorage, which
// is the same scheme-switching mechanism the player app uses — and the same
// storage key, so in production (one origin) a player who chose dark lands in
// dark here too. Dev servers sit on different ports, so there each app keeps
// its own choice.

/**
 * Management-only additions, merged into both schemes.
 *
 * Two rules hold this table together.
 *
 * **Every value resolves through an existing token, never a literal** — a
 * colour through the shared palette, a spacing through the framework's 4-based
 * `--space-*` scale. So this is a layer of MEANING on top of the scale, not a
 * second copy of it (the framework already defines `--space-1..8`; re-stating
 * `4px`/`8px`/… here would be exactly the scattered-literal duplication the
 * shared palette exists to prevent). The two exceptions are the layout
 * measurements at the end, which are shapes of this app's shell and have no
 * scale to sit on.
 *
 * **Theme-invariant** — because the colours are references, light and dark
 * follow from the shared palette rather than from a second table. That is the
 * shape the framework's own `controlTokens` map uses.
 *
 * The `manage-` prefix is deliberate: it marks at every call site, and in
 * devtools, which tokens are the Tapscore brand contract (shared, unprefixed)
 * and which are this app's local vocabulary. It also keeps the names out of
 * the way of any token the framework may add later.
 */
const manageTokens: Record<string, string> = {
    // ─── Density ───
    // Manage is desktop-first and list-heavy: whole catalogs on screen at
    // once, where the player app shows one card at a time. The density lives
    // in these four spacings — never in smaller hit areas. `touch-target` is
    // the floor for anything tappable and deliberately matches the player
    // app's controls: a course admin fixing a tee value from a phone in the
    // sim hall is a real usage pattern, not an edge case (spec §2.5).
    'manage-page-pad': 'var(--space-4)',
    'manage-page-pad-wide': 'var(--space-6)',
    'manage-stack-gap': 'var(--space-3)',
    'manage-section-gap': 'var(--space-5)',
    'manage-touch-target': '44px',

    // ─── Tables ───
    // The workhorse surface (spec §2.5): real columns above the breakpoint,
    // stacked cards below it, one component for both (T3). Naming the parts
    // here is what stops each screen re-deciding what a header row looks like.
    // The spacings match what `@basics/core/client/ui/table.ts` already
    // spends on the same parts, so a Manage table agrees with a framework one
    // whichever way T3 builds it; the header fill and the hover row are the
    // additions that make it read as a management grid.
    'manage-table-bg': 'var(--surface)',
    'manage-table-radius': 'var(--radius)',
    'manage-table-border': 'var(--border)',
    'manage-table-header-bg': 'var(--surface-sunken)',
    'manage-table-header-fg': 'var(--text-muted)',
    'manage-table-header-border': 'var(--border-strong)',
    'manage-table-header-pad-y': 'var(--space-2)',
    'manage-table-header-pad-x': 'var(--space-3)',
    'manage-table-cell-pad-y': 'var(--space-3)',
    'manage-table-cell-pad-x': 'var(--space-3)',
    'manage-table-row-border': 'var(--border)',
    'manage-table-row-hover-bg': 'var(--hover-bg)',
    // Narrow mode: rows become cards, and the gap between them replaces the
    // rules that separated them.
    'manage-table-card-gap': 'var(--space-2)',

    // ─── Shell measurements ───
    // The two figures the layout is built from. Literals because they are
    // shapes, not steps on a scale: the sidebar is as wide as the longest
    // section name needs, and the content column stops where a table of a
    // dozen columns stops being readable.
    'manage-sidebar-width': '232px',
    'manage-content-max': '1120px',
};

/**
 * The complete token maps for Manage — the shared Tapscore palette plus the
 * additions above, merged over the framework's neutral base and expanded with
 * the derived `--field-*` / `--btn-*` control tokens.
 */
export const resolvedLight = resolveTapscoreTokens('light', manageTokens);
export const resolvedDark = resolveTapscoreTokens('dark', manageTokens);

export const t = createTokens(resolvedLight, resolvedDark);
