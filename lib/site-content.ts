"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { collection, doc, onSnapshot, query, where, type Timestamp } from "firebase/firestore";
import { builtInMemories, builtInReviews, type Memory, type Review, type ReviewStatus } from "@/data/content";
import type { Article } from "@/data/articles";
import type { BookingRequest } from "@/data/booking";
import { readFocus } from "@/data/focus";
import { clientAuth, clientDb, firebaseEnabled } from "@/lib/firebase/client";

/**
 * Home's photos and reviews, live from Firestore when Firebase is on. Until the first snapshot
 * arrives the last list this browser saw (or the original content) is shown, so Home never starts empty.
 */

function liveStore<T>(key: string, fallback: T[], open: (emit: (items: T[]) => void) => void) {
  let current = fallback;
  let started = false;
  const listeners = new Set<() => void>();
  const emit = (items: T[]) => {
    current = items;
    try {
      window.localStorage.setItem(key, JSON.stringify(items));
    } catch {
      // Storage can be blocked; the live data still works.
    }
    listeners.forEach((listener) => listener());
  };
  return {
    subscribe(listener: () => void) {
      if (!started && typeof window !== "undefined") {
        started = true;
        if (firebaseEnabled) {
          try {
            const cached = window.localStorage.getItem(key);
            if (cached) current = JSON.parse(cached) as T[];
          } catch {
            // Ignore a broken cache.
          }
          open(emit);
        }
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get: () => current,
    server: () => fallback,
  };
}

const toMillis = (value: unknown) => (value as Timestamp | undefined)?.toMillis?.() ?? 0;

const toReview = (id: string, data: Record<string, unknown>): Review => ({
  id,
  name: String(data.name ?? ""),
  label: String(data.label ?? ""),
  rating: Number(data.rating ?? 5),
  text: String(data.text ?? ""),
  packageId: (data.packageId as string | null) ?? null,
  status: data.status as ReviewStatus,
  source: data.source === "traveler" ? "traveler" : "admin",
  uid: (data.uid as string | null) ?? null,
  createdAt: toMillis(data.createdAt) || Number(data.sortKey ?? 0),
});

const memoryStore = liveStore<Memory>("dhiltrip-memories", builtInMemories, (emit) =>
  onSnapshot(
    collection(clientDb(), "memories"),
    (snap) => {
      if (snap.empty) return;
      emit(
        snap.docs
          .map((doc) => ({ ...(doc.data() as Omit<Memory, "id">), id: doc.id }))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      );
    },
    (error) => console.warn("memories listener:", error.code),
  ),
);

const reviewStore = liveStore<Review>("dhiltrip-reviews", builtInReviews, (emit) =>
  onSnapshot(
    query(collection(clientDb(), "reviews"), where("status", "==", "published")),
    (snap) => emit(snap.docs.map((doc) => toReview(doc.id, doc.data())).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))),
    (error) => console.warn("reviews listener:", error.code),
  ),
);

/** Every photo, hidden ones included (for admins). */
export function useAllMemories() {
  return useSyncExternalStore(memoryStore.subscribe, memoryStore.get, memoryStore.server);
}

/** Photos shown on Home. */
export function useMemories() {
  return useAllMemories().filter((memory) => !memory.hidden);
}

/** Published reviews, newest first. */
export function useReviews() {
  return useSyncExternalStore(reviewStore.subscribe, reviewStore.get, reviewStore.server);
}

/** Every review the signed-in traveler has written, newest first, whatever its status. */
export function useMyReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const uid = firebaseEnabled ? clientAuth().currentUser?.uid : undefined;
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(collection(clientDb(), "reviews"), where("uid", "==", uid)),
      (snap) => setReviews(snap.docs.map((doc) => toReview(doc.id, doc.data())).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))),
      (error) => console.warn("my reviews listener:", error.code),
    );
  }, [uid]);
  return uid ? reviews : [];
}

/** The signed-in traveler's own review of one package, whatever its status. */
export function useMyReview(packageId: string | null) {
  const mine = useMyReviews();
  return packageId ? (mine.find((item) => item.packageId === packageId) ?? null) : null;
}

const toMillisOrNull = (value: unknown) => (value as Timestamp | undefined)?.toMillis?.() ?? null;

