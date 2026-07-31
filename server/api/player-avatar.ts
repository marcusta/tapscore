// Profile photos: the one part of the player API that moves bytes.
//
// Raw Hono registration rather than a `mount()` descriptor, for the same
// reason the SSE streams are (`spectate-events.ts`): `mount` parses every
// non-GET body as JSON and wraps every return value in `c.json()`. An image
// upload is neither. Base64 in a JSON envelope would have fit the descriptor —
// and would have meant a third of every upload spent on encoding, and a client
// decoding an image out of a string it can never hand straight to an <img> or
// a UIImage.
//
// So: request body IS the image, response body IS the image, and the typed
// client generator skips this file exactly as it skips the streams. Both
// clients call these three by hand.
//
// The serve route is session-gated, not public. Web sends the session cookie
// on an <img> request for free; the native client sends a bearer header, which
// `AsyncImage` cannot, and that is why iOS fetches avatar bytes through its
// API client into a cache instead of pointing a URL at a view. The alternative
// — an unauthenticated route so the native side could use a plain URL — would
// have made every profile photo readable by anyone who ever saw a player id in
// a payload. A photo of a face is not a thing to open by accident.

import type { Hono } from 'hono';
import {
    MAX_AVATAR_BYTES,
    type PlayerAvatarService,
} from '../services/player-avatar.service';

/**
 * `?v=<version>` is a promise the client makes: "I believe the photo is this
 * one". When it holds, the response is immutable for a year — the URL is
 * content-addressed, so a new photo is a new URL and no cache can serve a
 * stale face. When it is absent or stale (a client guessing, or one that
 * cached the id alone), the response must be revalidated every time.
 */
function cacheControlFor(askedVersion: string | undefined, actual: string): string {
    return askedVersion === actual
        ? 'private, max-age=31536000, immutable'
        : 'private, no-cache';
}

export function registerPlayerAvatarRoutes(app: Hono, avatars: PlayerAvatarService): void {
    /**
     * The image itself. `:playerId` accepts the literal `me` so a client that
     * has a session but has not yet loaded `/players/me` can still render its
     * own photo — every other player is addressed by id.
     */
    app.get('/api/players/:playerId/avatar', async (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const param = c.req.param('playerId');
        const playerId = param === 'me' ? user.id : param;

        const stored = await avatars.find(playerId);
        // 404, not a placeholder image. "No photo" is a state the client
        // renders as initials in its own type and colours; a server-drawn
        // fallback would ship a second, worse avatar design that no theme
        // reaches.
        if (!stored) return c.json({ error: 'not_found' }, 404);

        const etag = `"${stored.version}"`;
        c.header('ETag', etag);
        c.header('Cache-Control', cacheControlFor(c.req.query('v'), stored.version));
        c.header('Content-Type', stored.contentType);

        // A conditional request that already holds this version costs no bytes.
        // Worth honouring: a friends list is a screenful of these at once.
        if (c.req.header('If-None-Match') === etag) return c.body(null, 304);

        c.header('Content-Length', String(stored.byteSize));
        return c.body(stored.bytes as unknown as ArrayBuffer);
    });

    /**
     * Upload/replace the CALLER's photo. Body is the raw image; the
     * `Content-Type` header is ignored in favour of sniffing the bytes.
     *
     * PUT rather than POST: one photo per player, and sending the same image
     * twice must leave the same single row (it does — the store upserts and
     * the version is a content hash).
     */
    app.put('/api/players/me/avatar', async (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        // Cheap refusal before buffering. The declared length can lie, so the
        // service checks the real byte count too — this only spares us reading
        // a body that has already announced it is too big.
        const declared = Number(c.req.header('Content-Length') ?? '0');
        if (Number.isFinite(declared) && declared > MAX_AVATAR_BYTES) {
            return c.json({ error: 'too_large', limit: MAX_AVATAR_BYTES }, 413);
        }

        const bytes = new Uint8Array(await c.req.arrayBuffer());
        const result = await avatars.store(user.id, bytes);

        if (!result.ok) {
            if (result.reason === 'too_large') {
                return c.json({ error: 'too_large', limit: result.limit }, 413);
            }
            return c.json({ error: result.reason, accepts: ['image/jpeg', 'image/png', 'image/webp'] }, 400);
        }

        // The new version comes straight back so the client can swap its image
        // URL without a round trip to `/players/me` to discover it.
        return c.json({
            avatarVersion: result.version,
            contentType: result.contentType,
            byteSize: result.byteSize,
        });
    });

    /** Remove the caller's photo. Idempotent, so no 404 on a second call. */
    app.delete('/api/players/me/avatar', async (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        await avatars.remove(user.id);
        return c.json({ avatarVersion: null });
    });
}
