import type { Timestamp } from "firebase-admin/firestore";
import { createBookingCode } from "@/lib/server/bookings";
import { adminDb } from "@/lib/server/firebase-admin";
import type { BookingDoc } from "@/lib/server/model";
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

    const code = await createBookingCode({
      packageId: String(body.packageId ?? ""),
      date: String(body.date ?? ""),
      seats: Number(body.seats ?? 0),
      label: String(body.label ?? ""),
      createdBy: session.uid,
    });
    return ok({ code });
  });
}
