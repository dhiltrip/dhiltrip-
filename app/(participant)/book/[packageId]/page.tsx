"use client";

import { use, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  ImagePlus,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BANK, BOOKING_WHATSAPP, BOOKING_WHATSAPP_LABEL, MAX_TRAVELERS, countryNames } from "@/data/booking";
import { formatPrice } from "@/data/currency";
import { focusStyle } from "@/data/focus";
import { callApi, firebaseEnabled } from "@/lib/firebase/client";
import { usePackage } from "@/lib/packages";
import { leaveGuestMode, useChallenge } from "@/lib/participant";
import { priceFor, useSiteLanguage } from "@/lib/currency";
import { shrinkPhoto } from "@/lib/shrink-photo";

const field =
  "mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]";

const todayInJogja = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl bg-white p-5 shadow">
      <h2 className="title-card flex items-center gap-2 text-lg">
        <span translate="no" className="notranslate flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0D2A1F] font-fredoka text-sm text-white">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-semibold hover:bg-white/25"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span key={copied ? "copied" : "copy"}>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

type Done = { ref: string; whatsapp: string };

/** Book a trip in the app: details, bank transfer, proof of payment, then confirm on WhatsApp. */
export default function BookPage({ params }: { params: Promise<{ packageId: string }> }) {
  const { packageId } = use(params);
  const state = useChallenge();
  const pkg = usePackage(packageId);
  const language = useSiteLanguage();
  const priceText = pkg ? priceFor(pkg, language) : "";
  const countries = useMemo(() => countryNames(), []);

  const [date, setDate] = useState("");
  const [people, setPeople] = useState(1);
  const [fullName, setFullName] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [passport, setPassport] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [otherPoint, setOtherPoint] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  if (!state) return null;
  if (!pkg) {
    return (
      <div className="px-5 pt-10 text-center">
        <h1 className="title-page text-black">Package not found</h1>
        <Link href="/" className="mt-4 inline-block font-semibold text-[#03603F] underline">Back to Home</Link>
      </div>
    );
  }

  const name = fullName ?? state.user?.name ?? "";
  const mail = email ?? state.user?.email ?? "";
  const idr = pkg.prices?.IDR;
  const totalLabel = typeof idr === "number" ? formatPrice(idr * people, "IDR") : `${people} × ${priceText}`;
  const point = meetingPoint === "__other" ? otherPoint.trim() : meetingPoint;

  const pickProof = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setError(null);
    try {
      setProof(await shrinkPhoto(file, 1600));
    } catch {
      setError("This photo could not be used. Please upload a screenshot or photo of the transfer (JPG or PNG).");
    }
    setPhotoBusy(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state.isGuest) {
      setError("Please sign in or create a free account to book.");
      return;
    }
    if (!proof) {
      setError("Please upload your proof of payment.");
      return;
    }
    if (!point) {
      setError("Please choose a meeting point.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await callApi<{ id: string; ref: string }>("/api/bookings/request", {
      packageId: pkg.id,
      date,
      people,
      fullName: name,
      country,
      passport,
      email: mail,
      whatsapp,
      meetingPoint: point,
      totalLabel,
      proofData: proof,
      consent,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const message = [
      `Hello DhilTrip, I just booked ${pkg.title} in the app.`,
      `Booking ref: ${result.ref}`,
      `Name: ${name}`,
      `Tour date: ${date}`,
      `Number of people: ${people}`,
      `Meeting point: ${point}`,
      `Total: ${totalLabel}`,
      "I have uploaded my proof of payment. Please confirm my booking. Thank you!",
    ].join("\n");
    setDone({ ref: result.ref, whatsapp: `https://wa.me/${BOOKING_WHATSAPP}?text=${encodeURIComponent(message)}` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return (
      <div className="space-y-5 px-5 pt-8 lg:mx-auto lg:max-w-xl">
        <section className="rounded-3xl bg-white p-6 text-center shadow">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#03603F]" />
          <h1 className="title-page mt-3 text-black">Booking sent!</h1>
          <p className="mt-1 text-sm text-[#436850]">
            Your reference is<span translate="no" className="notranslate ml-[0.25em] font-mono font-bold text-[#12372A]">{done.ref}</span>
          </p>
          <p className="mx-auto mt-3 max-w-sm text-pretty text-sm">
            One last step: confirm on WhatsApp so our admin can check your payment. You will get your booking code there, and it also
            appears in your Profile.
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
          <Link href="/profile#my-bookings" className="mt-3 block text-sm font-semibold text-[#03603F] underline">
            See my bookings
          </Link>
        </section>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 px-5 pb-6 pt-6 lg:mx-auto lg:max-w-2xl">
      <div className="flex items-center gap-2">
        <Link href="/" aria-label="Back to Home" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="title-page min-w-0 text-black">Book your trip</h1>
      </div>

      <div className="flex gap-3 rounded-3xl bg-[#0D2A1F] p-3 text-white shadow">
        <div className="relative h-24 w-[4.25rem] shrink-0 overflow-hidden rounded-xl bg-[#DDE5BE]">
          <Image src={pkg.poster} alt="" fill sizes="68px" className="object-cover" style={focusStyle(pkg.posterFocus)} />
        </div>
        <div className="min-w-0 py-1">
          <p translate="no" className="notranslate font-fredoka text-xl font-semibold leading-tight">{pkg.title}</p>
          <p className="mt-0.5 text-sm text-white/80">{pkg.duration}</p>
          <p translate="no" className="notranslate mt-1 text-sm font-semibold text-[#B6DC7A]">{priceText}</p>
        </div>
      </div>

      {!firebaseEnabled && (
        <p className="rounded-2xl bg-[#FBF0C4] px-4 py-3 text-sm text-[#5A4300]">Booking needs the live site; this preview runs without the database.</p>
      )}

      <Section n={1} title="Your trip">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Tour date</span>
            <input type="date" required min={todayInJogja()} value={date} onChange={(event) => setDate(event.target.value)} className={field} />
          </label>
          <div className="text-sm font-semibold">
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Number of people</span>
            <div className="mt-1.5 flex items-center justify-between rounded-2xl border border-[#ADBC9F] bg-white px-2 py-1.5">
              <button type="button" onClick={() => setPeople((value) => Math.max(1, value - 1))} disabled={people <= 1} aria-label="Fewer people" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D2A1F] text-white disabled:opacity-30">
                <Minus className="h-4 w-4" />
              </button>
              <span translate="no" className="notranslate font-fredoka text-2xl" aria-live="polite">{people}</span>
              <button type="button" onClick={() => setPeople((value) => Math.min(MAX_TRAVELERS, value + 1))} disabled={people >= MAX_TRAVELERS} aria-label="More people" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D2A1F] text-white disabled:opacity-30">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <label className="block text-sm font-semibold">
          Meeting point
          <select required value={meetingPoint} onChange={(event) => setMeetingPoint(event.target.value)} className={field}>
            <option value="" disabled>Choose a meeting point</option>
            {pkg.meetingPoints.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
            <option value="__other">Other (write it below)</option>
          </select>
        </label>
        {meetingPoint === "__other" && (
          <input required maxLength={120} value={otherPoint} onChange={(event) => setOtherPoint(event.target.value)} placeholder="e.g. hotel name and address" aria-label="Other meeting point" className={field} />
        )}
      </Section>

      <Section n={2} title="Lead traveler">
        <label className="block text-sm font-semibold">
          Full name (as in passport)
          <input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setFullName(event.target.value)} className={field} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Country
            <input required list="booking-countries" maxLength={60} autoComplete="country-name" value={country} onChange={(event) => setCountry(event.target.value)} placeholder="e.g. Indonesia" className={field} />
            <datalist id="booking-countries">
              {countries.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
          <label className="block text-sm font-semibold">
            Passport number
            <input required minLength={5} maxLength={20} autoCapitalize="characters" value={passport} onChange={(event) => setPassport(event.target.value)} placeholder="e.g. X1234567" className={`${field} uppercase placeholder:normal-case`} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Email
            <input required type="email" autoComplete="email" value={mail} onChange={(event) => setEmail(event.target.value)} className={field} />
          </label>
          <label className="block text-sm font-semibold">
            WhatsApp number
            <input required type="tel" inputMode="tel" autoComplete="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+62 812 3456 7890" className={field} />
          </label>
        </div>
      </Section>

      <Section n={3} title="Payment">
        <div className="rounded-2xl bg-[#0D2A1F] p-4 text-white">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#B6DC7A]">
            <Building2 className="h-4 w-4" /> Bank transfer
          </p>
          <p translate="no" className="notranslate mt-2 font-fredoka text-lg font-semibold">{BANK.bank}</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p translate="no" className="notranslate whitespace-nowrap font-mono text-[clamp(1.25rem,6vw,1.6rem)] font-bold tracking-wide">
              {BANK.accountNumber}
            </p>
            <CopyButton value={BANK.accountNumber} />
          </div>
          <p translate="no" className="notranslate mt-1 text-sm text-white/85">{BANK.accountName}</p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 pt-3">
            <span className="text-sm text-white/85">Total to transfer</span>
            <span translate="no" className="notranslate text-right font-fredoka text-xl font-semibold leading-tight">{totalLabel}</span>
          </div>
          {typeof idr !== "number" && (
            <p className="mt-2 text-pretty text-xs text-white/75">Not sure of the amount in Rupiah? Ask our admin on WhatsApp before you transfer.</p>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold">Proof of payment</p>
          <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-[#ADBC9F] bg-[#F3F4DC] p-3">
            <span className="relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-[#436850]">
              {photoBusy ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : proof ? (
                // A data URL from the file picker can't go through the image optimizer.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proof} alt="Proof of payment preview" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-7 w-7" />
              )}
            </span>
            <span className="min-w-0 text-sm">
              <span key={proof ? "change" : "upload"} className="block font-semibold text-[#03603F]">
                {proof ? "Photo added. Tap to change." : "Upload a screenshot or photo of the transfer"}
              </span>
              <span className="block text-xs text-[#436850]">Only our admin can see it.</span>
            </span>
            <input type="file" accept="image/*" onChange={(event) => void pickProof(event)} className="sr-only" />
          </label>
        </div>
      </Section>

      <label className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm">
        <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#03603F]" />
        <span className="text-pretty">
          I agree that DhilTrip uses these details only to arrange my trip, as described in the{" "}
          <Link href="/legal#privacy" className="font-semibold text-[#03603F] underline">Privacy Policy</Link>.
        </span>
      </label>

      <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 space-y-2 rounded-3xl bg-[#0D2A1F] p-3 shadow-lg lg:bottom-4">
        {error && <p role="alert" className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#A33A12]">{error}</p>}
        {state.isGuest ? (
          <button type="button" onClick={leaveGuestMode} className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#8DB255] font-fredoka text-lg font-semibold text-[#0D2A1F]">
            Sign in to book
          </button>
        ) : (
          <button disabled={busy || photoBusy || !firebaseEnabled} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#8DB255] font-fredoka text-lg font-semibold text-[#0D2A1F] disabled:opacity-60">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
            Send booking
          </button>
        )}
        <p className="text-center text-xs text-white/75">
          Next, confirm on WhatsApp<span translate="no" className="notranslate ml-[0.25em]">{BOOKING_WHATSAPP_LABEL}</span>
        </p>
      </div>
    </form>
  );
}
