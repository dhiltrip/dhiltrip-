"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { usePackages } from "@/lib/packages";
import { focusStyle } from "@/data/focus";
import { continueAsGuest, firebaseEnabled, signInDemo } from "@/lib/participant";
import { sendPasswordReset, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/firebase/store";

type Mode = "signin" | "signup";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function Field({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#ADBC9F]/70 bg-white px-4 focus-within:border-[#03603F] focus-within:ring-2 focus-within:ring-[#8DB255]/50">
      <span className="shrink-0 text-[#436850]">{icon}</span>
      {children}
    </div>
  );
}

const input = "min-w-0 flex-1 bg-transparent py-3 text-base text-[#12372A] outline-none placeholder:text-[#436850]/70";

/** Sign in, create an account, continue with Google, or look around as a guest. */
export function SignInScreen() {
  const packages = usePackages().slice(0, 4);
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<"form" | "google" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!firebaseEnabled) {
      signInDemo(name || email.split("@")[0], email);
      return;
    }
    setBusy("form");
    const result = mode === "signup" ? await signUpWithEmail(name, email, password) : await signInWithEmail(email, password);
    setBusy(null);
    if (!result.ok) setError(result.message);
  };

  const google = async () => {
    setError(null);
    setNotice(null);
    setBusy("google");
    const result = await signInWithGoogle();
    setBusy(null);
    if (!result.ok) setError(result.message);
  };

  const forgot = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    setBusy("reset");
    const result = await sendPasswordReset(email);
    setBusy(null);
    if (result.ok) setNotice("We sent a password reset link to your email.");
    else setError(result.message);
  };

  const signup = mode === "signup";

  return (
    <div className="app-shell relative min-h-dvh bg-gradient-to-b from-[#DDE5BE] via-[#F3F4DC] to-[#F3F4DC] text-[#12372A] lg:grid lg:grid-cols-[1.1fr_1fr] lg:bg-none lg:bg-[#F3F4DC]">
      <aside className="relative hidden overflow-hidden bg-[#0D2A1F] p-12 text-white lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #ADBC9F 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#8DB255]/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-[#C2A44E]/20 blur-3xl" />
        <Image src="/challenge/logo.webp" alt="DhilTrip Explorations" width={778} height={319} priority className="relative h-auto w-56" />
        <div className="relative mt-auto max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ADBC9F]">Leave No Trace Challenge</p>
          <h2 className="title-page mt-3 text-5xl leading-[1.05]">Explore Jogja and leave it cleaner.</h2>
          <p className="mt-4 text-pretty text-lg text-white/80">
            Collect plastic bottles on every trip, earn points, and redeem recycled souvenirs made by local artisans.
          </p>
        </div>
        <div className="relative mt-10 grid grid-cols-4 gap-3" aria-hidden="true">
          {packages.map((pkg, index) => (
            <div key={pkg.id} className={`overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10 ${index % 2 ? "translate-y-6" : ""}`}>
              <Image src={pkg.poster} alt="" width={1000} height={1414} sizes="12vw" className="aspect-[1000/1414] h-auto w-full object-cover" style={focusStyle(pkg.posterFocus)} />
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col lg:justify-center">
      <div className="flex justify-end px-5 pt-5 lg:absolute lg:right-6 lg:top-6 lg:p-0">
        <div className="rounded-full bg-[#0D2A1F]">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-2 lg:flex-none lg:py-10">
        <div className="mx-auto rounded-3xl bg-[#0D2A1F] px-6 py-3 shadow-lg lg:hidden">
          <Image src="/challenge/logo.webp" alt="DhilTrip Explorations" width={778} height={319} priority className="h-auto w-44" />
        </div>
        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#436850] lg:hidden">Leave No Trace Challenge</p>

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl shadow-[#12372A]/10">
          {firebaseEnabled && (
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#F3F4DC] p-1.5" role="tablist">
              {(["signin", "signup"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={mode === item}
                  onClick={() => switchMode(item)}
                  className={`min-h-11 rounded-xl text-base font-semibold transition-colors ${
                    mode === item ? "bg-white text-[#12372A] shadow" : "text-[#436850]"
                  }`}
                >
                  {item === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          <h1 className="title-page mt-6 text-center text-3xl text-black">{signup ? "Create your account" : "Welcome!"}</h1>
          <p className="mt-1.5 text-center text-pretty text-sm text-[#436850]">
            {signup ? "Collect points on every trip and redeem local souvenirs." : "Sign in to join your trip and the challenge."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            {(signup || !firebaseEnabled) && (
              <Field icon={<User className="h-5 w-5" />}>
                <input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Full name" aria-label="Full name" className={input} />
              </Field>
            )}
            <Field icon={<Mail className="h-5 w-5" />}>
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="Email address" aria-label="Email address" className={input} />
            </Field>
            {firebaseEnabled && (
              <Field icon={<Lock className="h-5 w-5" />}>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={signup ? "new-password" : "current-password"}
                  placeholder="Password"
                  aria-label="Password"
                  className={input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#436850] hover:bg-[#F3F4DC]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </Field>
            )}

            {firebaseEnabled && !signup && (
              <div className="flex justify-end">
                <button type="button" onClick={() => void forgot()} disabled={busy === "reset"} className="text-sm font-semibold text-[#03603F] hover:underline">
                  {busy === "reset" ? "Sending…" : "Forgot password?"}
                </button>
              </div>
            )}

            {error && <p role="alert" className="rounded-xl bg-[#A33A12]/10 px-3 py-2 text-sm font-semibold text-[#A33A12]">{error}</p>}
            {notice && <p role="status" className="rounded-xl bg-[#DDE5BE] px-3 py-2 text-sm font-semibold text-[#03603F]">{notice}</p>}

            <button
              disabled={busy !== null}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] text-lg font-semibold text-white shadow-lg shadow-[#0D2A1F]/20 disabled:opacity-70"
            >
              {busy === "form" && <Loader2 className="h-5 w-5 animate-spin" />}
              {!firebaseEnabled ? "Continue" : signup ? "Create account" : "Sign in"}
            </button>
          </form>

          {firebaseEnabled && (
            <>
              <div className="my-5 flex items-center gap-3 text-sm text-[#436850]">
                <span className="h-px flex-1 bg-[#ADBC9F]/60" />
                OR
                <span className="h-px flex-1 bg-[#ADBC9F]/60" />
              </div>
              <button
                type="button"
                onClick={() => void google()}
                disabled={busy !== null}
                className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#ADBC9F]/70 bg-white text-lg font-semibold text-[#12372A] shadow-sm disabled:opacity-70"
              >
                {busy === "google" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleMark />}
                Continue with Google
              </button>
            </>
          )}

          <button
            type="button"
            onClick={continueAsGuest}
            className="mt-3 min-h-14 w-full rounded-2xl border-2 border-[#ADBC9F] text-base font-semibold text-[#436850]"
          >
            Start later (Guest Mode)
          </button>
          {!firebaseEnabled && <p className="mt-3 text-center text-xs text-[#436850]">Demo mode: your data stays on this device.</p>}
        </div>

        <Link href="/legal" className="mt-5 block text-center text-sm font-semibold text-[#436850] underline">
          Privacy &amp; Terms
        </Link>
      </div>
      </div>
    </div>
  );
}
