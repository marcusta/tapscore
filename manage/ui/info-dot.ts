// The circled ⓘ trigger for Manage — markup + styles for the small round "i"
// that opens a "where does this number come from?" explainer.
//
// The player app has the same glyph at `src/app/info-dot.ts`, and this is a
// deliberate second copy rather than an import: that module interpolates
// `src/theme.ts`, which calls `createTokens` at module scope, so importing it
// here would install the PLAYER theme's tokens into the manage bundle as a side
// effect of asking for a 22px circle. The shape is eleven declarations; the
// theme collision would be a real bug.
//
// The recognisable part is the glyph, so keep the two visually identical: a
// bordered circle with a serif italic "i", never the literal text "(i)".
//
// This is the TRIGGER only. What opens is the host's business — Manage's first
// use (the tee-role matrix) expands an inline panel under the heading, because
// a management screen has room and a bottom sheet would be a phone idiom on a
// desk. `docs/design-guidelines.md` §4 still stands: this is an aside to a
// label, never a control the owner reads as an action. Those stay worded.

import { t } from '../theme';

/**
 * The trigger's markup, for interpolation into a `template()` string.
 *
 * `label` becomes the accessible name; the glyph is aria-hidden, since "i" read
 * aloud is noise. Unlike the player's copy this one does bind `aria-expanded` —
 * every Manage use so far opens an inline panel, which is exactly the case the
 * attribute describes — but the host still owns the value.
 *
 * The label is escaped. Every caller today passes a literal, but this returns a
 * STRING that a `template()` parses as HTML, so an apostrophe or an `&` in a
 * label would break the attribute and anything data-derived would be an
 * injection. Escaping once here is cheaper than a rule callers must remember.
 */
export function infoDotMarkup<N extends string>(bind: N, label: string): `${string}bind="${N}"${string}` {
    return `<button bind="${bind}" class="minfo-dot" type="button" aria-expanded="false" aria-label="${escapeAttribute(label)}"><span aria-hidden="true">i</span></button>`;
}

function escapeAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Styles for the trigger. Appended to a host's `static styles`.
 *
 * Deliberately NOT the `btn()` recipe: `btn()` emits its own sizing, padding and
 * border, and this is a fixed circle. It also deliberately does NOT take the
 * 44px `--manage-touch-target` floor that every other Manage control takes —
 * a touch target that size beside a heading would read as the section's primary
 * action, which is precisely what an aside must not do. The tap area is widened
 * with a transparent inset instead (`outline`-free `::after`), so the finger
 * gets 44px while the ink stays 22.
 */
export const INFO_DOT_CSS = `
        .minfo-dot {
            position: relative;
            flex: none;
            appearance: none;
            width: 22px;
            height: 22px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: none;
            cursor: pointer;
            border: 1px solid ${t('border')};
            border-radius: ${t('radius-pill')};
            color: ${t('text-muted')};
            font-size: 0.8rem;
            font-style: italic;
            font-family: serif;
            line-height: 1;

            &::after {
                content: '';
                position: absolute;
                inset: -11px;
            }

            &:hover { color: ${t('text')}; }

            &:focus-visible {
                outline: 2px solid ${t('accent-strong')};
                outline-offset: 2px;
            }
        }`;
