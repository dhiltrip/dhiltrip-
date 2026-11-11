"use client";

/** Shrinks a photo in the browser so it fits in Firestore (well under 1 MB). */
export async function shrinkPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let result = "";
  for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
    result = canvas.toDataURL("image/webp", quality);
    // Browsers without WebP export return PNG; JPEG is much smaller then.
    if (!result.startsWith("data:image/webp")) result = canvas.toDataURL("image/jpeg", quality);
    if (result.length < 850_000) return result;
  }
  throw new Error("too large");
}
