"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Check, Circle, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { type Stop } from "@/data/challenge";
import { findIn, useAllPackages, usePackages } from "@/lib/packages";
import { DhilWay } from "@/components/DhilWay";
import { PartnerSection } from "@/components/PartnerSection";
import { chooseRoute, toggleVisited, useChallenge } from "@/lib/participant";

const ChallengeMap = dynamic(
  () => import("@/components/ChallengeMap").then((module) => module.ChallengeMap),
  { ssr: false, loading: () => <div className="h-72 w-full rounded-2xl bg-white/20" /> },
);

type StopCardProps = {
  stop: Stop;
  number: number;
  visited: boolean;
  active: boolean;
  routeChoice: boolean;
  preview: boolean;
  onToggle: () => Promise<{ ok: boolean; message?: string }>;
  onShow: () => void;
};

function StopCard({ stop, number, visited, active, routeChoice, preview, onToggle, onShow }: StopCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = async () => {
    setBusy(true);
    setError(null);
    const result = await onToggle();
    setBusy(false);
    if (!result.ok) setError(result.message ?? "Please try again.");
  };
  const idle = routeChoice ? "Choose this route" : "Mark as visited";
  const done = routeChoice ? "My route" : "Visited";

  return (
    <article id={`stop-${stop.id}`} className="scroll-mt-24">
      <button
        onClick={onShow}
        className={`flex items-center gap-2 rounded-t-xl px-3 py-1.5 text-sm font-bold text-white ${active ? "bg-[#03603F]" : "bg-[#0D2A1F]"}`}
      >
        <span
          translate="no"
          className={`notranslate flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
            visited ? "bg-[#8DB255] text-[#0D2A1F]" : "bg-white text-[#0D2A1F]"
          }`}
        >
          {visited ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : number}
        </span>
        <span translate="no" className="notranslate">{stop.name}</span>
      </button>
      <div
        className={`rounded-b-xl rounded-tr-xl border bg-[#FBFADA] p-3.5 text-xs leading-relaxed text-black ${
          active ? "border-[#03603F] ring-2 ring-[#03603F]" : "border-black/70"
        }`}
      >
        <p className="text-pretty">
          <strong>Funfact:</strong> {stop.funfact}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {!preview && (
          <button
            onClick={toggle}
            disabled={busy}
            aria-pressed={visited}
            className={`flex min-h-10 items-center gap-1.5 rounded-full px-4 font-bold ${
              visited ? "bg-[#03603F] text-white" : "bg-[#0D2A1F] text-white"
            } disabled:opacity-70`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : visited ? <Check className="h-4 w-4" strokeWidth={3} /> : <Circle className="h-4 w-4" />}
            {visited ? done : idle}
          </button>
          )}
          <button onClick={onShow} className="min-h-10 rounded-full border border-[#0D2A1F]/40 px-4 font-bold text-[#0D2A1F]">
            Show on map
          </button>
        </div>
        {error && <p className="mt-1.5 font-semibold text-[#A33A12]">{error}</p>}
      </div>
    </article>
  );
}

