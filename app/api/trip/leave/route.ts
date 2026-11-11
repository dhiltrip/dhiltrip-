import { adminDb } from "@/lib/server/firebase-admin";
import { handle, ok, requireSession } from "@/lib/server/session";

/** Lets the traveler go back to the catalog; their points stay. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    await adminDb().collection("users").doc(session.uid).set({ trip: null }, { merge: true });
    return ok({});
  });
}
