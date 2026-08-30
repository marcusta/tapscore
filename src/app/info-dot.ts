// The circled ⓘ trigger — markup + styles for the small round "i" that opens a
// "where did this come from?" explainer.
//
// It was drawn twice before this module existed (the per-ball handicap
// derivation dialog in score entry, and the preferred-tee explainer in the
// profile) and the two had already drifted: one a bordered serif circle, the
// other the literal text `(i)`. The glyph is the recognisable part — a reader
// who has met one has to recognise the other — so it lives in one place.
//
// This is the GLYPH only. What opens is the host's business: score entry opens
// a bottom sheet, the profile expands a line of prose. `docs/design-guidelines.md`
// §4 still stands — this is an aside to a label, never a control the owner
// reads as an action. Those stay worded.

import { t } from '../theme';

/**
 * The trigger's markup, for interpolation into a `template()` string.
 *
 * `label` becomes the accessible name; the glyph itself is aria-hidden, since
 * "i" read aloud is noise. `extra` appends to the class list for hosts that
 * need to toggle visibility (`hidden`).
 *
 * No `aria-expanded` here: what the two hosts open is not the same kind of
 * thing (a modal sheet vs. an inline paragraph), so the state attribute is the
 * host's to bind.
 */
export function infoDotMarkup<N extends string>(bind: N, label: string, extra = ''): `${string}bind="${N}"${string}` {
    const cls = extra ? `info-dot ${extra}` : 'info-dot';
    return `<button bind="${bind}" class="${cls}" type="button" aria-label="${label}"><span aria-hidden="true">i</span></button>`;
}

/**
 * Styles for the trigger. Appended to a host's `static styles`.
 *
 * Deliberately NOT the `btn()` recipe: btn() emits sizing, padding and a border
 * of its own, and this is a fixed 22px circle. Serif italic because that is what
 * an information mark looks like everywhere else it appears.
 */
export const INFO_DOT_CSS = `
        .info-dot {
            flex: none;
            appearance: none;
            width: 22px; height: 22px; padding: 0;
            display: inline-flex; align-items: center; justify-content: center;
            background: none; cursor: pointer;
            border: 1px solid ${t('border')}; border-radius: ${t('radius-pill')};
            color: ${t('text-muted')};
            font-size: 0.8rem; font-style: italic; font-family: serif;
            line-height: 1;
            &:hover { color: ${t('text')}; }
            &.hidden { display: none; }
        }`;
