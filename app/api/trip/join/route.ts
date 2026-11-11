import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";
import { getPackage } from "@/lib/server/packages";
import {
  addDays,
  todayInJogja,
  type BookingDoc,
  type TripDoc,
} from "@/lib/server/model";
import {
  HttpError,
  handle,
  ok,
  readJson,
  requireSession,
} from "@/lib/server/session";

class WrongPackage extends Error {
  constructor(readonly packageId: string) {
    super("wrong package");
  }
}

/** Joins a trip with the group booking code an admin sent after payment. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const body = await readJson<{ code: string; packageId: string }>(request);
    const code = String(body.code ?? "")
      .trim()
      .toUpperCase();
    const packageId = String(body.packageId ?? "");
    if (!code) throw new HttpError(400, "Please enter your booking code.");

    const db = adminDb();
    const bookingRef = db.collection("bookings").doc(code);
    const userRef = db.collection("users").doc(session.uid);

    const joined = await db
      .runTransaction(async (tx) => {
        const [bookingSnap, userSnap] = await Promise.all([
          tx.get(bookingRef),
          tx.get(userRef),
        ]);
        if (!bookingSnap.exists)
          throw new HttpError(
            404,
            "This booking code was not found. Please check it with our admin.",
          );
        const booking = bookingSnap.data() as BookingDoc;
        if (!booking.active)
          throw new HttpError(410, "This booking code is no longer active.");
        if (todayInJogja() > addDays(booking.date, 1))
          throw new HttpError(410, "This booking code has expired.");
        if (packageId && booking.packageId !== packageId)
          throw new WrongPackage(booking.packageId);
        const isMember = booking.members.includes(session.uid);
        if (!isMember && booking.members.length >= booking.seats) {
          throw new HttpError(409, "This booking is already full.");
        }

        const previous = userSnap.data()?.trip as TripDoc | null | undefined;
        // Rejoining the same booking keeps the progress made so far.
        const trip: TripDoc =
          previous && previous.code === code
            ? previous
            : {
                code,
                packageId: booking.packageId,
                bottles: 0,
                tumbler: false,
                teloBag: false,
                visited: [],
              };

        if (!isMember)
          tx.update(bookingRef, {
            members: FieldValue.arrayUnion(session.uid),
          });
        tx.set(userRef, { trip }, { merge: true });
        return trip;
      })
      .catch(async (error) => {
        if (!(error instanceof WrongPackage)) throw error;
        const right = await getPackage(error.packageId);
        throw new HttpError(
          409,
          `This code is for ${right?.title ?? "another package"}.`,
        );
      });

    return ok({ packageId: joined.packageId });
  });
}
