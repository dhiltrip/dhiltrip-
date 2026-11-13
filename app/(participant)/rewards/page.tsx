"use client";

import { useState } from "react";
import Image from "next/image";
import { Gift } from "lucide-react";
import { nextRewardFor, whatsappLink, type Reward } from "@/data/challenge";
import { focusStyle } from "@/data/focus";
import { redeemReward, useChallenge, useRewardStock, type RedeemResult } from "@/lib/participant";
import { useRewards } from "@/lib/rewards";
import { priceFor, useSiteLanguage } from "@/lib/currency";

function RedeemSheet({ reward, points, onClose }: { reward: Reward; points: number; onClose: () => void }) {
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    setResult(await redeemReward(reward.id));
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 lg:items-center lg:p-6" role="dialog" aria-modal="true" aria-label="Redeem reward">
      <div className="w-full max-w-[480px] animate-rise-in rounded-t-3xl lg:max-w-md lg:rounded-3xl lg:pb-6 bg-[#F3F4DC] p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] text-[#12372A]">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#DDE5BE]">
            <Image src={reward.image} alt={reward.label} fill sizes="64px" className="object-cover" style={focusStyle(reward.imageFocus)} />
          </div>
          {result?.ok ? (
            <div className="min-w-0">
              <h2 className="title-card text-[#03603F]">Redeemed!</h2>
              <p className="mt-1 text-sm">Collect your souvenir from your tour leader at the end of the trip.</p>
            </div>
          ) : (
            <div className="min-w-0">
              <h2 className="title-card">
                Redeem for<span translate="no" className="notranslate mx-[0.25em]">{reward.points}</span>points?
              </h2>
              <p className="mt-1 text-sm">
                You have<span translate="no" className="notranslate mx-[0.25em]">{points}</span>points.
              </p>
            </div>
          )}
        </div>
        {result && !result.ok && <p className="mt-3 text-sm font-semibold text-[#A33A12]">{result.message}</p>}
        {!result?.ok && (
          <button
            onClick={confirm}
            disabled={busy}
            className="mt-5 min-h-12 w-full rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white"
          >
            Confirm
          </button>
        )}
        <button onClick={onClose} className="mt-2 min-h-12 w-full rounded-2xl border border-[#12372A]/30 font-fredoka text-lg font-semibold">
          Close
        </button>
      </div>
    </div>
  );
}

