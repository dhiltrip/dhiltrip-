"use client";

import { Plus, X } from "lucide-react";
import { CURRENCIES, currencyInfo, formatPrice } from "@/data/currency";

export type PriceDraft = { key: string; code: string; amount: string };

const newKey = () => Math.random().toString(36).slice(2);

export const pricesToDraft = (prices: Partial<Record<string, number>> | undefined): PriceDraft[] =>
  Object.entries(prices ?? {}).map(([code, amount]) => ({ key: newKey(), code, amount: String(amount ?? "") }));

export const draftToPrices = (draft: PriceDraft[]) =>
  Object.fromEntries(draft.filter((price) => price.amount.trim()).map((price) => [price.code, Number(price.amount)]));

export const newPrice = (code = "IDR"): PriceDraft => ({ key: newKey(), code, amount: "" });

/** A price per country; visitors see the one matching the language they choose. */
export function CountryPrices({ prices, onChange }: { prices: PriceDraft[]; onChange: (prices: PriceDraft[]) => void }) {
  const used = new Set(prices.map((price) => price.code));
  const free = CURRENCIES.filter((currency) => !used.has(currency.code));
  const update = (key: string, patch: Partial<PriceDraft>) =>
    onChange(prices.map((price) => (price.key === key ? { ...price, ...patch } : price)));

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Price per country</p>
      {prices.length === 0 && <p className="text-xs text-[#436850]">No country prices yet.</p>}
      {prices.map((price) => {
        const info = currencyInfo(price.code);
        const amount = Number(price.amount);
        return (
          <div key={price.key} className="rounded-2xl bg-[#F3F4DC] p-3">
            <div className="flex items-center gap-2">
              <select
                value={price.code}
                onChange={(event) => update(price.key, { code: event.target.value })}
                aria-label="Country and currency"
                className="min-w-0 flex-1 rounded-xl border border-[#ADBC9F] bg-white px-2 py-2.5 text-sm"
              >
                {[...(info ? [info] : []), ...free].map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.country} ({currency.code})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={price.amount}
                onChange={(event) => update(price.key, { amount: event.target.value })}
                placeholder="Amount"
                aria-label={`Price in ${price.code}`}
                className="w-32 shrink-0 rounded-xl border border-[#ADBC9F] bg-white px-3 py-2.5 text-right text-sm"
              />
              <button
                type="button"
                onClick={() => onChange(prices.filter((item) => item.key !== price.key))}
                aria-label="Remove this price"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#A33A12] hover:bg-[#A33A12]/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#436850]">
              {amount > 0 ? (
                <>
                  Shows as{" "}
                  <span translate="no" className="notranslate font-semibold text-[#12372A]">
                    {formatPrice(amount, price.code)}
                  </span>
                </>
              ) : (
                "Enter the amount, e.g. 650000"
              )}
            </p>
          </div>
        );
      })}
      {free.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([...prices, newPrice(free[0].code)])}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ADBC9F] text-sm font-semibold text-[#03603F]"
        >
          <Plus className="h-4 w-4" />
          Add a country price
        </button>
      )}
    </div>
  );
}
