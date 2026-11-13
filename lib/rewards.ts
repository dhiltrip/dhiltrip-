"use client";

import { useSyncExternalStore } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { rewards as builtIn, type Reward } from "@/data/challenge";
import { clientDb, firebaseEnabled } from "@/lib/firebase/client";

/**
 * Souvenirs in the Rewards Store, live from Firestore when Firebase is on.
 * Until the first snapshot arrives (and when Firebase is off) the built-in twelve are used,
 * or the last list this browser saw, so the store never starts empty.
 */

const CACHE_KEY = "dhiltrip-rewards";
const sortRewards = (list: Reward[]) =>
  [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.points - b.points || a.label.localeCompare(b.label));

type Snapshot = { all: Reward[]; visible: Reward[] };
const build = (all: Reward[]): Snapshot => {
  const sorted = sortRewards(all);
  return { all: sorted, visible: sorted.filter((reward) => !reward.hidden) };
};

const builtInSnapshot = build(builtIn);
let current: Snapshot = builtInSnapshot;
let started = false;
const listeners = new Set<() => void>();

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) current = build(JSON.parse(raw) as Reward[]);
  } catch {
    // A private window or blocked storage just means no cache.
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!firebaseEnabled) return;
  readCache();
  onSnapshot(
    collection(clientDb(), "rewards"),
    (snap) => {
      // An empty collection means no admin has changed the souvenirs yet.
      if (snap.empty) return;
      // updatedAt is a Firestore timestamp; it is left out so the list can be cached as JSON.
      const list = snap.docs.map((doc) => {
        const data = { ...doc.data() };
        delete data.updatedAt;
        return { ...(data as Reward), id: doc.id };
      });
      current = build(list);
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      } catch {
        // Ignore storage errors.
      }
      listeners.forEach((listener) => listener());
    },
    (error) => console.warn("rewards listener:", error.code),
  );
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => current;
const getServerSnapshot = () => builtInSnapshot;

/** Every souvenir, hidden ones included (for admins and for past redemptions). */
export function useAllRewards() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).all;
}

/** Souvenirs travelers can redeem or buy. */
export function useRewards() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).visible;
}

export const findRewardIn = (list: Reward[], id: string | null | undefined) => list.find((reward) => reward.id === id) ?? null;
