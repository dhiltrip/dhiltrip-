import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";
import { HttpError } from "@/lib/server/session";

const MAX_IMAGE_CHARS = 900_000;

/** Checks a data URL from the browser (already shrunk there) and splits it into type and base64. */
export function readImage(value: string) {
  const match = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) throw new HttpError(400, "Please choose a photo (JPG, PNG or WebP).");
  if (match[2].length > MAX_IMAGE_CHARS) throw new HttpError(413, "The photo is too large. Please choose a smaller one.");
  return { contentType: match[1], data: match[2] };
}

/** Stores an image in Firestore and returns a versioned URL that browsers may cache for good. */
export async function saveImage(collection: string, id: string, dataUrl: string, urlBase: string) {
  const image = readImage(dataUrl);
  await adminDb().collection(collection).doc(id).set({ ...image, updatedAt: FieldValue.serverTimestamp() });
  return `${urlBase}/${id}/${Date.now().toString(36)}`;
}

/** Serves an image saved with saveImage. */
export async function serveImage(collection: string, id: string) {
  const snap = await adminDb().collection(collection).doc(id).get();
  const data = snap.data() as { data?: string; contentType?: string } | undefined;
  if (!data?.data) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(data.data, "base64"), {
    headers: {
      "Content-Type": data.contentType ?? "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
