// The round photo-or-initials badge, as markup + bindings + a CSS recipe.
//
// Not a Component: these badges live inside `$each` rows (friends, search
// results), where a child component per row is a mount/destroy cycle per
// keystroke of a search. What every surface actually needs is three things
// that must agree — the two elements, the two bindings that toggle between
// them, and the circle's styling — so those are what this module exports.
//
// The CSS half follows the framework's recipe convention (ADR-005): it is
// interpolated FIRST in a block, app overrides after.

import { avatarInitials, avatarSrc, type AvatarSubject } from '../avatar';

/**
 * A 1×1 transparent GIF, parked in `img.src` when there is no photo.
 *
 * Necessary, not decorative: assigning `img.src = ''` makes the browser
 * resolve the empty string against the document URL and fetch the PAGE as an
 * image. On a friends list that is one wasted request per photo-less row.
 */
const BLANK_PIXEL =
    'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export interface AvatarBadgeSubject extends AvatarSubject {
    displayName?: string | null;
    username?: string | null;
}

/**
 * The badge's markup, for interpolation into a `template()` string.
 *
 * `alt` is deliberately empty: the badge always sits beside the player's name
 * in the same row, so a non-empty alt would have a screen reader say the name
 * twice. The photo is decoration on top of text that is already there.
 */
export function avatarBadgeMarkup(cls = 'avatar'): string {
    // Only the WRAPPER takes the caller's class. The two inner elements are
    // always `avatar__photo` / `avatar__initials`, because the bindings below
    // rewrite `className` on both to toggle them — a caller-prefixed inner
    // class would survive exactly until the first binding run.
    return `<span class="${cls}">
            <img bind="avatarPhoto" class="avatar__photo" alt="" />
            <span bind="avatarInitials" class="avatar__initials"></span>
        </span>`;
}

/**
 * Bindings for the two elements `avatarBadgeMarkup` produced. Spread into a
 * `wireEl` map:
 *
 *     this.wireEl(rowTpl, { ...avatarBadgeBindings(() => row), name: ... })
 *
 * The subject is a GETTER, not a value: inside `$each` the row object closed
 * over goes stale the moment the list re-renders, and a photo that keeps
 * pointing at the previous occupant of a row is the one failure mode this
 * whole component has.
 */
export function avatarBadgeBindings(subject: () => AvatarBadgeSubject) {
    const src = () => avatarSrc(subject());
    return {
        avatarPhoto: {
            src: () => src() ?? BLANK_PIXEL,
            className: () => (src() ? 'avatar__photo' : 'avatar__photo hidden'),
        },
        avatarInitials: {
            textContent: () => {
                const s = subject();
                return avatarInitials(s.displayName, s.username);
            },
            // Initials are not a placeholder UNDER the photo — they are hidden
            // outright when there is one. A half-second of letters showing
            // through a loading image reads as a rendering fault.
            className: () => (src() ? 'avatar__initials hidden' : 'avatar__initials'),
        },
    };
}

/**
 * The circle. `size` is the diameter in px; the photo fills it and is cropped
 * to it by `object-fit: cover`, so a source that is not perfectly square (a
 * server-side row from before the clients started cropping, say) still renders
 * as a circle rather than a squashed oval.
 */
export function avatarBadgeCss(size: number, fontSize = '0.85rem'): string {
    return `
        position: relative;
        display: grid; place-items: center;
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        font-weight: 700; font-size: ${fontSize};

        & .avatar__photo {
            position: absolute; inset: 0;
            width: 100%; height: 100%;
            object-fit: cover;
            &.hidden { display: none; }
        }
        & .avatar__initials {
            &.hidden { display: none; }
        }
    `;
}
