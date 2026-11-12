import { FieldValue } from "firebase-admin/firestore";
import { POINTS } from "@/data/challenge";
import { adminDb } from "@/lib/server/firebase-admin";
import { CLAIM_PREFIX, IMPACT_DOC, type ClaimDoc, type TripDoc } from "@/lib/server/model";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

/** A traveler scans a tour leader's code; the points are worked out here, never in the browser. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const body = await readJson<{ code: string }>(request);
    const raw = String(body.code ?? "").trim().toUpperCase();
    if (!raw.startsWith(CLAIM_PREFIX)) throw new HttpError(400, "This code is not valid.");
    const id = raw.slice(CLAIM_PREFIX.length);
    if (!/^[A-Z0-9]{6,20}$/.test(id)) throw new HttpError(400, "This code is not valid.");

    const db = adminDb();
    const claimRef = db.collection("claims").doc(id);
    const userRef = db.collection("users").doc(session.uid);
    const impactRef = db.doc(IMPACT_DOC);

    const result = await db.runTransaction(async (tx) => {
      const [claimSnap, userSnap] = await Promise.all([tx.get(claimRef), tx.get(userRef)]);
      if (!claimSnap.exists) throw new HttpError(404, "This code is not valid.");
      const claim = claimSnap.data() as ClaimDoc;
      if (claim.usedBy) throw new HttpError(409, "This code has already been used.");
      if (Date.now() > claim.expiresAt) throw new HttpError(410, "This code has expired. Ask your tour leader for a new one.");
      const trip = userSnap.data()?.trip as TripDoc | null | undefined;
      if (!trip) throw new HttpError(409, "Choose your travel package first.");

      const room = Math.max(0, POINTS.maxBottlesPerTrip - trip.bottles);
      const bottles = Math.min(claim.bottles, room);
      const tumbler = claim.tumbler && !trip.tumbler;
      const teloBag = claim.teloBag && !trip.teloBag;
      const points = bottles * POINTS.perBottle + (tumbler ? POINTS.tumbler : 0) + (teloBag ? POINTS.teloBag : 0);
      const weightGrams = Math.max(0, Math.round(claim.weightGrams ?? 0));

      tx.update(userRef, {
        points: FieldValue.increment(points),
        bottlesTotal: FieldValue.increment(bottles),
        teloBagsUsed: FieldValue.increment(teloBag ? 1 : 0),
        weightGrams: FieldValue.increment(weightGrams),
        "trip.weightGrams": (trip.weightGrams ?? 0) + weightGrams,
        "trip.bottles": trip.bottles + bottles,
        "trip.tumbler": trip.tumbler || tumbler,
        "trip.teloBag": trip.teloBag || teloBag,
      });
      tx.update(claimRef, { usedBy: session.uid, usedAt: FieldValue.serverTimestamp() });
      // Community totals shown on the site.
      tx.set(
        impactRef,
        {
          bottles: FieldValue.increment(bottles),
          weightGrams: FieldValue.increment(weightGrams),
          teloBags: FieldValue.increment(teloBag ? 1 : 0),
          tumblers: FieldValue.increment(tumbler ? 1 : 0),
        },
        { merge: true },
      );
      return { points, bottles, weightGrams, capped: bottles < claim.bottles };
    });

    return ok(result);
  });
}
