"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Clock, Eye, EyeOff, Loader2, MessageSquarePlus, Pencil, Star, Trash2, User, X } from "lucide-react";
import { REVIEW_TEXT_MAX, averageRating, type Review, type ReviewStatus } from "@/data/content";
import { callApi } from "@/lib/firebase/client";
import { findIn, useAllPackages } from "@/lib/packages";
import { StarPicker, Stars } from "@/components/Stars";

const field =
  "mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]";

type Draft = { id?: string; name: string; label: string; rating: number; text: string; packageId: string };
const emptyDraft: Draft = { name: "", label: "", rating: 5, text: "", packageId: "" };

function ReviewForm({ draft, onDone }: { draft: Draft; onDone: (saved: boolean) => void }) {
  const packages = useAllPackages();
  const [value, setValue] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(key: K, next: Draft[K]) => setValue((current) => ({ ...current, [key]: next }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await callApi("/api/admin/reviews", { action: "save", ...value, packageId: value.packageId || null });
    setBusy(false);
    if (result.ok) onDone(true);
    else setError(result.message);
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white p-5 shadow">
      <div className="flex items-center justify-between gap-3">
        <h2 className="title-card flex items-center gap-2 text-xl">
          <MessageSquarePlus className="h-5 w-5 text-[#03603F]" />
          {value.id ? "Edit review" : "Add a review"}
        </h2>
        {value.id && (
          <button type="button" onClick={() => onDone(false)} aria-label="Cancel editing" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex justify-center rounded-2xl bg-[#F3F4DC] py-1">
        <StarPicker value={value.rating} onChange={(rating) => set("rating", rating)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Name
          <input required maxLength={60} value={value.name} onChange={(event) => set("name", event.target.value)} placeholder="e.g. Dimas A." className={field} />
        </label>
        <label className="block text-sm font-semibold">
          About them (optional)
          <input maxLength={60} value={value.label} onChange={(event) => set("label", event.target.value)} placeholder="e.g. Teacher" className={field} />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        Review
        <textarea required rows={4} maxLength={REVIEW_TEXT_MAX} value={value.text} onChange={(event) => set("text", event.target.value)} className={`${field} resize-y`} />
      </label>
      <label className="block text-sm font-semibold">
        Package (optional)
        <select value={value.packageId} onChange={(event) => set("packageId", event.target.value)} className={field}>
          <option value="">Not about one package</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
          ))}
        </select>
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}
      <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white disabled:opacity-70">
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        {value.id ? "Save changes" : "Publish review"}
      </button>
    </form>
  );
}

function ReviewCard({
  review,
  onEdit,
  onChanged,
  onError,
}: {
  review: Review;
  onEdit: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const packages = useAllPackages();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pkg = findIn(packages, review.packageId);

  const run = async (name: string, body: object, method?: "DELETE") => {
    setBusy(name);
    const result = await callApi("/api/admin/reviews", body, method);
    setBusy(null);
    if (result.ok) onChanged();
    else onError(result.message);
  };
  const setStatus = (status: ReviewStatus) => void run(status, { action: "status", id: review.id, status });
  const small = "flex min-h-10 items-center justify-center gap-1.5 rounded-2xl px-3 text-sm font-semibold disabled:opacity-50";

  return (
    <li className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ${review.status === "pending" ? "ring-2 ring-[#C2A44E]" : "ring-[#ADBC9F]/60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p translate="no" className="notranslate font-fredoka text-lg font-semibold leading-tight">{review.name}</p>
          {review.label && <p className="text-xs text-[#436850]">{review.label}</p>}
        </div>
        <div className="text-amber-400">
          <Stars value={review.rating} tone="fill-amber-400 text-amber-400" />
        </div>
      </div>
      <p translate="no" className="notranslate mt-2 text-pretty text-sm leading-relaxed">{review.text}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
        <span key={review.source} className="flex items-center gap-1 rounded-full bg-[#F3F4DC] px-2 py-0.5 text-[#436850]">
          <User className="h-3 w-3" /> {review.source === "traveler" ? "From a traveler" : "Added by admin"}
        </span>
        {pkg && (
          <span translate="no" className="notranslate rounded-full bg-[#F3F4DC] px-2 py-0.5 text-[#436850]">{pkg.title}</span>
        )}
      </div>

      {confirming ? (
        <div className="mt-3 rounded-2xl bg-[#A33A12]/10 p-3">
          <p className="text-sm font-semibold text-[#A33A12]">Delete this review for good?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirming(false)} className="min-h-10 rounded-2xl border border-[#12372A]/30 bg-white text-sm font-semibold">
              Cancel
            </button>
            <button
              onClick={() => void run("delete", { id: review.id }, "DELETE")}
              disabled={busy !== null}
              style={{ backgroundColor: "#A33A12" }}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Yes, delete
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.status !== "published" && (
            <button onClick={() => setStatus("published")} disabled={busy !== null} className={`${small} bg-[#03603F] text-white`}>
              {busy === "published" ? <Loader2 className="h-4 w-4 animate-spin" /> : review.status === "pending" ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {review.status === "pending" ? "Approve" : "Show"}
            </button>
          )}
          {review.status !== "hidden" && (
            <button onClick={() => setStatus("hidden")} disabled={busy !== null} className={`${small} border border-[#12372A]/30`}>
              {busy === "hidden" ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
              Hide
            </button>
          )}
          <button onClick={onEdit} disabled={busy !== null} className={`${small} border border-[#12372A]/30`}>
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button onClick={() => setConfirming(true)} disabled={busy !== null} className={`${small} border border-[#A33A12]/40 text-[#A33A12]`}>
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

const SECTIONS: { status: ReviewStatus; title: string; empty: string; icon: React.ReactNode }[] = [
  { status: "pending", title: "Waiting for approval", empty: "No new reviews from travelers.", icon: <Clock className="h-5 w-5 text-[#C2A44E]" /> },
  { status: "published", title: "On the home page", empty: "No published reviews yet.", icon: <Eye className="h-5 w-5 text-[#03603F]" /> },
  { status: "hidden", title: "Hidden", empty: "Nothing hidden.", icon: <EyeOff className="h-5 w-5 text-[#436850]" /> },
];

/** Admins add reviews, approve travelers' reviews, and hide or delete any of them. */
export function ReviewsManager() {
  const [items, setItems] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [formKey, setFormKey] = useState(0);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    callApi<{ items: Review[] }>("/api/admin/reviews").then((result) => {
      if (cancelled) return;
      if (result.ok) setItems(result.items);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = () => setVersion((value) => value + 1);
  const published = items?.filter((item) => item.status === "published") ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4 lg:sticky lg:top-6">
        <div className="flex items-center gap-3 rounded-3xl bg-[#0D2A1F] p-4 text-white shadow">
          <Star className="h-9 w-9 shrink-0 fill-amber-400 text-amber-400" />
          <div>
            <p translate="no" className="notranslate font-fredoka text-3xl font-semibold leading-none">
              {published.length ? averageRating(published).toFixed(1) : "–"}
            </p>
            <p className="mt-1 text-xs text-white/80">
              Average of<span translate="no" className="notranslate mx-[0.25em]">{published.length}</span>reviews on the home page
            </p>
          </div>
        </div>
        <ReviewForm
          key={formKey}
          draft={draft}
          onDone={(saved) => {
            setDraft(emptyDraft);
            setFormKey((value) => value + 1);
            if (saved) reload();
          }}
        />
      </div>

      <div className="space-y-6">
        {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}
        {items === null && !error && (
          <p className="flex items-center gap-2 text-sm text-[#436850]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        )}
        {items &&
          SECTIONS.map((section) => {
            const list = items.filter((item) => item.status === section.status);
            if (section.status === "hidden" && list.length === 0) return null;
            return (
              <section key={section.status}>
                <h2 className="title-section flex items-center gap-2 text-black">
                  {section.icon}
                  {section.title}
                  <span translate="no" className="notranslate rounded-full bg-[#DDE5BE] px-2 text-sm">{list.length}</span>
                </h2>
                {list.length === 0 ? (
                  <p className="mt-2 rounded-3xl border-2 border-dashed border-[#ADBC9F] px-5 py-6 text-center text-sm text-[#436850]">{section.empty}</p>
                ) : (
                  <ul className="mt-3 grid gap-3 xl:grid-cols-2">
                    {list.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        onChanged={reload}
                        onError={setError}
                        onEdit={() => {
                          setDraft({
                            id: review.id,
                            name: review.name,
                            label: review.label,
                            rating: review.rating,
                            text: review.text,
                            packageId: review.packageId ?? "",
                          });
                          setFormKey((value) => value + 1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
      </div>
    </div>
  );
}
