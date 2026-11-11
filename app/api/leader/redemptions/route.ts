import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

/** Souvenirs that travelers redeemed and that still need to be handed over. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession(request, ["leader", "admin"]);
    const snap = await adminDb().collection("redemptions").where("status", "==", "pending").limit(200).get();
    const items = snap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: String(data.name ?? ""),
          email: String(data.email ?? ""),
          rewardId: String(data.rewardId ?? ""),
          rewardLabel: String(data.rewardLabel ?? ""),
          bookingCode: (data.bookingCode as string | null) ?? null,
          createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? 0,
        };
      })
      .sort((a, b) => a.createdAt - b.createdAt);
    return ok({ items });
  });
}

/** Marks one souvenir as handed over. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request, ["leader", "admin"]);
    const body = await readJson<{ id: string }>(request);
    const id = String(body.id ?? "");
    if (!id) throw new HttpError(400, "Missing redemption.");
    const ref = adminDb().collection("redemptions").doc(id);
    await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpError(404, "This redemption was not found.");
      if (snap.data()?.status !== "pending") return;
      tx.update(ref, { status: "handed", handedBy: session.uid, handedAt: FieldValue.serverTimestamp() });
    });
    return ok({});
  });
}
