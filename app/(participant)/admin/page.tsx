"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarDays,
  Check,
  Copy,
  Gift,
  Images,
  Inbox,
  Loader2,
  Map as MapIcon,
  MessageCircle,
  Newspaper,
  Minus,
  Pause,
  Play,
  Plus,
  QrCode,
  Star,
  StickyNote,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { rewards } from "@/data/challenge";
import { focusStyle } from "@/data/focus";
import { findIn, useAllPackages, usePackages } from "@/lib/packages";
import { callApi } from "@/lib/firebase/client";
import { isAdmin, useChallenge } from "@/lib/participant";
import { StaffHeader, StepBadge } from "@/components/StaffHeader";
import { PackageManager } from "@/components/admin/PackageManager";
import { TeamManager } from "@/components/admin/TeamManager";
import { MemoriesManager } from "@/components/admin/MemoriesManager";
import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { ArticlesManager } from "@/components/admin/ArticlesManager";
import { RequestsManager } from "@/components/admin/RequestsManager";

type Booking = {
  code: string;
  packageId: string;
  date: string;
  seats: number;
  joined: number;
  label: string;
  active: boolean;
};

const field =
  "mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]";

const todayInJogja = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

const prettyDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

function shareText(booking: Booking, title = "your trip") {
  return `Your Dhil Trip booking code for ${title} on ${booking.date}: ${booking.code}\nOpen dhiltrip.com, choose the package, and enter this code to join the Leave No Trace Challenge.`;
}

/** Round minus / value / plus control. */
function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
  display,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  display?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Fewer ${label}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0D2A1F] text-white disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span translate="no" className="notranslate min-w-9 text-center font-fredoka text-2xl font-semibold" aria-live="polite">
        {display ?? value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`More ${label}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0D2A1F] text-white disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  tone = "default",
  pressed,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone?: "default" | "danger";
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed}
      disabled={disabled}
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold leading-tight transition-colors disabled:opacity-35 ${
        tone === "danger"
          ? "text-[#A33A12] hover:bg-[#A33A12]/10"
          : pressed
            ? "bg-[#DDE5BE] text-[#12372A]"
            : "text-[#12372A] hover:bg-[#DDE5BE]/70"
      }`}
    >
      {icon}
      {/* A new node per label so the translator re-translates it. */}
      <span key={label}>{label}</span>
    </button>
  );
}

