import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import type { RewardOrder } from "@/data/reward-order";
import { adminDb } from "@/lib/server/firebase-admin";
import { IMPACT_DOC } from "@/lib/server/model";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

function toOrder(id: string, data: Record<string, unknown>): RewardOrder {
  return {
    id,
    uid: String(data.uid ?? ""),
    fullName: String(data.fullName ?? ""),
    email: String(data.email ?? ""),
    whatsapp: String(data.whatsapp ?? ""),
    rewardId: String(data.rewardId ?? ""),
    rewardLabel: String(data.rewardLabel ?? ""),
    kind: data.kind === "topup" ? "topup" : "buy",
    pointsUsed: Number(data.pointsUsed ?? 0),
    totalText: String(data.totalText ?? ""),
    pickup: data.pickup === "office" ? "office" : "trip",
    bookingCode: (data.bookingCode as string | null) ?? null,
    status: (data.status as RewardOrder["status"]) ?? "new",
    adminNote: String(data.adminNote ?? ""),
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? 0,
  };
}

/** Souvenir orders, newest first; with ?proof=<id>, the payment photo of one order. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const db = adminDb();
    const proofId = new URL(request.url).searchParams.get("proof");
    if (proofId) {
      const data = (await db.collection("rewardOrderProofs").doc(proofId).get()).data() as { data?: string; contentType?: string } | undefined;
      if (!data?.data) throw new HttpError(404, "No payment photo found.");
      return ok({ dataUrl: `data:${data.contentType ?? "image/webp"};base64,${data.data}` });
    }
    const snap = await db.collection("rewardOrders").orderBy("createdAt", "desc").limit(100).get();
    return ok({ items: snap.docs.map((doc) => toOrder(doc.id, doc.data())) });
  });
}

/**
 * Confirm: the payment arrived, so the souvenir joins the tour leader's hand-over list.
 * Reject: the held points and stock go back to the traveler and the store.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request, ["admin"]);
    const body = await readJson<{ id: string; action: string; note: string }>(request);
    const db = adminDb();
    const ref = db.collection("rewardOrders").doc(String(body.id ?? ""));
    const note = String(body.note ?? "").trim().slice(0, 200);
    if (body.action !== "confirm" && body.action !== "reject") throw new HttpError(400, "Unknown action.");

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpError(404, "This order was not found.");
      const data = snap.data() ?? {};
      const order = toOrder(snap.id, data);
      if (order.status !== "new") throw new HttpError(409, "This order was already decided.");
      const decided = { adminNote: note, decidedAt: FieldValue.serverTimestamp(), decidedBy: session.email };

      if (body.action === "confirm") {
        const redemptionRef = db.collection("redemptions").doc();
        tx.create(redemptionRef, {
          uid: order.uid,
          name: order.fullName,
          email: order.email,
          rewardId: order.rewardId,
          rewardLabel: order.rewardLabel,
          points: order.pointsUsed,
          bookingCode: order.bookingCode,
          // A full purchase does not use up the free souvenir for the trip.
          purchase: order.kind === "buy",
          paid: order.totalText,
          pickup: order.pickup,
          orderId: order.id,
          status: "pending",
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.set(db.doc(IMPACT_DOC), { souvenirs: FieldValue.increment(1) }, { merge: true });
        tx.update(ref, { ...decided, status: "confirmed", redemptionId: redemptionRef.id });
        return;
      }

      if (order.pointsUsed > 0) tx.update(db.collection("users").doc(order.uid), { points: FieldValue.increment(order.pointsUsed) });
      if (data.stockHeld === true) {
        tx.set(db.collection("rewardStock").doc(order.rewardId), { stock: FieldValue.increment(1) }, { merge: true });
      }
      tx.update(ref, { ...decided, status: "rejected" });
    });
    return ok({});
  });
}

/** Deletes a decided order and its payment photo (e.g. spam or a duplicate). Waiting orders must be rejected first. */
export async function DELETE(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const { id } = await readJson<{ id: string }>(request);
    const db = adminDb();
    const ref = db.collection("rewardOrders").doc(String(id ?? ""));
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "This order was not found.");
    if (snap.data()?.status === "new") throw new HttpError(409, "Reject the order first, so the points and stock go back.");
    await ref.delete();
    await db.collection("rewardOrderProofs").doc(ref.id).delete();
    return ok({});
  });
}
