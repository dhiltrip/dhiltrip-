"use client";

import Image from "next/image";
import { CheckCircle2, Clock, MessageCircle, XCircle } from "lucide-react";
import { BOOKING_WHATSAPP } from "@/data/booking";
import { focusStyle } from "@/data/focus";
import { orderRef, type RewardOrder } from "@/data/reward-order";
import { firebaseEnabled } from "@/lib/firebase/client";
import { findRewardIn, useAllRewards } from "@/lib/rewards";
import { useMyRewardOrders } from "@/lib/site-content";

function StatusBadge({ status }: { status: RewardOrder["status"] }) {
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

/** Profile: souvenirs bought in the app, with their status. */
export function MyRewardOrders() {
  const items = useMyRewardOrders();
  const rewards = useAllRewards();
  if (!firebaseEnabled || items.length === 0) return null;
  return (
    <section id="my-orders" className="scroll-mt-24 space-y-3">
      <h2 className="title-section text-black">My souvenir orders</h2>
      <ul className="space-y-3">
        {items.map((item) => {
          const reward = findRewardIn(rewards, item.rewardId);
          const ask = `https://wa.me/${BOOKING_WHATSAPP}?text=${encodeURIComponent(`Hello DhilTrip, about my souvenir order ${orderRef(item.id)} (${item.rewardLabel}).`)}`;
          return (
            <li key={item.id} className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-xl bg-[#0D2A1F]">
                  {reward && <Image src={reward.image} alt="" fill sizes="48px" className="object-cover" style={focusStyle(reward.imageFocus)} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 font-semibold leading-snug">{item.rewardLabel}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-[#436850]">
                    {item.kind === "topup" ? (
                      <>
                        <span translate="no" className="notranslate mr-[0.25em]">{item.pointsUsed}</span>points +
                        <span translate="no" className="notranslate ml-[0.25em]">{item.totalText}</span>
                      </>
                    ) : (
                      <span translate="no" className="notranslate">{item.totalText}</span>
                    )}
                    {" · "}
                    <span translate="no" className="notranslate font-mono">{orderRef(item.id)}</span>
                  </p>
                </div>
              </div>
              {item.status === "new" && (
                <p className="mt-2 text-pretty text-xs text-[#436850]">
                  Our admin is checking your payment.{item.kind === "topup" ? " Your points are on hold until then." : ""}
                </p>
              )}
              {item.status === "confirmed" && (
                <p className="mt-2 text-pretty text-xs text-[#03603F]">
                  {item.pickup === "trip" ? "Paid. Your tour leader hands it over at the end of your trip." : "Paid. We will tell you on WhatsApp when it is ready at our office."}
                </p>
              )}
              {item.status === "rejected" && item.kind === "topup" && (
                <p className="mt-2 text-pretty text-xs text-[#436850]">Your points were given back.</p>
              )}
              {item.adminNote && <p className="mt-2 rounded-xl bg-[#F3F4DC] px-3 py-2 text-xs">{item.adminNote}</p>}
              <a href={ask} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#12372A]/20 text-sm font-semibold">
                <MessageCircle className="h-4 w-4" />
                Ask about this order
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
