"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { articleDate } from "@/data/articles";
import { useSiteLanguage } from "@/lib/currency";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/** The date in the visitor's chosen language, e.g. "21 Okt 2026". */
export function ArticleDate({ ms }: { ms: number | null }) {
  return <>{articleDate(ms, useSiteLanguage())}</>;
}

/** Slim header for the public article pages. */
export function ArticleHeader({ back = "/", backLabel = "Home" }: { back?: string; backLabel?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-[#0D2A1F] text-white">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
        <Link href={back} className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <ArrowLeft className="h-5 w-5 shrink-0" />
          <span className="truncate">{backLabel}</span>
        </Link>
        <Link href="/" aria-label="Dhil Trip Explorations home" className="shrink-0">
          <Image src="/challenge/logo.webp" alt="Dhil Trip Explorations" width={778} height={319} priority className="h-10 w-auto" />
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
