// Turning a file the user picked into the bytes the server stores.
//
// The downscale happens HERE, on the device that has the photo, rather than on
// the server. A phone photo is 3–8 MB and 4000px wide; the avatar is a 40px
// circle in a list. Uploading the original to resize it server-side would mean
// carrying an image-processing dependency into a Bun server whose whole deploy
// story is one process and one SQLite file, and paying for the bytes twice on
// a connection at a golf course. So the client sends a 512px square and the
// server checks two things it cannot delegate: that the bytes really are an
// image, and that they are under the cap.

import { AVATAR_EDGE_PX, MAX_AVATAR_BYTES, avatarCropRect } from '../avatar';

/** Re-encode quality. 0.85 on a 512px square lands around 40 KB. */
const JPEG_QUALITY = 0.85;

export class AvatarFileError extends Error {}

/**
 * Decode, centre-crop to a square, scale to `AVATAR_EDGE_PX`, re-encode as
 * JPEG.
 *
 * JPEG rather than WebP even though WebP is smaller: this output is what every
 * client will be handed back for years, and JPEG is the one format nothing
 * anywhere has ever failed to display. The saving is a few kilobytes on a file
 * that is already tiny.
 *
 * The decode is where a picked file realistically fails — a HEIC straight off
 * an iPhone decodes in Safari and in nothing else. That surfaces as a plain
 * message asking for a JPEG or PNG, not as a stack trace.
 */
export async function prepareAvatarBlob(file: File): Promise<Blob> {
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new AvatarFileError(
            'That image could not be read. Try a JPEG or PNG.',
        );
    }

    try {
        const { sx, sy, size } = avatarCropRect(bitmap.width, bitmap.height);
        const canvas = document.createElement('canvas');
        canvas.width = AVATAR_EDGE_PX;
        canvas.height = AVATAR_EDGE_PX;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new AvatarFileError('This browser cannot process images.');
        ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, AVATAR_EDGE_PX, AVATAR_EDGE_PX);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
        );
        if (!blob) throw new AvatarFileError('That image could not be processed.');

        // Belt and braces: a 512px JPEG cannot realistically exceed 2 MiB, but
        // the server refuses one that does, and refusing here means the user
        // learns before the upload rather than after it.
        if (blob.size > MAX_AVATAR_BYTES) {
            throw new AvatarFileError('That image is too large.');
        }
        return blob;
    } finally {
        bitmap.close();
    }
}
