import { adminDb } from "@/lib/server/firebase-admin";
import { getPackage } from "@/lib/server/packages";
import type { TripDoc } from "@/lib/server/model";
import {
  HttpError,
  handle,
  ok,
  readJson,
  requireSession,
} from "@/lib/server/session";

/** Ticks or unticks a place of the traveler's package. Route-choice packages keep only one. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const body = await readJson<{ stopId: string }>(request);
    const stopId = String(body.stopId ?? "");
    const db = adminDb();
    const userRef = db.collection("users").doc(session.uid);
    const current = (await userRef.get()).data()?.trip as
      TripDoc | null | undefined;
    const pkg = await getPackage(current?.packageId);

    const visited = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const trip = snap.data()?.trip as TripDoc | null | undefined;
      if (!trip) throw new HttpError(409, "Choose your travel package first.");
      if (!pkg || pkg.id !== trip.packageId)
        throw new HttpError(409, "Your trip changed. Please try again.");
      if (!pkg.stops.some((stop) => stop.id === stopId))
        throw new HttpError(400, "This place is not part of your trip.");

      const ticked = trip.visited.includes(stopId);
      let next: string[];
      if (pkg.routeChoice) next = ticked ? [] : [stopId];
      else
        next = ticked
          ? trip.visited.filter((id) => id !== stopId)
          : [...trip.visited, stopId];

      tx.update(userRef, { "trip.visited": next });
      return next;
    });

    return ok({ visited });
  });
}
