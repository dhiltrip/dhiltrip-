"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, CupSoda, Flag, Gift, Loader2, MessageCircle, PackageCheck, QrCode, RefreshCcw, Scale, Truck } from "lucide-react";
import { POINTS } from "@/data/challenge";
import { focusStyle } from "@/data/focus";
import { findRewardIn, useAllRewards } from "@/lib/rewards";
import { callApi } from "@/lib/firebase/client";
import { canLead, createClaimCode, firebaseEnabled, useChallenge } from "@/lib/participant";
import { StaffHeader, StepBadge } from "@/components/StaffHeader";
import { formatWeight, useImpact } from "@/lib/site-content";

type PendingRedemption = {
  id: string;
  name: string;
  email: string;
  rewardId: string;
  rewardLabel: string;
  bookingCode: string | null;
  createdAt: number;
};

/** Message for sending a bottle code to a traveler who isn't next to the tour leader. */
function bottleCodeMessage(code: string, points: number) {
  return [
    `Your DhilTrip bottle code (+${points} points): ${code}`,
    "Open dhiltrip.com, tap Eco Mission, and type this code in the code box.",
    firebaseEnabled ? "It works once, within 2 hours." : "It works once.",
  ].join("\n");
}

/** Copy the code text, or send it on WhatsApp, for when scanning in person isn't possible. */
function ShareBottleCode({ code, points }: { code: string; points: number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
      <button
        onClick={() => void copy()}
        aria-label="Copy code"
        className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-white/30 px-4 text-sm font-semibold"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span key={copied ? "copied" : "copy"}>{copied ? "Copied" : "Copy"}</span>
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(bottleCodeMessage(code, points))}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#03603F] text-sm font-semibold text-white"
      >
        <MessageCircle className="h-4 w-4" />
        Send via WhatsApp
      </a>
    </div>
  );
}

