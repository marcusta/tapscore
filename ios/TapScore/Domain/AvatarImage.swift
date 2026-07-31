import UIKit

/// Turning a picked photo into the bytes the server stores.
///
/// The downscale happens on the device that has the photo, not on the server:
/// a phone photo is several megabytes and 4000px wide, the avatar is a 40pt
/// circle in a list, and the alternative is an image-processing dependency in a
/// Bun server whose entire deploy story is one process and one SQLite file.
///
/// Same rules as the web's `src/profile/avatar-file.ts`, and they have to stay
/// the same: both clients feed one column, and two crops would mean the same
/// person framed differently depending on where they uploaded from.
enum AvatarImage {
    /// The square edge, in pixels, of what gets uploaded.
    static let edge: CGFloat = 512

    /// The server's cap (2 MiB). A 512px JPEG cannot realistically approach it;
    /// this exists so a caller can refuse before the request rather than after.
    static let maxBytes = 2 * 1024 * 1024

    /// JPEG rather than HEIC or PNG: HEIC is what an iPhone hands over and what
    /// nothing else decodes, and PNG of a photograph is several times the size
    /// for no visible gain. 0.85 on a 512px square lands around 40 KB.
    static let quality: CGFloat = 0.85

    /// Decode, centre-crop to a square, scale to `edge`, re-encode as JPEG.
    /// Nil when the data is not an image this device can decode.
    ///
    /// A centre crop rather than an interactive cropper: a profile photo is a
    /// face, a face is in the middle of the frame nearly always, and a
    /// drag-to-position screen is a whole surface to build, theme and test on
    /// both clients for the rest. If that minority turns out to matter it
    /// becomes a cropper — it does not become a squashed avatar.
    static func prepare(_ data: Data) -> Data? {
        guard let image = UIImage(data: data) else { return nil }
        let source = image.size
        guard source.width > 0, source.height > 0 else { return nil }

        let side = min(source.width, source.height)
        let scale = edge / side

        let format = UIGraphicsImageRendererFormat.default()
        // Points ARE pixels here: `edge` is a pixel count the server and the
        // web client both agree on, and letting the device's scale factor
        // multiply it would upload a 1536px image from a 3× phone.
        format.scale = 1
        // No alpha to preserve — the output is JPEG, which has none.
        format.opaque = true

        let renderer = UIGraphicsImageRenderer(
            size: CGSize(width: edge, height: edge),
            format: format
        )
        let square = renderer.image { _ in
            // Draw the WHOLE image scaled so its short side fills the square,
            // offset so the excess falls off both ends equally. `draw(in:)`
            // applies the orientation metadata, which is what keeps a photo
            // taken in portrait from arriving on its side.
            image.draw(
                in: CGRect(
                    x: -(source.width - side) / 2 * scale,
                    y: -(source.height - side) / 2 * scale,
                    width: source.width * scale,
                    height: source.height * scale
                )
            )
        }
        return square.jpegData(compressionQuality: quality)
    }
}
