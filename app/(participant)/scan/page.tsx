"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { POINTS, packageForBookingCode } from "@/data/challenge";
import { joinTrip, redeemClaim, setMission, useChallenge, type ClaimResult } from "@/lib/participant";
import { formatWeight } from "@/lib/site-content";
import { HowItWorksButton, TelobagInfoButton } from "@/components/InfoSheets";
import { useAllPackages } from "@/lib/packages";

// Decoding every frame would block the page; a few checks per second is enough for a QR code.
const SCAN_INTERVAL_MS = 250;
const SCAN_MAX_WIDTH = 640;

type JoinResult = { kind: "join"; ok: true; title: string } | { kind: "join"; ok: false; message: string };
type ScanResult = (ClaimResult & { kind?: undefined }) | JoinResult;

function MissionItem({
  done,
  onToggle,
  disabled,
  children,
  info,
}: {
  done: boolean;
  onToggle: () => void;
  disabled: boolean;
  children: React.ReactNode;
  info?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        onClick={onToggle}
        disabled={disabled}
        className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-60"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
            done ? "border-[#B6DC7A] bg-[#B6DC7A] text-[#0D2A1F]" : "border-white/80"
          }`}
        >
          {done && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
        <span className="min-w-0 text-sm font-semibold">{children}</span>
      </button>
      {info}
    </li>
  );
}

/** The traveler's own checklist; points for these come from the guide's QR at the end of the trip. */
function EcoChecklist() {
  const state = useChallenge();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const joined = Boolean(state?.packageId);
  const toggle = async (item: "tumbler" | "teloBag", done: boolean) => {
    setBusy(item);
    setError(null);
    const result = await setMission(item, done);
    setBusy(null);
    if (!result.ok) setError(result.message);
  };

  return (
    <section className="mt-6 w-full shrink-0 rounded-3xl bg-gradient-to-br from-[#8DB255] to-[#3F5F2A] p-4 text-left text-white shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-fredoka text-xl font-semibold">Your mission checklist</h2>
        <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-white/90">
          <Image src="/challenge/coin.webp" alt="" width={18} height={18} />
          <span translate="no" className="notranslate">{POINTS.perBottle}</span>/ bottle
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        <MissionItem
          done={state?.missionTumbler === true}
          disabled={!joined || busy !== null}
          onToggle={() => void toggle("tumbler", !state?.missionTumbler)}
        >
          I brought my own drinking bottle (tumbler)
        </MissionItem>
        <MissionItem
          done={state?.missionTeloBag === true}
          disabled={!joined || busy !== null}
          onToggle={() => void toggle("teloBag", !state?.missionTeloBag)}
          info={<TelobagInfoButton />}
        >
          <span translate="no" className="notranslate mr-[0.3em]">Telobag:</span>I use the bag from my guide
        </MissionItem>
        <li className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5 text-sm font-semibold">
          <Image src="/challenge/bottle.webp" alt="" width={24} height={24} className="h-6 w-auto shrink-0" />
          <span className="min-w-0">
            Bottles collected this trip:<span translate="no" className="notranslate ml-[0.25em]">{state?.bottlesThisTrip ?? 0}</span>
            {state?.weightGramsThisTrip ? (
              <span translate="no" className="notranslate ml-[0.25em] text-white/85">({formatWeight(state.weightGramsThisTrip)})</span>
            ) : null}
          </span>
        </li>
      </ul>
      <p className="mt-3 text-pretty text-xs text-white/85">
        {joined
          ? "Tick these for yourself. Points are added when you scan your guide's QR code."
          : "Join a trip on Home first, then tick your mission here."}
      </p>
      {error && <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#A33A12]">{error}</p>}
    </section>
  );
}

export default function ScanPage() {
  const router = useRouter();
  const allPackages = useAllPackages();
  // The camera loop keeps the first submitCode it saw, so it reads the latest package list from here.
  const packagesRef = useRef(allPackages);
  useEffect(() => {
    packagesRef.current = allPackages;
  }, [allPackages]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [checking, setChecking] = useState(false);
  // Bumped to reopen the camera, e.g. after iOS stops it while the app was in the background.
  const [cameraRun, setCameraRun] = useState(0);

  const submitCode = async (value: string) => {
    setChecking(true);
    // A booking QR joins the trip; anything else is treated as a bottle code.
    const pkg = packageForBookingCode(value, packagesRef.current);
    if (pkg) {
      const joined = await joinTrip(value.trim().toUpperCase(), pkg.id);
      setChecking(false);
      setResult(joined.ok ? { kind: "join", ok: true, title: pkg.title } : { kind: "join", ok: false, message: joined.message });
      return;
    }
    const outcome = await redeemClaim(value);
    setChecking(false);
    setResult(outcome);
  };

  useEffect(() => {
    if (result) return;

    let stopped = false;
    let timer = 0;
    let stream: MediaStream | undefined;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && context && video.readyState === video.HAVE_ENOUGH_DATA) {
        const scale = Math.min(1, SCAN_MAX_WIDTH / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height);
        if (code?.data) {
          // Stop reading frames while the server checks this code.
          stopped = true;
          void submitCode(code.data);
          return;
        }
      }
      timer = window.setTimeout(tick, SCAN_INTERVAL_MS);
    };

    // In-app browsers (Instagram, LINE…) and non-HTTPS pages have no camera API at all.
    if (!navigator.mediaDevices?.getUserMedia) {
      void Promise.resolve().then(() => {
        if (!stopped) setCameraError("This browser can't open the camera. Open the site in Safari or Chrome, or type the code below.");
      });
      return () => {
        stopped = true;
      };
    }

    // iOS may stop the camera when the app goes to the background; reopen it on return.
    const onVisible = () => {
      if (document.visibilityState !== "visible" || stopped) return;
      const ended = !stream || stream.getVideoTracks().every((track) => track.readyState === "ended");
      if (ended) setCameraRun((value) => value + 1);
      else videoRef.current?.play().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisible);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((media) => {
        setCameraError(null);
        if (stopped) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          videoRef.current.play().catch(() => undefined);
        }
        timer = window.setTimeout(tick, SCAN_INTERVAL_MS);
      })
      .catch((error: unknown) => {
        if (stopped) return;
        const name = (error as { name?: string }).name;
        setCameraError(
          name === "NotAllowedError"
            ? "Camera access is blocked. Allow the camera for this site in your browser settings, or type the code below."
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "No camera was found on this device. You can type the code below."
              : "Camera is not available. You can type the code below.",
        );
      });

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [result, cameraRun]);

  const submitManual = (event: FormEvent) => {
    event.preventDefault();
    void submitCode(manualCode);
    setManualCode("");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-0 z-20 mx-auto flex w-full max-w-[480px] flex-col bg-neutral-800 pb-[calc(68px+env(safe-area-inset-bottom))] pt-[66px] lg:left-64 lg:right-0 lg:w-auto lg:max-w-none lg:pb-0 lg:pt-0">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pb-4 pt-6 text-center text-white lg:mx-auto lg:w-full lg:max-w-md lg:pt-16">
        <div className="flex w-full items-center justify-between gap-3">
          <p translate="no" className="notranslate font-fredoka text-lg font-semibold text-[#B6DC7A]">Eco Mission</p>
          <HowItWorksButton tone="light" />
        </div>
        <h1 className="mt-2 text-pretty font-fredoka text-xl font-semibold leading-snug">Scan the QR code from your tour guide to claim your points</h1>
        <p className="mt-1 text-pretty text-xs text-white/85">
          Your guide verifies your plastic bottles at the end of the trip. Got a booking QR from our admin? Scan it here to join your
          trip.
        </p>

        {result ? (
          <div className="mt-8 w-full animate-rise-in rounded-3xl bg-white p-6 text-[#12372A]">
            {result.kind === "join" ? (
              result.ok ? (
                <>
                  <p className="title-card text-2xl text-[#03603F]">You&apos;re in!</p>
                  <p className="mt-1 text-pretty text-sm">
                    You joined <span translate="no" className="notranslate font-semibold">{result.title}</span>. Have a great trip!
                  </p>
                </>
              ) : (
                <p className="font-semibold text-[#A33A12]">{result.message}</p>
              )
            ) : result.ok ? (
              <>
                <Image src="/challenge/coin.webp" alt="" width={56} height={56} className="mx-auto animate-coin-pop" />
                <p className="title-card mt-2 text-3xl text-[#03603F]">
                  +<span translate="no" className="notranslate mr-[0.25em]">{result.points}</span>points
                </p>
                <p className="mt-1 text-sm">
                  <span translate="no" className="notranslate mr-[0.25em]">{result.bottles}</span>plastic bottles recorded
                  {result.weightGrams ? (
                    <>
                      {" "}
                      (<span translate="no" className="notranslate">{formatWeight(result.weightGrams)}</span>)
                    </>
                  ) : null}
                  . Thank you!
                </p>
                {result.capped && (
                  <p className="mt-1 text-xs">
                    The limit is<span translate="no" className="notranslate mx-[0.25em]">{POINTS.maxBottlesPerTrip}</span>bottles per trip.
                  </p>
                )}
              </>
            ) : (
              <p className="font-semibold text-[#A33A12]">{result.message}</p>
            )}
            {result.kind === "join" && result.ok ? (
              <button
                onClick={() => router.push("/")}
                className="mt-5 min-h-12 w-full rounded-2xl bg-[#0D2A1F] font-semibold text-white"
              >
                Go to my trip
              </button>
            ) : (
              <button
                onClick={() => setResult(null)}
                className="mt-5 min-h-12 w-full rounded-2xl bg-[#0D2A1F] font-semibold text-white"
              >
                Scan another code
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 flex aspect-[10/9] w-[74%] max-w-[36dvh] shrink-0 items-center justify-center rounded-2xl border-2 border-black/80 bg-white/5">
            {checking && <span className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold">Checking code…</span>}
          </div>
        )}

        {cameraError && !result && <p className="mt-4 text-pretty text-xs text-white/90">{cameraError}</p>}
        {!result && (
          <p className="mt-4 w-full text-pretty text-left text-xs text-white/85">
            Code entry is only for when QR scanning is under maintenance. Your guide will give you the code.
          </p>
        )}
        {!result && (
          <form onSubmit={submitManual} className="mt-2 flex w-full gap-2">
            <input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Type the code, e.g. DT2-…"
              aria-label="Type the code"
              className="min-w-0 flex-1 rounded-xl bg-white/95 px-3 py-2.5 text-sm uppercase text-[#12372A] outline-none placeholder:normal-case"
            />
            <button disabled={!manualCode.trim()} className="rounded-xl bg-[#8DB255] px-4 text-sm font-bold text-[#0D2A1F] disabled:opacity-60">
              Submit
            </button>
          </form>
        )}
        <EcoChecklist />
      </div>
    </div>
  );
}
