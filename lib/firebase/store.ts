"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { collection, doc, onSnapshot, query, where, type Timestamp } from "firebase/firestore";
import { callApi, clientAuth, clientDb } from "@/lib/firebase/client";
import type { ChallengeState, Redemption } from "@/lib/challenge-store";

/** Live view of the signed-in traveler, kept in sync with Firestore. */

type UserData = {
  name?: string;
  email?: string;
  role?: "participant" | "leader" | "admin";
  pendingRole?: "leader" | "admin" | null;
  points?: number;
  bottlesTotal?: number;
  teloBagsUsed?: number;
  trip?: { code: string; packageId: string; bottles: number; tumbler: boolean; teloBag: boolean; visited: string[] } | null;
};

let state: ChallengeState | null = null;
let started = false;
const listeners = new Set<() => void>();
let stopUser: (() => void) | undefined;
let stopRedemptions: (() => void) | undefined;
let stock: Record<string, number> = {};
const stockListeners = new Set<() => void>();

const signedOut: ChallengeState = {
  user: null,
  bookingCode: null,
  packageId: null,
  points: 0,
  bottlesThisTrip: 0,
  bottlesTotal: 0,
  tumblerClaimed: false,
  teloBagClaimed: false,
  teloBagsUsed: 0,
  visitedStopIds: [],
  redemptions: [],
  usedClaimIds: [],
};

function emit(next: ChallengeState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function toState(user: User, data: UserData | null, redemptions: Redemption[]): ChallengeState {
  const trip = data?.trip ?? null;
  return {
    user: { name: data?.name || user.displayName || user.email?.split("@")[0] || "Traveler", email: user.email ?? "" },
    role: data?.role ?? "participant",
    pendingRole: data?.pendingRole ?? null,
    bookingCode: trip?.code ?? null,
    packageId: trip?.packageId ?? null,
    points: data?.points ?? 0,
    bottlesThisTrip: trip?.bottles ?? 0,
    bottlesTotal: data?.bottlesTotal ?? 0,
    tumblerClaimed: trip?.tumbler ?? false,
    teloBagClaimed: trip?.teloBag ?? false,
    teloBagsUsed: data?.teloBagsUsed ?? 0,
    visitedStopIds: trip?.visited ?? [],
    redemptions,
    usedClaimIds: [],
  };
}

function start() {
  if (started) return;
  started = true;

  onSnapshot(collection(clientDb(), "rewardStock"), (snap) => {
    stock = Object.fromEntries(snap.docs.map((item) => [item.id, Number(item.data().stock ?? 0)]));
    stockListeners.forEach((listener) => listener());
  }, (error) => console.warn("Reward stock is unavailable:", error.code));

  onAuthStateChanged(clientAuth(), async (user) => {
    // Signing in ends guest mode.
    if (user) {
      try {
        window.localStorage.removeItem("dhiltrip-guest");
      } catch {}
    }
    stopUser?.();
    stopRedemptions?.();
    if (!user) {
      emit(signedOut);
      return;
    }
    // Show the traveler straight away; the profile fills in once Firestore answers.
    emit(toState(user, null, []));
    await callApi("/api/me", { name: user.displayName ?? "" });

    let data: UserData | null = null;
    let redemptions: Redemption[] = [];
    const push = () => emit(toState(user, data, redemptions));
    stopUser = onSnapshot(doc(clientDb(), "users", user.uid), (snap) => {
      data = (snap.data() as UserData | undefined) ?? null;
      push();
    }, (error) => console.warn("Profile is unavailable:", error.code));
    stopRedemptions = onSnapshot(
      query(collection(clientDb(), "redemptions"), where("uid", "==", user.uid)),
      (snap) => {
        redemptions = snap.docs
          .map((item) => {
            const value = item.data();
            return {
              id: item.id,
              rewardId: String(value.rewardId),
              points: Number(value.points ?? 0),
              createdAt: new Date((value.createdAt as Timestamp | undefined)?.toMillis() ?? Date.now()).toISOString(),
            };
          })
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        push();
      },
      (error) => console.warn("Redemptions are unavailable:", error.code),
    );
  });
}

export function subscribeFirebase(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const firebaseSnapshot = () => state;

export function subscribeStock(listener: () => void) {
  start();
  stockListeners.add(listener);
  return () => stockListeners.delete(listener);
}

export const stockSnapshot = () => stock;

const authMessage = (error: unknown) => {
  const code = (error as { code?: string }).code ?? "";
  if (code.includes("popup-closed") || code.includes("cancelled-popup")) return "Sign-in was cancelled.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "Email or password is incorrect.";
  if (code.includes("email-already-in-use")) return "This email already has an account. Sign in instead.";
  if (code.includes("weak-password")) return "Use a password of at least 6 characters.";
  if (code.includes("invalid-email")) return "Please enter a valid email.";
  if (code.includes("network")) return "No connection. Please try again.";
  return "Sign-in failed. Please try again.";
};

export type AuthResult = { ok: true } | { ok: false; message: string };

export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    await signInWithPopup(clientAuth(), new GoogleAuthProvider());
    return { ok: true };
  } catch (error) {
    return { ok: false, message: authMessage(error) };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    await signInWithEmailAndPassword(clientAuth(), email.trim(), password);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: authMessage(error) };
  }
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<AuthResult> {
  try {
    const { user } = await createUserWithEmailAndPassword(clientAuth(), email.trim(), password);
    await updateProfile(user, { displayName: name.trim() });
    // Staff tools only unlock for verified emails, so ask for it right away.
    await sendEmailVerification(user).catch(() => undefined);
    await callApi("/api/me", { name: name.trim() });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: authMessage(error) };
  }
}

/** Sends the "verify your email" link again. */
export async function sendVerificationEmail(): Promise<AuthResult> {
  const user = clientAuth().currentUser;
  if (!user) return { ok: false, message: "Please sign in again." };
  try {
    await sendEmailVerification(user);
    return { ok: true };
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    return { ok: false, message: code.includes("too-many") ? "Please wait a few minutes before sending another email." : "Could not send the email. Please try again." };
  }
}

/** After the person clicks the link in their email: refresh the account so the server sees it is verified. */
export async function recheckVerification(): Promise<AuthResult> {
  const user = clientAuth().currentUser;
  if (!user) return { ok: false, message: "Please sign in again." };
  try {
    await user.reload();
    if (!user.emailVerified) return { ok: false, message: "Not verified yet. Open the link in the email we sent, then try again." };
    await user.getIdToken(true);
    await callApi("/api/me", {});
    return { ok: true };
  } catch {
    return { ok: false, message: "Please try again." };
  }
}

export const signOutFirebase = () => firebaseSignOut(clientAuth());

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  try {
    await sendPasswordResetEmail(clientAuth(), email.trim());
    return { ok: true };
  } catch (error) {
    return { ok: false, message: authMessage(error) };
  }
}
