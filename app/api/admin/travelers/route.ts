import type { Timestamp } from "firebase-admin/firestore";
import { requestRef } from "@/data/booking";
import type { Traveler, TravelerBooking, TravelerRedemption } from "@/data/travelers";
import { adminDb } from "@/lib/server/firebase-admin";
import { handle, ok, requireSession } from "@/lib/server/session";

const millis = (value: unknown) => (value as Timestamp | undefined)?.toMillis?.() ?? 0;

/** Every account with its in-app bookings and souvenir redemptions, so admins can follow up. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const db = adminDb();
    const [users, requests, redemptions] = await Promise.all([
      db.collection("users").limit(1000).get(),
      db.collection("bookingRequests").limit(1000).get(),
      db.collection("redemptions").limit(2000).get(),
    ]);

    const bookingsBy = new Map<string, TravelerBooking[]>();
    for (const doc of requests.docs) {
      const data = doc.data();
      const list = bookingsBy.get(String(data.uid)) ?? [];
      list.push({
        id: doc.id,
        ref: requestRef(doc.id),
        packageTitle: String(data.packageTitle ?? ""),
        date: String(data.date ?? ""),
        people: Number(data.people ?? 1),
        status: String(data.status ?? "new"),
        code: (data.code as string | null) ?? null,
        createdAt: millis(data.createdAt),
      });
      bookingsBy.set(String(data.uid), list);
    }

    const redemptionsBy = new Map<string, TravelerRedemption[]>();
    for (const doc of redemptions.docs) {
      const data = doc.data();
      const list = redemptionsBy.get(String(data.uid)) ?? [];
      list.push({
        id: doc.id,
        rewardLabel: String(data.rewardLabel ?? ""),
        points: Number(data.points ?? 0),
        status: String(data.status ?? "pending"),
        bookingCode: (data.bookingCode as string | null) ?? null,
        createdAt: millis(data.createdAt),
        handedAt: millis(data.handedAt),
      });
      redemptionsBy.set(String(data.uid), list);
    }

    const newestFirst = <T extends { createdAt: number }>(list: T[] = []) => list.sort((a, b) => b.createdAt - a.createdAt);
    const items: Traveler[] = users.docs.map((doc) => {
      const data = doc.data();
      const trip = (data.trip ?? null) as { code?: string; packageId?: string } | null;
      return {
        uid: doc.id,
        name: String(data.name ?? ""),
        email: String(data.email ?? ""),
        role: String(data.role ?? "participant"),
        points: Number(data.points ?? 0),
        bottles: Number(data.bottlesTotal ?? 0),
        weightGrams: Number(data.weightGrams ?? 0),
        tripCode: trip?.code ?? null,
        tripPackageId: trip?.packageId ?? null,
        createdAt: millis(data.createdAt),
        bookings: newestFirst(bookingsBy.get(doc.id)),
        redemptions: newestFirst(redemptionsBy.get(doc.id)),
      };
    });

    // Most recent activity first.
    const lastActivity = (item: Traveler) =>
      Math.max(item.createdAt, item.bookings[0]?.createdAt ?? 0, item.redemptions[0]?.createdAt ?? 0);
    items.sort((a, b) => lastActivity(b) - lastActivity(a));
    return ok({ items });
  });
}