export default function RewardsPage() {
  const state = useChallenge();
  const stock = useRewardStock();
  const rewards = useRewards();
  const language = useSiteLanguage();
  const [filter, setFilter] = useState("All");
  const [redeeming, setRedeeming] = useState<Reward | null>(null);
  if (!state) return null;

  // Filters follow the categories admins use, in the order they first appear.
  const filters = ["All", ...new Set(rewards.map((reward) => reward.category))];
  const active = filters.includes(filter) ? filter : "All";
  const visible = rewards.filter((reward) => active === "All" || reward.category === active);
  const next = nextRewardFor(state.points, rewards);
  // One souvenir per trip: the trip's booking code (or "no trip") already has a redemption.
  const usedThisTrip = state.redemptions.some((item) => (item.bookingCode ?? null) === (state.bookingCode ?? null));
  const affordableCount = usedThisTrip ? 0 : rewards.filter((reward) => reward.points <= state.points && stock[reward.id] !== 0).length;

  return (
    <div className="space-y-5 px-5 pt-6">
      <h1 className="title-card rounded-3xl bg-gradient-to-r from-[#8DB255] to-[#3F5F2A] py-3.5 text-center text-3xl text-white shadow">
        Rewards Store
      </h1>

      <section className="relative overflow-hidden rounded-3xl bg-[#0D2A1F] p-4 text-white shadow">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#8DB255]/25 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <Image src="/challenge/coin.webp" alt="" width={44} height={44} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#ADBC9F]">Your points</p>
            <p translate="no" className="notranslate font-fredoka text-3xl font-semibold leading-none">{state.points}</p>
          </div>
          <p className="max-w-[9rem] text-right text-xs font-semibold text-white/85">
            {affordableCount > 0 ? (
              <>
                <span translate="no" className="notranslate mr-[0.25em] text-[#8DB255]">{affordableCount}</span>
                souvenirs you can redeem now
              </>
            ) : (
              "Collect bottles on your trip to earn points"
            )}
          </p>
        </div>
        {next && (
          <div className="relative mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-[#8DB255]" style={{ width: `${Math.min(100, (state.points / next.points) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-white/80">
              <span translate="no" className="notranslate mr-[0.25em]">{next.points - state.points}</span>more points to {next.label}
            </p>
          </div>
        )}
      </section>

      <p
        key={usedThisTrip ? "used" : "rule"}
        className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-pretty text-sm ${
          usedThisTrip ? "bg-[#FBF0C4] text-[#5A4300]" : "bg-white text-[#12372A] shadow-sm"
        }`}
      >
        <Gift className="mt-0.5 h-4 w-4 shrink-0" />
        {usedThisTrip
          ? "You already redeemed your souvenir for this trip. You can redeem again on your next trip, or buy one."
          : "One trip, one souvenir: you can redeem a maximum of 1 item per trip."}
      </p>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            aria-pressed={active === item}
            className={`min-h-10 grow whitespace-nowrap rounded-full border border-[#5A4300] px-3.5 font-fredoka text-base ${
              active === item ? "bg-[#5A4300] text-white" : "text-[#12372A]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-5">
        {visible.map((reward, index) => {
          const missing = reward.points - state.points;
          const soldOut = stock[reward.id] === 0;
          const affordable = missing <= 0 && !soldOut && !usedThisTrip;
          const price = priceFor(reward, language);
          return (
            <article key={reward.id} className="flex flex-col rounded-3xl bg-[#8FB05E] p-2 shadow-sm transition-transform hover:-translate-y-0.5">
              {/* The photo fills the 3:4 frame; admins choose which part stays in view. */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#0D2A1F]">
                <Image
                  src={reward.image}
                  alt={reward.label}
                  fill
                  sizes="220px"
                  loading={index < 4 ? "eager" : "lazy"}
                  className={`object-cover ${soldOut ? "grayscale" : ""}`}
                  style={focusStyle(reward.imageFocus)}
                />
                {soldOut ? (
                  <span key="out" className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow" style={{ backgroundColor: "#A33A12" }}>
                    Out of stock
                  </span>
                ) : (
                  typeof stock[reward.id] === "number" && (
                    <span key="left" className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#03603F] shadow">
                      Only<span translate="no" className="notranslate mx-[0.25em]">{stock[reward.id]}</span>left
                    </span>
                  )
                )}
              </div>
              <p className="mt-2 line-clamp-2 min-h-[2.5em] px-1 text-xs font-semibold leading-tight text-[#0D2A1F]">{reward.label}</p>
              <div className="flex flex-1 flex-col px-1 pt-1">
                <p className="flex items-center gap-1.5 font-fredoka text-base font-semibold text-[#0D2A1F]">
                  <Image src="/challenge/coin.webp" alt="" width={18} height={18} className="shrink-0" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span translate="no" className="notranslate mr-[0.25em]">{reward.points}</span>points
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-[#14281C]">
                  or<span translate="no" className="notranslate ml-[0.25em] whitespace-nowrap">{price}</span>
                </p>
                {!soldOut && missing > 0 && (
                  <p className="mt-0.5 text-[11px] font-semibold text-[#5A4300]">
                    Need<span translate="no" className="notranslate mx-[0.25em]">{missing}</span>more points
                  </p>
                )}
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => setRedeeming(reward)}
                  disabled={!affordable}
                  className="min-h-11 rounded-2xl bg-[#5A4300] px-3 font-fredoka text-sm font-semibold text-white [overflow-wrap:break-word] disabled:opacity-45"
                >
                  redeem
                </button>
                <a
                  href={whatsappLink(`Hello DhilTrip, I would like to purchase: ${reward.label} (${price}).`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center rounded-2xl bg-[#14281C] px-3 text-center font-fredoka text-sm font-semibold text-white [overflow-wrap:break-word]"
                >
                  purchase
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {redeeming && (
        <RedeemSheet reward={redeeming} points={state.points} onClose={() => setRedeeming(null)} />
      )}
    </div>
  );
}
