"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Gift,
  ImagePlus,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { Reward } from "@/data/challenge";
import { focusStyle, type Focus } from "@/data/focus";
import { callApi } from "@/lib/firebase/client";
import { useAllRewards } from "@/lib/rewards";
import { shrinkPhoto } from "@/lib/shrink-photo";
import { FocusPicker } from "@/components/admin/FocusPicker";
import { CountryPrices, draftToPrices, newPrice, pricesToDraft, type PriceDraft } from "@/components/admin/CountryPrices";
import { formatPrice } from "@/lib/currency";

type Draft = {
  id?: string;
  label: string;
  category: string;
  points: string;
  priceLabel: string;
  prices: PriceDraft[];
  image: string | null;
  imageData: string | null;
  imageFocus: Focus | null;
};

const emptyDraft = (): Draft => ({
  label: "",
  category: "",
  points: "50",
  priceLabel: "",
  prices: [newPrice("IDR")],
  image: null,
  imageData: null,
  imageFocus: null,
});
const draftOf = (reward: Reward): Draft => ({
  id: reward.id,
  label: reward.label,
  category: reward.category,
  points: String(reward.points),
  priceLabel: reward.priceLabel,
  prices: pricesToDraft(reward.prices),
  image: reward.image,
  imageData: null,
  imageFocus: reward.imageFocus ?? null,
});

const field =
  "mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]";

/** Add a new souvenir or change one: photo with focus point, name, category, points and price. */
function Editor({
  initial,
  categories,
  onDone,
  onCancel,
}: {
  initial: Draft;
  categories: string[];
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const photo = draft.imageData ?? draft.image;

  const pickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const data = await shrinkPhoto(file);
      // A new photo starts centred again.
      setDraft((current) => ({ ...current, imageData: data, imageFocus: null }));
    } catch {
      setError("This photo could not be used. Please try another one.");
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await callApi("/api/admin/rewards", {
      action: "save",
      id: draft.id,
      label: draft.label,
      category: draft.category,
      points: Number(draft.points),
      priceLabel: draft.priceLabel,
      prices: draftToPrices(draft.prices),
      imageData: draft.imageData,
      imageFocus: draft.imageFocus,
    });
    setBusy(false);
    if (result.ok) onDone(draft.id ? `${draft.label.trim()} is updated.` : `${draft.label.trim()} is now in the Rewards Store.`);
    else setError(result.message);
  };

  return (
    <form onSubmit={save} className="animate-rise-in space-y-4 rounded-3xl bg-white p-5 shadow ring-2 ring-[#8DB255]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="title-card flex items-center gap-2 text-xl">
          {draft.id ? <Pencil className="h-5 w-5 text-[#03603F]" /> : <Plus className="h-5 w-5 text-[#03603F]" />}
          {draft.id ? "Edit souvenir" : "New souvenir"}
        </h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F3F4DC]">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold">Photo</p>
        <div className="mt-1.5 flex items-center gap-3">
          <label className="relative flex aspect-[3/4] w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-[#F3F4DC] text-[#436850] ring-1 ring-[#ADBC9F]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Photo preview" className="h-full w-full object-cover" style={focusStyle(draft.imageFocus)} />
            ) : (
              <ImagePlus className="h-7 w-7" />
            )}
            <input type="file" accept="image/*" onChange={(event) => void pickPhoto(event)} className="sr-only" />
          </label>
          <p className="text-pretty text-xs text-[#436850]">
            Tap to {photo ? "change" : "choose"} the photo. It fills the whole card; choose below which part stays in view.
          </p>
        </div>
        {photo && (
          <div className="mt-3">
            <FocusPicker
              src={photo}
              focus={draft.imageFocus}
              onChange={(focus) => set("imageFocus", focus)}
              shapes={[
                { label: "Rewards card", aspect: "3 / 4", width: "7rem" },
                { label: "Small photo", aspect: "1 / 1", width: "4rem" },
              ]}
            />
          </div>
        )}
      </div>

      <label className="block text-sm font-semibold">
        Name
        <input required maxLength={80} value={draft.label} onChange={(event) => set("label", event.target.value)} placeholder="e.g. Wayang Keychain (Bima)" className={field} />
      </label>

      <div>
        <label className="block text-sm font-semibold">
          Category
          <input
            required
            maxLength={24}
            list="reward-categories"
            value={draft.category}
            onChange={(event) => set("category", event.target.value)}
            placeholder="Wayang, Keychain, Earring…"
            className={field}
          />
        </label>
        <datalist id="reward-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => set("category", category)}
              aria-pressed={draft.category === category}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-[#5A4300]/40 ${
                draft.category === category ? "bg-[#5A4300] text-white" : "text-[#5A4300]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[#436850]">Pick one, or type a new category. Travelers filter by it.</p>
      </div>

      <label className="block text-sm font-semibold">
          Points to redeem
          <input
            required
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            value={draft.points}
            onChange={(event) => set("points", event.target.value)}
            className={field}
          />
        </label>

      <div className="space-y-3 rounded-2xl bg-white p-3 ring-1 ring-[#ADBC9F]/60">
        <div>
          <p className="text-sm font-semibold">Price to buy</p>
          <p className="mt-0.5 text-pretty text-xs text-[#436850]">Visitors see the price for the language they choose. Other languages see the default price.</p>
        </div>
        <label className="block text-sm font-semibold">
          Default price
          <input required maxLength={60} value={draft.priceLabel} onChange={(event) => set("priceLabel", event.target.value)} placeholder="e.g. 5 USD" className={field} />
        </label>
        <CountryPrices prices={draft.prices} onChange={(prices) => set("prices", prices)} />
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel} className="min-h-12 rounded-2xl border border-[#12372A]/30 font-fredoka text-lg font-semibold">
          Cancel
        </button>
        <button
          disabled={busy || !photo}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          Save
        </button>
      </div>
    </form>
  );
}

