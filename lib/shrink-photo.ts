"use client";

/**
 * Shrinks a photo in the browser so it fits in Firestore (well under 1 MB).
 * maxSide is the longest edge in pixels; payment screenshots use a larger one so their text stays readable.
 */
export async function shrinkPhoto(file: File, maxSide = 1000): Promise<string> {
  const bitmap = await createImageBitmap(file);
  let side = maxSide;
  // Very detailed photos may still be too big; step the size down until it fits.
  for (let attempt = 0; attempt < 3; attempt += 1, side = Math.round(side * 0.75)) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
      let result = canvas.toDataURL("image/webp", quality);
      // Browsers without WebP export return PNG; JPEG is much smaller then.
      if (!result.startsWith("data:image/webp")) result = canvas.toDataURL("image/jpeg", quality);
      if (result.length < 850_000) {
        bitmap.close();
        return result;
      }
    }
  }
  bitmap.close();
  throw new Error("too large");
}
