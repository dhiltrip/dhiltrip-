"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { prefixOf, type ChallengePackage } from "@/data/challenge";
import { callApi } from "@/lib/firebase/client";
import { CURRENCIES, currencyInfo, formatPrice } from "@/data/currency";
import { useAllPackages } from "@/lib/packages";
import { shrinkPhoto } from "@/lib/shrink-photo";
import { FocusPicker } from "@/components/admin/FocusPicker";
import { focusStyle, type Focus } from "@/data/focus";

const LocationPicker = dynamic(() => import("@/components/LocationPicker").then((module) => module.LocationPicker), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-2xl bg-[#DDE5BE]" />,
});

const field =
  "mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]";

type PriceDraft = { key: string; code: string; amount: string };
type StopDraft = { key: string; id?: string; name: string; lat: number | null; lng: number | null; funfact: string };
type Draft = {
  id?: string;
  title: string;
  tagline: string;
  description: string;
  priceLabel: string;
  prices: PriceDraft[];
  duration: string;
  tags: string;
  destinationLabel: string;
  destinations: string;
  includes: string;
  meetingPoints: string;
  routeChoice: boolean;
  stops: StopDraft[];
  poster: string | null;
  posterData: string | null;
  posterFocus: Focus | null;
};

const newKey = () => Math.random().toString(36).slice(2);

const emptyStop = (): StopDraft => ({ key: newKey(), name: "", lat: null, lng: null, funfact: "" });

const emptyDraft = (): Draft => ({
  title: "",
  tagline: "",
  description: "",
  priceLabel: "50 USD",
  prices: [{ key: newKey(), code: "IDR", amount: "" }],
  duration: "One Day Trip",
  tags: "",
  destinationLabel: "Route / Destination",
  destinations: "",
  includes: "",
  meetingPoints: "Yogyakarta Train Station\nBandara YIA\nHotel",
  routeChoice: false,
  stops: [emptyStop()],
  poster: null,
  posterData: null,
  posterFocus: null,
});

const draftFrom = (pkg: ChallengePackage): Draft => ({
  id: pkg.id,
  title: pkg.title,
  tagline: pkg.tagline,
  description: pkg.description,
  priceLabel: pkg.priceLabel,
  prices: Object.entries(pkg.prices ?? {}).map(([code, amount]) => ({ key: newKey(), code, amount: String(amount ?? "") })),
  duration: pkg.duration,
  tags: pkg.tags.join(", "),
  destinationLabel: pkg.destinationLabel,
  destinations: pkg.destinations.join("\n"),
  includes: pkg.includes.join("\n"),
  meetingPoints: pkg.meetingPoints.join("\n"),
  routeChoice: pkg.routeChoice === true,
  stops: pkg.stops.map((stop) => ({ key: newKey(), ...stop })),
  poster: pkg.poster,
  posterData: null,
  posterFocus: pkg.posterFocus ?? null,
});

