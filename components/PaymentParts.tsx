"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import { Building2, Check, Copy, ImagePlus, Loader2 } from "lucide-react";
import { BANK } from "@/data/booking";
import { shrinkPhoto } from "@/lib/shrink-photo";

/** Pieces shared by the trip booking and souvenir order forms. */

export const field =
  "mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]";

export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl bg-white p-5 shadow">
      <h2 className="title-card flex items-center gap-2 text-lg">
        <span translate="no" className="notranslate flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0D2A1F] font-fredoka text-sm text-white">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-semibold hover:bg-white/25"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span key={copied ? "copied" : "copy"}>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

/** The bank account to transfer to, with the total. */
export function BankCard({ total, note, children }: { total: string; note?: string | null; children?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#0D2A1F] p-4 text-white">
      <p className="flex items-center gap-2 text-sm font-semibold text-[#B6DC7A]">
        <Building2 className="h-4 w-4" /> Bank transfer
      </p>
      <p translate="no" className="notranslate mt-2 font-fredoka text-lg font-semibold">{BANK.bank}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p translate="no" className="notranslate whitespace-nowrap font-mono text-[clamp(1.25rem,6vw,1.6rem)] font-bold tracking-wide">
          {BANK.accountNumber}
        </p>
        <CopyButton value={BANK.accountNumber} />
      </div>
      <p translate="no" className="notranslate mt-1 text-sm text-white/85">{BANK.accountName}</p>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 pt-3">
        <span className="text-sm text-white/85">Total to transfer</span>
        <span translate="no" className="notranslate text-right font-fredoka text-xl font-semibold leading-tight">{total}</span>
      </div>
      {children}
      {note && <p className="mt-2 text-pretty text-xs text-white/75">{note}</p>}
    </div>
  );
}

/** Upload a screenshot or photo of the bank transfer. */
export function ProofPicker({ proof, onChange, onError }: { proof: string | null; onChange: (proof: string) => void; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      onChange(await shrinkPhoto(file, 1600));
    } catch {
      onError("This photo could not be used. Please upload a screenshot or photo of the transfer (JPG or PNG).");
    }
    setBusy(false);
  };
  return (
    <div>
      <p className="text-sm font-semibold">Proof of payment</p>
      <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-[#ADBC9F] bg-[#F3F4DC] p-3">
        <span className="relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-[#436850]">
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : proof ? (
            // A data URL from the file picker can't go through the image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={proof} alt="Proof of payment preview" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-7 w-7" />
          )}
        </span>
        <span className="min-w-0 text-sm">
          <span key={proof ? "change" : "upload"} className="block font-semibold text-[#03603F]">
            {proof ? "Photo added. Tap to change." : "Upload a screenshot or photo of the transfer"}
          </span>
          <span className="block text-xs text-[#436850]">Only our admin can see it.</span>
        </span>
        <input type="file" accept="image/*" onChange={(event) => void pick(event)} className="sr-only" />
      </label>
    </div>
  );
}
