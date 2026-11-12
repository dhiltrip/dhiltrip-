import { FieldValue } from "firebase-admin/firestore";
import { MAX_TRAVELERS, requestRef } from "@/data/booking";
import { adminDb } from "@/lib/server/firebase-admin";
import { readImage } from "@/lib/server/images";
import { todayInJogja } from "@/lib/server/model";
import { getPackage } from "@/lib/server/packages";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

type Body = {
  packageId: string;
  date: string;
  people: number;
  fullName: string;
  country: string;
  passport: string;
  email: string;
  whatsapp: string;
  meetingPoint: string;
  totalLabel: string;
  proofData: string;
  consent: boolean;
};

const text = (value: unknown, label: string, min: number, max: number) => {
  const result = String(value ?? "").trim();
  if (result.length < min) throw new HttpError(400, `Please fill in ${label}.`);
  if (result.length > max) throw new HttpError(400, `${label[0].toUpperCase()}${label.slice(1)} is too long.`);
  return result;
};

/**
 * A traveler books a trip from the app: details plus a photo of the bank transfer.
 * The request is private: only the traveler and admins can see it.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const body = await readJson<Body>(request);
    if (body.consent !== true) throw new HttpError(400, "Please agree to how we use your booking details.");

    const pkg = await getPackage(String(body.packageId ?? ""));
    if (!pkg || pkg.hidden) throw new HttpError(400, "This package is not available.");
    const date = String(body.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "Choose the tour date.");
    if (date < todayInJogja()) throw new HttpError(400, "The tour date can't be in the past.");
    const people = Math.floor(Number(body.people ?? 0));
    if (!Number.isFinite(people) || people < 1 || people > MAX_TRAVELERS) throw new HttpError(400, `Number of people must be 1 to ${MAX_TRAVELERS}.`);

    const email = text(body.email, "your email", 5, 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Please enter a valid email.");
    const whatsapp = text(body.whatsapp, "your WhatsApp number", 8, 20).replace(/[^\d+]/g, "");
    if (!/^\+?\d{8,16}$/.test(whatsapp)) throw new HttpError(400, "Please enter a valid WhatsApp number, e.g. +62 812 3456 7890.");
    const passport = text(body.passport, "your passport number", 5, 20).toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9-]{5,20}$/.test(passport)) throw new HttpError(400, "The passport number should only have letters and numbers.");

    const db = adminDb();
    // Avoid floods of unanswered requests from one account.
    const open = await db.collection("bookingRequests").where("uid", "==", session.uid).where("status", "==", "new").get();
    if (open.size >= 5) throw new HttpError(429, "You already have 5 bookings waiting. Please wait for our admin to reply.");

    const proof = readImage(String(body.proofData ?? ""));
    const ref = db.collection("bookingRequests").doc();
    await db.collection("bookingProofs").doc(ref.id).set({ ...proof, uid: session.uid, createdAt: FieldValue.serverTimestamp() });
    await ref.set({
      uid: session.uid,
      packageId: pkg.id,
      packageTitle: pkg.title,
      date,
      people,
      fullName: text(body.fullName, "your full name", 2, 80),
      country: text(body.country, "your country", 2, 60),
      passport,
      email,
      whatsapp,
      meetingPoint: text(body.meetingPoint, "the meeting point", 2, 120),
      totalLabel: String(body.totalLabel ?? "").trim().slice(0, 60),
      status: "new",
      code: null,
      adminNote: "",
      createdAt: FieldValue.serverTimestamp(),
    });
    return ok({ id: ref.id, ref: requestRef(ref.id) });
  });
}
