"use client";

import { useSyncExternalStore } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { packages as builtIn, type ChallengePackage } from "@/data/challenge";
import { clientDb, firebaseEnabled } from "@/lib/firebase/client";

/**
 * Travel packages, live from Firestore when Firebase is on.
 * Until the first snapshot arrives (and when Firebase is off) the built-in four are used,
 * or the last list this browser saw, so the catalog never starts empty.
 */

const CACHE_KEY = "dhiltrip-packages";
const sortPackages = (list: ChallengePackage[]) =>
  [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title));

type Snapshot = { all: ChallengePackage[]; visible: ChallengePackage[] };
const build = (all: ChallengePackage[]): Snapshot => {
  const sorted = sortPackages(all);
  return { all: sorted, visible: sorted.filter((pkg) => !pkg.hidden) };
};

const builtInSnapshot = build(builtIn);
let current: Snapshot = builtInSnapshot;
let started = false;
const listeners = new Set<() => void>();

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) current = build(JSON.parse(raw) as ChallengePackage[]);
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
    collection(clientDb(), "packages"),
    (snap) => {
      // An empty collection means the packages were never moved to the database yet.
      if (snap.empty) return;
      const list = snap.docs.map((doc) => ({ ...(doc.data() as ChallengePackage), id: doc.id }));
      current = build(list);
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      } catch {
        // Ignore storage errors.
      }
      listeners.forEach((listener) => listener());
    },
    (error) => console.warn("packages listener:", error.code),
  );
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => current;
const getServerSnapshot = () => builtInSnapshot;

/** Every package, hidden ones included (for admins and for a trip already joined). */
export function useAllPackages() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).all;
}

/** Packages travelers can choose. */
export function usePackages() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).visible;
}

export const findIn = (list: ChallengePackage[], id: string | null | undefined) => list.find((pkg) => pkg.id === id) ?? null;

/** The package a traveler joined, even if an admin has hidden it since. */
export function usePackage(id: string | null | undefined) {
  return findIn(useAllPackages(), id);
}
