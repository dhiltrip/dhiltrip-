import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import {
  HttpError,
  handle,
  isOwner,
  normalizeEmail,
  ok,
  readJson,
  requireSession,
  rolesFor,
  type StaffRole,
} from "@/lib/server/session";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ownerEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

/** Looks up the account that uses this email, if there is one yet. */
async function accountFor(email: string) {
  try {
    const user = await adminAuth().getUserByEmail(email);
    return { uid: user.uid, name: user.displayName ?? "", verified: user.emailVerified };
  } catch {
    return null;
  }
}

/** Copies the new role onto the person's profile so their menus change right away. */
async function syncProfile(email: string) {
  const account = await accountFor(email);
  if (!account) return;
  const ref = adminDb().collection("users").doc(account.uid);
  if ((await ref.get()).exists) await ref.update(await rolesFor(email, account.verified));
}

/** Everyone with staff access: the owners from the server settings and the people added in the Team tab. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const snap = await adminDb().collection("staff").get();
    const owners = ownerEmails();
    const entries = [
      ...owners.map((email) => ({ email, role: "admin" as StaffRole, owner: true, addedAt: 0 })),
      ...snap.docs
        .filter((doc) => !owners.includes(doc.id))
        .map((doc) => ({
          email: doc.id,
          role: doc.data().role as StaffRole,
          owner: false,
          addedAt: (doc.data().addedAt as Timestamp | undefined)?.toMillis() ?? 0,
        })),
    ];
    const items = await Promise.all(
      entries.map(async (entry) => {
        const account = await accountFor(entry.email);
        return { ...entry, name: account?.name ?? "", hasAccount: Boolean(account), verified: account?.verified ?? false };
      }),
    );
    return ok({ items });
  });
}

/** Adds someone to the team or changes their role. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request, ["admin"]);
    const body = await readJson<{ email: string; role: string }>(request);
    const email = normalizeEmail(String(body.email ?? ""));
    if (!EMAIL.test(email) || email.length > 120) throw new HttpError(400, "Please enter a valid email.");
    if (body.role !== "admin" && body.role !== "leader") throw new HttpError(400, "Choose Admin or Tour leader.");
    if (isOwner(email)) throw new HttpError(409, "This person is an owner and is always an admin.");
    if (email === normalizeEmail(session.email)) throw new HttpError(409, "You can't change your own role.");

    await adminDb()
      .collection("staff")
      .doc(email)
      .set({ role: body.role, addedBy: session.email, addedAt: FieldValue.serverTimestamp() }, { merge: true });
    await syncProfile(email);
    return ok({});
  });
}

/** Removes someone's staff access; they become a regular traveler again. */
export async function DELETE(request: Request) {
  return handle(async () => {
    const session = await requireSession(request, ["admin"]);
    const body = await readJson<{ email: string }>(request);
    const email = normalizeEmail(String(body.email ?? ""));
    if (isOwner(email)) throw new HttpError(409, "Owners can only be changed in the server settings.");
    if (email === normalizeEmail(session.email)) throw new HttpError(409, "You can't remove yourself.");
    await adminDb().collection("staff").doc(email).delete();
    await syncProfile(email);
    return ok({});
  });
}
