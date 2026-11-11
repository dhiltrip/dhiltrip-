import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { prefixOf } from "@/data/challenge";
import { getPackage } from "@/lib/server/packages";
import { adminDb } from "@/lib/server/firebase-admin";
import { bookingCodeFor, type BookingDoc } from "@/lib/server/model";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

/** Recent group bookings with how many travelers have joined each. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const snap = await adminDb().collection("bookings").orderBy("createdAt", "desc").limit(60).get();
    const items = snap.docs.map((doc) => {
      const data = doc.data() as BookingDoc & { createdAt?: Timestamp };
      return {
        code: doc.id,
        packageId: data.packageId,
        date: data.date,
        seats: data.seats,
        joined: data.members?.length ?? 0,
        label: data.label,
        active: data.active,
      };
    });
    return ok({ items });
  });
}

/** Deletes a booking code nobody has joined yet. Codes with travelers can only be turned off. */
export async function DELETE(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const { code } = await readJson<{ code: string }>(request);
    const ref = adminDb().collection("bookings").doc(String(code ?? "").toUpperCase());
    await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpError(404, "This booking code was not found.");
      if (((snap.data() as BookingDoc).members?.length ?? 0) > 0) {
        throw new HttpError(409, "Travelers already joined with this code. Turn it off instead.");
      }
      tx.delete(ref);
    });
    return ok({});
  });
}

/** Creates a group booking code after the admin confirms payment on WhatsApp. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request, ["admin"]);
    const body = await readJson<{ packageId: string; date: string; seats: number; label: string; active: boolean; code: string }>(request);

    // Turning a code on or off.
    if (body.code) {
      const ref = adminDb().collection("bookings").doc(String(body.code).toUpperCase());
      await ref.update({ active: body.active === true });
      return ok({});
    }

    const packageId = String(body.packageId ?? "");
    const pkg = await getPackage(packageId);
    if (!pkg) throw new HttpError(400, "Choose a package.");
    const date = String(body.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "Choose the trip date.");
    const seats = Math.floor(Number(body.seats ?? 0));
    if (!Number.isFinite(seats) || seats < 1 || seats > 100) throw new HttpError(400, "Seats must be between 1 and 100.");
    const label = String(body.label ?? "").trim().slice(0, 80);

    const booking: BookingDoc & { createdAt: FieldValue } = {
      packageId,
      date,
      seats,
      label,
      members: [],
      active: true,
      createdBy: session.uid,
      createdAt: FieldValue.serverTimestamp(),
    };
    // A clash on the random part is unlikely; retry a few times if it happens.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = bookingCodeFor(prefixOf(pkg), date);
      try {
        await adminDb().collection("bookings").doc(code).create(booking);
        return ok({ code });
      } catch (error) {
        if ((error as { code?: number }).code !== 6) throw error;
      }
    }
    throw new HttpError(500, "Could not create a unique code. Please try again.");
  });
}
