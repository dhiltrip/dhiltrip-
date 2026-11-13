"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Check, ChevronRight, Loader2, Map as MapIcon, Maximize2, X } from "lucide-react";
import { HomeExtras } from "@/components/HomeExtras";
import { TripReview } from "@/components/TripReview";
import { HowItWorksButton, TelobagInfoButton } from "@/components/InfoSheets";
import { DhilWay } from "@/components/DhilWay";
import { PosterViewer } from "@/components/PosterViewer";
import { POINTS, cheapestReward, nextRewardFor, type ChallengePackage } from "@/data/challenge";
import { usePackage, usePackages } from "@/lib/packages";
import { usePrice } from "@/lib/currency";
import { focusStyle } from "@/data/focus";
import { joinTrip, useChallenge, type ChallengeState } from "@/lib/participant";

/** The price in the currency of the chosen language, if the admin set one. */
function PriceText({ pkg }: { pkg: ChallengePackage }) {
  return <>{usePrice(pkg)}</>;
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-[#12372A] bg-[#F3F4DC] text-[#12372A]">
      {checked && <Check className="h-4 w-4" strokeWidth={3} />}
    </span>
  );
}

function RewardHint({ points }: { points: number }) {
  const next = nextRewardFor(points);
  const canRedeem = points >= cheapestReward();
  return (
    <Link
      href="/rewards"
      className="mt-4 flex items-center gap-2.5 rounded-2xl bg-[#0D2A1F]/40 px-3.5 py-3 font-inter text-sm text-white"
    >
      <Image src="/challenge/coin.webp" alt="" width={24} height={24} className="shrink-0" />
      <span className="min-w-0 flex-1">
        {canRedeem && <span className="block font-semibold">You can redeem a reward now!</span>}
        {next ? (
          <span className={canRedeem ? "block text-white/85" : "block font-semibold"}>
            <span translate="no" className="notranslate mr-[0.25em]">{next.points - points}</span>
            more points to a {next.category.toLowerCase()}
          </span>
        ) : (
          <span className="block text-white/85">Every reward is within reach.</span>
        )}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0" />
    </Link>
  );
}

function MyTrip({ pkg, state }: { pkg: ChallengePackage; state: ChallengeState }) {
  const packages = usePackages();
  const [viewing, setViewing] = useState(false);
  const max = POINTS.maxBottlesPerTrip;
  const percent = Math.min(100, Math.round((state.bottlesThisTrip / max) * 100));

  return (
    <div className="space-y-6 px-5 pt-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="title-page text-center text-black">Your travel package</h1>
        <HowItWorksButton />
      </div>
      <div className="space-y-6 lg:grid lg:grid-cols-[300px_1fr] lg:items-start lg:gap-8 lg:space-y-0">
      <button
        onClick={() => setViewing(true)}
        className="relative mx-auto block w-[61%] rounded-3xl bg-[#DDE5BE] p-3 shadow lg:w-full"
        aria-label={`View the ${pkg.title} poster`}
      >
        <span className="block overflow-hidden rounded-2xl"><Image src={pkg.poster} alt={pkg.title} width={1000} height={1414} sizes="320px" loading="eager" className="aspect-[1000/1414] h-auto w-full object-cover" style={focusStyle(pkg.posterFocus)} /></span>
        <span className="absolute bottom-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#0D2A1F]/80 text-white">
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>
      <div className="space-y-6">
      <Link
        href="/map"
        className="mx-auto flex w-[88%] lg:w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#C2A44E] to-[#7E6322] px-4 py-4 text-center font-fredoka text-xl font-semibold leading-tight text-white shadow"
      >
        <span>
          Please press the <MapIcon className="mx-0.5 inline h-6 w-6 align-text-bottom" /> icon to find out the rules
        </span>
      </Link>
      <section className="rounded-3xl bg-gradient-to-br from-[#8DB255] to-[#3F5F2A] p-5 font-fredoka text-white shadow">
        <h2 className="title-card">Your progress so far:</h2>
        <p className="mt-1 text-pretty font-inter text-xs text-white/85">
          Ticked automatically when you scan your tour leader&apos;s QR code.
        </p>
        <ul className="mt-3 space-y-2.5 text-lg">
          <li className="flex items-center gap-2.5">
            <CheckBox checked={state.tumblerClaimed} />
            <span>
              Bringing a<span translate="no" className="notranslate mx-[0.25em]">tumbler</span>
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <CheckBox checked={state.teloBagClaimed} />
            <span>Using<span translate="no" className="notranslate mx-[0.25em]">Telobag</span></span>
            <TelobagInfoButton className="h-6 w-6" />
          </li>
          <li>
            <div className="flex items-baseline justify-between gap-2">
              <span>Plastic bottles collected</span>
              <span translate="no" className="notranslate shrink-0 font-semibold">
                {state.bottlesThisTrip}/{max}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Plastic bottles collected"
              aria-valuemin={0}
              aria-valuemax={max}
              aria-valuenow={state.bottlesThisTrip}
              className="mt-2 h-3 overflow-hidden rounded-full bg-white/25"
            >
              <div className="h-full rounded-full bg-[#FBFADA] transition-[width] duration-700" style={{ width: `${percent}%` }} />
            </div>
          </li>
        </ul>
        <RewardHint points={state.points} />
      </section>
      <TripReview packageId={pkg.id} />
      </div>
      </div>
      <PackageCatalog
        title="Other packages"
        subtitle="Planning another trip? Every package includes a tour guide."
        items={packages.filter((item) => item.id !== pkg.id)}
        switching
      />
      {viewing && <PosterViewer src={pkg.poster} alt={pkg.title} onClose={() => setViewing(false)} />}
    </div>
  );
}

