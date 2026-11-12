import { FieldValue } from "firebase-admin/firestore";
import { POINTS } from "@/data/challenge";
import { adminDb } from "@/lib/server/firebase-admin";
import { CLAIM_LIFETIME_MS, CLAIM_PREFIX, MAX_CLAIM_GRAMS, randomCode, type ClaimDoc } from "@/lib/server/model";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

/** A tour leader records what a traveler collected; the traveler scans the returned code. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request, ["leader", "admin"]);
    const body = await readJson<{ bottles: number; tumbler: boolean; teloBag: boolean; weightKg: number }>(request);
    const bottles = Math.floor(Number(body.bottles ?? 0));
    if (!Number.isFinite(bottles) || bottles < 0 || bottles > POINTS.maxBottlesPerTrip) {
      throw new HttpError(400, `Bottles must be between 0 and ${POINTS.maxBottlesPerTrip}.`);
    }
    const tumbler = body.tumbler === true;
    const teloBag = body.teloBag === true;
    const weightKg = Number(body.weightKg ?? 0);
    if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg * 1000 > MAX_CLAIM_GRAMS) {
      throw new HttpError(400, `Weight must be between 0 and ${MAX_CLAIM_GRAMS / 1000} kg.`);
    }
    const weightGrams = Math.round(weightKg * 1000);
    if (bottles === 0 && !tumbler && !teloBag && weightGrams === 0) throw new HttpError(400, "Nothing to record yet.");

    const id = randomCode(10);
    const claim: ClaimDoc & { createdAt: FieldValue } = {
      bottles,
      tumbler,
      teloBag,
      weightGrams,
      createdBy: session.uid,
      expiresAt: Date.now() + CLAIM_LIFETIME_MS,
      usedBy: null,
      createdAt: FieldValue.serverTimestamp(),
    };
    await adminDb().collection("claims").doc(id).create(claim);
    return ok({ code: CLAIM_PREFIX + id });
  });
}
