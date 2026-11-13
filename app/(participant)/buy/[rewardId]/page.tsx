"use client";

import { use, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Flag, Loader2, MessageCircle, ShieldCheck, Store } from "lucide-react";
import { BOOKING_WHATSAPP, BOOKING_WHATSAPP_LABEL } from "@/data/booking";
import { focusStyle } from "@/data/focus";
import { canTopUp, minPointsForTopup, quoteOrder, type OrderKind, type Pickup } from "@/data/reward-order";
import { callApi, firebaseEnabled } from "@/lib/firebase/client";
import { priceFor, useSiteLanguage } from "@/lib/currency";
import { leaveGuestMode, useChallenge, useRewardStock } from "@/lib/participant";
import { findRewardIn, useRewards } from "@/lib/rewards";
import { useMyRewardOrders } from "@/lib/site-content";
import { BankCard, ProofPicker, Section, field } from "@/components/PaymentParts";

function Choice({
  checked,
  disabled,
  onSelect,
  title,
  detail,
  icon,
}: {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: ReactNode;
  detail: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-2xl p-3.5 text-left ring-2 transition-colors disabled:opacity-50 ${
        checked ? "bg-[#DDE5BE] ring-[#03603F]" : "bg-[#F3F4DC] ring-transparent"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${checked ? "border-[#03603F]" : "border-[#436850]/60"}`}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-[#03603F]" />}
      </span>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{title}</span>
        <span className="mt-0.5 block text-pretty text-xs text-[#436850]">{detail}</span>
      </span>
    </button>
  );
}

type Done = { ref: string; whatsapp: string; total: string };

/** Buy a souvenir in the app: full price, or your points plus money for the points you miss. */
export default function BuyPage({ params, searchParams }: { params: Promise<{ rewardId: string }>; searchParams: Promise<{ topup?: string }> }) {
  const { rewardId } = use(params);
  const { topup } = use(searchParams);
  const state = useChallenge();
  const rewards = useRewards();
  const stock = useRewardStock();
  const orders = useMyRewardOrders();
  const language = useSiteLanguage();
  const reward = findRewardIn(rewards, rewardId);

  const [chosen, setChosen] = useState<OrderKind | null>(topup === "1" ? "topup" : null);
  const [pickup, setPickup] = useState<Pickup>("trip");
  const [fullName, setFullName] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  if (!state) return null;
  if (!reward) {
    return (
      <div className="px-5 pt-10 text-center">
        <h1 className="title-page text-black">Souvenir not found</h1>
        <Link href="/rewards" className="mt-4 inline-block font-semibold text-[#03603F] underline">Back to Rewards</Link>
      </div>
    );
  }

  const points = state.points;
  const soldOut = stock[reward.id] === 0;
  // Points go to one souvenir per trip: a redeemed one, or one where the rest is paid with money.
  const usedThisTrip =
    state.redemptions.some((item) => !item.purchase && (item.bookingCode ?? null) === (state.bookingCode ?? null)) ||
    orders.some((item) => item.status === "new" && item.kind === "topup" && item.bookingCode === (state.bookingCode ?? null));
  const topUpQuote = quoteOrder(reward, "topup", points, language);
  const topUpOpen = canTopUp(reward, points) && !usedThisTrip && topUpQuote.ok;
  const kind: OrderKind = chosen === "topup" && topUpOpen ? "topup" : "buy";
  const buyQuote = quoteOrder(reward, "buy", points, language);
  const buyText = buyQuote.ok ? buyQuote.totalText : reward.priceLabel;
  const quote = kind === "topup" ? topUpQuote : buyQuote;
  const total = quote.ok ? quote.totalText : priceFor(reward, language);
  const name = fullName ?? state.user?.name ?? "";

  const topUpReason = usedThisTrip
    ? "You already used your points for a souvenir on this trip."
    : points >= reward.points
      ? "You have enough points. Redeem it for free in the Rewards Store."
      : !canTopUp(reward, points)
        ? `Available from ${minPointsForTopup(reward)} points. You have ${points}.`
        : !topUpQuote.ok
          ? topUpQuote.message
          : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state.isGuest) {
      setError("Please sign in or create a free account to order.");
      return;
    }
    if (!proof) {
      setError("Please upload your proof of payment.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await callApi<{ id: string; ref: string; totalText: string }>("/api/rewards/order", {
      rewardId: reward.id,
      kind,
      language,
      fullName: name,
      whatsapp,
      pickup,
      proofData: proof,
      consent,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const message = [
      `Hello DhilTrip, I just ordered a souvenir in the app.`,
      `Order ref: ${result.ref}`,
      `Name: ${name}`,
      `Souvenir: ${reward.label}`,
      kind === "topup" ? `Paid with ${points} points + ${result.totalText}` : `Total: ${result.totalText}`,
      `Pick up: ${pickup === "trip" ? "from my tour leader during the trip" : "at the DhilTrip office"}`,
      "I have uploaded my proof of payment. Please confirm my order. Thank you!",
    ].join("\n");
    setDone({ ref: result.ref, total: result.totalText, whatsapp: `https://wa.me/${BOOKING_WHATSAPP}?text=${encodeURIComponent(message)}` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return (
      <div className="space-y-5 px-5 pt-8 lg:mx-auto lg:max-w-xl">
        <section className="rounded-3xl bg-white p-6 text-center shadow">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#03603F]" />
          <h1 className="title-page mt-3 text-black">Order sent!</h1>
          <p className="mt-1 text-sm text-[#436850]">
            Your reference is<span translate="no" className="notranslate ml-[0.25em] font-mono font-bold text-[#12372A]">{done.ref}</span>
          </p>
          <p className="mx-auto mt-3 max-w-sm text-pretty text-sm">
            One last step: confirm on WhatsApp so our admin can check your payment. Once confirmed, your tour leader hands over the
            souvenir. You can follow the status in your Profile.
          </p>
          <a
            href={done.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#03603F] font-fredoka text-lg font-semibold text-white"
          >
            <MessageCircle className="h-5 w-5" />
            Confirm on WhatsApp
          </a>
          <Link href="/profile#my-orders" className="mt-3 block text-sm font-semibold text-[#03603F] underline">
            See my orders
          </Link>
        </section>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 px-5 pb-6 pt-6 lg:mx-auto lg:max-w-2xl">
      <div className="flex items-center gap-2">
        <Link href="/rewards" aria-label="Back to Rewards" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="title-page min-w-0 text-black">Buy a souvenir</h1>
      </div>

      <div className="flex gap-3 rounded-3xl bg-[#0D2A1F] p-3 text-white shadow">
        <div className="relative aspect-[3/4] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-[#DDE5BE]">
          <Image src={reward.image} alt="" fill sizes="72px" className="object-cover" style={focusStyle(reward.imageFocus)} />
        </div>
        <div className="min-w-0 py-1">
          <p className="font-fredoka text-lg font-semibold leading-tight">{reward.label}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
            <span className="flex items-center gap-1 font-semibold text-[#B6DC7A]">
              <Image src="/challenge/coin.webp" alt="" width={16} height={16} />
              <span translate="no" className="notranslate">{reward.points}</span>
            </span>
            <span className="text-white/80">
              or<span translate="no" className="notranslate ml-[0.25em] font-semibold text-white">{priceFor(reward, language)}</span>
            </span>
          </p>
          <p className="mt-0.5 text-xs text-white/75">
            You have<span translate="no" className="notranslate mx-[0.25em] font-semibold text-white">{points}</span>points
          </p>
        </div>
      </div>

      {!firebaseEnabled && (
        <p className="rounded-2xl bg-[#FBF0C4] px-4 py-3 text-sm text-[#5A4300]">Ordering needs the live site; this preview runs without the database.</p>
      )}
      {soldOut && (
        <p role="alert" className="rounded-2xl px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: "#A33A12" }}>
          This souvenir is out of stock right now.
        </p>
      )}

      <Section n={1} title="How do you want to pay?">
        <div role="radiogroup" aria-label="How to pay" className="space-y-2">
          <Choice
            checked={kind === "buy"}
            onSelect={() => setChosen("buy")}
            title={
              <>
                Pay the full price<span translate="no" className="notranslate ml-[0.25em]">{buyText}</span>
              </>
            }
            detail="Your points stay untouched."
          />
          <Choice
            checked={kind === "topup"}
            disabled={!topUpOpen}
            onSelect={() => setChosen("topup")}
            title={
              topUpQuote.ok ? (
                <>
                  Pay with<span translate="no" className="notranslate mx-[0.25em]">{topUpQuote.pointsUsed}</span>points +
                  <span translate="no" className="notranslate ml-[0.25em]">{topUpQuote.totalText}</span>
                </>
              ) : (
                "Pay with points + money"
              )
            }
            detail={
              topUpReason ??
              (topUpQuote.ok ? (
                <>
                  <span className="block">
                    Points still missing:<span translate="no" className="notranslate ml-[0.25em] font-semibold">{topUpQuote.missingPoints}</span>
                  </span>
                  <span className="block">You only pay for those. This is your souvenir for this trip.</span>
                </>
              ) : null)
            }
          />
        </div>
      </Section>

      <Section n={2} title="Your details">
        <label className="block text-sm font-semibold">
          Full name
          <input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setFullName(event.target.value)} className={field} />
        </label>
        <label className="block text-sm font-semibold">
          WhatsApp number
          <input required type="tel" inputMode="tel" autoComplete="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+62 812 3456 7890" className={field} />
        </label>
        <div>
          <p className="text-sm font-semibold">Where do you get it?</p>
          <div role="radiogroup" aria-label="Where do you get it" className="mt-1.5 space-y-2">
            <Choice
              checked={pickup === "trip"}
              onSelect={() => setPickup("trip")}
              icon={<Flag className="mt-0.5 h-4 w-4 shrink-0 text-[#03603F]" />}
              title="From my tour leader"
              detail="Handed over at the end of your trip."
            />
            <Choice
              checked={pickup === "office"}
              onSelect={() => setPickup("office")}
              icon={<Store className="mt-0.5 h-4 w-4 shrink-0 text-[#03603F]" />}
              title="At the DhilTrip office"
              detail="Our admin tells you on WhatsApp when it is ready."
            />
          </div>
        </div>
      </Section>

      <Section n={3} title="Payment">
        <BankCard
          total={total}
          note={quote.ok && quote.currency === "IDR" ? null : "Not sure of the amount in Rupiah? Ask our admin on WhatsApp before you transfer."}
        >
          {kind === "topup" && topUpQuote.ok && (
            <p className="mt-2 flex items-center justify-between gap-3 text-xs text-white/85">
              <span>Paid with points</span>
              <span translate="no" className="notranslate font-semibold">{topUpQuote.pointsUsed}</span>
            </p>
          )}
        </BankCard>
        <ProofPicker proof={proof} onChange={setProof} onError={setError} />
      </Section>

      <label className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm">
        <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#03603F]" />
        <span className="text-pretty">
          I agree that DhilTrip uses these details only to handle my order, as described in the{" "}
          <Link href="/legal#privacy" className="font-semibold text-[#03603F] underline">Privacy Policy</Link>.
        </span>
      </label>

      <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 space-y-2 rounded-3xl bg-[#0D2A1F] p-3 shadow-lg lg:bottom-4">
        {error && <p role="alert" className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#A33A12]">{error}</p>}
        {state.isGuest ? (
          <button type="button" onClick={leaveGuestMode} className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#8DB255] font-fredoka text-lg font-semibold text-[#0D2A1F]">
            Sign in to order
          </button>
        ) : (
          <button disabled={busy || soldOut || !firebaseEnabled} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#8DB255] font-fredoka text-lg font-semibold text-[#0D2A1F] disabled:opacity-60">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
            Send order
          </button>
        )}
        <p className="text-center text-xs text-white/75">
          Next, confirm on WhatsApp<span translate="no" className="notranslate ml-[0.25em]">{BOOKING_WHATSAPP_LABEL}</span>
        </p>
      </div>
    </form>
  );
}