export default function MapPage() {
  const state = useChallenge();
  const packages = usePackages();
  const allPackages = useAllPackages();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const mapBoxRef = useRef<HTMLDivElement>(null);

  const showOnMap = useCallback((id: string) => {
    setActiveId(id);
    mapBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const selectFromMap = useCallback((id: string) => {
    setActiveId(id);
    document.getElementById(`stop-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (!state) return null;
  const joined = findIn(allPackages, state.packageId);
  const preview = !joined;
  const pkg = joined ?? findIn(packages, previewId) ?? packages[0] ?? allPackages[0];
  const visitedHere = pkg ? pkg.stops.filter((stop) => state.visitedStopIds.includes(stop.id)) : [];

  return (
    <div className="space-y-6 px-5 pt-6">
      <h1 translate="no" className="notranslate title-page text-center text-black">Responsible Travel Trail</h1>
      <section className="rounded-3xl bg-gradient-to-br from-[#8DB255] to-[#3F5F2A] p-5 text-white shadow">
        <h2 className="title-card">&ldquo;Leave No Trace Challenge&rdquo;</h2>
        <p className="mt-3 font-semibold">How to participate:</p>
        <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-pretty text-sm leading-snug">
          <li>Tourist adopt eco-friendly habits bringing a<span translate="no" className="notranslate mx-[0.25em]">tumbler</span>and using<span translate="no" className="notranslate mx-[0.25em]">Telobag</span>provided by us</li>
          <li>During the tour, tourists have an eco-mission to collect littered plastic bottles, put them into the<span translate="no" className="notranslate mx-[0.25em]">Telobag</span></li>
          <li>Tourist scan a QR code our system detects the number of bottles collected and automatically adds points to your account.</li>
          <li>Redeem Rewards exchange your accumulated points for unique, high-quality recycled waste souvenirs.</li>
        </ol>
      </section>

      <DhilWay />

      {preview && (
        <div>
          <h2 className="title-section text-black">Explore the routes</h2>
          <p className="mt-1 text-pretty text-sm text-[#436850]">See where each package goes before you join.</p>
          <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
            {packages.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setPreviewId(item.id);
                  setActiveId(null);
                }}
                aria-pressed={item.id === pkg.id}
                translate="no"
                className={`notranslate min-h-10 shrink-0 whitespace-nowrap rounded-full border border-[#5A4300] px-4 font-fredoka text-base ${
                  item.id === pkg.id ? "bg-[#5A4300] text-white" : "text-[#12372A]"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {pkg && (
        <section className="rounded-3xl bg-gradient-to-b from-[#B79A4B] to-[#4A3A12] p-5 shadow">
          <p className="text-lg text-white">{preview ? "Package route:" : "Your travel package:"}</p>
          <h2 translate="no" className="notranslate title-card text-3xl text-white">{pkg.title}</h2>
          <div className="mt-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
          <div ref={mapBoxRef} className="lg:sticky lg:top-6">
            <ChallengeMap
              key={`${pkg.id}:${pkg.stops.map((stop) => `${stop.id}@${stop.lat},${stop.lng}`).join("|")}`}
              stops={pkg.stops}
              activeId={activeId}
              visitedIds={preview ? [] : state.visitedStopIds}
              onSelect={selectFromMap}
            />
          </div>
          <div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-black/20 lg:mt-0 px-4 py-2.5 text-sm text-white">
            <span className="text-pretty">
              {preview
                ? "Join this trip with your booking code to tick the places you visit."
                : pkg.routeChoice
                ? "Choose your own route: tick the one you take."
                : "Tick each place once you have visited it."}
            </span>
            {preview ? (
              <Link href="/" className="shrink-0 rounded-full bg-[#FBFADA] px-3 py-1.5 text-xs font-bold text-[#12372A]">
                Join a trip
              </Link>
            ) : !pkg.routeChoice && (
              <span translate="no" className="notranslate shrink-0 font-semibold">
                {visitedHere.length}/{pkg.stops.length}
              </span>
            )}
          </div>
          <div className="mt-4 space-y-4">
            {pkg.stops.map((stop, index) => (
              <StopCard
                key={stop.id}
                stop={stop}
                number={index + 1}
                visited={!preview && state.visitedStopIds.includes(stop.id)}
                preview={preview}
                active={stop.id === activeId}
                routeChoice={Boolean(pkg.routeChoice)}
                onToggle={() =>
                  pkg.routeChoice
                    ? chooseRoute(stop.id, pkg.stops.map((item) => item.id))
                    : toggleVisited(stop.id)
                }
                onShow={() => showOnMap(stop.id)}
              />
            ))}
          </div>
          </div>
          </div>
        </section>
      )}

      <PartnerSection />
    </div>
  );
}
