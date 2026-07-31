import { describe, expect, test } from 'bun:test';
import { API_BASE } from '../../src/api-base';
import { avatarCropRect, avatarInitials, avatarSrc, AVATAR_EDGE_PX } from '../../src/avatar';

// ===========================================================================
// PROFILE PHOTOS — EXECUTABLE SPECIFICATION (pure half)
// ---------------------------------------------------------------------------
// Three questions every surface that draws a person asks: where is the photo,
// what letters stand in when there is none, and which square comes out of the
// source image. All three are answered from data already in hand — nothing
// here touches the network, and that is the design, not a testing convenience.
//
// The initials rule is mirrored in `AccountAvatar.initials` on iOS; the crop
// is mirrored in `AvatarImage.prepare`. Both are asserted case-for-case there.
// ===========================================================================

describe('avatarSrc', () => {
    test('null when the player has no photo — the caller must not guess a URL', () => {
        // Requesting a photo for a player who has none is a guaranteed 404, and
        // a friends list doing it per row is a burst of them on every render.
        expect(avatarSrc({ id: 'p1' })).toBeNull();
        expect(avatarSrc({ id: 'p1', avatarVersion: null })).toBeNull();
        expect(avatarSrc({ id: 'p1', avatarVersion: '' })).toBeNull();
    });

    test('the version rides along as ?v=, which is what busts a replaced photo', () => {
        expect(avatarSrc({ id: 'p1', avatarVersion: 'abc123' })).toBe(
            `${API_BASE}/players/p1/avatar?v=abc123`,
        );
        // A new photo is a new hash is a new URL, so an `immutable` cache entry
        // for the old one is never consulted again.
        expect(avatarSrc({ id: 'p1', avatarVersion: 'def456' })).not.toBe(
            avatarSrc({ id: 'p1', avatarVersion: 'abc123' }),
        );
    });

    test('the id is escaped — it lands in a path segment', () => {
        expect(avatarSrc({ id: 'a/b?c', avatarVersion: 'v' })).toBe(
            `${API_BASE}/players/a%2Fb%3Fc/avatar?v=v`,
        );
    });
});

describe('avatarInitials', () => {
    test('first and LAST word, so a middle name does not displace the surname', () => {
        expect(avatarInitials('Marcus Andersson')).toBe('MA');
        expect(avatarInitials('Anna Karin Söderberg')).toBe('AS');
    });

    test('one word gives one letter rather than half a name', () => {
        expect(avatarInitials('Marcus')).toBe('M');
    });

    test('extra whitespace is not a word', () => {
        expect(avatarInitials('   Marcus   Andersson  ')).toBe('MA');
    });

    test('falls back to the username, then to a neutral glyph', () => {
        // A circle mid-load is never empty: there is always something to draw.
        expect(avatarInitials('', 'marcus')).toBe('M');
        expect(avatarInitials(null, null)).toBe('•');
        expect(avatarInitials(undefined, undefined)).toBe('•');
    });

    test('splits by code point — an astral first character stays whole', () => {
        expect(avatarInitials('👩‍🚀 Andersson')).toBe('👩A');
    });
});

describe('avatarCropRect', () => {
    test('a square source is taken whole', () => {
        expect(avatarCropRect(1000, 1000)).toEqual({ sx: 0, sy: 0, size: 1000 });
    });

    test('a landscape source is cropped from the centre, not the left', () => {
        expect(avatarCropRect(1600, 900)).toEqual({ sx: 350, sy: 0, size: 900 });
    });

    test('a portrait source keeps the middle band — where a face is', () => {
        expect(avatarCropRect(900, 1600)).toEqual({ sx: 0, sy: 350, size: 900 });
    });

    test('an odd offset is rounded, never fractional', () => {
        // Canvas would accept a fraction and resample; a whole pixel is free.
        const rect = avatarCropRect(101, 100);
        expect(rect).toEqual({ sx: 1, sy: 0, size: 100 });
    });

    test('a source smaller than the target edge is still cropped square', () => {
        // Upscaling a 200px photo to 512 is what the caller then does, and a
        // slightly soft avatar beats refusing a picture the player chose.
        expect(avatarCropRect(300, 200).size).toBe(200);
        expect(AVATAR_EDGE_PX).toBe(512);
    });
});
