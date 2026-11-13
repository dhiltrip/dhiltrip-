"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

/** A bottom sheet on phones, a centred dialog on laptops. Closes with the X, the backdrop or Escape. */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Rendered at the end of <body> so it always sits above the page and the bottom menu.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 lg:items-center lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-[480px] animate-rise-in flex-col overflow-hidden rounded-t-3xl bg-[#F3F4DC] text-left text-[#12372A] lg:max-w-lg lg:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <h2 className="title-card text-xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-black/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// A small side margin keeps the gap when Google Translate drops the spaces around kept-as-is words.
const TELOBAG = <span translate="no" className="notranslate mx-[0.15em]">Telobag</span>;
// At the start of a sentence only the gap after the word is needed.
const TELOBAG_START = <span translate="no" className="notranslate mr-[0.15em]">Telobag</span>;

/** Round (i) button that explains what a Telobag is. */
export function TelobagInfoButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label="What is a Telobag?"
        data-info="telobag"
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#03603F] shadow-sm hover:bg-white ${className}`}
      >
        <Info className="h-4 w-4" />
      </button>
      {open && (
        <Sheet title="What is a Telobag?" onClose={() => setOpen(false)}>
          <div className="space-y-3 text-pretty text-sm leading-relaxed">
            <p>
              {TELOBAG_START} is an Indonesian brand of eco-friendly plant-based bags (bioplastic) made mainly from cassava starch, with no
              conventional plastic mixed in.
            </p>
            <p>
              It is designed to replace single-use plastic bags. It is as strong and stretchy as ordinary plastic, but feels softer in
              the hand.
            </p>
            <p>
              Its main advantage: it is <strong>biodegradable in about 3 to 6 months</strong>, without leaving harmful microplastics
              behind for nature or living things.
            </p>
            <p>
              {TELOBAG_START} comes as shopping bags, rubbish bags and shipping mailers: a practical packaging alternative that is safe and
              sustainable.
            </p>
            <p className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#03603F]">
              Your guide hands you a {TELOBAG} at the meeting point. Put the plastic bottles you find in it during the trip.
            </p>
          </div>
        </Sheet>
      )}
    </>
  );
}

const STEPS: ReactNode[] = [
  <>Choose a package on Home and sign in to book. Fill in your details and make the payment.</>,
  <>Our admin confirms your booking again on WhatsApp.</>,
  <>At the meeting point your tour guide hands out the {TELOBAG}, and your &ldquo;{TELOBAG} used&rdquo; count goes up.</>,
  <>During the tour, collect plastic bottles in your {TELOBAG} and tick your checklist (menu:<span translate="no" className="notranslate ml-[0.25em]">Eco Mission</span>).</>,
  <>At the end of the tour, give the bottles to your guide, who counts, weighs and verifies them in guide mode.</>,
  <>Your guide shows a QR code (with the number of bottles and kg). Scan it with your own phone (menu:<span translate="no" className="notranslate ml-[0.25em]">Eco Mission</span>).</>,
  <>Your points arrive, and both your personal dashboard and the community total update.</>,
  <>Redeem your points or buy an upcycled souvenir. &ldquo;Local products supported&rdquo; goes up, and your guide hands you the souvenir.</>,
  <>Your guide takes the waste to our partner waste bank and marks it &ldquo;Delivered&rdquo;. The amount is added to the impact total.</>,
];

/** "How it works" link with an (i) icon that opens the nine steps of a DhilTrip. */
export function HowItWorksButton({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ${
          tone === "light" ? "bg-white/15 text-white hover:bg-white/25" : "bg-white text-[#03603F] shadow-sm hover:bg-[#DDE5BE]"
        } ${className}`}
      >
        <Info className="h-4 w-4" />
        How it works
      </button>
      {open && (
        <Sheet title="How a DhilTrip works" onClose={() => setOpen(false)}>
          <ol className="space-y-3">
            {STEPS.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span
                  translate="no"
                  className="notranslate flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0D2A1F] font-fredoka text-sm font-semibold text-white"
                >
                  {index + 1}
                </span>
                <p className="pt-0.5 text-pretty text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </Sheet>
      )}
    </>
  );
}
