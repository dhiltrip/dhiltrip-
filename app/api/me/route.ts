import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";
import type { UserDoc } from "@/lib/server/model";
import { handle, ok, readJson, requireSession } from "@/lib/server/session";

/** Creates the traveler's profile on first sign-in and keeps their name and role current. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const body = await readJson<{ name: string }>(request);
    const name = String(body.name ?? "").trim().slice(0, 60);
    const ref = adminDb().collection("users").doc(session.uid);

    await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        const fresh: UserDoc & { createdAt: FieldValue } = {
          name: name || session.name,
          email: session.email,
          role: session.role,
          pendingRole: session.pendingRole,
          points: 0,
          bottlesTotal: 0,
          teloBagsUsed: 0,
          trip: null,
          createdAt: FieldValue.serverTimestamp(),
        };
        tx.set(ref, fresh);
        return;
      }
      const updates: Partial<UserDoc> = { role: session.role, pendingRole: session.pendingRole, email: session.email };
      if (name) updates.name = name;
      tx.update(ref, updates);
    });

    return ok({ role: session.role, pendingRole: session.pendingRole });
  });
}