/** Default price plus every country price, so admins see all of them at a glance. */
function PriceList({ reward }: { reward: Reward }) {
  const entries = Object.entries(reward.prices ?? {}).filter((entry): entry is [string, number] => typeof entry[1] === "number");
  return (
    <span translate="no" className="notranslate">
      {[reward.priceLabel, ...entries.map(([code, amount]) => formatPrice(amount, code))].filter(Boolean).join(" · ")}
    </span>
  );
}

type SaveStatus = "saving" | "saved" | "error";

function StockControl({
  reward,
  value,
  status,
  onChange,
}: {
  reward: Reward;
  value: number | null;
  status?: SaveStatus;
  onChange: (next: number | null) => void;
}) {
  const unlimited = value === null;
  const round = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D2A1F] text-white disabled:opacity-30";
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-xs font-semibold text-[#436850]">Stock</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(unlimited ? null : Math.max(0, value - 1))}
          disabled={unlimited || value <= 0}
          aria-label={`Fewer ${reward.label}`}
          className={round}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span translate="no" className="notranslate min-w-8 text-center font-fredoka text-xl font-semibold" aria-live="polite">
          {unlimited ? "∞" : value}
        </span>
        <button
          type="button"
          onClick={() => onChange(unlimited ? 1 : Math.min(9999, value + 1))}
          aria-label={`More ${reward.label}`}
          className={round}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {!unlimited && (
        <button type="button" onClick={() => onChange(null)} className="text-[11px] font-semibold text-[#436850] underline">
          Make unlimited
        </button>
      )}
      {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#436850]" />}
      {status === "saved" && (
        <span key="saved" className="flex items-center gap-0.5 text-[11px] font-semibold text-[#03603F]">
          <Check className="h-3.5 w-3.5" /> Saved
        </span>
      )}
      {status === "error" && <span key="error" className="text-[11px] font-semibold text-[#A33A12]">Not saved</span>}
    </div>
  );
}

