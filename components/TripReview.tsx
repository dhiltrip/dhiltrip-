"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Clock, Eye, EyeOff, Loader2, MessageSquareHeart, Pencil, Trash2, X } from "lucide-react";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN, type Review } from "@/data/content";
import { callApi, firebaseEnabled } from "@/lib/firebase/client";
import { usePackage } from "@/lib/packages";
import { useMyReview, useMyReviews } from "@/lib/site-content";
import { StarPicker, Stars } from "@/components/Stars";

function ReviewSheet({ initial, packageId, onClose }: { initial: Review | null; packageId: string; onClose: () => void }) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [text, setText] = useState(initial?.text ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!rating) {
      setError("Tap the stars to choose your rating.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await callApi("/api/reviews", { rating, text, label, packageId });
    setBusy(false);
    if (result.ok) onClose();
    else setError(result.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 lg:items-center lg:p-6" role="dialog" aria-modal="true" aria-label="Review your trip">
      <form onSubmit={submit} className="w-full max-w-[480px] animate-rise-in space-y-4 rounded-t-3xl bg-[#F3F4DC] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:max-w-md lg:rounded-3xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="title-card">How was your trip?</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-black/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-center">
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <label className="block text-sm font-semibold">
          Your review
          <textarea
            required
            rows={4}
            minLength={REVIEW_TEXT_MIN}
            maxLength={REVIEW_TEXT_MAX}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What did you enjoy? Anything we could do better?"
            className="mt-1.5 w-full resize-y rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]"
          />
          <span translate="no" className="notranslate mt-1 block text-right text-xs font-normal text-[#436850]">
            {text.trim().length}/{REVIEW_TEXT_MAX}
          </span>
        </label>
        <label className="block text-sm font-semibold">
          About you (optional)
          <input
            maxLength={60}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="e.g. Student from Seoul"
            className="mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]"
          />
        </label>
        <p className="text-pretty text-xs text-[#436850]">Your first name and review may appear on our home page after our team checks it.</p>
        {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}
        <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white disabled:opacity-70">
          {busy && <Loader2 className="h-5 w-5 animate-spin" />}
          {initial ? "Update review" : "Send review"}
        </button>
      </form>
    </div>
  );
}

function StatusBadge({ status }: { status: Review["status"] }) {
  return (
    <span
      key={status}
      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        status === "published" ? "bg-[#DDE5BE] text-[#03603F]" : "bg-[#FBF0C4] text-[#5A4300]"
      }`}
    >
      {status === "published" && <Eye className="h-3 w-3" />}
      {status === "pending" && <Clock className="h-3 w-3" />}
      {status === "hidden" && <EyeOff className="h-3 w-3" />}
      {status === "published" ? "On the home page" : status === "pending" ? "Waiting for approval" : "Not shown"}
    </span>
  );
}

/** One of the traveler's reviews, with its status and Edit / Delete. Used on Home and in Profile. */
export function MyReviewCard({ review, showPackage = false }: { review: Review; showPackage?: boolean }) {
  const pkg = usePackage(review.packageId);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    const result = await callApi("/api/reviews", { packageId: review.packageId }, "DELETE");
    setBusy(false);
    if (result.ok) setConfirming(false);
    else setError(result.message);
  };

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showPackage && pkg ? (
            <h3 translate="no" className="notranslate title-card truncate text-lg">{pkg.title}</h3>
          ) : (
            <h2 className="title-card text-lg">Your review</h2>
          )}
          <div className="mt-1">
            <Stars value={review.rating} size="h-5 w-5" tone="fill-amber-400 text-amber-400" />
          </div>
        </div>
        <StatusBadge status={review.status} />
      </div>
      <p translate="no" className="notranslate mt-2 text-pretty text-sm leading-relaxed">{review.text}</p>
      {error && <p className="mt-2 text-sm font-semibold text-[#A33A12]">{error}</p>}
      {confirming ? (
        <div className="mt-3 rounded-2xl bg-[#A33A12]/10 p-3">
          <p className="text-sm font-semibold text-[#A33A12]">Delete your review? This cannot be undone.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirming(false)} className="min-h-10 rounded-2xl border border-[#12372A]/30 bg-white text-sm font-semibold">
              Cancel
            </button>
            <button
              onClick={() => void remove()}
              disabled={busy}
              style={{ backgroundColor: "#A33A12" }}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Yes, delete
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => setOpen(true)} className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border border-[#12372A]/30 text-sm font-semibold">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border border-[#A33A12]/40 text-sm font-semibold text-[#A33A12]"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
      {review.status !== "pending" && !confirming && (
        <p className="mt-2 text-pretty text-xs text-[#436850]">Editing sends it to our team to check again.</p>
      )}
      {open && review.packageId && <ReviewSheet initial={review} packageId={review.packageId} onClose={() => setOpen(false)} />}
    </article>
  );
}

/**
 * On "Your travel package": invites the traveler to rate the trip and shows it while it waits for approval.
 * Once approved, the review lives in Profile, and only a short note stays here.
 */
export function TripReview({ packageId }: { packageId: string }) {
  const review = useMyReview(packageId);
  const [open, setOpen] = useState(false);
  if (!firebaseEnabled) return null;

  if (review?.status === "published") {
    return (
      <Link href="/profile#my-reviews" className="flex items-center gap-3 rounded-3xl bg-white px-5 py-4 shadow-sm">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-[#03603F]" />
        <span className="min-w-0 flex-1 text-pretty text-sm">
          <span className="block font-semibold">Thanks for your review!</span>
          <span className="text-[#436850]">It&apos;s on our home page. See it in your Profile.</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-[#436850]" />
      </Link>
    );
  }

  if (review) return <MyReviewCard review={review} />;

  return (
    <section className="rounded-3xl bg-white p-5 shadow">
      <div className="flex items-center gap-3">
        <MessageSquareHeart className="h-9 w-9 shrink-0 text-[#03603F]" />
        <div className="min-w-0 flex-1">
          <h2 className="title-card text-lg">Enjoying the trip?</h2>
          <p className="text-pretty text-sm text-[#436850]">Give it a rating and help other travelers.</p>
        </div>
        <button onClick={() => setOpen(true)} className="shrink-0 rounded-full bg-[#0D2A1F] px-4 py-2.5 text-sm font-semibold text-white">
          Rate
        </button>
      </div>
      {open && <ReviewSheet initial={null} packageId={packageId} onClose={() => setOpen(false)} />}
    </section>
  );
}

/** Profile: every review the traveler has written, from every trip. */
export function MyReviews() {
  const reviews = useMyReviews();
  if (!firebaseEnabled || reviews.length === 0) return null;
  return (
    <section id="my-reviews" className="scroll-mt-24 space-y-3">
      <h2 className="title-section text-black">Your reviews</h2>
      {reviews.map((review) => (
        <MyReviewCard key={review.id} review={review} showPackage />
      ))}
    </section>
  );
}
