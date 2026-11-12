import { FieldValue } from "firebase-admin/firestore";
import { findReward } from "@/data/challenge";
import { adminDb } from "@/lib/server/firebase-admin";
import { IMPACT_DOC, type TripDoc } from "@/lib/server/model";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

/** Spends points on a souvenir and queues it for the tour leader to hand over. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const body = await readJson<{ rewardId: string }>(request);
    const reward = findReward(String(body.rewardId ?? ""));
    if (!reward) throw new HttpError(404, "This reward is not available.");

    const db = adminDb();
    const userRef = db.collection("users").doc(session.uid);
    const stockRef = db.collection("rewardStock").doc(reward.id);
    const redemptionRef = db.collection("redemptions").doc();

    await db.runTransaction(async (tx) => {
      const [userSnap, stockSnap] = await Promise.all([tx.get(userRef), tx.get(stockRef)]);
      const user = userSnap.data();
      if (!user) throw new HttpError(409, "Please sign in again.");
      const points = Number(user.points ?? 0);
      if (points < reward.points) throw new HttpError(409, `You need ${reward.points - points} more points.`);
      // No stock document means the reward is not limited.
      if (stockSnap.exists) {
        const stock = Number(stockSnap.data()?.stock ?? 0);
        if (stock <= 0) throw new HttpError(409, "This reward is out of stock.");
        tx.update(stockRef, { stock: stock - 1 });
      }
      tx.update(userRef, { points: FieldValue.increment(-reward.points) });
      tx.create(redemptionRef, {
        uid: session.uid,
        name: String(user.name ?? session.name),
        email: session.email,
        rewardId: reward.id,
        rewardLabel: reward.label,
        points: reward.points,
        bookingCode: (user.trip as TripDoc | null)?.code ?? null,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });
      // Each souvenir is a local upcycled product supported.
      tx.set(db.doc(IMPACT_DOC), { souvenirs: FieldValue.increment(1) }, { merge: true });
    });

    return ok({ id: redemptionRef.id });
  });
}
