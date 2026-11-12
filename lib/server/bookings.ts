import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { prefixOf } from "@/data/challenge";
import { adminDb } from "@/lib/server/firebase-admin";
import { bookingCodeFor, type BookingDoc } from "@/lib/server/model";
import { getPackage } from "@/lib/server/packages";
import { HttpError } from "@/lib/server/session";

/** Creates a group booking code. Used by the admin form and when a booking request is confirmed. */
export async function createBookingCode(input: { packageId: string; date: string; seats: number; label: string; createdBy: string }) {
  const pkg = await getPackage(input.packageId);
  if (!pkg) throw new HttpError(400, "Choose a package.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new HttpError(400, "Choose the trip date.");
  const seats = Math.floor(Number(input.seats));
  if (!Number.isFinite(seats) || seats < 1 || seats > 100) throw new HttpError(400, "Seats must be between 1 and 100.");

  const booking: BookingDoc & { createdAt: FieldValue } = {
    packageId: pkg.id,
    date: input.date,
    seats,
    label: input.label.trim().slice(0, 80),
    members: [],
    active: true,
    createdBy: input.createdBy,
    createdAt: FieldValue.serverTimestamp(),
  };
  // A clash on the random part is unlikely; retry a few times if it happens.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = bookingCodeFor(prefixOf(pkg), input.date);
    try {
      await adminDb().collection("bookings").doc(code).create(booking);
      return code;
    } catch (error) {
      if ((error as { code?: number }).code !== 6) throw error;
    }
  }
  throw new HttpError(500, "Could not create a unique code. Please try again.");
}
