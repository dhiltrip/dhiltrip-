"use client";

import { useSyncExternalStore } from "react";
import type { ChallengePackage } from "@/data/challenge";
import { priceFor } from "@/data/currency";

export * from "@/data/currency";

/** The language chosen in the language switcher. Changing it reloads the page, so no subscription is needed. */
const readLanguage = () => {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "en";
};

export function useSiteLanguage() {
  return useSyncExternalStore(
    () => () => undefined,
    readLanguage,
    () => "en",
  );
}

export function usePrice(pkg: ChallengePackage) {
  return priceFor(pkg, useSiteLanguage());
}