/** Admins manage the Rewards Store: add, edit, hide, reorder and delete souvenirs, and set their stock. */
export function RewardsManager() {
  const rewards = useAllRewards();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [stock, setStock] = useState<Record<string, number | null> | null>(null);
  const [status, setStatus] = useState<Partial<Record<string, SaveStatus>>>({});
  const [stockVersion, setStockVersion] = useState(0);
  const timers = useRef<Record<string, number>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const categories = [...new Set(rewards.map((reward) => reward.category))];

  useEffect(() => {
    let cancelled = false;
    callApi<{ stock: Record<string, number | null> }>("/api/admin/stock").then((result) => {
      if (cancelled) return;
      if (result.ok) setStock(result.stock);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [stockVersion]);

  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach((timer) => window.clearTimeout(timer));
  }, []);

  const persistStock = async (rewardId: string, next: number | null) => {
    setStatus((current) => ({ ...current, [rewardId]: "saving" }));
    const result = await callApi("/api/admin/stock", { rewardId, stock: next });
    if (result.ok) {
      setStatus((current) => ({ ...current, [rewardId]: "saved" }));
      window.setTimeout(
        () => setStatus((current) => (current[rewardId] === "saved" ? { ...current, [rewardId]: undefined } : current)),
        2500,
      );
    } else {
      setError(result.message);
      setStatus((current) => ({ ...current, [rewardId]: "error" }));
    }
  };

  /** Updates the number right away and saves shortly after the last tap. */
  const changeStock = (rewardId: string, next: number | null) => {
    setStock((current) => ({ ...(current ?? {}), [rewardId]: next }));
    window.clearTimeout(timers.current[rewardId]);
    timers.current[rewardId] = window.setTimeout(() => void persistStock(rewardId, next), 600);
  };

  const run = async (id: string, body: Record<string, unknown>, method?: "DELETE") => {
    setBusyId(id);
    setError(null);
    const result = await callApi("/api/admin/rewards", body, method);
    setBusyId(null);
    if (!result.ok) setError(result.message);
    return result.ok;
  };

  const openEditor = (draft: Draft) => {
    setNotice(null);
    setEditing(draft);
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl bg-white/70 p-4 ring-1 ring-[#ADBC9F]/60 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#03603F]" />
          <p className="min-w-0 text-pretty text-sm text-[#436850]">
            Add souvenirs, change their photo, points and price, and set how many are left. <strong className="text-[#12372A]">∞</strong> means
            unlimited; at <strong className="text-[#12372A]">0</strong> travelers see &ldquo;Out of stock&rdquo;. Changes show in the Rewards Store right away.
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => openEditor(emptyDraft())}
            className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-[#0D2A1F] px-4 font-fredoka font-semibold text-white"
          >
            <Plus className="h-5 w-5" /> Add souvenir
          </button>
        )}
      </div>

      {notice && <p key={notice} className="rounded-2xl bg-[#DDE5BE] px-4 py-3 text-sm font-semibold text-[#03603F]">{notice}</p>}
      {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}

      <div ref={editorRef} className="scroll-mt-4">
        {editing && (
          <Editor
            key={editing.id ?? "new"}
            initial={editing}
            categories={categories}
            onCancel={() => setEditing(null)}
            onDone={(message) => {
              setEditing(null);
              setNotice(message);
              setStockVersion((value) => value + 1);
            }}
          />
        )}
      </div>

      <ul className="grid gap-3 lg:grid-cols-2">
        {rewards.map((reward, index) => {
          const busy = busyId === reward.id;
          const value = stock ? (stock[reward.id] ?? null) : null;
          return (
            <li
              key={reward.id}
              className={`rounded-3xl bg-white p-3 shadow-sm ring-1 ring-[#ADBC9F]/60 ${reward.hidden ? "opacity-70" : ""}`}
            >
              <div className="flex gap-3">
                <div className={`relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-2xl bg-[#0D2A1F] ${value === 0 || reward.hidden ? "grayscale" : ""}`}>
                  <Image src={reward.image} alt="" fill sizes="80px" className="object-cover" style={focusStyle(reward.imageFocus)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#F3F4DC] px-2 py-0.5 text-[11px] font-bold text-[#5A4300]">{reward.category}</span>
                    {reward.hidden && (
                      <span key="hidden" className="flex items-center gap-1 rounded-full bg-[#E9E6DF] px-2 py-0.5 text-[11px] font-bold text-[#436850]">
                        <EyeOff className="h-3 w-3" /> Hidden
                      </span>
                    )}
                    {busy && <Loader2 className="h-4 w-4 animate-spin text-[#436850]" />}
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-snug">{reward.label}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#436850]">
                    <span className="flex items-center gap-1 font-semibold text-[#5A4300]">
                      <Image src="/challenge/coin.webp" alt="" width={14} height={14} />
                      <span translate="no" className="notranslate">{reward.points}</span>
                    </span>
                    <PriceList reward={reward} />
                  </p>
                  <div className="mt-2">
                    {stock ? (
                      <StockControl reward={reward} value={value} status={status[reward.id]} onChange={(next) => changeStock(reward.id, next)} />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-[#436850]" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  onClick={() => openEditor(draftOf(reward))}
                  className="flex min-h-10 items-center gap-1 rounded-xl bg-[#F3F4DC] px-3 text-xs font-semibold"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => void run(reward.id, { action: "hide", id: reward.id, hidden: !reward.hidden })}
                  disabled={busy}
                  className="flex min-h-10 items-center gap-1 rounded-xl bg-[#F3F4DC] px-3 text-xs font-semibold disabled:opacity-50"
                >
                  {reward.hidden ? <Eye key="icon-show" className="h-4 w-4" /> : <EyeOff key="icon-hide" className="h-4 w-4" />}
                  <span key={reward.hidden ? "label-show" : "label-hide"}>{reward.hidden ? "Show" : "Hide"}</span>
                </button>
                <button
                  onClick={() => void run(reward.id, { action: "move", id: reward.id, direction: -1 })}
                  disabled={busy || index === 0}
                  aria-label={`Move ${reward.label} up`}
                  className="flex min-h-10 w-10 items-center justify-center rounded-xl bg-[#F3F4DC] disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => void run(reward.id, { action: "move", id: reward.id, direction: 1 })}
                  disabled={busy || index === rewards.length - 1}
                  aria-label={`Move ${reward.label} down`}
                  className="flex min-h-10 w-10 items-center justify-center rounded-xl bg-[#F3F4DC] disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmingId(reward.id)}
                  disabled={busy}
                  aria-label={`Delete ${reward.label}`}
                  className="ml-auto flex min-h-10 w-10 items-center justify-center rounded-xl text-[#A33A12] ring-1 ring-[#A33A12]/30 hover:bg-[#A33A12]/10 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {confirmingId === reward.id && (
                <div className="mt-3 animate-rise-in rounded-2xl bg-[#A33A12]/10 p-3">
                  <p className="text-pretty text-sm font-semibold text-[#A33A12]">
                    Delete {reward.label} for good? Travelers who already redeemed it keep their record. To take it away for a while, use Hide instead.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => setConfirmingId(null)} className="min-h-10 rounded-2xl border border-[#12372A]/30 bg-white text-sm font-semibold">
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (await run(reward.id, { id: reward.id }, "DELETE")) {
                          setConfirmingId(null);
                          setNotice(`${reward.label} is deleted.`);
                        }
                      }}
                      disabled={busy}
                      style={{ backgroundColor: "#A33A12" }}
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Yes, delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
