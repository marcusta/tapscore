// Profile photos, client side — the two pure questions every surface that
// draws a person asks, in one module so the answers cannot drift.
//
// The server never hands out an image URL. It hands out `avatarVersion`: a
// content hash, or null when the player has no photo (migration 050). That is
// deliberate — an absolute URL stored server-side would have had to know the
// deploy's base path ('/tapscore/api' in production, '/api' in dev) and the
// native client's configurable host, neither of which the server is in a
// position to state. So the client composes the URL from its own API base,
// which it already knows, and the version rides along as the cache key.

import { API_BASE } from './api-base';

/** Anything with an id and a photo version — every player-carrying shape. */
export interface AvatarSubject {
    id: string;
    avatarVersion?: string | null;
}

/**
 * Where this player's photo lives, or null when they have none.
 *
 * Null is the whole point: it is answered from data already in hand, so a
 * screenful of friends decides face-or-initials without a single request. Never
 * build this URL from an id alone — a request for a player with no photo is a
 * guaranteed 404, and doing it per row turns an empty friends list into a
 * burst of them.
 *
 * `?v=` is what makes a replaced photo a new URL. The server answers a
 * matching one `immutable` for a year, so the browser cache is allowed to be
 * as aggressive as it likes without any risk of showing yesterday's face.
 */
export function avatarSrc(subject: AvatarSubject): string | null {
    if (!subject.avatarVersion) return null;
    return `${API_BASE}/players/${encodeURIComponent(subject.id)}/avatar?v=${subject.avatarVersion}`;
}

/**
 * Initials for the no-photo case: first letter of the first and last word of
 * the display name, upper-cased. Falls back to the username's first letter,
 * then to a neutral glyph so a circle is never empty mid-load.
 *
 * The fallback is initials rather than a generic silhouette on purpose — a
 * roster of identical grey heads tells you less than a roster of letters, and
 * "no photo" is the majority state, not an error state.
 */
export function avatarInitials(displayName?: string | null, username?: string | null): string {
    const words = (displayName ?? '').trim().split(/\s+/).filter((w) => w.length > 0);
    if (words.length >= 2) {
        return (first(words[0]!) + first(words[words.length - 1]!)).toUpperCase();
    }
    if (words.length === 1) return first(words[0]!).toUpperCase();
    const user = (username ?? '').trim();
    if (user.length > 0) return first(user).toUpperCase();
    return '•';
}

/** First CODE POINT, so an emoji or astral-plane name doesn't split in half. */
function first(word: string): string {
    return [...word][0] ?? '';
}

// --- Upload preparation ---

/** The square a photo is downscaled to before upload. */
export const AVATAR_EDGE_PX = 512;

/** Refused by the server too (2 MiB); checked here to fail before the request. */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export interface CropRect {
    sx: number;
    sy: number;
    size: number;
}

/**
 * The centred square to take out of a `width`×`height` photo.
 *
 * A centre crop rather than an interactive cropper: a profile photo is a face,
 * a face is in the middle of the frame the overwhelming majority of the time,
 * and a drag-to-position UI is a whole screen to build, theme and test on both
 * clients for the minority. If that minority turns out to matter, it becomes a
 * cropper — it does not become a stretched non-square avatar.
 */
export function avatarCropRect(width: number, height: number): CropRect {
    const size = Math.min(width, height);
    return {
        sx: Math.round((width - size) / 2),
        sy: Math.round((height - size) / 2),
        size,
    };
}
