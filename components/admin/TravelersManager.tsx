"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Download, Gift, Loader2, Search, Ticket, Users } from "lucide-react";
import type { Traveler, TravelerRedemption } from "@/data/travelers";
import { callApi } from "@/lib/firebase/client";
import { findIn, useAllPackages } from "@/lib/packages";
import { formatWeight } from "@/lib/site-content";
import { initialsOf } from "@/lib/initials";

type Filter = "all" | "booked" | "redeemed";

const day = (ms: number) =>
  ms ? new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "–";
const tripDate = (date: string) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

const BOOKING_STYLE: Record<string, string> = {
  new: "bg-[#FBF0C4] text-[#5A4300]",
  confirmed: "bg-[#DDE5BE] text-[#03603F]",
  rejected: "bg-[#A33A12]/10 text-[#A33A12]",
};
const BOOKING_LABEL: Record<string, string> = { new: "Checking payment", confirmed: "Confirmed", rejected: "Rejected" };

/** Totals over every account: the cumulative picture of bookings, souvenirs and impact. */
function totals(items: Traveler[]) {
  const bookings = items.flatMap((item) => item.bookings);
  const redemptions = items.flatMap((item) => item.redemptions);
  const confirmed = bookings.filter((item) => item.status === "confirmed");
  return {
    accounts: items.length,
    bookings: bookings.length,
    confirmed: confirmed.length,
    people: confirmed.reduce((sum, item) => sum + item.people, 0),
    souvenirs: redemptions.length,
    pending: redemptions.filter((item) => item.status === "pending").length,
    pointsSpent: redemptions.reduce((sum, item) => sum + item.points, 0),
    bottles: items.reduce((sum, item) => sum + item.bottles, 0),
    weightGrams: items.reduce((sum, item) => sum + item.weightGrams, 0),
  };
}