function JoinSheet({ pkg, switching, onClose }: { pkg: ChallengePackage; switching: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [viewing, setViewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await joinTrip(code, pkg.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onClose();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 lg:items-center lg:p-6" role="dialog" aria-modal="true" aria-label={pkg.title}>
      <div className="flex max-h-[92dvh] w-full max-w-[480px] animate-rise-in flex-col overflow-hidden rounded-t-3xl bg-[#F3F4DC] lg:max-w-xl lg:rounded-3xl">
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <h2 translate="no" className="notranslate title-section">{pkg.title}</h2>
            <p className="text-sm text-[#436850]">
              {pkg.duration} ·{" "}
              <span translate="no" className="notranslate font-semibold text-[#5A4300]">
                <PriceText pkg={pkg} />
              </span>
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-black/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 pb-6 pt-3">
          <button onClick={() => setViewing(true)} className="relative block w-full" aria-label={`View the ${pkg.title} poster`}>
            <span className="block overflow-hidden rounded-2xl"><Image src={pkg.poster} alt={pkg.title} width={1000} height={1414} sizes="480px" className="aspect-[1000/1414] h-auto w-full object-cover" style={focusStyle(pkg.posterFocus)} /></span>
            <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#0D2A1F]/80 text-white">
              <Maximize2 className="h-4 w-4" />
            </span>
          </button>
          <p className="text-pretty text-sm leading-relaxed">{pkg.description}</p>
          <Link
            href={`/book/${pkg.id}`}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#03603F] font-fredoka text-lg font-semibold text-white shadow"
          >
            <CalendarCheck className="h-5 w-5" />
            Book this trip
          </Link>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#436850]">
            <span className="h-px flex-1 bg-[#ADBC9F]" />
            Already booked? Enter your code
            <span className="h-px flex-1 bg-[#ADBC9F]" />
          </div>
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-sm font-semibold">
              Booking code
              <input
                required
                minLength={4}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="From our admin"
                className="mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base uppercase outline-none placeholder:normal-case focus:ring-2 focus:ring-[#8DB255]"
              />
            </label>
            {switching && (
              <p className="rounded-2xl bg-[#FBF0C4] px-4 py-3 text-pretty text-sm text-[#5A4300]">
                Switching starts this trip from the beginning. Your points stay in your account.
              </p>
            )}
            {error && <p role="alert" className="text-pretty text-sm font-semibold text-[#A33A12]">{error}</p>}
            <button
              disabled={busy}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white disabled:opacity-70"
            >
              {busy && <Loader2 className="h-5 w-5 animate-spin" />}
              {switching ? "Switch to this trip" : "Join this trip"}
            </button>
          </form>
        </div>
      </div>
      {viewing && <PosterViewer src={pkg.poster} alt={pkg.title} onClose={() => setViewing(false)} />}
    </div>
  );
}

function ChoosePackage() {
  const packages = usePackages();
  return (
    <div className="space-y-6 px-5 pt-6">
      <section className="rounded-3xl bg-gradient-to-br from-[#8DB255] to-[#3F5F2A] p-5 text-pretty text-sm leading-relaxed text-white shadow">
        <h1 className="title-card">Hello!</h1>
        <p className="mt-1 font-semibold">Thank you for choosing DhilTrip as your travel buddy!</p>
        <p className="mt-3">
          DhilTrip Explorations is a pioneering travel company based in Yogyakarta, Indonesia,
          specializing in sustainable tourism. We seamlessly blend destination discovery with
          high-impact environmental responsibility, integrating circular economy initiatives and
          community-based waste management into our travel experiences.
        </p>
        <p className="mt-3">
          To make our journey more exciting, we challenge you to take a part in our &ldquo;Leave No
          Trace Challenge&rdquo;
        </p>
        <p className="mt-3">
          How to participate?
          <br />
          Simply just follow the rules below. But, please choose your travel package first!
        </p>
        <HowItWorksButton tone="light" className="mt-4" />
      </section>

      <DhilWay />

      <PackageCatalog title="Choose your travel package" subtitle="Package Include Tour Guide" items={packages} />
    </div>
  );
}

type CatalogProps = {
  title: string;
  subtitle: string;
  items: ChallengePackage[];
  switching?: boolean;
};

/** The dark catalog panel; used to choose a first trip and, later, to switch to another one. */
function PackageCatalog({ title, subtitle, items, switching = false }: CatalogProps) {
  const [selected, setSelected] = useState<ChallengePackage | null>(null);

  return (
    <section className="relative -mx-1 overflow-hidden rounded-[2rem] bg-[#0D2A1F] px-4 pb-5 pt-6 shadow-lg lg:mx-0 lg:px-8 lg:pb-8 lg:pt-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle, #ADBC9F 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8DB255]/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[#C2A44E]/20 blur-3xl" />

      <div className="relative text-center">
        <h2 className="title-page text-white">{title}</h2>
        <p className="mt-1 text-pretty text-sm font-semibold text-[#ADBC9F]">{subtitle}</p>
      </div>

      <div className={`relative mt-5 grid grid-cols-2 gap-x-3 gap-y-5 lg:gap-x-5 ${items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
        {items.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelected(pkg)}
            className="flex h-full flex-col rounded-3xl bg-[#FBFADA] p-2 text-left shadow-md"
          >
            <span className="block overflow-hidden rounded-2xl"><Image src={pkg.poster} alt={pkg.title} width={1000} height={1414} sizes="220px" className="aspect-[1000/1414] h-auto w-full object-cover" style={focusStyle(pkg.posterFocus)} /></span>
            <span className="flex flex-1 flex-col px-1 pb-1 pt-2.5">
              <span translate="no" className="notranslate line-clamp-2 min-h-[2.5em] font-fredoka text-[15px] font-semibold leading-[1.25] text-[#12372A]">
                {pkg.title}
              </span>
              <span className="mb-2.5 mt-1 block text-xs text-[#436850] [overflow-wrap:break-word]">{pkg.duration}</span>
              <span translate="no" className="notranslate mt-auto block rounded-2xl bg-[#5A4300] px-1 py-2 text-center font-inter text-xs font-semibold text-white">
                <PriceText pkg={pkg} />
              </span>
            </span>
          </button>
        ))}
      </div>

      {selected && <JoinSheet pkg={selected} switching={switching} onClose={() => setSelected(null)} />}
    </section>
  );
}

export default function ParticipantHome() {
  const state = useChallenge();
  const pkg = usePackage(state?.packageId);
  if (!state) return null;
  return (
    <>
      {pkg ? <MyTrip pkg={pkg} state={state} /> : <ChoosePackage />}
      <HomeExtras />
    </>
  );
}
