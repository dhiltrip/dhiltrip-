import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";
import { IMPACT_DOC } from "@/lib/server/model";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

/** Recent drop-offs at the waste bank. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession(request, ["leader", "admin"]);
    const snap = await adminDb().collection("deliveries").orderBy("createdAt", "desc").limit(20).get();
    const items = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        weightGrams: Number(data.weightGrams ?? 0),
        note: String(data.note ?? ""),
        by: String(data.byName ?? ""),
        createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? 0,
      };
    });
    return ok({ items });
  });
}

/** The guide marks collected waste as delivered to the waste bank; it counts in the impact total. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request, ["leader", "admin"]);
    const body = await readJson<{ weightKg: number; note: string }>(request);
    const weightKg = Number(body.weightKg ?? 0);
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 1000) throw new HttpError(400, "Enter the weight in kg (up to 1000).");
    const weightGrams = Math.round(weightKg * 1000);
    const db = adminDb();
    const ref = db.collection("deliveries").doc();
    await db.runTransaction(async (tx) => {
      tx.create(ref, {
        weightGrams,
        note: String(body.note ?? "").trim().slice(0, 120),
        by: session.uid,
        byName: session.name,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(db.doc(IMPACT_DOC), { deliveredGrams: FieldValue.increment(weightGrams), deliveries: FieldValue.increment(1) }, { merge: true });
    });
    return ok({ id: ref.id });
  });
}
