import "server-only";
import { findReward as findBuiltIn, rewards as builtIn, type Reward } from "@/data/challenge";
import { adminDb } from "@/lib/server/firebase-admin";

/** Rewards live in Firestore; the built-in twelve are used only while that collection is still empty. */

export async function listRewards(): Promise<Reward[]> {
  const snap = await adminDb().collection("rewards").get();
  if (snap.empty) return builtIn;
  return snap.docs.map((doc) => ({ ...(doc.data() as Reward), id: doc.id }));
}

export async function getReward(id: string | null | undefined): Promise<Reward | null> {
  if (!id) return null;
  const snap = await adminDb().collection("rewards").doc(id).get();
  if (snap.exists) return { ...(snap.data() as Reward), id: snap.id };
  const any = await adminDb().collection("rewards").limit(1).get();
  return any.empty ? findBuiltIn(id) : null;
}

/** Copies the built-in rewards into Firestore the first time an admin changes anything. */
export async function ensureRewardsSeeded() {
  const db = adminDb();
  const any = await db.collection("rewards").limit(1).get();
  if (!any.empty) return;
  const batch = db.batch();
  builtIn.forEach((reward, index) => {
    const { id, ...rest } = reward;
    batch.set(db.collection("rewards").doc(id), { ...rest, order: index, hidden: false, imageFocus: null });
  });
  await batch.commit();
}
