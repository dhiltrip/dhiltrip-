"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Clock, ImageIcon, Inbox, Loader2, MessageCircle, RotateCcw, Trash2, XCircle } from "lucide-react";
import { requestRef, type BookingRequest, type BookingRequestStatus } from "@/data/booking";
import { callApi } from "@/lib/firebase/client";

const prettyDate = (date: string) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";

const waDigits = (number: string) => number.replace(/[^\d]/g, "").replace(/^0/, "62");

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <dt className="shrink-0 text-[#436850]">{label}</dt>
      <dd translate="no" className="notranslate min-w-0 break-words text-right font-semibold">{children}</dd>
    </div>
  );
}

function RequestCard({ item, onChanged }: { item: BookingRequest; onChanged: () => void }) {
  const [proof, setProof] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState(item.adminNote);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const run = async (name: string, body: object, method?: "DELETE") => {
    setBusy(name);
    setError(null);
    const result = await callApi("/api/admin/requests", body, method);
    setBusy(null);
    if (result.ok) onChanged();
    else setError(result.message);
  };

  const loadProof = async () => {
    setBusy("proof");
    const result = await callApi<{ dataUrl: string }>(`/api/admin/requests?proof=${encodeURIComponent(item.id)}`);
    setBusy(null);
    if (result.ok) setProof(result.dataUrl);
    else setError(result.message);
  };

  const codeMessage = item.code
    ? `Hello ${item.fullName}, your DhilTrip booking for ${item.packageTitle} on ${item.date} is confirmed!\nYour booking code: ${item.code}\nOpen dhiltrip.com, go to Profile → My bookings and tap "Join this trip" (or enter the code on the package). See you at ${item.meetingPoint}!`
    : "";

  return (
    <li className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ${item.status === "new" ? "ring-2 ring-[#C2A44E]" : "ring-[#ADBC9F]/60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p translate="no" className="notranslate font-fredoka text-lg font-semibold leading-tight">{item.fullName}</p>
          <p className="text-xs text-[#436850]">
            <span translate="no" className="notranslate font-mono">{requestRef(item.id)}</span> ·{" "}
            <span translate="no" className="notranslate">{new Date(item.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>
        <span
          key={item.status}
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            item.status === "new" ? "bg-[#FBF0C4] text-[#5A4300]" : item.status === "confirmed" ? "bg-[#DDE5BE] text-[#03603F]" : "bg-[#A33A12]/10 text-[#A33A12]"
          }`}
        >
          {item.status === "new" ? <Clock className="h-3 w-3" /> : item.status === "confirmed" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {item.status === "new" ? "New" : item.status === "confirmed" ? "Confirmed" : "Rejected"}
        </span>
      </div>

      <dl className="mt-2 divide-y divide-[#12372A]/10">
        <Row label="Package">{item.packageTitle}</Row>
        <Row label="Tour date">{prettyDate(item.date)}</Row>
        <Row label="People">{item.people}</Row>
        <Row label="Meeting point">{item.meetingPoint}</Row>
        <Row label="Total">{item.totalLabel}</Row>
        <Row label="Country">{item.country}</Row>
        <Row label="Passport">{item.passport}</Row>
        <Row label="Email">{item.email}</Row>
        <Row label="WhatsApp">
          <a href={`https://wa.me/${waDigits(item.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="text-[#03603F] underline">
            {item.whatsapp}
          </a>
        </Row>
      </dl>

      <div className="mt-3">
        {proof ? (
          // The payment photo comes as a data URL from the admin API.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proof} alt="Proof of payment" className="max-h-96 w-full rounded-2xl bg-[#F3F4DC] object-contain" />
        ) : (
          <button
            onClick={() => void loadProof()}
            disabled={busy !== null}
            className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#12372A]/30 text-sm font-semibold disabled:opacity-60"
          >
            {busy === "proof" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            View proof of payment
          </button>
        )}
      </div>

      {item.status === "confirmed" && item.code && (
        <div className="mt-3 rounded-2xl bg-[#0D2A1F] p-3 text-white">
          <p className="text-xs text-white/80">Booking code</p>
          <p translate="no" className="notranslate font-mono text-xl font-bold tracking-wide">{item.code}</p>
          <a
            href={`https://wa.me/${waDigits(item.whatsapp)}?text=${encodeURIComponent(codeMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#03603F] text-sm font-semibold"
          >
            <MessageCircle className="h-4 w-4" />
            Send the code on WhatsApp
          </a>
        </div>
      )}

      <input
        value={note}
        maxLength={200}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Note to the traveler (optional), e.g. payment received"
        aria-label="Note to the traveler"
        className="mt-3 w-full rounded-xl border border-[#ADBC9F] px-3 py-2.5 text-sm"
      />
      {error && <p className="mt-2 text-sm font-semibold text-[#A33A12]">{error}</p>}

      {confirmingDelete ? (
        <div className="mt-3 rounded-2xl bg-[#A33A12]/10 p-3">
          <p className="text-sm font-semibold text-[#A33A12]">Delete this request and its payment photo for good?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirmingDelete(false)} className="min-h-10 rounded-2xl border border-[#12372A]/30 bg-white text-sm font-semibold">
              Cancel
            </button>
            <button
              onClick={() => void run("delete", { id: item.id }, "DELETE")}
              disabled={busy !== null}
              style={{ backgroundColor: "#A33A12" }}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" /> Yes, delete
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.status !== "confirmed" && (
            <button
              onClick={() => void run("confirm", { id: item.id, action: "confirm", note })}
              disabled={busy !== null}
              className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#03603F] px-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirm & create code
            </button>
          )}
          {item.status === "new" && (
            <button
              onClick={() => void run("reject", { id: item.id, action: "reject", note })}
              disabled={busy !== null}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#A33A12]/40 px-3 text-sm font-semibold text-[#A33A12] disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
          )}
          {item.status === "rejected" && (
            <button
              onClick={() => void run("reopen", { id: item.id, action: "reopen", note })}
              disabled={busy !== null}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#12372A]/30 px-3 text-sm font-semibold disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" /> Reopen
            </button>
          )}
          <button
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete request"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#A33A12] ring-1 ring-[#A33A12]/30 hover:bg-[#A33A12]/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  );
}

const FILTERS: { id: BookingRequestStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "confirmed", label: "Confirmed" },
  { id: "rejected", label: "Rejected" },
];

/** Bookings travelers sent from the app: check the payment, then confirm with a booking code. */
export function RequestsManager() {
  const [items, setItems] = useState<BookingRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingRequestStatus>("new");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    callApi<{ items: BookingRequest[] }>("/api/admin/requests").then((result) => {
      if (cancelled) return;
      if (result.ok) setItems(result.items);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const shown = items?.filter((item) => item.status === filter) ?? [];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {FILTERS.map((item) => {
          const count = items?.filter((request) => request.status === item.id).length ?? 0;
          return (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={`min-h-10 rounded-xl text-sm font-semibold ${filter === item.id ? "bg-[#0D2A1F] text-white" : "text-[#12372A]"}`}
            >
              <span key={item.label}>{item.label}</span>
              <span translate="no" className="notranslate ml-[0.35em] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
      <p className="text-pretty text-xs text-[#436850]">
        Check the payment photo, then confirm: a booking code is created for the group size and shown to the traveler in their Profile.
      </p>
      {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}
      {items === null && !error && (
        <p className="flex items-center gap-2 text-sm text-[#436850]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      )}
      {items && shown.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-[#ADBC9F] px-5 py-10 text-center">
          <Inbox className="mx-auto h-8 w-8 text-[#ADBC9F]" />
          <p className="mt-2 text-sm text-[#436850]">Nothing here.</p>
        </div>
      )}
      <ul className="grid gap-3 lg:grid-cols-2">
        {shown.map((item) => (
          <RequestCard key={item.id} item={item} onChanged={() => setVersion((value) => value + 1)} />
        ))}
      </ul>
    </section>
  );
}
