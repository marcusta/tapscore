// The two avatar writes, by hand.
//
// `bun run generate` skips `server/api/player-avatar.ts` for the same reason it
// skips the SSE streams: those routes are raw Hono, not `mount()` descriptors,
// because their bodies are images rather than JSON. So this is the one place in
// the client where a request is assembled without a generated client.
//
// It still throws `ApiError`, which is the part that matters — `request()` maps
// that to the same `RequestError` codes as every other call, so the profile
// screen's error handling does not learn a second vocabulary for photos.

import { ApiError } from '@basics/core/client/api-error';
import { API_BASE } from '../api-base';

/** What `PUT /players/me/avatar` answers with. */
export interface AvatarUploadResult {
    avatarVersion: string;
    contentType: string;
    byteSize: number;
}

/**
 * Upload/replace the signed-in player's photo. The blob IS the body — no
 * multipart wrapper, because there is exactly one field and a boundary-encoded
 * envelope would only give the server a form to parse.
 *
 * The session rides on the cookie: `fetch` defaults to `same-origin`
 * credentials and `API_BASE` is a same-origin path, which is also why the plain
 * `<img src>` elsewhere in the app can reach the serve route at all.
 */
export async function putAvatar(blob: Blob): Promise<AvatarUploadResult> {
    const res = await fetch(`${API_BASE}/players/me/avatar`, {
        method: 'PUT',
        // Honest about what is being sent, even though the server decides the
        // stored type by sniffing the bytes and never by trusting this.
        headers: { 'Content-Type': blob.type || 'application/octet-stream' },
        body: blob,
    });
    if (!res.ok) throw await toApiError(res);
    return (await res.json()) as AvatarUploadResult;
}

/** Remove it. Idempotent server-side, so calling it without a photo is fine. */
export async function deleteAvatar(): Promise<void> {
    const res = await fetch(`${API_BASE}/players/me/avatar`, { method: 'DELETE' });
    if (!res.ok) throw await toApiError(res);
}

/**
 * 413 is folded into 400 on the way out. `request()` has no rung for "payload
 * too large" and would flatten it to a bare "Server error"; as a validation
 * error it keeps the server's own word for what was wrong, which is the only
 * useful thing to say about a file that was too big.
 */
async function toApiError(res: Response): Promise<ApiError> {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const status = res.status === 413 ? 400 : res.status;
    return new ApiError(status, messageFor(body.error, res.status));
}

function messageFor(error: string | undefined, status: number): string {
    if (error === 'too_large' || status === 413) return 'That image is too large.';
    if (error === 'unsupported_type') return 'That file is not a JPEG, PNG or WebP image.';
    if (error === 'empty') return 'That image was empty.';
    return error ?? 'Photo upload failed.';
}
