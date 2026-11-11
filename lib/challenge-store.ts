"use client";

import { useSyncExternalStore } from "react";
import { POINTS, findReward } from "@/data/challenge";

/**
 * Demo backend: every value lives in this browser's localStorage.
 * It exists so the participant flow can be tried before Firebase is connected.
 * Points must be calculated on the server before real users are allowed in.
 */

const STORAGE_KEY = "dhiltrip-challenge-demo-v1";

export type Redemption = {
  id: string;
  rewardId: string;
  points: number;
  createdAt: string;
};

export type ChallengeState = {
  user: { name: string; email: string } | null;
  /** Set from the server when Firebase is connected; the demo treats everyone as a tour leader too. */
  role?: "participant" | "leader" | "admin";
  /** A staff role waiting for the person to verify their email. */
  pendingRole?: "leader" | "admin" | null;
  /** Browsing without an account: packages, map and rewards are visible, actions ask to sign up. */
  isGuest?: boolean;
  bookingCode: string | null;
  packageId: string | null;
  points: number;
  bottlesThisTrip: number;
  bottlesTotal: number;
  tumblerClaimed: boolean;
  teloBagClaimed: boolean;
  teloBagsUsed: number;
  visitedStopIds: string[];
  redemptions: Redemption[];
  usedClaimIds: string[];
};

const emptyState: ChallengeState = {
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

let state: ChallengeState | null = null;
const listeners = new Set<() => void>();

export type PointsGain = { amount: number; at: number } | null;
// Kept out of storage so the "+points" animation only plays right after a scan.
let lastGain: PointsGain = null;

function read(): ChallengeState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    state = raw ? { ...emptyState, ...JSON.parse(raw) } : emptyState;
  } catch {
    state = emptyState;
  }
  return state as ChallengeState;
}

function write(next: ChallengeState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing can block storage; the session still works in memory.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeDemo(listener: () => void) {
  return subscribe(listener);
}

export const demoSnapshot = () => read();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The most recent points earned in this visit, used for the header animation. */
export function useLastGain(): PointsGain {
  return useSyncExternalStore(subscribe, () => lastGain, () => null);
}

/** Returns null during server rendering and the first client paint. */
export function useChallenge(): ChallengeState | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

const newId = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export function signIn(name: string, email: string) {
  write({ ...read(), user: { name: name.trim(), email: email.trim() } });
}

export function signOut() {
  write(emptyState);
}

export function joinTrip(bookingCode: string, packageId: string) {
  write({
    ...read(),
    bookingCode: bookingCode.trim().toUpperCase(),
    packageId,
    bottlesThisTrip: 0,
    tumblerClaimed: false,
    teloBagClaimed: false,
    visitedStopIds: [],
  });
}

export function leaveTrip() {
  write({ ...read(), bookingCode: null, packageId: null });
}

export function resetDemo() {
  write(emptyState);
}

/** The participant ticks a place on their own; no location data is used. */
export function toggleVisited(stopId: string) {
  const current = read();
  const visitedStopIds = current.visitedStopIds.includes(stopId)
    ? current.visitedStopIds.filter((id) => id !== stopId)
    : [...current.visitedStopIds, stopId];
  write({ ...current, visitedStopIds });
}

/** For packages where the traveler takes one of several routes: picking one clears the others. */
export function chooseRoute(stopId: string, routeIds: string[]) {
  const current = read();
  const others = current.visitedStopIds.filter((id) => !routeIds.includes(id));
  const alreadyChosen = current.visitedStopIds.includes(stopId);
  write({ ...current, visitedStopIds: alreadyChosen ? others : [...others, stopId] });
}

export type Claim = {
  id: string;
  bottles: number;
  tumbler: boolean;
  teloBag: boolean;
};

export function createClaimCode(input: Omit<Claim, "id">) {
  return [
    "DT1",
    newId(),
    input.bottles,
    input.tumbler ? 1 : 0,
    input.teloBag ? 1 : 0,
  ].join("-");
}

export function parseClaimCode(raw: string): Claim | null {
  const parts = raw.trim().toUpperCase().split("-");
  if (parts.length !== 5 || parts[0] !== "DT1") return null;
  const bottles = Number(parts[2]);
  if (!parts[1] || !Number.isInteger(bottles) || bottles < 0) return null;
  if (!["0", "1"].includes(parts[3]) || !["0", "1"].includes(parts[4])) return null;
  return { id: parts[1], bottles, tumbler: parts[3] === "1", teloBag: parts[4] === "1" };
}

export type ClaimResult =
  | { ok: true; points: number; bottles: number; capped: boolean }
  | { ok: false; message: string };

export function redeemClaim(raw: string): ClaimResult {
  const claim = parseClaimCode(raw);
  if (!claim) return { ok: false, message: "This code is not valid." };

  const current = read();
  if (!current.packageId) {
    return { ok: false, message: "Choose your travel package first." };
  }
  if (current.usedClaimIds.includes(claim.id)) {
    return { ok: false, message: "This code has already been used." };
  }

  const room = Math.max(0, POINTS.maxBottlesPerTrip - current.bottlesThisTrip);
  const bottles = Math.min(claim.bottles, room);
  const tumbler = claim.tumbler && !current.tumblerClaimed;
  const teloBag = claim.teloBag && !current.teloBagClaimed;
  const points =
    bottles * POINTS.perBottle +
    (tumbler ? POINTS.tumbler : 0) +
    (teloBag ? POINTS.teloBag : 0);

  if (points > 0) lastGain = { amount: points, at: Date.now() };
  write({
    ...current,
    points: current.points + points,
    bottlesThisTrip: current.bottlesThisTrip + bottles,
    bottlesTotal: current.bottlesTotal + bottles,
    tumblerClaimed: current.tumblerClaimed || tumbler,
    teloBagClaimed: current.teloBagClaimed || teloBag,
    teloBagsUsed: current.teloBagsUsed + (teloBag ? 1 : 0),
    usedClaimIds: [...current.usedClaimIds, claim.id],
  });

  return { ok: true, points, bottles, capped: bottles < claim.bottles };
}

export type RedeemResult = { ok: true } | { ok: false; message: string };

export function redeemReward(rewardId: string): RedeemResult {
  const reward = findReward(rewardId);
  if (!reward) return { ok: false, message: "This reward is not available." };

  const current = read();
  if (current.points < reward.points) {
    return {
      ok: false,
      message: `You need ${reward.points - current.points} more points.`,
    };
  }

  write({
    ...current,
    points: current.points - reward.points,
    redemptions: [
      ...current.redemptions,
      {
        id: newId(),
        rewardId,
        points: reward.points,
        createdAt: new Date().toISOString(),
      },
    ],
  });
  return { ok: true };
}
