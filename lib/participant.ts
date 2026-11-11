"use client";

import { useSyncExternalStore } from "react";
import * as demo from "@/lib/challenge-store";
import { callApi, firebaseEnabled } from "@/lib/firebase/client";
import {
  firebaseSnapshot,
  recheckVerification,
  sendVerificationEmail,
  signOutFirebase,
  stockSnapshot,
  subscribeFirebase,
  subscribeStock,
} from "@/lib/firebase/store";

/**
 * One entry point for the participant screens. With Firebase configured every change goes
 * through the server; without it the app runs the on-device demo.
 */

export type { ChallengeState, ClaimResult, PointsGain, RedeemResult } from "@/lib/challenge-store";
export { firebaseEnabled, recheckVerification, sendVerificationEmail };

export type ActionResult = { ok: true } | { ok: false; message: string };

// Guest mode is remembered on this device until the visitor signs in or leaves it.
const GUEST_KEY = "dhiltrip-guest";
const guestListeners = new Set<() => void>();
const readGuest = () => {
  try {
    return window.localStorage.getItem(GUEST_KEY) === "1";
  } catch {
    return false;
  }
};
const subscribeGuest = (listener: () => void) => {
  guestListeners.add(listener);
  return () => guestListeners.delete(listener);
};
function setGuest(on: boolean) {
  try {
    if (on) window.localStorage.setItem(GUEST_KEY, "1");
    else window.localStorage.removeItem(GUEST_KEY);
  } catch {
    // Storage can be blocked; guest mode then lasts for this visit only.
  }
  guestListeners.forEach((listener) => listener());
}

export const continueAsGuest = () => setGuest(true);
export const leaveGuestMode = () => setGuest(false);

const GUEST_STATE: demo.ChallengeState = {
  user: { name: "Guest", email: "" },
  role: "participant",
  isGuest: true,
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

export function useChallenge(): demo.ChallengeState | null {
  const state = useSyncExternalStore(
    firebaseEnabled ? subscribeFirebase : demo.subscribeDemo,
    firebaseEnabled ? firebaseSnapshot : demo.demoSnapshot,
    () => null,
  );
  const guest = useSyncExternalStore(subscribeGuest, readGuest, () => false);
  if (state && !state.user && guest) return GUEST_STATE;
  return state;
}

const GUEST_MESSAGE = "Create a free account to join trips, collect points and redeem rewards.";
const isGuestNow = () => typeof window !== "undefined" && readGuest() && !(firebaseEnabled ? firebaseSnapshot() : demo.demoSnapshot())?.user;
const guestBlocked = { ok: false as const, message: GUEST_MESSAGE };

const NO_STOCK: Record<string, number> = {};
const noSubscription = () => () => undefined;

/** Remaining stock per reward id; a missing id means unlimited. */
export function useRewardStock(): Record<string, number> {
  return useSyncExternalStore(
    firebaseEnabled ? subscribeStock : noSubscription,
    firebaseEnabled ? stockSnapshot : () => NO_STOCK,
    () => NO_STOCK,
  );
}

// The "+points" animation in the header, shown right after a successful scan.
let lastGain: demo.PointsGain = null;
const gainListeners = new Set<() => void>();
const subscribeGain = (listener: () => void) => {
  gainListeners.add(listener);
  return () => gainListeners.delete(listener);
};

export function useLastGain(): demo.PointsGain {
  return useSyncExternalStore(subscribeGain, () => lastGain, () => null);
}

function announceGain(points: number) {
  if (points <= 0) return;
  lastGain = { amount: points, at: Date.now() };
  gainListeners.forEach((listener) => listener());
}

/** Tour leaders and admins can create bottle codes; in the demo everyone can. */
export const canLead = (state: demo.ChallengeState | null) =>
  !firebaseEnabled || state?.role === "leader" || state?.role === "admin";

export const isAdmin = (state: demo.ChallengeState | null) => firebaseEnabled && state?.role === "admin";

export async function joinTrip(code: string, packageId: string): Promise<ActionResult> {
  if (isGuestNow()) return guestBlocked;
  if (!firebaseEnabled) {
    demo.joinTrip(code, packageId);
    return { ok: true };
  }
  return callApi("/api/trip/join", { code, packageId });
}

export async function leaveTrip(): Promise<ActionResult> {
  if (!firebaseEnabled) {
    demo.leaveTrip();
    return { ok: true };
  }
  return callApi("/api/trip/leave", {});
}

export async function toggleVisited(stopId: string): Promise<ActionResult> {
  if (isGuestNow()) return guestBlocked;
  if (!firebaseEnabled) {
    demo.toggleVisited(stopId);
    return { ok: true };
  }
  return callApi("/api/trip/visit", { stopId });
}

export async function chooseRoute(stopId: string, routeIds: string[]): Promise<ActionResult> {
  if (isGuestNow()) return guestBlocked;
  if (!firebaseEnabled) {
    demo.chooseRoute(stopId, routeIds);
    return { ok: true };
  }
  // The server knows which packages are a route choice and keeps only one.
  return callApi("/api/trip/visit", { stopId });
}

export async function redeemClaim(code: string): Promise<demo.ClaimResult> {
  if (isGuestNow()) return guestBlocked;
  const result = firebaseEnabled
    ? await callApi<{ points: number; bottles: number; capped: boolean }>("/api/claims/redeem", { code })
    : demo.redeemClaim(code);
  if (result.ok) announceGain(result.points);
  return result;
}

export async function redeemReward(rewardId: string): Promise<demo.RedeemResult> {
  if (isGuestNow()) return guestBlocked;
  if (!firebaseEnabled) return demo.redeemReward(rewardId);
  return callApi("/api/rewards/redeem", { rewardId });
}

export async function createClaimCode(input: { bottles: number; tumbler: boolean; teloBag: boolean }) {
  if (!firebaseEnabled) return { ok: true as const, code: demo.createClaimCode(input) };
  return callApi<{ code: string }>("/api/claims", input);
}

export async function signOut() {
  setGuest(false);
  if (firebaseEnabled) await signOutFirebase();
  else demo.signOut();
}

export const signInDemo = (name: string, email: string) => {
  setGuest(false);
  demo.signIn(name, email);
};
export const resetDemo = demo.resetDemo;
