import { findReward, rewards } from "@/data/challenge";
import { adminDb } from "@/lib/server/firebase-admin";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

/** Current stock per reward; null means unlimited. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const snap = await adminDb().collection("rewardStock").get();
    const stock: Record<string, number | null> = Object.fromEntries(rewards.map((reward) => [reward.id, null]));
    snap.docs.forEach((doc) => {
      stock[doc.id] = Number(doc.data().stock ?? 0);
    });
    return ok({ stock });
  });
}

/** Sets the stock for one reward, or removes the limit when stock is null. */
export async function POST(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const body = await readJson<{ rewardId: string; stock: number | null }>(request);
    const reward = findReward(String(body.rewardId ?? ""));
    if (!reward) throw new HttpError(404, "Unknown reward.");
    const ref = adminDb().collection("rewardStock").doc(reward.id);
    if (body.stock === null || body.stock === undefined) {
      await ref.delete();
      return ok({});
    }
    const stock = Math.floor(Number(body.stock));
    if (!Number.isFinite(stock) || stock < 0 || stock > 10000) throw new HttpError(400, "Stock must be 0 or more.");
    await ref.set({ stock });
    return ok({});
  });
}
