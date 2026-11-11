import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import type { Review, ReviewStatus } from "@/data/content";
import { ensureContentSeeded } from "@/lib/server/content";
import { adminDb } from "@/lib/server/firebase-admin";
import { getPackage } from "@/lib/server/packages";
import { readLabel, readRating, readReviewText } from "@/lib/server/reviews";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

const STATUSES: ReviewStatus[] = ["published", "pending", "hidden"];

/** Every review, including ones waiting for approval. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    await ensureContentSeeded();
    const snap = await adminDb().collection("reviews").get();
    const items: Review[] = snap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: String(data.name ?? ""),
          label: String(data.label ?? ""),
          rating: Number(data.rating ?? 5),
          text: String(data.text ?? ""),
          packageId: (data.packageId as string | null) ?? null,
          status: data.status as ReviewStatus,
          source: data.source === "traveler" ? "traveler" : "admin",
          uid: (data.uid as string | null) ?? null,
          createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? 0,
        } satisfies Review;
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return ok({ items });
  });
}

type Body = {
  action: string;
  id?: string;
  status?: string;
  name?: string;
  label?: string;
  rating?: number;
  text?: string;
  packageId?: string | null;
};

/** Admins write reviews (e.g. copied from WhatsApp), edit them, and approve or hide travelers' reviews. */
export async function POST(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    await ensureContentSeeded();
    const body = await readJson<Body>(request);
    const db = adminDb();

    if (body.action === "status") {
      if (!STATUSES.includes(body.status as ReviewStatus)) throw new HttpError(400, "Unknown status.");
      const ref = db.collection("reviews").doc(String(body.id ?? ""));
      if (!(await ref.get()).exists) throw new HttpError(404, "This review was not found.");
      await ref.update({ status: body.status, updatedAt: FieldValue.serverTimestamp() });
      return ok({});
    }

    if (body.action === "save") {
      const name = String(body.name ?? "").trim().slice(0, 60);
      if (!name) throw new HttpError(400, "Please fill in the name.");
      const packageId = body.packageId ? String(body.packageId) : null;
      if (packageId && !(await getPackage(packageId))) throw new HttpError(400, "That package was not found.");
      const fields = {
        name,
        label: readLabel(body.label),
        rating: readRating(body.rating),
        text: readReviewText(body.text),
        packageId,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (body.id) {
        const ref = db.collection("reviews").doc(String(body.id));
        if (!(await ref.get()).exists) throw new HttpError(404, "This review was not found.");
        await ref.update(fields);
        return ok({ id: ref.id });
      }
      const ref = db.collection("reviews").doc();
      await ref.set({ ...fields, status: "published", source: "admin", uid: null, createdAt: FieldValue.serverTimestamp() });
      return ok({ id: ref.id });
    }

    throw new HttpError(400, "Unknown action.");
  });
}

/** Deletes a review for good. */
export async function DELETE(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const { id } = await readJson<{ id: string }>(request);
    const ref = adminDb().collection("reviews").doc(String(id ?? ""));
    if (!(await ref.get()).exists) throw new HttpError(404, "This review was not found.");
    await ref.delete();
    return ok({});
  });
}