const articleStore = liveStore<Article>("dhiltrip-articles", [], (emit) =>
  onSnapshot(
    query(collection(clientDb(), "articles"), where("published", "==", true)),
    (snap) =>
      emit(
        snap.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: String(data.title ?? ""),
              excerpt: String(data.excerpt ?? ""),
              body: "",
              cover: (data.cover as string | null) ?? null,
              coverFocus: readFocus(data.coverFocus),
              author: String(data.author ?? "Dhil Trip Team"),
              published: true,
              publishedAt: toMillisOrNull(data.publishedAt),
              updatedAt: toMillisOrNull(data.updatedAt),
            } satisfies Article;
          })
          .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0)),
      ),
    (error) => console.warn("articles listener:", error.code),
  ),
);

/** Published articles, newest first (without their full text). */
export function useArticles() {
  return useSyncExternalStore(articleStore.subscribe, articleStore.get, articleStore.server);
}

/** Community totals: bottles and kg collected on trips, kg delivered to the waste bank, souvenirs supported. */
export type Impact = { bottles: number; weightGrams: number; deliveredGrams: number; souvenirs: number; teloBags: number };
const NO_IMPACT: Impact = { bottles: 0, weightGrams: 0, deliveredGrams: 0, souvenirs: 0, teloBags: 0 };
let impact: Impact = NO_IMPACT;
let impactStarted = false;
const impactListeners = new Set<() => void>();

function subscribeImpact(listener: () => void) {
  if (!impactStarted && firebaseEnabled && typeof window !== "undefined") {
    impactStarted = true;
    onSnapshot(
      doc(clientDb(), "stats", "impact"),
      (snap) => {
        const data = snap.data() ?? {};
        impact = {
          bottles: Number(data.bottles ?? 0),
          weightGrams: Number(data.weightGrams ?? 0),
          deliveredGrams: Number(data.deliveredGrams ?? 0),
          souvenirs: Number(data.souvenirs ?? 0),
          teloBags: Number(data.teloBags ?? 0),
        };
        impactListeners.forEach((item) => item());
      },
      (error) => console.warn("impact listener:", error.code),
    );
  }
  impactListeners.add(listener);
  return () => impactListeners.delete(listener);
}

export function useImpact() {
  return useSyncExternalStore(subscribeImpact, () => impact, () => NO_IMPACT);
}

/** 1250 g -> "1.3 kg", 400 g -> "400 g". */
export const formatWeight = (grams: number) =>
  grams <= 0 ? "0 kg" : grams >= 1000 ? `${(grams / 1000).toFixed(grams >= 10000 ? 0 : 1)} kg` : `${Math.round(grams)} g`;

/** The signed-in traveler's booking requests from the app, newest first. */
export function useMyBookingRequests() {
  const [items, setItems] = useState<BookingRequest[]>([]);
  const uid = firebaseEnabled ? clientAuth().currentUser?.uid : undefined;
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(collection(clientDb(), "bookingRequests"), where("uid", "==", uid)),
      (snap) =>
        setItems(
          snap.docs
            .map((item) => {
              const data = item.data();
              return {
                id: item.id,
                uid: String(data.uid ?? ""),
                packageId: String(data.packageId ?? ""),
                packageTitle: String(data.packageTitle ?? ""),
                date: String(data.date ?? ""),
                people: Number(data.people ?? 1),
                fullName: String(data.fullName ?? ""),
                country: String(data.country ?? ""),
                passport: String(data.passport ?? ""),
                email: String(data.email ?? ""),
                whatsapp: String(data.whatsapp ?? ""),
                meetingPoint: String(data.meetingPoint ?? ""),
                totalLabel: String(data.totalLabel ?? ""),
                status: (data.status as BookingRequest["status"]) ?? "new",
                code: (data.code as string | null) ?? null,
                adminNote: String(data.adminNote ?? ""),
                createdAt: toMillis(data.createdAt),
              } satisfies BookingRequest;
            })
            .sort((a, b) => b.createdAt - a.createdAt),
        ),
      (error) => console.warn("booking requests listener:", error.code),
    );
  }, [uid]);
  return uid ? items : [];
}
