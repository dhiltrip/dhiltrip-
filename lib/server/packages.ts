import "server-only";
import { findPackage as findBuiltIn, packages as builtIn, prefixOf, type ChallengePackage } from "@/data/challenge";
import { adminDb } from "@/lib/server/firebase-admin";

/** Packages live in Firestore; the built-in four are used only while that collection is still empty. */

export async function listPackages(): Promise<ChallengePackage[]> {
  const snap = await adminDb().collection("packages").get();
  if (snap.empty) return builtIn;
  return snap.docs.map((doc) => ({ ...(doc.data() as ChallengePackage), id: doc.id }));
}

export async function getPackage(id: string | null | undefined): Promise<ChallengePackage | null> {
  if (!id) return null;
  const snap = await adminDb().collection("packages").doc(id).get();
  if (snap.exists) return { ...(snap.data() as ChallengePackage), id: snap.id };
  const any = await adminDb().collection("packages").limit(1).get();
  return any.empty ? findBuiltIn(id) : null;
}

/** Copies the built-in packages into Firestore the first time an admin changes anything. */
export async function ensureSeeded() {
  const db = adminDb();
  const any = await db.collection("packages").limit(1).get();
  if (!any.empty) return;
  const batch = db.batch();
  builtIn.forEach((pkg, index) => {
    const { id, ...rest } = pkg;
    batch.set(db.collection("packages").doc(id), { ...rest, prefix: prefixOf(pkg), order: index, hidden: false });
  });
  await batch.commit();
}
