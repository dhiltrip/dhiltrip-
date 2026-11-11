import "server-only";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";

export type Role = "participant" | "leader" | "admin";
export type StaffRole = "leader" | "admin";

export type Session = {
  uid: string;
  email: string;
  name: string;
  role: Role;
  /** A staff role this person has but cannot use until their email is verified. */
  pendingRole: StaffRole | null;
};

const emailList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Owners are set in the server settings (ADMIN_EMAILS) and can never be removed from the app. */
export const isOwner = (email: string) => emailList(process.env.ADMIN_EMAILS).includes(normalizeEmail(email));

/** The staff role given to an email, by the owners list or the Team tab (Firestore staff/{email}). */
export async function staffRoleFor(email: string): Promise<StaffRole | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  if (isOwner(normalized)) return "admin";
  // Older setting, still honoured.
  if (emailList(process.env.LEADER_EMAILS).includes(normalized)) return "leader";
  const snap = await adminDb().collection("staff").doc(normalized).get();
  const role = snap.data()?.role;
  return role === "admin" || role === "leader" ? role : null;
}

/**
 * Roles are decided on the server so nobody can promote themselves from the browser.
 * Staff roles need a verified email, otherwise anyone could sign up with a staff address first.
 */
export async function rolesFor(email: string, emailVerified: boolean) {
  const staff = await staffRoleFor(email);
  return {
    role: (staff && emailVerified ? staff : "participant") as Role,
    pendingRole: staff && !emailVerified ? staff : null,
  };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireSession(request: Request, roles?: Role[]): Promise<Session> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Please sign in again.");
  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch {
    throw new HttpError(401, "Please sign in again.");
  }
  const email = decoded.email ?? "";
  const session: Session = {
    uid: decoded.uid,
    email,
    name: (decoded.name as string | undefined) ?? email.split("@")[0] ?? "Traveler",
    ...(await rolesFor(email, decoded.email_verified === true)),
  };
  if (roles && !roles.includes(session.role)) throw new HttpError(403, "You do not have access to this.");
  return session;
}

export const ok = <T extends object>(data: T) => NextResponse.json({ ok: true, ...data });

/** Turns thrown errors into the { ok: false, message } shape the app expects. */
export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ ok: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>;
  } catch {
    return {};
  }
}