/** One row per booking or souvenir, for a spreadsheet. */
function toCsv(items: Traveler[]) {
  const rows: (string | number)[][] = [
    ["Type", "Name", "Email", "Package / Souvenir", "Trip date", "People", "Points", "Status", "Booking code", "Created", "Handed over"],
  ];
  for (const item of items) {
    for (const booking of item.bookings) {
      rows.push(["Booking", item.name, item.email, booking.packageTitle, booking.date, booking.people, "", booking.status, booking.code ?? "", day(booking.createdAt), ""]);
    }
    for (const redemption of item.redemptions) {
      rows.push([
        "Souvenir",
        item.name,
        item.email,
        redemption.rewardLabel,
        "",
        "",
        redemption.points,
        redemption.status,
        redemption.bookingCode ?? "",
        day(redemption.createdAt),
        redemption.handedAt ? day(redemption.handedAt) : "",
      ]);
    }
    if (!item.bookings.length && !item.redemptions.length) {
      rows.push(["Account", item.name, item.email, "", "", "", item.points, "", item.tripCode ?? "", day(item.createdAt), ""]);
    }
  }
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

function RedemptionRow({ item, onHanded }: { item: TravelerRedemption; onHanded: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hand = async () => {
    setBusy(true);
    const result = await callApi("/api/leader/redemptions", { id: item.id });
    setBusy(false);
    if (result.ok) onHanded();
    else setError(result.message);
  };
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="min-w-0">
        <span className="block font-semibold leading-snug">{item.rewardLabel}</span>
        <span className="block text-xs text-[#436850]">
          <span translate="no" className="notranslate">{item.points}</span> points · <span translate="no" className="notranslate">{day(item.createdAt)}</span>
          {item.bookingCode && (
            <>
              {" "}· <span translate="no" className="notranslate font-mono">{item.bookingCode}</span>
            </>
          )}
        </span>
        {error && <span className="block text-xs font-semibold text-[#A33A12]">{error}</span>}
      </span>
      {item.status === "pending" ? (
        <button
          onClick={() => void hand()}
          disabled={busy}
          className="flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-[#03603F] px-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Handed over
        </button>
      ) : (
        <span key="handed" className="shrink-0 rounded-full bg-[#DDE5BE] px-2.5 py-1 text-[11px] font-bold text-[#03603F]">
          Handed {item.handedAt ? <span translate="no" className="notranslate">{day(item.handedAt)}</span> : ""}
        </span>
      )}
    </li>
  );
}

function TravelerCard({ item, onChanged }: { item: Traveler; onChanged: () => void }) {
  const packages = useAllPackages();
  const [open, setOpen] = useState(false);
  const pending = item.redemptions.filter((redemption) => redemption.status === "pending").length;
  const trip = findIn(packages, item.tripPackageId);
  const spent = item.redemptions.reduce((sum, redemption) => sum + redemption.points, 0);

  return (
    <li className="rounded-3xl bg-white shadow-sm ring-1 ring-[#ADBC9F]/60">
      <button onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left">
        <span translate="no" aria-hidden="true" className="notranslate flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E9E6DF] font-fredoka text-lg font-semibold">
          {initialsOf(item.name || item.email)}
        </span>
        <span className="min-w-0 flex-1">
          <span translate="no" className="notranslate block truncate font-semibold capitalize">{item.name || "(no name)"}</span>
          <span translate="no" className="notranslate block truncate text-xs text-[#436850]">{item.email}</span>
          <span className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold">
            <span className="rounded-full bg-[#F3F4DC] px-2 py-0.5">
              <span translate="no" className="notranslate">{item.points}</span> points
            </span>
            {item.bookings.length > 0 && (
              <span className="rounded-full bg-[#DDE5BE] px-2 py-0.5 text-[#03603F]">
                <span translate="no" className="notranslate">{item.bookings.length}</span> bookings
              </span>
            )}
            {item.redemptions.length > 0 && (
              <span className="rounded-full bg-[#DDE5BE] px-2 py-0.5 text-[#03603F]">
                <span translate="no" className="notranslate">{item.redemptions.length}</span> souvenirs
              </span>
            )}
            {pending > 0 && (
              <span className="rounded-full bg-[#FBF0C4] px-2 py-0.5 text-[#5A4300]">
                <span translate="no" className="notranslate">{pending}</span> to hand over
              </span>
            )}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-[#12372A]/10 px-4 pb-4 pt-3">
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {[
              ["Current trip", trip ? `${trip.title}${item.tripCode ? ` (${item.tripCode})` : ""}` : "None"],
              ["Bottles", String(item.bottles)],
              ["Waste weighed", formatWeight(item.weightGrams)],
              ["Points spent", String(spent)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#F3F4DC] px-3 py-2">
                <dt className="text-[#436850]">{label}</dt>
                <dd translate="no" className="notranslate break-words font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold">
              <Ticket className="h-4 w-4 text-[#03603F]" /> Bookings
            </h4>
            {item.bookings.length === 0 ? (
              <p className="mt-1 text-xs text-[#436850]">No bookings from the app.</p>
            ) : (
              <ul className="mt-1 divide-y divide-[#12372A]/10">
                {item.bookings.map((booking) => (
                  <li key={booking.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span translate="no" className="notranslate block font-semibold leading-snug">{booking.packageTitle}</span>
                      <span className="block text-xs text-[#436850]">
                        <span translate="no" className="notranslate">{tripDate(booking.date)}</span> ·
                        <span translate="no" className="notranslate mx-[0.25em]">{booking.people}</span>people ·
                        <span translate="no" className="notranslate ml-[0.25em] font-mono">{booking.code ?? booking.ref}</span>
                      </span>
                    </span>
                    <span key={booking.status} className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${BOOKING_STYLE[booking.status] ?? ""}`}>
                      {BOOKING_LABEL[booking.status] ?? booking.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold">
              <Gift className="h-4 w-4 text-[#03603F]" /> Souvenirs redeemed
            </h4>
            {item.redemptions.length === 0 ? (
              <p className="mt-1 text-xs text-[#436850]">No souvenirs redeemed yet.</p>
            ) : (
              <ul className="mt-1 divide-y divide-[#12372A]/10">
                {item.redemptions.map((redemption) => (
                  <RedemptionRow key={redemption.id} item={redemption} onHanded={onChanged} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </li>
  );
}

/** Admins see every account with what it booked and redeemed, plus running totals. */
export function TravelersManager() {
  const [items, setItems] = useState<Traveler[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    callApi<{ items: Traveler[] }>("/api/admin/travelers").then((result) => {
      if (cancelled) return;
      if (result.ok) setItems(result.items);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const sum = useMemo(() => totals(items ?? []), [items]);
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      if (filter === "booked" && item.bookings.length === 0) return false;
      if (filter === "redeemed" && item.redemptions.length === 0) return false;
      return !needle || item.name.toLowerCase().includes(needle) || item.email.toLowerCase().includes(needle);
    });
  }, [items, filter, query]);

  const download = () => {
    if (!items) return;
    const blob = new Blob([`﻿${toCsv(items)}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dhiltrip-travelers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { value: sum.accounts, label: "Accounts" },
    { value: sum.bookings, label: "Bookings sent" },
    { value: sum.confirmed, label: "Bookings confirmed" },
    { value: sum.people, label: "Travelers booked" },
    { value: sum.souvenirs, label: "Souvenirs redeemed" },
    { value: sum.pending, label: "Waiting to hand over" },
    { value: sum.pointsSpent.toLocaleString("en-US"), label: "Points redeemed" },
    { value: formatWeight(sum.weightGrams), label: `Waste weighed (${sum.bottles} bottles)` },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-3xl bg-[#0D2A1F] p-4 text-white shadow">
        <div className="flex items-center justify-between gap-3">
          <h2 className="title-card flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-[#B6DC7A]" /> All-time totals
          </h2>
          <button
            onClick={download}
            disabled={!items}
            className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-semibold hover:bg-white/25 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/10 px-3 py-2.5">
              <dd translate="no" className="notranslate font-fredoka text-2xl font-semibold leading-none">{items ? stat.value : "–"}</dd>
              <dt className="mt-1 text-[11px] font-semibold leading-snug text-white/80">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex min-h-11 flex-1 items-center gap-2 rounded-2xl bg-white px-3 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-[#436850]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" aria-label="Search travelers" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
        </label>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm">
          {(
            [
              ["all", "All"],
              ["booked", "Booked"],
              ["redeemed", "Redeemed"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={`min-h-9 rounded-xl px-3 text-sm font-semibold ${filter === id ? "bg-[#0D2A1F] text-white" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}
      {items === null && !error && (
        <p className="flex items-center gap-2 text-sm text-[#436850]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      )}
      {items && shown.length === 0 && (
        <p className="rounded-3xl border-2 border-dashed border-[#ADBC9F] px-5 py-8 text-center text-sm text-[#436850]">No accounts match.</p>
      )}
      <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
        {shown.map((item) => (
          <TravelerCard key={item.uid} item={item} onChanged={() => setVersion((value) => value + 1)} />
        ))}
      </ul>
    </section>
  );
}
