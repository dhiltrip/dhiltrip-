import { FieldValue } from "firebase-admin/firestore";
import { orderRef, quoteOrder, type OrderKind } from "@/data/reward-order";
import { adminDb } from "@/lib/server/firebase-admin";
import { readImage } from "@/lib/server/images";
import type { TripDoc } from "@/lib/server/model";
import { getReward } from "@/lib/server/rewards";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

type Body = {
  rewardId: string;
  kind: string;
  language: string;
  fullName: string;
  whatsapp: string;
  pickup: string;
  proofData: string;
  consent: boolean;
};

/**
 * A traveler buys a souvenir in the app: full price, or their points plus money for the points they miss.
 * Points and stock are held right away and given back if the admin does not confirm the payment.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const body = await readJson<Body>(request);
    if (body.consent !== true) throw new HttpError(400, "Please agree to how we use your order details.");
    const kind: OrderKind = body.kind === "topup" ? "topup" : "buy";
    const reward = await getReward(String(body.rewardId ?? ""));
    if (!reward || reward.hidden) throw new HttpError(404, "This souvenir is not available.");

    const fullName = String(body.fullName ?? "").trim();
    if (fullName.length < 2 || fullName.length > 80) throw new HttpError(400, "Please fill in your full name.");
    const whatsapp = String(body.whatsapp ?? "").replace(/[^\d+]/g, "");
    if (!/^\+?\d{8,16}$/.test(whatsapp)) throw new HttpError(400, "Please enter a valid WhatsApp number, e.g. +62 812 3456 7890.");
    const pickup = body.pickup === "office" ? "office" : "trip";
    const language = String(body.language ?? "en").slice(0, 10);
    const proof = readImage(String(body.proofData ?? ""));

    const db = adminDb();
    const open = await db.collection("rewardOrders").where("uid", "==", session.uid).where("status", "==", "new").get();
    if (open.size >= 5) throw new HttpError(429, "You already have 5 orders waiting. Please wait for our admin to reply.");

    const userRef = db.collection("users").doc(session.uid);
    const stockRef = db.collection("rewardStock").doc(reward.id);
    const ref = db.collection("rewardOrders").doc();
    let totalText = "";

    await db.runTransaction(async (tx) => {
      const [userSnap, stockSnap] = await Promise.all([tx.get(userRef), tx.get(stockRef)]);
      const user = userSnap.data();
      if (!user) throw new HttpError(409, "Please sign in again.");
      const points = Number(user.points ?? 0);
      const tripCode = (user.trip as TripDoc | null)?.code ?? null;

      const quote = quoteOrder(reward, kind, points, language);
      if (!quote.ok) throw new HttpError(409, quote.message);
      totalText = quote.totalText;

      if (kind === "topup") {
        // Paying the rest still counts as the one souvenir for this trip.
        const [redeemed, waiting] = await Promise.all([
          tx.get(db.collection("redemptions").where("uid", "==", session.uid).where("bookingCode", "==", tripCode)),
          tx.get(db.collection("rewardOrders").where("uid", "==", session.uid).where("status", "==", "new")),
        ]);
        const used =
          redeemed.docs.some((doc) => doc.data().purchase !== true) ||
          waiting.docs.some((doc) => doc.data().kind === "topup" && (doc.data().bookingCode ?? null) === tripCode);
        if (used) throw new HttpError(409, "You can use points for only 1 souvenir per trip, and you already have one for this trip.");
        tx.update(userRef, { points: FieldValue.increment(-quote.pointsUsed) });
      }
      // No stock document means the souvenir is not limited.
      if (stockSnap.exists) {
        const stock = Number(stockSnap.data()?.stock ?? 0);
        if (stock <= 0) throw new HttpError(409, "This souvenir is out of stock.");
        tx.update(stockRef, { stock: stock - 1 });
      }
      tx.set(db.collection("rewardOrderProofs").doc(ref.id), { ...proof, uid: session.uid, createdAt: FieldValue.serverTimestamp() });
      tx.create(ref, {
        uid: session.uid,
        fullName,
        email: session.email,
        whatsapp,
        rewardId: reward.id,
        rewardLabel: reward.label,
        kind,
        pointsUsed: quote.pointsUsed,
        amount: quote.amount,
        currency: quote.currency,
        totalText: quote.totalText,
        pickup,
        bookingCode: tripCode,
        stockHeld: stockSnap.exists,
        status: "new",
        adminNote: "",
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return ok({ id: ref.id, ref: orderRef(ref.id), totalText });
  });
}
