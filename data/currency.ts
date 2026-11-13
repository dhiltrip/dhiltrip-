/** Anything sold with a default price text and optional prices per currency (packages, souvenirs). */
export type Priced = { priceLabel: string; prices?: Partial<Record<string, number>> };

/** Currencies an admin can set a package price in, and how each is written. */
export const CURRENCIES = [
  { code: "IDR", country: "Indonesia", locale: "id-ID", languages: ["id", "jw", "su"] },
  { code: "KRW", country: "South Korea", locale: "ko-KR", languages: ["ko"] },
  { code: "JPY", country: "Japan", locale: "ja-JP", languages: ["ja"] },
  { code: "CNY", country: "China", locale: "zh-CN", languages: ["zh-CN"] },
  { code: "TWD", country: "Taiwan", locale: "zh-TW", languages: ["zh-TW"] },
  { code: "MYR", country: "Malaysia", locale: "ms-MY", languages: ["ms"] },
  { code: "THB", country: "Thailand", locale: "th-TH", languages: ["th"] },
  { code: "VND", country: "Vietnam", locale: "vi-VN", languages: ["vi"] },
  { code: "PHP", country: "Philippines", locale: "fil-PH", languages: ["tl", "ceb"] },
  { code: "INR", country: "India", locale: "en-IN", languages: ["hi", "mr", "gu", "ta", "te", "kn", "ml", "pa", "or", "as"] },
  {
    code: "EUR",
    country: "Europe (euro)",
    locale: "de-DE",
    languages: ["de", "fr", "it", "nl", "es", "pt", "el", "fi", "et", "lv", "lt", "sk", "sl", "mt", "ga", "lb", "ca", "gl", "eu", "hr"],
  },
  { code: "RUB", country: "Russia", locale: "ru-RU", languages: ["ru"] },
  { code: "TRY", country: "Turkey", locale: "tr-TR", languages: ["tr"] },
  { code: "SAR", country: "Saudi Arabia", locale: "ar-SA", languages: ["ar"] },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const CURRENCY_CODES = CURRENCIES.map((currency) => currency.code) as readonly string[];

export const currencyInfo = (code: string) => CURRENCIES.find((currency) => currency.code === code) ?? null;

/** The currency used for a website language, or null for languages that show the default price. */
export function currencyForLanguage(language: string): CurrencyCode | null {
  return CURRENCIES.find((currency) => (currency.languages as readonly string[]).includes(language))?.code ?? null;
}

const NO_DECIMALS = new Set(["IDR", "KRW", "JPY", "VND"]);

export function formatPrice(amount: number, code: string) {
  const info = currencyInfo(code);
  try {
    return new Intl.NumberFormat(info?.locale ?? "en", {
      style: "currency",
      currency: code,
      maximumFractionDigits: NO_DECIMALS.has(code) ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

/** The price for the visitor's language, falling back to the default price text. */
export function priceFor(item: Priced, language: string) {
  const code = currencyForLanguage(language);
  const amount = code ? item.prices?.[code] : undefined;
  return code && typeof amount === "number" ? formatPrice(amount, code) : item.priceLabel;
}
