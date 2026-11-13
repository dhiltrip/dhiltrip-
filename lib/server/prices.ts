import { CURRENCY_CODES } from "@/data/currency";
import { HttpError } from "@/lib/server/session";

/** Keeps only known currencies with a sensible positive amount. */
export function readPrices(input: unknown) {
  const prices: Record<string, number> = {};
  if (!input || typeof input !== "object") return prices;
  for (const [code, value] of Object.entries(input as Record<string, unknown>)) {
    if (!CURRENCY_CODES.includes(code) || value === null || value === "") continue;
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) {
      throw new HttpError(400, `The ${code} price must be a number above 0.`);
    }
    prices[code] = Math.round(amount * 100) / 100;
  }
  return prices;
}