const splitLines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl bg-white p-5 shadow">
      <div>
        <h3 className="title-card text-lg">{title}</h3>
        {hint && <p className="mt-0.5 text-pretty text-xs text-[#436850]">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Default price text plus a price per country; visitors see the one matching their language. */
function PriceSection({ draft, set }: { draft: Draft; set: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) {
  const used = new Set(draft.prices.map((price) => price.code));
  const free = CURRENCIES.filter((currency) => !used.has(currency.code));
  const update = (key: string, patch: Partial<PriceDraft>) =>
    set("prices", draft.prices.map((price) => (price.key === key ? { ...price, ...patch } : price)));

  return (
    <Section title="Price" hint="Visitors see the price for the language they choose. Other languages see the default price.">
      <label className="block text-sm font-semibold">
        Default price
        <input required maxLength={60} value={draft.priceLabel} onChange={(event) => set("priceLabel", event.target.value)} placeholder="50 USD" className={field} />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Price per country</p>
        {draft.prices.length === 0 && <p className="text-xs text-[#436850]">No country prices yet.</p>}
        {draft.prices.map((price) => {
          const info = currencyInfo(price.code);
          const amount = Number(price.amount);
          return (
            <div key={price.key} className="rounded-2xl bg-[#F3F4DC] p-3">
              <div className="flex items-center gap-2">
                <select
                  value={price.code}
                  onChange={(event) => update(price.key, { code: event.target.value })}
                  aria-label="Country and currency"
                  className="min-w-0 flex-1 rounded-xl border border-[#ADBC9F] bg-white px-2 py-2.5 text-sm"
                >
                  {[...(info ? [info] : []), ...free].map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.country} ({currency.code})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={price.amount}
                  onChange={(event) => update(price.key, { amount: event.target.value })}
                  placeholder="Amount"
                  aria-label={`Price in ${price.code}`}
                  className="w-32 shrink-0 rounded-xl border border-[#ADBC9F] bg-white px-3 py-2.5 text-right text-sm"
                />
                <button
                  type="button"
                  onClick={() => set("prices", draft.prices.filter((item) => item.key !== price.key))}
                  aria-label="Remove this price"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#A33A12] hover:bg-[#A33A12]/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[#436850]">
                {amount > 0 ? (
                  <>
                    Shows as{" "}
                    <span translate="no" className="notranslate font-semibold text-[#12372A]">
                      {formatPrice(amount, price.code)}
                    </span>
                  </>
                ) : (
                  "Enter the amount, e.g. 650000"
                )}
              </p>
            </div>
          );
        })}
        {free.length > 0 && (
          <button
            type="button"
            onClick={() => set("prices", [...draft.prices, { key: newKey(), code: free[0].code, amount: "" }])}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ADBC9F] text-sm font-semibold text-[#03603F]"
          >
            <Plus className="h-4 w-4" />
            Add a country price
          </button>
        )}
      </div>
    </Section>
  );
}

function Editor({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [openStop, setOpenStop] = useState<string | null>(initial.id ? null : initial.stops[0]?.key ?? null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = !initial.id;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const setStop = (key: string, patch: Partial<StopDraft>) =>
    setDraft((current) => ({ ...current, stops: current.stops.map((stop) => (stop.key === key ? { ...stop, ...patch } : stop)) }));
  const moveStop = (index: number, delta: number) =>
    setDraft((current) => {
      const stops = [...current.stops];
      const to = index + delta;
      if (to < 0 || to >= stops.length) return current;
      [stops[index], stops[to]] = [stops[to], stops[index]];
      return { ...current, stops };
    });

  const pickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setError(null);
    try {
      const data = await shrinkPhoto(file);
      // A new photo starts centred again.
      setDraft((current) => ({ ...current, posterData: data, posterFocus: null }));
    } catch {
      setError("This photo could not be used. Please try another one.");
    }
    setPhotoBusy(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const missing = draft.stops.find((stop) => stop.lat === null || stop.lng === null);
    if (missing) {
      setError(`Tap the map to set where ${missing.name || "each place"} is.`);
      setOpenStop(missing.key);
      return;
    }
    if (isNew && !draft.posterData) {
      setError("Please add a poster photo.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await callApi<{ id: string }>("/api/admin/packages", {
      action: "save",
      package: {
        id: draft.id,
        title: draft.title,
        tagline: draft.tagline,
        description: draft.description,
        priceLabel: draft.priceLabel,
        prices: Object.fromEntries(draft.prices.filter((price) => price.amount.trim()).map((price) => [price.code, Number(price.amount)])),
        duration: draft.duration,
        tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        destinationLabel: draft.destinationLabel,
        destinations: splitLines(draft.destinations),
        includes: splitLines(draft.includes),
        meetingPoints: splitLines(draft.meetingPoints),
        routeChoice: draft.routeChoice,
        stops: draft.stops.map(({ id, name, lat, lng, funfact }) => ({ id, name, lat, lng, funfact })),
        posterData: draft.posterData,
        posterFocus: draft.posterFocus,
      },
    });
    setBusy(false);
    if (result.ok) onDone();
    else setError(result.message);
  };

  const posterSrc = draft.posterData ?? draft.poster;

  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onDone} aria-label="Back to packages" className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="title-section min-w-0 text-black">{isNew ? "New package" : "Edit package"}</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <Section title="Poster" hint="Every card in the catalog has the same tall shape. Other photos are cropped from the middle, as shown here.">
          <label className="relative block cursor-pointer overflow-hidden rounded-2xl bg-[#F3F4DC] ring-1 ring-[#ADBC9F]">
            {posterSrc ? (
              // Data URLs from the file picker can't go through the image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterSrc} alt="Poster preview" className="aspect-[1000/1414] h-auto w-full object-cover" style={focusStyle(draft.posterFocus)} />
            ) : (
              <span className="flex aspect-[1000/1414] flex-col items-center justify-center gap-2 text-sm font-semibold text-[#436850]">
                <ImagePlus className="h-8 w-8" />
                Choose a photo
              </span>
            )}
            {photoBusy && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="h-6 w-6 animate-spin" />
              </span>
            )}
            <input type="file" accept="image/*" onChange={(event) => void pickPhoto(event)} className="sr-only" />
          </label>
          {posterSrc && (
            <>
              <p className="text-center text-xs font-semibold text-[#436850]">Tap the poster to change it.</p>
              <FocusPicker
                src={posterSrc}
                focus={draft.posterFocus}
                onChange={(focus) => set("posterFocus", focus)}
                shapes={[
                  { label: "Catalog card", aspect: "1000 / 1414", width: "5.5rem" },
                  { label: "Package picker (Admin)", aspect: "4 / 3", width: "7.5rem" },
                ]}
              />
            </>
          )}
        </Section>

        <div className="space-y-4">
          <Section title="Basics">
            <label className="block text-sm font-semibold">
              Package name
              <input required maxLength={60} value={draft.title} onChange={(event) => set("title", event.target.value)} placeholder="e.g. Prambanan Sunrise Walk" className={field} />
            </label>
            <label className="block text-sm font-semibold">
              Tagline (optional)
              <input maxLength={120} value={draft.tagline} onChange={(event) => set("tagline", event.target.value)} placeholder="One short line" className={field} />
            </label>
            <label className="block text-sm font-semibold">
              Description
              <textarea required rows={4} maxLength={1500} value={draft.description} onChange={(event) => set("description", event.target.value)} className={`${field} resize-y`} />
            </label>
            <label className="block text-sm font-semibold">
              Duration
              <input required maxLength={40} value={draft.duration} onChange={(event) => set("duration", event.target.value)} className={field} />
            </label>
            <label className="block text-sm font-semibold">
              Tags (optional, separated by commas)
              <input value={draft.tags} onChange={(event) => set("tags", event.target.value)} placeholder="Nature, Culture" className={field} />
            </label>
          </Section>

          <PriceSection draft={draft} set={set} />

          <Section title="Places on the map" hint="Travelers see these pins and their fun facts, and tick them during the trip.">
            <label className="flex items-start gap-3 rounded-2xl bg-[#F3F4DC] p-3 text-sm">
              <input type="checkbox" checked={draft.routeChoice} onChange={(event) => set("routeChoice", event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#03603F]" />
              <span>
                <span className="block font-semibold">Travelers choose one route</span>
                <span className="text-xs text-[#436850]">Like Mount Merapi: each place is a separate route and only one can be ticked.</span>
              </span>
            </label>

            <ol className="space-y-3">
              {draft.stops.map((stop, index) => {
                const open = openStop === stop.key;
                const placed = stop.lat !== null && stop.lng !== null;
                return (
                  <li key={stop.key} className="rounded-2xl ring-1 ring-[#ADBC9F]">
                    <div className="flex items-center gap-2 p-3">
                      <span translate="no" className="notranslate flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0D2A1F] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <button type="button" onClick={() => setOpenStop(open ? null : stop.key)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-semibold">{stop.name || "New place"}</span>
                        {/* A new node per label so the translator re-translates it. */}
                        <span key={placed ? "placed" : "missing"} className={`flex items-center gap-1 text-xs ${placed ? "text-[#03603F]" : "text-[#A33A12]"}`}>
                          <MapPin className="h-3 w-3" />
                          {placed ? "On the map" : "Not on the map yet"}
                        </span>
                      </button>
                      <button type="button" onClick={() => moveStop(index, -1)} disabled={index === 0} aria-label="Move up" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-30">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => moveStop(index, 1)} disabled={index === draft.stops.length - 1} aria-label="Move down" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-30">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => set("stops", draft.stops.filter((item) => item.key !== stop.key))}
                        disabled={draft.stops.length === 1}
                        aria-label="Remove place"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#A33A12] hover:bg-[#A33A12]/10 disabled:opacity-30"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {open && (
                      <div className="space-y-3 border-t border-[#ADBC9F]/60 p-3">
                        <label className="block text-sm font-semibold">
                          Place name
                          <input required maxLength={60} value={stop.name} onChange={(event) => setStop(stop.key, { name: event.target.value })} className={field} />
                        </label>
                        <label className="block text-sm font-semibold">
                          Fun fact
                          <textarea required rows={3} maxLength={700} value={stop.funfact} onChange={(event) => setStop(stop.key, { funfact: event.target.value })} className={`${field} resize-y`} />
                        </label>
                        <LocationPicker lat={stop.lat} lng={stop.lng} onChange={(lat, lng) => setStop(stop.key, { lat, lng })} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            <button
              type="button"
              onClick={() => {
                const stop = emptyStop();
                set("stops", [...draft.stops, stop]);
                setOpenStop(stop.key);
              }}
              disabled={draft.stops.length >= 15}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ADBC9F] text-sm font-semibold text-[#03603F] disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Add a place
            </button>
          </Section>

          <Section title="Details" hint="One item per line.">
            <label className="block text-sm font-semibold">
              What&apos;s included
              <textarea rows={4} value={draft.includes} onChange={(event) => set("includes", event.target.value)} placeholder={"Guided walking tour\nLocal snacks"} className={`${field} resize-y`} />
            </label>
            <label className="block text-sm font-semibold">
              Meeting points
              <textarea rows={3} value={draft.meetingPoints} onChange={(event) => set("meetingPoints", event.target.value)} className={`${field} resize-y`} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Route title
                <input maxLength={40} value={draft.destinationLabel} onChange={(event) => set("destinationLabel", event.target.value)} className={field} />
              </label>
              <label className="block text-sm font-semibold">
                Route list (optional)
                <textarea rows={3} value={draft.destinations} onChange={(event) => set("destinations", event.target.value)} placeholder="Empty: uses the place names" className={`${field} resize-y`} />
              </label>
            </div>
          </Section>
        </div>
      </div>

      <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 space-y-2 rounded-3xl bg-[#0D2A1F] p-3 shadow-lg lg:bottom-4">
        {error && <p role="alert" className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#A33A12]">{error}</p>}
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
          <button type="button" onClick={onDone} className="min-h-12 rounded-2xl border border-white/30 px-4 font-semibold text-white">
            Cancel
          </button>
          <button disabled={busy || photoBusy} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#8DB255] font-fredoka text-lg font-semibold text-[#0D2A1F] disabled:opacity-60">
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {isNew ? "Publish package" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

function PackageRow({
  pkg,
  first,
  last,
  onEdit,
  onError,
}: {
  pkg: ChallengePackage;
  first: boolean;
  last: boolean;
  onEdit: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const run = async (name: string, body: object, method?: "DELETE") => {
    setBusy(name);
    const result = await callApi("/api/admin/packages", body, method);
    setBusy(null);
    if (!result.ok) onError(result.message);
    return result.ok;
  };

  const iconButton = "flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-30";

  return (
    <li className={`rounded-3xl bg-white p-3 shadow-sm ring-1 ring-[#ADBC9F]/60 ${pkg.hidden ? "bg-white/70" : ""}`}>
      <div className="flex gap-3">
        <div className={`relative h-24 w-[4.25rem] shrink-0 overflow-hidden rounded-xl bg-[#DDE5BE] ${pkg.hidden ? "grayscale" : ""}`}>
          <Image src={pkg.poster} alt="" fill sizes="68px" className="object-cover" style={focusStyle(pkg.posterFocus)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p translate="no" className="notranslate font-fredoka text-lg font-semibold leading-tight">{pkg.title}</p>
            {pkg.hidden && (
              <span key="hidden" className="rounded-full bg-[#E9E6DF] px-2 py-0.5 text-[11px] font-bold text-[#5A4300]">Hidden</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#436850]">
            {pkg.duration} · <span translate="no" className="notranslate mr-[0.25em]">{pkg.stops.length}</span>places
          </p>
          <p className="mt-0.5 text-xs text-[#436850]">
            Codes start with <span translate="no" className="notranslate font-mono font-bold text-[#12372A]">{prefixOf(pkg)}-</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={onEdit} className="flex min-h-9 items-center gap-1.5 rounded-full bg-[#0D2A1F] px-3 text-sm font-semibold text-white">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={() => void run("hide", { action: "hide", id: pkg.id, hidden: !pkg.hidden })}
              disabled={busy !== null}
              className="flex min-h-9 items-center gap-1.5 rounded-full border border-[#12372A]/30 px-3 text-sm font-semibold"
            >
              {busy === "hide" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : pkg.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span key={pkg.hidden ? "show" : "hide"}>{pkg.hidden ? "Show" : "Hide"}</span>
            </button>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center">
          <button onClick={() => void run("up", { action: "move", id: pkg.id, direction: -1 })} disabled={first || busy !== null} aria-label="Move up" className={iconButton}>
            <ArrowUp className="h-4 w-4" />
          </button>
          <button onClick={() => void run("down", { action: "move", id: pkg.id, direction: 1 })} disabled={last || busy !== null} aria-label="Move down" className={iconButton}>
            <ArrowDown className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirming(true)} disabled={busy !== null} aria-label="Delete package" className={`${iconButton} text-[#A33A12]`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {confirming && (
        <div className="mt-3 animate-rise-in rounded-2xl bg-[#A33A12]/10 p-3">
          <p className="text-pretty text-sm font-semibold text-[#A33A12]">
            Delete <span translate="no" className="notranslate">{pkg.title}</span>? This cannot be undone. Packages that already have booking
            codes can only be hidden.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirming(false)} className="min-h-10 rounded-2xl border border-[#12372A]/30 bg-white text-sm font-semibold">
              Cancel
            </button>
            <button
              onClick={async () => {
                if (await run("delete", { id: pkg.id }, "DELETE")) setConfirming(false);
              }}
              disabled={busy !== null}
              style={{ backgroundColor: "#A33A12" }}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Yes, delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Lets admins add, edit, hide and reorder travel packages without touching code. */
export function PackageManager() {
  const all = useAllPackages();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <Editor
        key={editing.id ?? "new"}
        initial={editing}
        onDone={() => {
          setEditing(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  return (
    <section className="space-y-3">
      <button
        onClick={() => {
          setError(null);
          setEditing(emptyDraft());
        }}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white"
      >
        <Plus className="h-5 w-5" />
        Add a package
      </button>
      <p className="text-pretty text-xs text-[#436850]">
        Changes appear for travelers right away. Hidden packages disappear from the catalog, but travelers already on that trip keep it.
      </p>
      {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}
      <ul className="grid gap-3 lg:grid-cols-2">
        {all.map((pkg, index) => (
          <PackageRow
            key={pkg.id}
            pkg={pkg}
            first={index === 0}
            last={index === all.length - 1}
            onEdit={() => {
              setError(null);
              setEditing(draftFrom(pkg));
            }}
            onError={setError}
          />
        ))}
      </ul>
    </section>
  );
}
