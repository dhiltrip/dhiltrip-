"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Check, Globe, Search } from "lucide-react";

const LANGUAGE_CODES = [
  "en", "id", "jw", "su", "ms", "ko", "ja", "zh-CN", "zh-TW", "ar", "hi", "bn", "ur", "pa", "ta", "te", "mr", "gu", "kn", "ml",
  "ne", "si", "th", "vi", "lo", "km", "my", "tl", "es", "pt", "fr", "de", "it", "nl", "ru", "uk", "pl", "cs", "sk", "hu",
  "ro", "bg", "el", "tr", "sv", "no", "da", "fi", "is", "et", "lv", "lt", "hr", "sr", "bs", "sl", "mk", "sq", "ca", "gl",
  "eu", "ga", "cy", "mt", "lb", "af", "sw", "zu", "xh", "st", "yo", "ig", "ha", "am", "so", "rw", "sn", "ny", "mg", "fa",
  "ps", "ku", "iw", "yi", "hy", "ka", "az", "kk", "ky", "uz", "tg", "tk", "mn", "ug", "sd", "or", "as", "mi", "sm", "haw",
  "gd", "fy", "co", "eo", "la", "ht", "ceb", "hmn",
];

const INTL_CODE: Record<string, string> = { jw: "jv", iw: "he", tl: "fil" };

const readLanguage = () => {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "en";
};

function nativeName(code: string) {
  const tag = INTL_CODE[code] ?? code;
  try {
    return new Intl.DisplayNames([tag], { type: "language" }).of(tag) ?? code;
  } catch {
    return code;
  }
}

function englishName(code: string) {
  const tag = INTL_CODE[code] ?? code;
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(tag) ?? code;
  } catch {
    return code;
  }
}

function applyLanguage(code: string) {
  const host = window.location.hostname;
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = `googtrans=; ${expired}`;
  document.cookie = `googtrans=; ${expired}; domain=.${host}`;
  if (code !== "en") {
    document.cookie = `googtrans=/en/${code}; path=/; max-age=31536000`;
  }
  window.location.reload();
}

/** align: which edge of the button the menu lines up with; use "left" near the left side of the screen. */
export function LanguageSwitcher({ className = "", align = "right" }: { className?: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const current = useSyncExternalStore(
    () => () => undefined,
    readLanguage,
    () => "en",
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const options = useMemo(() => {
    if (!open) return [];
    const needle = query.trim().toLowerCase();
    return LANGUAGE_CODES.map((code) => ({
      code,
      native: nativeName(code),
      english: englishName(code),
    })).filter(
      ({ native, english, code }) =>
        !needle ||
        native.toLowerCase().includes(needle) ||
        english.toLowerCase().includes(needle) ||
        code.toLowerCase().startsWith(needle),
    );
  }, [open, query]);

  return (
    <div ref={rootRef} className={`relative notranslate ${className}`} translate="no">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Change language"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-full border border-white/25 px-2.5 text-xs font-semibold uppercase text-white transition-colors hover:bg-white/10"
      >
        <Globe className="h-4 w-4" />
        <span>{current.split("-")[0]}</span>
      </button>

      {open && (
        <div className={`absolute top-11 z-[200] w-64 ${align === "left" ? "left-0" : "right-0"} max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#ADBC9F]/40 bg-white text-[#12372A] shadow-2xl`}>
          <label className="flex items-center gap-2 border-b border-[#ADBC9F]/40 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-[#436850]" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search language"
              aria-label="Search language"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <ul className="max-h-72 overflow-y-auto py-1">
            {options.map(({ code, native, english }) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => applyLanguage(code)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#12372A]/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold capitalize">{native}</span>
                    <span className="block truncate text-xs text-[#436850]">{english}</span>
                  </span>
                  {code === current && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-3 py-3 text-sm text-[#436850]">No language found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
