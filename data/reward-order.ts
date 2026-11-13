import type { Reward } from "@/data/challenge";
import { CURRENCY_CODES, currencyForLanguage, formatPrice } from "@/data/currency";

/**
 * Buying a souvenir in the app.
 * "buy": pay the full price. "topup": use all your points and pay only for the points you are missing.
 */
export type OrderKind = "buy" | "topup";
export type RewardOrderStatus = "new" | "confirmed" | "rejected";
export type Pickup = "trip" | "office";

/** A traveler may pay for missing points once they have at least this share of the points. */
export const TOPUP_MIN_SHARE = 0.5;

export const minPointsForTopup = (reward: Pick<Reward, "points">) => Math.ceil(reward.points * TOPUP_MIN_SHARE);

export const canTopUp = (reward: Pick<Reward, "points">, points: number) =>
  points < reward.points && points >= minPointsForTopup(reward);

export type RewardOrder = {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  whatsapp: string;
  rewardId: string;
  rewardLabel: string;
  kind: OrderKind;
  /** Points spent on this order (topup only); held until the admin decides. */
  pointsUsed: number;
  totalText: string;
  pickup: Pickup;
  bookingCode: string | null;
  status: RewardOrderStatus;
  adminNote: string;
  createdAt: number;
};

/** Short reference shown to the traveler and in WhatsApp, e.g. ORD-7KQ2AB. */
export const orderRef = (id: string) => `ORD-${id.slice(0, 6).toUpperCase()}`;

/** Smallest step to round a money amount up to, so totals look like real prices. */
const STEP: Record<string, number> = { IDR: 1000, VND: 1000, KRW: 100, JPY: 10, INR: 1, PHP: 1, THB: 1, TWD: 1, RUB: 1 };

const roundUp = (amount: number, currency: string) => {
  const step = STEP[currency] ?? 0.01;
  return Math.round(Math.ceil(amount / step - 1e-9) * step * 100) / 100;
};

/** Reads a default price like "25 USD", "USD 25" or "7.5 EUR"; null when it is free text. */
export function parsePriceLabel(label: string): { amount: number; currency: string } | null {
  const text = label.trim();
  const numberFirst = text.match(/^(\d[\d.,]*)\s*([A-Za-z]{3})$/);
  const codeFirst = text.match(/^([A-Za-z]{3})\s*(\d[\d.,]*)$/);
  const [rawNumber, code] = numberFirst ? [numberFirst[1], numberFirst[2]] : codeFirst ? [codeFirst[2], codeFirst[1]] : ["", ""];
  if (!rawNumber) return null;
  const number = /^\d{1,3}([.,]\d{3})+$/.test(rawNumber) ? rawNumber.replace(/[.,]/g, "") : rawNumber.replace(",", ".");
  const amount = Number(number);
  return Number.isFinite(amount) && amount > 0 ? { amount, currency: code.toUpperCase() } : null;
}

const show = (amount: number, currency: string) =>
  CURRENCY_CODES.includes(currency) ? formatPrice(amount, currency) : `${Number(amount.toFixed(2))} ${currency}`;

/** The full price of a souvenir for a language: the country price when set, else the default price. */
export function basePrice(reward: Pick<Reward, "prices" | "priceLabel">, language: string) {
  const code = currencyForLanguage(language);
  const amount = code ? reward.prices?.[code] : undefined;
  if (code && typeof amount === "number") return { amount, currency: code as string };
  return parsePriceLabel(reward.priceLabel);
}

export type Quote =
  | { ok: true; kind: OrderKind; pointsUsed: number; missingPoints: number; amount: number | null; currency: string | null; totalText: string }
  | { ok: false; message: string };

/** What a traveler pays for an order. The server recomputes this, so the app and the admin always agree. */
export function quoteOrder(reward: Pick<Reward, "points" | "prices" | "priceLabel">, kind: OrderKind, points: number, language: string): Quote {
  const base = basePrice(reward, language);
  if (kind === "buy") {
    return {
      ok: true,
      kind,
      pointsUsed: 0,
      missingPoints: 0,
      amount: base?.amount ?? null,
      currency: base?.currency ?? null,
      totalText: base ? show(base.amount, base.currency) : reward.priceLabel,
    };
  }
  if (points >= reward.points) return { ok: false, message: "You have enough points; redeem it for free instead." };
  if (!canTopUp(reward, points)) {
    return { ok: false, message: `You need at least ${minPointsForTopup(reward)} points to pay the rest with money.` };
  }
  if (!base) return { ok: false, message: "This souvenir has no price to calculate the rest. Please ask our admin on WhatsApp." };
  const missingPoints = reward.points - points;
  const amount = roundUp((base.amount * missingPoints) / reward.points, base.currency);
  return { ok: true, kind, pointsUsed: points, missingPoints, amount, currency: base.currency, totalText: show(amount, base.currency) };
}
