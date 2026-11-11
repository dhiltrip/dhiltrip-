import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";
import type { UserDoc } from "@/lib/server/model";
import { readLabel, readRating, readReviewText } from "@/lib/server/reviews";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

/** One review per traveler per package. */
const reviewId = (uid: string, packageId: string) => `t_${uid}_${packageId}`;

/**
 * Which package's review this request is about. A traveler may write a new review only for the trip
 * they are on now, but may edit or delete their earlier reviews of past trips (from Profile).
 */
async function target(uid: string, requested: unknown, mustExist: boolean) {
  const db = adminDb();
  const user = (await db.collection("users").doc(uid).get()).data() as UserDoc | undefined;
  const packageId = String(requested ?? "") || user?.trip?.packageId || "";
  if (!packageId) throw new HttpError(409, "Join a trip first, then you can review it.");
  const ref = db.collection("reviews").doc(reviewId(uid, packageId));
  const existing = await ref.get();
  const onThisTrip = user?.trip?.packageId === packageId;
  if (!existing.exists && (mustExist || !onThisTrip)) {
    throw new HttpError(mustExist ? 404 : 409, mustExist ? "This review was not found." : "Join this trip first, then you can review it.");
  }
  return { user, packageId, ref, existing };
}

/** A traveler rates a trip. It waits for an admin to approve it before it shows on Home. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const body = await readJson<{ rating: number; text: string; label: string; packageId: string }>(request);
    const { user, packageId, ref, existing } = await target(session.uid, body.packageId, false);
    await ref.set(
      {
        name: (user?.name || session.name).slice(0, 60),
        label: readLabel(body.label),
        rating: readRating(body.rating),
        text: readReviewText(body.text),
        packageId,
        // Every change is checked again before it is shown.
        status: "pending",
        source: "traveler",
        uid: session.uid,
        updatedAt: FieldValue.serverTimestamp(),
        ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );
    return ok({});
  });
}

/** A traveler deletes one of their own reviews. */
export async function DELETE(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const body = await readJson<{ packageId: string }>(request);
    const { ref } = await target(session.uid, body.packageId, true);
    await ref.delete();
    return ok({});
  });
}
