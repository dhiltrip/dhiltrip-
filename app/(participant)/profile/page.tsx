"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight, Loader2, MailCheck, FileText, KeyRound, LogOut, RefreshCcw, Repeat, ShieldCheck } from "lucide-react";
import { findReward } from "@/data/challenge";
import { usePackage } from "@/lib/packages";
import { MyReviews } from "@/components/TripReview";
import {
  canLead,
  firebaseEnabled,
  isAdmin,
  leaveGuestMode,
  leaveTrip,
  recheckVerification,
  resetDemo,
  sendVerificationEmail,
  signOut,
  useChallenge,
} from "@/lib/participant";
import { initialsOf } from "@/lib/initials";

function Stat({ value, label, media }: { value: number; label: string; media: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl bg-[#0D2A1F] p-3 text-white">
      <div className="flex items-center gap-2.5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white/5">{media}</div>
        <p translate="no" className="notranslate font-fredoka text-[2rem] font-semibold leading-none">{value}</p>
      </div>
      <p className="mt-2 text-xs font-semibold leading-snug text-white/85">{label}</p>
    </div>
  );
}

/** Shown when someone was added to the team but their email is not verified yet. */
function VerifyEmailCard({ role, email }: { role: "leader" | "admin"; email: string }) {
  const [busy, setBusy] = useState<"send" | "check" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const title = role === "admin" ? "Admin" : "Tour leader";

  const send = async () => {
    setBusy("send");
    const result = await sendVerificationEmail();
    setBusy(null);
    setMessage(result.ok ? { ok: true, text: "Email sent. Check your inbox (and spam folder), open the link, then tap \"I've verified\"." } : { ok: false, text: result.message });
  };
  const check = async () => {
    setBusy("check");
    const result = await recheckVerification();
    setBusy(null);
    setMessage(result.ok ? { ok: true, text: "Verified! Your tools are now in Account & Settings." } : { ok: false, text: result.message });
  };

  return (
    <section className="rounded-3xl bg-[#FBF0C4] p-5 text-[#5A4300] shadow-sm ring-1 ring-[#C2A44E]/50">
      <div className="flex items-start gap-3">
        <MailCheck className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="min-w-0">
          <h2 className="title-card text-lg">
            You were added as <span key={role}>{title}</span>
          </h2>
          <p className="mt-1 text-pretty text-sm">To keep staff tools safe, please verify this email first:</p>
          <p translate="no" className="notranslate mt-0.5 break-all text-sm font-semibold">{email}</p>
          <p className="mt-2 text-pretty text-xs">Quickest way: sign out, then sign in again with &ldquo;Continue with Google&rdquo; using this email.</p>
        </div>
      </div>
      {message && (
        <p key={message.text} className={`mt-3 text-pretty text-sm font-semibold ${message.ok ? "text-[#03603F]" : "text-[#A33A12]"}`}>
          {message.text}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => void send()}
          disabled={busy !== null}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#5A4300]/40 bg-white text-sm font-semibold disabled:opacity-60"
        >
          {busy === "send" && <Loader2 className="h-4 w-4 animate-spin" />}
          Send email
        </button>
        <button
          onClick={() => void check()}
          disabled={busy !== null}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#5A4300] text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy === "check" && <Loader2 className="h-4 w-4 animate-spin" />}
          I&apos;ve verified
        </button>
      </div>
    </section>
  );
}

const rowClass = "flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm font-semibold";

export default function ProfilePage() {
  const state = useChallenge();
  const pkg = usePackage(state?.packageId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  if (!state || !state.user) return null;
  if (state.isGuest) {
    return (
      <div className="space-y-5 px-5 pt-6 lg:mx-auto lg:max-w-2xl">
        <section className="rounded-[2rem] bg-[#0D2A1F] px-5 pb-7 pt-8 text-center text-white shadow-lg">
          <div aria-hidden="true" className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#8DB255] bg-[#E9E6DF] font-fredoka text-4xl font-semibold text-[#12372A]">
            G
          </div>
          <h1 className="title-page mt-3">Guest</h1>
          <p className="mx-auto mt-2 max-w-xs text-pretty text-sm text-[#ADBC9F]">
            You are looking around as a guest. Create a free account to join a trip, collect points and redeem souvenirs.
          </p>
          <button
            onClick={leaveGuestMode}
            className="mt-5 min-h-12 w-full rounded-2xl bg-[#8DB255] font-fredoka text-lg font-semibold text-[#0D2A1F]"
          >
            Sign in or create account
          </button>
        </section>
        <Link href="/legal" className="block text-center text-sm font-semibold text-[#436850] underline">
          Privacy &amp; Terms
        </Link>
      </div>
    );
  }
  const firstReward = state.redemptions[0] ? findReward(state.redemptions[0].rewardId) : null;
  const visited = pkg ? pkg.stops.filter((stop) => state.visitedStopIds.includes(stop.id)).length : 0;

  return (
    <div className="space-y-5 px-5 pt-6 lg:mx-auto lg:max-w-2xl">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0D2A1F] px-5 pb-6 pt-7 text-center text-white shadow-lg">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #ADBC9F 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#8DB255]/25 blur-3xl" />
        <div className="relative">
          <div
            translate="no"
            aria-hidden="true"
            className="notranslate mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#8DB255] bg-[#E9E6DF] font-fredoka text-4xl font-semibold text-[#12372A]"
          >
            {initialsOf(state.user.name)}
          </div>
          <h1 className="title-page mt-3 capitalize">{state.user.name}</h1>
          <p className="mt-0.5 break-all text-xs text-[#ADBC9F]">{state.user.email}</p>
          {pkg && (
            <p className="mx-auto mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8DB255]" />
              <span translate="no" className="notranslate truncate">{pkg.title}</span>
            </p>
          )}
        </div>
      </section>

      {state.pendingRole && <VerifyEmailCard role={state.pendingRole} email={state.user.email} />}

      <section className="rounded-3xl bg-gradient-to-br from-[#8DB255] to-[#3F5F2A] p-4 text-white shadow">
        <h2 className="title-card mb-3 px-1 text-xl">Environmental Impact</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <Stat
            value={state.bottlesTotal}
            label="Bottles collected"
            media={<Image src="/challenge/bottle.webp" alt="" fill sizes="44px" className="object-contain p-1" />}
          />
          <Stat
            value={state.teloBagsUsed}
            label="Telobag used"
            media={<Image src="/challenge/telobag.webp" alt="" fill sizes="44px" className="object-cover" />}
          />
          <Stat
            value={state.redemptions.length}
            label="Local products supported"
            media={
              <Image
                src={firstReward?.image ?? "/challenge/wayang-pair-yellow.webp"}
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            }
          />
          <Stat
            value={state.points}
            label="Points"
            media={<Image src="/challenge/coin.webp" alt="" fill sizes="44px" className="object-contain p-1" />}
          />
        </div>
      </section>

      {pkg && (
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="title-card text-xl">{pkg.routeChoice ? "Your route" : "Visited destination"}</h2>
            {!pkg.routeChoice && (
              <span translate="no" className="notranslate shrink-0 text-sm font-semibold text-[#436850]">
                {visited}/{pkg.stops.length}
              </span>
            )}
          </div>
          <ul className="mt-3 space-y-2.5 text-sm font-semibold">
            {pkg.stops.map((stop) => {
              const done = state.visitedStopIds.includes(stop.id);
              return (
                <li key={stop.id} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      done ? "border-[#03603F] bg-[#03603F] text-white" : "border-[#ADBC9F] bg-[#F3F4DC]"
                    }`}
                  >
                    {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span translate="no" className={`notranslate ${done ? "text-[#12372A]" : "text-[#436850]"}`}>{stop.name}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <MyReviews />

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <button onClick={() => setSettingsOpen((open) => !open)} aria-expanded={settingsOpen} className={`${rowClass} justify-between font-fredoka text-lg`}>
          Account &amp; Settings
          <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
        </button>
        {settingsOpen && (
          <div className="animate-rise-in divide-y divide-[#12372A]/10 border-t border-[#12372A]/10">
            <p className="px-4 py-3 text-sm">
              <span className="block text-xs text-[#436850]">Booking code</span>
              <span translate="no" className="notranslate font-semibold">{state.bookingCode ?? "-"}</span>
            </p>
            {canLead(state) && (
              <Link href="/leader" className={rowClass}>
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#03603F]" />
                <span className="flex-1">Tour leader tools</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            )}
            {isAdmin(state) && (
              <Link href="/admin" className={rowClass}>
                <KeyRound className="h-5 w-5 shrink-0 text-[#03603F]" />
                <span className="flex-1">Admin: booking codes &amp; stock</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            )}
            <Link href="/legal" className={rowClass}>
              <FileText className="h-5 w-5 shrink-0 text-[#03603F]" />
              <span className="flex-1">Privacy &amp; Terms</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Link>
            {pkg && (
              <button onClick={() => void leaveTrip()} className={rowClass}>
                <Repeat className="h-5 w-5 shrink-0 text-[#03603F]" />
                <span className="flex-1">Choose another package</span>
              </button>
            )}
            {!firebaseEnabled && (
              <button onClick={resetDemo} className={`${rowClass} text-[#A33A12]`}>
                <RefreshCcw className="h-5 w-5 shrink-0" />
                <span className="flex-1">Reset demo data</span>
              </button>
            )}
          </div>
        )}
      </section>

      <button
        onClick={() => void signOut()}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#3F5F2A] font-fredoka text-lg font-semibold text-[#3F5F2A]"
      >
        <LogOut className="h-5 w-5" />
        Log Out
      </button>
    </div>
  );
}
