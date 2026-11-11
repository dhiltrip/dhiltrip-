import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { builtInMemories, builtInReviews } from "@/data/content";
import { adminDb } from "@/lib/server/firebase-admin";

/** Copies the original photos and testimonials into Firestore once, so admins can manage them. */
export async function ensureContentSeeded() {
  const db = adminDb();
  const marker = db.collection("meta").doc("content");
  const seeded = (await marker.get()).data() ?? {};
  if (seeded.memories && seeded.reviews) return;
  const batch = db.batch();
  if (!seeded.memories) {
    builtInMemories.forEach(({ id, ...memory }) => batch.set(db.collection("memories").doc(id), { ...memory, hidden: false }));
  }
  if (!seeded.reviews) {
    builtInReviews.forEach(({ id, createdAt, ...review }) =>
      batch.set(db.collection("reviews").doc(id), {
        ...review,
        uid: null,
        createdAt: FieldValue.serverTimestamp(),
        sortKey: createdAt ?? 0,
      }),
    );
  }
  batch.set(marker, { memories: true, reviews: true }, { merge: true });
  await batch.commit();
}