function BookingCard({
  booking,
  highlight,
  onToggle,
  onDelete,
}: {
  booking: Booking;
  highlight: boolean;
  onToggle: (active: boolean) => void;
  onDelete: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const pkg = findIn(useAllPackages(), booking.packageId);
  const full = booking.joined >= booking.seats;

  const remove = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setConfirming(false);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(booking.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <li
      className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 transition-shadow ${
        highlight ? "ring-2 ring-[#8DB255] shadow-md" : "ring-[#ADBC9F]/70"
      }`}
    >
      <div className="flex gap-3 p-4">
        <div className={`relative h-[4.5rem] w-14 shrink-0 overflow-hidden rounded-xl bg-[#DDE5BE] ${booking.active ? "" : "grayscale"}`}>
          {pkg && <Image src={pkg.poster} alt="" fill sizes="56px" className="object-cover" style={focusStyle(pkg.posterFocus)} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p translate="no" className="notranslate break-all font-mono text-lg font-bold leading-tight tracking-wide">{booking.code}</p>
            <span
              key={booking.active ? "on" : "off"}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                booking.active ? "bg-[#DDE5BE] text-[#03603F]" : "bg-[#E9E6DF] text-[#5A4300]"
              }`}
            >
              {booking.active ? "Active" : "Off"}
            </span>
          </div>
          <p translate="no" className="notranslate mt-0.5 truncate text-sm font-semibold">{pkg?.title ?? booking.packageId}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#436850]">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{prettyDate(booking.date)}</span>
          </p>
          {booking.label && (
            <p className="mt-1 flex items-start gap-1 text-xs font-semibold text-[#12372A]">
              <StickyNote className="mt-px h-3.5 w-3.5 shrink-0 text-[#5A4300]" />
              {/* The admin's own words, so the translator leaves them alone. */}
              <span translate="no" className="notranslate min-w-0 break-words">{booking.label}</span>
            </p>
          )}
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1 text-[#436850]">
            <Users className="h-3.5 w-3.5" />
            Joined
          </span>
          <span translate="no" className={`notranslate ${full ? "text-[#03603F]" : ""}`}>
            {booking.joined} / {booking.seats}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E9E6DF]">
          <div
            className="h-full rounded-full bg-[#8DB255] transition-[width]"
            style={{ width: `${Math.min(100, (booking.joined / Math.max(1, booking.seats)) * 100)}%` }}
          />
        </div>
      </div>

      <div className="px-4 pt-4">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText(booking, pkg?.title))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#03603F] text-sm font-semibold text-white"
        >
          <MessageCircle className="h-4 w-4" />
          Send via WhatsApp
        </a>
      </div>

      <div className="mt-3 border-t border-dashed border-[#ADBC9F]" />
      <div className="grid grid-cols-4 gap-1 p-2">
        <ActionButton onClick={() => void copy()} icon={copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />} label={copied ? "Copied" : "Copy"} />
        <ActionButton onClick={() => setShowQr((value) => !value)} pressed={showQr} icon={<QrCode className="h-5 w-5" />} label="QR code" />
        <ActionButton
          onClick={() => onToggle(!booking.active)}
          icon={booking.active ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          label={booking.active ? "Turn off" : "Turn on"}
        />
        <ActionButton
          onClick={() => setConfirming(true)}
          disabled={booking.joined > 0 || confirming}
          tone="danger"
          icon={<Trash2 className="h-5 w-5" />}
          label="Delete"
        />
      </div>

      {showQr && (
        <div className="mx-4 mb-4 animate-rise-in rounded-2xl bg-[#F3F4DC] p-4 text-center">
          <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm">
            <QRCodeSVG value={booking.code} size={184} marginSize={1} />
          </div>
          <p translate="no" className="notranslate mt-3 font-mono text-sm font-bold">{booking.code}</p>
          <p className="mx-auto mt-1 max-w-xs text-pretty text-xs text-[#436850]">
            Travelers point their camera here to join this trip (menu:<span translate="no" className="notranslate ml-[0.25em]">Eco Mission</span>).
          </p>
        </div>
      )}

      {confirming && (
        <div className="mx-4 mb-4 animate-rise-in rounded-2xl bg-[#A33A12]/10 p-4">
          <p className="text-pretty text-sm font-semibold text-[#A33A12]">
            Delete <span translate="no" className="notranslate">{booking.code}</span>? This cannot be undone.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="min-h-11 rounded-2xl border border-[#12372A]/30 bg-white text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => void remove()}
              disabled={deleting}
              style={{ backgroundColor: "#A33A12" }}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Yes, delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

type SaveStatus = "saving" | "saved" | "error";

function StockEditor() {
  const [stock, setStock] = useState<Record<string, number | null> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<Partial<Record<string, SaveStatus>>>({});
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    callApi<{ stock: Record<string, number | null> }>("/api/admin/stock").then((result) => {
      if (cancelled) return;
      if (result.ok) setStock(result.stock);
      else setMessage(result.message);
    });
    const pending = timers.current;
    return () => {
      cancelled = true;
      Object.values(pending).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const persist = async (rewardId: string, next: number | null) => {
    setStatus((current) => ({ ...current, [rewardId]: "saving" }));
    const result = await callApi("/api/admin/stock", { rewardId, stock: next });
    if (result.ok) {
      setMessage(null);
      setStatus((current) => ({ ...current, [rewardId]: "saved" }));
      window.setTimeout(
        () => setStatus((current) => (current[rewardId] === "saved" ? { ...current, [rewardId]: undefined } : current)),
        2500,
      );
    } else {
      setMessage(result.message);
      setStatus((current) => ({ ...current, [rewardId]: "error" }));
    }
  };

  /** Updates the number right away and saves shortly after the last tap. */
  const change = (rewardId: string, next: number | null) => {
    setStock((current) => ({ ...(current ?? {}), [rewardId]: next }));
    window.clearTimeout(timers.current[rewardId]);
    timers.current[rewardId] = window.setTimeout(() => void persist(rewardId, next), 600);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3 rounded-3xl bg-white/70 p-4 ring-1 ring-[#ADBC9F]/60">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#03603F]" />
        <p className="text-pretty text-sm text-[#436850]">
          Set how many of each souvenir you still have. Changes save by themselves. <strong className="text-[#12372A]">∞</strong> means
          unlimited; at <strong className="text-[#12372A]">0</strong> travelers see &ldquo;Out of stock&rdquo;.
        </p>
      </div>
      {message && <p className="text-sm font-semibold text-[#A33A12]">{message}</p>}
      {!stock ? (
        <p className="flex items-center gap-2 text-sm text-[#436850]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rewards.map((reward) => {
            const value = stock[reward.id] ?? null;
            const state = status[reward.id];
            const unlimited = value === null;
            return (
              <li key={reward.id} className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-[#ADBC9F]/60">
                <div className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#DDE5BE] ${value === 0 ? "grayscale" : ""}`}>
                  <Image src={reward.image} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug">{reward.label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                    <span className="flex items-center gap-1 text-[#5A4300]">
                      <Image src="/challenge/coin.webp" alt="" width={14} height={14} />
                      <span translate="no" className="notranslate">{reward.points}</span>
                    </span>
                    {state === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#436850]" />}
                    {state === "saved" && (
                      <span key="saved" className="flex items-center gap-0.5 text-[#03603F]">
                        <Check className="h-3.5 w-3.5" /> Saved
                      </span>
                    )}
                    {state === "error" && <span key="error" className="text-[#A33A12]">Not saved</span>}
                  </div>
                  {!unlimited && (
                    <button onClick={() => change(reward.id, null)} className="mt-1 text-[11px] font-semibold text-[#436850] underline">
                      Make unlimited
                    </button>
                  )}
                </div>
                <Stepper
                  label={reward.label}
                  value={unlimited ? -1 : value}
                  min={unlimited ? -1 : 0}
                  display={unlimited ? "∞" : undefined}
                  onChange={(next) => change(reward.id, unlimited ? (next > -1 ? 1 : null) : Math.max(0, next))}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type Tab = "requests" | "codes" | "packages" | "souvenirs" | "memories" | "reviews" | "articles" | "team";

/** Admins create a group booking code after payment and send it to the group on WhatsApp. */
export default function AdminPage() {
  const state = useChallenge();
  const packages = usePackages();
  const [tab, setTab] = useState<Tab>("requests");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [date, setDate] = useState(todayInJogja());
  const [seats, setSeats] = useState(4);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const allowed = isAdmin(state);
  const packageId = chosenId && packages.some((pkg) => pkg.id === chosenId) ? chosenId : (packages[0]?.id ?? "");
  const setPackageId = setChosenId;

  const load = async () => {
    const result = await callApi<{ items: Booking[] }>("/api/admin/bookings");
    if (result.ok) setBookings(result.items);
    else setError(result.message);
  };

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    callApi<{ items: Booking[] }>("/api/admin/bookings").then((result) => {
      if (cancelled) return;
      if (result.ok) setBookings(result.items);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  if (!state) return null;
  if (!allowed) {
    return (
      <div className="px-5 pt-10 text-center lg:pt-20">
        <h1 className="title-page text-black">Admin</h1>
        <p className="mt-2 text-pretty text-sm text-[#436850]">This page is only for Dhil Trip admins.</p>
      </div>
    );
  }

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await callApi<{ code: string }>("/api/admin/bookings", { packageId, date, seats, label });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCreated(result.code);
    setLabel("");
    await load();
  };

  const toggle = async (code: string, active: boolean) => {
    const result = await callApi("/api/admin/bookings", { code, active });
    if (result.ok) setBookings((current) => current?.map((item) => (item.code === code ? { ...item, active } : item)) ?? null);
    else setError(result.message);
  };

  const removeBooking = async (code: string) => {
    const result = await callApi("/api/admin/bookings", { code }, "DELETE");
    if (result.ok) setBookings((current) => current?.filter((item) => item.code !== code) ?? null);
    else setError(result.message);
  };

  const active = bookings?.filter((item) => item.active) ?? [];
  const joined = bookings?.reduce((sum, item) => sum + item.joined, 0) ?? 0;
  const openSeats = active.reduce((sum, item) => sum + Math.max(0, item.seats - item.joined), 0);

  return (
    <div className="space-y-5 px-5 pt-6 lg:mx-auto lg:max-w-5xl">
      <StaffHeader
        icon={<Ticket className="h-6 w-6" />}
        title="Admin"
        subtitle="Everything travelers see, in one place."
        stats={[
          { value: bookings ? active.length : "–", label: "Active codes" },
          { value: bookings ? joined : "–", label: "Travelers joined" },
          { value: bookings ? openSeats : "–", label: "Open seats" },
        ]}
      />

      <div role="tablist" aria-label="Admin sections" className="grid grid-cols-4 gap-1 rounded-3xl bg-[#DDE5BE] p-1 sm:grid-cols-8">
        {(
          [
            ["requests", "Bookings", <Inbox key="i" className="h-4 w-4 shrink-0" />],
            ["codes", "Codes", <Ticket key="i" className="h-4 w-4 shrink-0" />],
            ["packages", "Packages", <MapIcon key="i" className="h-4 w-4 shrink-0" />],
            ["souvenirs", "Stock", <Gift key="i" className="h-4 w-4 shrink-0" />],
            ["memories", "Photos", <Images key="i" className="h-4 w-4 shrink-0" />],
            ["reviews", "Reviews", <Star key="i" className="h-4 w-4 shrink-0" />],
            ["articles", "Articles", <Newspaper key="i" className="h-4 w-4 shrink-0" />],
            ["team", "Team", <Users key="i" className="h-4 w-4 shrink-0" />],
          ] as const
        ).map(([id, text, icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] px-1 font-fredoka text-[12px] font-semibold leading-tight transition-colors min-[380px]:text-[13px] ${
              tab === id ? "bg-[#0D2A1F] text-white shadow" : "text-[#12372A]"
            }`}
          >
            {icon}
            {text}
          </button>
        ))}
      </div>

      {tab === "requests" ? (
        <RequestsManager />
      ) : tab === "articles" ? (
        <ArticlesManager />
      ) : tab === "memories" ? (
        <MemoriesManager />
      ) : tab === "reviews" ? (
        <ReviewsManager />
      ) : tab === "team" ? (
        <TeamManager myEmail={state.user?.email ?? ""} />
      ) : tab === "souvenirs" ? (
        <StockEditor />
      ) : tab === "packages" ? (
        <PackageManager />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
          <form onSubmit={create} className="space-y-4 rounded-3xl bg-white p-5 shadow lg:sticky lg:top-6">
            <h2 className="title-card flex items-center gap-2 text-xl">
              <StepBadge n={1} />
              New booking code
            </h2>

            <fieldset>
              <legend className="text-sm font-semibold">Trip package</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {packages.map((pkg) => {
                  const selected = pkg.id === packageId;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setPackageId(pkg.id)}
                      aria-pressed={selected}
                      className={`relative aspect-[4/3] overflow-hidden rounded-2xl text-left transition ${
                        selected ? "ring-4 ring-[#8DB255]" : "opacity-80 ring-1 ring-[#ADBC9F] hover:opacity-100"
                      }`}
                    >
                      <Image src={pkg.poster} alt="" fill sizes="180px" className="object-cover" style={focusStyle(pkg.posterFocus)} />
                      <span className="absolute inset-0 bg-gradient-to-t from-[#0D2A1F]/90 via-[#0D2A1F]/30 to-transparent" />
                      <span translate="no" className="notranslate absolute inset-x-2 bottom-1.5 font-fredoka text-sm font-semibold leading-tight text-white">
                        {pkg.title}
                      </span>
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#8DB255] text-[#0D2A1F]">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block text-sm font-semibold">
              Trip date
              <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className={field} />
            </label>

            <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F3F4DC] px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4" />
                Number of travelers
              </span>
              <Stepper label="people" value={seats} min={1} max={100} onChange={setSeats} />
            </div>

            <label className="block text-sm font-semibold">
              Note (optional)
              <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Group name or WhatsApp contact" className={field} />
            </label>

            {error && <p className="text-sm font-semibold text-[#A33A12]">{error}</p>}
            {created && (
              <div className="flex animate-rise-in items-center gap-3 rounded-2xl bg-[#DDE5BE] px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#03603F] text-white">
                  <Check className="h-4 w-4" />
                </span>
                <p className="min-w-0 text-sm">
                  New code: <span translate="no" className="notranslate ml-[0.25em] font-mono font-bold">{created}</span>
                  <span className="block">Send it to the group from the list below.</span>
                </p>
              </div>
            )}
            <button
              disabled={busy}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white disabled:opacity-70"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              Create code
            </button>
          </form>

          <section>
            <h2 className="title-section flex items-center gap-2 text-black">
              <StepBadge n={2} />
              Send to the group
            </h2>
            {bookings === null ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-[#436850]">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </p>
            ) : bookings.length === 0 ? (
              <div className="mt-3 rounded-3xl border-2 border-dashed border-[#ADBC9F] px-5 py-10 text-center">
                <Ticket className="mx-auto h-8 w-8 text-[#ADBC9F]" />
                <p className="mt-2 font-fredoka text-lg font-semibold">No booking codes yet</p>
                <p className="mt-1 text-pretty text-sm text-[#436850]">Create one after the group has paid, then send it on WhatsApp.</p>
              </div>
            ) : (
              <ul className="mt-3 grid gap-3 xl:grid-cols-2">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.code}
                    booking={booking}
                    highlight={booking.code === created}
                    onToggle={(value) => void toggle(booking.code, value)}
                    onDelete={() => removeBooking(booking.code)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