/** Souvenirs travelers redeemed with points, waiting to be handed over at the end of the trip. */
function PendingSouvenirs({ onCount }: { onCount: (count: number) => void }) {
  const [items, setItems] = useState<PendingRedemption[] | null>(null);
  const allRewards = useAllRewards();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const apply = useCallback(
    (result: Awaited<ReturnType<typeof callApi<{ items: PendingRedemption[] }>>>) => {
      if (result.ok) {
        setItems(result.items);
        setError(null);
        onCount(result.items.length);
      } else setError(result.message);
    },
    [onCount],
  );

  const load = async () => {
    setRefreshing(true);
    apply(await callApi<{ items: PendingRedemption[] }>("/api/leader/redemptions"));
    setRefreshing(false);
  };

  useEffect(() => {
    let cancelled = false;
    callApi<{ items: PendingRedemption[] }>("/api/leader/redemptions").then((result) => {
      if (!cancelled) apply(result);
    });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const handOver = async (id: string) => {
    setBusyId(id);
    const result = await callApi("/api/leader/redemptions", { id });
    setBusyId(null);
    if (result.ok) {
      setItems((current) => {
        const next = current?.filter((item) => item.id !== id) ?? null;
        onCount(next?.length ?? 0);
        return next;
      });
    } else setError(result.message);
  };

  return (
    <section className="rounded-3xl bg-white p-5 shadow">
      <div className="flex items-center justify-between gap-3">
        <h2 className="title-card flex items-center gap-2 text-xl">
          <Gift className="h-5 w-5 text-[#03603F]" />
          Souvenirs to hand over
        </h2>
        <button
          onClick={() => void load()}
          aria-label="Refresh"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3F4DC] hover:bg-[#DDE5BE]"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-[#A33A12]">{error}</p>}
      {items === null && !error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-[#436850]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      )}
      {items?.length === 0 && (
        <div className="mt-3 rounded-2xl bg-[#F3F4DC] px-4 py-6 text-center">
          <PackageCheck className="mx-auto h-7 w-7 text-[#8DB255]" />
          <p className="mt-1.5 text-sm font-semibold">All souvenirs are handed over.</p>
        </div>
      )}
      <ul className="mt-3 space-y-2">
        {items?.map((item) => {
          const reward = findRewardIn(allRewards, item.rewardId);
          return (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-[#F3F4DC] p-2.5">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#DDE5BE]">
                {reward && <Image src={reward.image} alt="" fill sizes="56px" className="object-cover" style={focusStyle(reward.imageFocus)} />}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold leading-snug">{item.rewardLabel}</p>
                <p className="truncate text-xs text-[#436850]">
                  <span translate="no" className="notranslate">{item.name}</span>
                  {item.bookingCode && (
                    <>
                      {" · "}
                      <span translate="no" className="notranslate font-mono">{item.bookingCode}</span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => void handOver(item.id)}
                disabled={busyId === item.id}
                className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#03603F] px-3.5 text-sm font-semibold text-white disabled:opacity-70"
              >
                {busyId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Given
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ExtraTile({
  on,
  onToggle,
  media,
  title,
  points,
}: {
  on: boolean;
  onToggle: () => void;
  media: React.ReactNode;
  title: React.ReactNode;
  points: number;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`relative flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition ${
        on ? "bg-[#0D2A1F] text-white shadow-md" : "bg-[#F3F4DC] text-[#12372A] ring-1 ring-[#ADBC9F]"
      }`}
    >
      {on && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#8DB255] text-[#0D2A1F]">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      <div className="flex h-12 w-12 items-center justify-center">{media}</div>
      <span className="text-sm font-semibold leading-tight">{title}</span>
      <span className={`text-xs font-semibold ${on ? "text-[#8DB255]" : "text-[#5A4300]"}`}>
        +<span translate="no" className="notranslate mr-[0.25em]">{points}</span>points
      </span>
    </button>
  );
}

type Delivery = { id: string; weightGrams: number; note: string; by: string; createdAt: number };

/** After the trip the guide drops the collected waste at the partner waste bank and records it here. */
function WasteBankDelivery() {
  const impact = useImpact();
  const [items, setItems] = useState<Delivery[] | null>(null);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    callApi<{ items: Delivery[] }>("/api/leader/deliveries").then((result) => {
      if (!cancelled && result.ok) setItems(result.items);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await callApi("/api/leader/deliveries", { weightKg: Number(weight.replace(",", ".")), note });
    setBusy(false);
    if (!result.ok) {
      setMessage({ ok: false, text: result.message });
      return;
    }
    setMessage({ ok: true, text: "Marked as delivered. It now counts in the impact total." });
    setWeight("");
    setNote("");
    setVersion((value) => value + 1);
  };

  return (
    <section className="rounded-3xl bg-white p-5 shadow">
      <h2 className="title-card flex items-center gap-2 text-xl">
        <Truck className="h-5 w-5 text-[#03603F]" />
        Delivered to the waste bank
      </h2>
      <p className="mt-1 text-pretty text-xs text-[#436850]">
        After the trip, take the collected waste to<span translate="no" className="notranslate mx-[0.25em]">Bank Sampah Pa-Q-One</span>and
        record the weight here.
      </p>
      <p className="mt-3 rounded-2xl bg-[#F3F4DC] px-4 py-2.5 text-sm">
        Delivered so far:<span translate="no" className="notranslate ml-[0.25em] font-semibold">{formatWeight(impact.deliveredGrams)}</span>
      </p>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            required
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            placeholder="Weight (kg)"
            aria-label="Delivered weight in kilograms"
            className="w-32 shrink-0 rounded-xl border border-[#ADBC9F] px-3 py-2.5 text-base"
          />
          <input
            value={note}
            maxLength={120}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note (optional), e.g. trip CUT-1111"
            aria-label="Note"
            className="min-w-0 flex-1 rounded-xl border border-[#ADBC9F] px-3 py-2.5 text-base"
          />
        </div>
        <button
          disabled={busy || !weight}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#03603F] text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Mark as delivered
        </button>
      </form>
      {message && (
        <p key={message.text} className={`mt-2 text-sm font-semibold ${message.ok ? "text-[#03603F]" : "text-[#A33A12]"}`}>{message.text}</p>
      )}
      {items && items.length > 0 && (
        <ul className="mt-4 divide-y divide-[#12372A]/10 text-sm">
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate text-[#436850]">
                <span translate="no" className="notranslate">{new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                {item.note && ` · ${item.note}`}
              </span>
              <span translate="no" className="notranslate shrink-0 font-semibold">{formatWeight(item.weightGrams)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function LeaderPage() {
  const state = useChallenge();
  const [bottles, setBottles] = useState(1);
  const [tumbler, setTumbler] = useState(false);
  const [teloBag, setTeloBag] = useState(false);
  const [weightKg, setWeightKg] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  if (!state) return null;
  if (!canLead(state)) {
    return (
      <div className="px-5 pt-10 text-center lg:pt-20">
        <h1 className="title-page text-black">Tour leader</h1>
        <p className="mt-2 text-pretty text-sm text-[#436850]">This page is only for DhilTrip tour leaders.</p>
      </div>
    );
  }

  const points = bottles * POINTS.perBottle + (tumbler ? POINTS.tumbler : 0) + (teloBag ? POINTS.teloBag : 0);

  const change = (delta: number) => {
    setCode(null);
    setBottles((value) => Math.min(POINTS.maxBottlesPerTrip, Math.max(0, value + delta)));
  };

  const create = async () => {
    setBusy(true);
    setError(null);
    const result = await createClaimCode({ bottles, tumbler, teloBag, weightKg: Number(weightKg.replace(",", ".")) || 0 });
    setBusy(false);
    if (result.ok) setCode(result.code);
    else setError(result.message);
  };

  const reset = () => {
    setCode(null);
    setBottles(1);
    setTumbler(false);
    setTeloBag(false);
    setWeightKg("");
  };

  return (
    <div className="space-y-5 px-5 pt-6 lg:mx-auto lg:max-w-5xl">
      <StaffHeader
        icon={<Flag className="h-6 w-6" />}
        title="Tour leader"
        subtitle="Count and weigh the bottles, then show the traveler a QR code."
        stats={[
          { value: POINTS.perBottle, label: "Points per bottle" },
          { value: POINTS.maxBottlesPerTrip, label: "Bottles max per trip" },
          { value: firebaseEnabled ? (pendingCount ?? "–") : "–", label: "Souvenirs waiting" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <section className="space-y-4 rounded-3xl bg-white p-5 shadow">
          <h2 className="title-card flex items-center gap-2 text-xl">
            <StepBadge n={1} />
            <span>Check the<span translate="no" className="notranslate mx-[0.25em]">Telobag</span></span>
          </h2>

          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#8DB255] to-[#3F5F2A] p-4 text-white">
            <Image src="/challenge/bottle.webp" alt="" width={52} height={52} className="h-[52px] w-auto shrink-0 drop-shadow" />
            <div className="min-w-0 flex-1">
              <p className="font-fredoka text-lg font-semibold leading-tight">Plastic bottles</p>
              <p className="text-xs text-white/85">
                <span translate="no" className="notranslate mr-[0.25em]">{POINTS.perBottle}</span>points each
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => change(-1)}
                disabled={bottles <= 0}
                aria-label="Fewer bottles"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D2A1F] text-xl font-semibold disabled:opacity-40"
              >
                −
              </button>
              <span translate="no" className="notranslate w-8 text-center font-fredoka text-3xl font-semibold" aria-live="polite">
                {bottles}
              </span>
              <button
                onClick={() => change(1)}
                disabled={bottles >= POINTS.maxBottlesPerTrip}
                aria-label="More bottles"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D2A1F] text-xl font-semibold disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-[#F3F4DC] p-4 ring-1 ring-[#ADBC9F]">
            <Scale className="h-8 w-8 shrink-0 text-[#03603F]" />
            <span className="min-w-0 flex-1">
              <span className="block font-fredoka text-lg font-semibold leading-tight">Weight</span>
              <span className="block text-xs text-[#436850]">Weigh the bottles and waste in the bag</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={50}
                step="0.01"
                value={weightKg}
                onChange={(event) => {
                  setCode(null);
                  setWeightKg(event.target.value);
                }}
                placeholder="0.00"
                aria-label="Weight in kilograms"
                className="w-24 rounded-xl border border-[#ADBC9F] bg-white px-3 py-2.5 text-right text-lg font-semibold"
              />
              <span translate="no" className="notranslate font-semibold">kg</span>
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <ExtraTile
              on={tumbler}
              onToggle={() => {
                setCode(null);
                setTumbler((value) => !value);
              }}
              media={<CupSoda className="h-9 w-9" />}
              title={<>Brought a<span translate="no" className="notranslate mx-[0.25em]">tumbler</span></>}
              points={POINTS.tumbler}
            />
            <ExtraTile
              on={teloBag}
              onToggle={() => {
                setCode(null);
                setTeloBag((value) => !value);
              }}
              media={<Image src="/challenge/telobag.webp" alt="" width={48} height={48} className="h-12 w-auto object-contain" />}
              title={<>Used a<span translate="no" className="notranslate mx-[0.25em]">Telobag</span></>}
              points={POINTS.teloBag}
            />
          </div>
          <p className="text-pretty text-xs text-[#436850]"><span translate="no" className="notranslate mr-[0.25em]">Tumbler</span>and<span translate="no" className="notranslate mx-[0.25em]">Telobag</span>points count once per trip.</p>

          {error && <p className="text-sm font-semibold text-[#A33A12]">{error}</p>}
          <button
            onClick={() => void create()}
            disabled={(points === 0 && !(Number(weightKg.replace(",", ".")) > 0)) || busy}
            className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-[#0D2A1F] px-5 text-white disabled:opacity-50"
          >
            <span className="flex items-center gap-2 font-fredoka text-lg font-semibold">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
              Create QR code
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
              <Image src="/challenge/coin.webp" alt="" width={18} height={18} />
              <span translate="no" className="notranslate">{points}</span>
            </span>
          </button>
        </section>

        <section className="space-y-5">
          <div className="rounded-3xl bg-white p-5 shadow">
            <h2 className="title-card flex items-center gap-2 text-xl">
              <StepBadge n={2} />
              Show this to the traveler
            </h2>
            {code ? (
              <div className="mt-4 animate-rise-in rounded-3xl bg-[#0D2A1F] p-5 text-center text-white">
                <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                  <QRCodeSVG value={code} size={208} marginSize={1} />
                </div>
                <p translate="no" className="notranslate mt-3 break-all font-mono text-sm font-bold">{code}</p>
                <p className="mt-1 text-xs text-[#ADBC9F]">
                  {firebaseEnabled ? "Each code can be used once, within 2 hours." : "Each code can be used once."}
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                  <Image src="/challenge/coin.webp" alt="" width={18} height={18} />+
                  <span translate="no" className="notranslate mr-[0.25em]">{points}</span>points
                  {Number(weightKg.replace(",", ".")) > 0 && (
                    <span translate="no" className="notranslate ml-1 text-[#ADBC9F]">· {Number(weightKg.replace(",", "."))} kg</span>
                  )}
                </p>
                <ShareBottleCode code={code} points={points} />
                <p className="mt-2 text-pretty text-xs text-[#ADBC9F]">Scanner not working or not next to the traveler? Send the code; they type it in the code box (menu:<span translate="no" className="notranslate ml-[0.25em]">Eco Mission</span>).</p>
                <button onClick={reset} className="mt-3 min-h-11 w-full rounded-2xl bg-[#8DB255] font-fredoka font-semibold text-[#0D2A1F]">
                  Next traveler
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-3xl border-2 border-dashed border-[#ADBC9F] px-5 py-10 text-center">
                <QrCode className="mx-auto h-10 w-10 text-[#ADBC9F]" />
                <p className="mt-2 text-pretty text-sm text-[#436850]">
                  The QR code appears here. The traveler scans it to get the points (menu:<span translate="no" className="notranslate ml-[0.25em]">Eco Mission</span>).
                </p>
              </div>
            )}
          </div>

          {firebaseEnabled && <PendingSouvenirs onCount={setPendingCount} />}
          {firebaseEnabled && <WasteBankDelivery />}
        </section>
      </div>
    </div>
  );
}
