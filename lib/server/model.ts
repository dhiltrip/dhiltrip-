import "server-only";

/** Shape of users/{uid}. Only the server writes it; the owner may read it. */
export type TripDoc = {
  code: string;
  packageId: string;
  bottles: number;
  tumbler: boolean;
  teloBag: boolean;
  visited: string[];
  /** Grams of waste weighed by the guide on this trip. */
  weightGrams?: number;
  /** The traveler's own Eco Mission checklist (no points; points come from the guide's QR). */
  mission?: { tumbler?: boolean; teloBag?: boolean };
};

export type UserDoc = {
  name: string;
  email: string;
  role: "participant" | "leader" | "admin";
  pendingRole?: "leader" | "admin" | null;
  points: number;
  bottlesTotal: number;
  teloBagsUsed: number;
  /** Grams of waste collected over all trips. */
  weightGrams?: number;
  trip: TripDoc | null;
};

/** Shape of bookings/{CODE}. One code per group booking, with a seat limit. */
export type BookingDoc = {
  packageId: string;
  date: string;
  seats: number;
  label: string;
  members: string[];
  active: boolean;
  createdBy: string;
};

/** Shape of claims/{id}. Created by a tour leader, usable once, for a limited time. */
export type ClaimDoc = {
  bottles: number;
  tumbler: boolean;
  teloBag: boolean;
  /** Weight of the bottles and waste the guide weighed, in grams. */
  weightGrams?: number;
  createdBy: string;
  expiresAt: number;
  usedBy: string | null;
};

export const CLAIM_PREFIX = "DT2-";
/** Largest weight one claim may record: 50 kg. */
export const MAX_CLAIM_GRAMS = 50_000;
/** stats/impact: community totals shown on the site. */
export const IMPACT_DOC = "stats/impact";
export const CLAIM_LIFETIME_MS = 2 * 60 * 60 * 1000;

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function randomCode(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function bookingCodeFor(prefix: string, date: string) {
  return `${prefix}-${date.slice(5, 7)}${date.slice(8, 10)}-${randomCode(3)}`;
}

/** Today's date in Yogyakarta, as YYYY-MM-DD. */
export function todayInJogja() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
