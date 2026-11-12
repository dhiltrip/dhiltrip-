import { adminDb } from "@/lib/server/firebase-admin";
import type { TripDoc } from "@/lib/server/model";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

const ITEMS = ["tumbler", "teloBag"] as const;

/** The traveler ticks their own Eco Mission checklist. It earns no points; the guide's QR does that. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const body = await readJson<{ item: string; done: boolean }>(request);
    const item = ITEMS.find((name) => name === body.item);
    if (!item) throw new HttpError(400, "Unknown mission item.");
    const ref = adminDb().collection("users").doc(session.uid);
    const trip = (await ref.get()).data()?.trip as TripDoc | null | undefined;
    if (!trip) throw new HttpError(409, "Choose your travel package first.");
    await ref.update({ [`trip.mission.${item}`]: body.done === true });
    return ok({});
  });
}
