import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import type { BookingRequest } from "@/data/booking";
import { createBookingCode } from "@/lib/server/bookings";
import { adminDb } from "@/lib/server/firebase-admin";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

function toRequest(id: string, data: Record<string, unknown>): BookingRequest {
  return {
    id,
    uid: String(data.uid ?? ""),
    packageId: String(data.packageId ?? ""),
    packageTitle: String(data.packageTitle ?? ""),
    date: String(data.date ?? ""),
    people: Number(data.people ?? 1),
    fullName: String(data.fullName ?? ""),
    country: String(data.country ?? ""),
    passport: String(data.passport ?? ""),
    email: String(data.email ?? ""),
    whatsapp: String(data.whatsapp ?? ""),
    meetingPoint: String(data.meetingPoint ?? ""),
    totalLabel: String(data.totalLabel ?? ""),
    status: (data.status as BookingRequest["status"]) ?? "new",
    code: (data.code as string | null) ?? null,
    adminNote: String(data.adminNote ?? ""),
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? 0,
  };
}

/** Booking requests, newest first; with ?proof=<id>, the payment photo of one request. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const db = adminDb();
    const proofId = new URL(request.url).searchParams.get("proof");
    if (proofId) {
      const snap = await db.collection("bookingProofs").doc(proofId).get();
      const data = snap.data() as { data?: string; contentType?: string } | undefined;
      if (!data?.data) throw new HttpError(404, "No payment photo found.");
      return ok({ dataUrl: `data:${data.contentType ?? "image/webp"};base64,${data.data}` });
    }
    const snap = await db.collection("bookingRequests").orderBy("createdAt", "desc").limit(100).get();
    return ok({ items: snap.docs.map((doc) => toRequest(doc.id, doc.data())) });
  });
}

/** Confirm (creates the booking code), reject, or reopen a request. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request, ["admin"]);
    const body = await readJson<{ id: string; action: string; note: string }>(request);
    const ref = adminDb().collection("bookingRequests").doc(String(body.id ?? ""));
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "This booking request was not found.");
    const current = toRequest(snap.id, snap.data() ?? {});
    const note = String(body.note ?? "").trim().slice(0, 200);

    if (body.action === "confirm") {
      if (current.status === "confirmed" && current.code) return ok({ code: current.code });
      const code = await createBookingCode({
        packageId: current.packageId,
        date: current.date,
        seats: current.people,
        label: `${current.fullName} (${current.country})`,
        createdBy: session.uid,
      });
      await ref.update({ status: "confirmed", code, adminNote: note, decidedAt: FieldValue.serverTimestamp(), decidedBy: session.email });
      return ok({ code });
    }
    if (body.action === "reject") {
      await ref.update({ status: "rejected", adminNote: note, decidedAt: FieldValue.serverTimestamp(), decidedBy: session.email });
      return ok({});
    }
    if (body.action === "reopen") {
      await ref.update({ status: "new", adminNote: note });
      return ok({});
    }
    throw new HttpError(400, "Unknown action.");
  });
}

/** Deletes a request and its payment photo for good (e.g. spam or a duplicate). */
export async function DELETE(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const { id } = await readJson<{ id: string }>(request);
    const db = adminDb();
    const ref = db.collection("bookingRequests").doc(String(id ?? ""));
    if (!(await ref.get()).exists) throw new HttpError(404, "This booking request was not found.");
    await ref.delete();
    await db.collection("bookingProofs").doc(ref.id).delete();
    return ok({});
  });
}
