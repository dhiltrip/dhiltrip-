"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Loader2, MessageCircle, XCircle } from "lucide-react";
import { BOOKING_WHATSAPP, requestRef, type BookingRequest } from "@/data/booking";
import { firebaseEnabled } from "@/lib/firebase/client";
import { joinTrip, useChallenge } from "@/lib/participant";
import { useMyBookingRequests } from "@/lib/site-content";

const prettyDate = (date: string) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

function StatusBadge({ status }: { status: BookingRequest["status"] }) {
  const styles = {
    new: "bg-[#FBF0C4] text-[#5A4300]",
    confirmed: "bg-[#DDE5BE] text-[#03603F]",
    rejected: "bg-[#A33A12]/10 text-[#A33A12]",
  } as const;
  return (
    <span key={status} className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>
      {status === "new" && <Clock className="h-3 w-3" />}
      {status === "confirmed" && <CheckCircle2 className="h-3 w-3" />}
      {status === "rejected" && <XCircle className="h-3 w-3" />}
      {status === "new" ? "Checking payment" : status === "confirmed" ? "Confirmed" : "Not confirmed"}
    </span>
  );
}

function BookingCard({ item }: { item: BookingRequest }) {
  const state = useChallenge();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const joined = state?.bookingCode === item.code;
  const ask = `https://wa.me/${BOOKING_WHATSAPP}?text=${encodeURIComponent(`Hello DhilTrip, about my booking ${requestRef(item.id)} (${item.packageTitle}, ${item.date}).`)}`;

  const join = async () => {
    if (!item.code) return;
    setBusy(true);
    const result = await joinTrip(item.code, item.packageId);
    setBusy(false);
    setMessage(result.ok ? "You joined this trip. See it on Home." : result.message);
  };

  return (
    <li className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p translate="no" className="notranslate truncate font-fredoka text-lg font-semibold leading-tight">{item.packageTitle}</p>
          <p className="text-xs text-[#436850]">
            <span translate="no" className="notranslate">{prettyDate(item.date)}</span> ·
            <span translate="no" className="notranslate mx-[0.25em]">{item.people}</span>people ·
            <span translate="no" className="notranslate ml-[0.25em] font-mono">{requestRef(item.id)}</span>
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {item.status === "new" && (
        <p className="mt-2 text-pretty text-xs text-[#436850]">Our admin is checking your payment. You will get a booking code here and on WhatsApp.</p>
      )}
      {item.adminNote && <p className="mt-2 rounded-xl bg-[#F3F4DC] px-3 py-2 text-xs">{item.adminNote}</p>}

      {item.status === "confirmed" && item.code && (
        <div className="mt-3 rounded-2xl bg-[#0D2A1F] p-3 text-white">
          <p className="text-xs text-white/80">Your booking code</p>
          <p translate="no" className="notranslate font-mono text-xl font-bold tracking-wide">{item.code}</p>
          {joined ? (
            <p className="mt-1 text-xs font-semibold text-[#B6DC7A]">You are on this trip.</p>
          ) : (
            <button
              onClick={() => void join()}
              disabled={busy}
              className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#8DB255] text-sm font-semibold text-[#0D2A1F] disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Join this trip
            </button>
          )}
        </div>
      )}
      {message && <p key={message} className="mt-2 text-sm font-semibold text-[#03603F]">{message}</p>}

      <a href={ask} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#12372A]/20 text-sm font-semibold">
        <MessageCircle className="h-4 w-4" />
        Ask about this booking
      </a>
    </li>
  );
}

/** Profile: trips booked in the app, with their status and booking code. */
export function MyBookings() {
  const items = useMyBookingRequests();
  if (!firebaseEnabled || items.length === 0) return null;
  return (
    <section id="my-bookings" className="scroll-mt-24 space-y-3">
      <h2 className="title-section text-black">My bookings</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <BookingCard key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
