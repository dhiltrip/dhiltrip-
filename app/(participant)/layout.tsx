"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Home, Map as MapIcon, ScanLine, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignInScreen } from "@/components/SignInScreen";
import { useChallenge, useLastGain, type ChallengeState, type PointsGain } from "@/lib/participant";
import { initialsOf } from "@/lib/initials";

const tabs = [
  { href: "/", label: "Home", icon: Home, name: false },
  { href: "/map", label: "Responsible Travel Trail", icon: MapIcon, name: true },
  { href: "/rewards", label: "Rewards", icon: Award, name: false },
  { href: "/profile", label: "Green Impact Dashboard", icon: User, name: true },
];

function TabLink({ tab, active }: { tab: (typeof tabs)[number]; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden transition-colors ${
        active ? "bg-[#03603F] text-white" : "text-white/80 hover:bg-white/5"
      }`}
    >
      <Icon className="h-6 w-6 shrink-0" />
      {/* Feature names stay the same in every language; plain words are translated. */}
      <span
        translate={tab.name ? "no" : undefined}
        className={`line-clamp-2 max-w-full px-0.5 text-center text-[10px] font-semibold leading-[1.1] ${tab.name ? "notranslate" : "[overflow-wrap:anywhere]"}`}
      >
        {tab.label}
      </span>
    </Link>
  );
}

type SidebarProps = {
  state: ChallengeState;
  gain: PointsGain;
  pathname: string;
};

/** Laptop and desktop navigation; phones keep the bottom bar from the prototype. */
function DesktopSidebar({ state, gain, pathname }: SidebarProps) {
  const item = (href: string, label: string, Icon: typeof Home, name = false) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 font-semibold transition-colors ${
          active ? "bg-[#03603F] text-white" : "text-white/80 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span translate={name ? "no" : undefined} className={`min-w-0 leading-tight ${name ? "notranslate" : ""}`}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#0D2A1F] px-4 py-6 text-white lg:flex">
      <div className="flex items-center justify-between gap-2 px-1">
        <Link href="/" className="shrink-0">
          <Image src="/challenge/logo.webp" alt="DhilTrip Explorations" width={778} height={319} className="h-12 w-auto" />
        </Link>
        <LanguageSwitcher align="left" />
      </div>

      <nav className="mt-8 space-y-1.5" aria-label="Main">
        {item("/", "Home", Home)}
        {item("/map", "Responsible Travel Trail", MapIcon, true)}
        <Link
          href="/scan"
          aria-current={pathname === "/scan" ? "page" : undefined}
          className={`my-3 flex min-h-14 items-center gap-3 rounded-2xl bg-gradient-to-b px-4 text-lg font-semibold text-white shadow-lg ${
            pathname === "/scan" ? "from-[#B6DC7A] to-[#3E8560]" : "from-[#6F9148] to-[#1F4D33]"
          }`}
        >
          <ScanLine className="h-6 w-6 shrink-0" strokeWidth={1.75} />
          {/* A feature name: kept as is in every language (and short enough for the menu). */}
          <span translate="no" className="notranslate">Eco Mission</span>
        </Link>
        {item("/rewards", "Rewards", Award)}
        {item("/profile", "Green Impact Dashboard", User, true)}
      </nav>

      <div className="mt-auto space-y-3">
        <Link href="/rewards" className="relative flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
          <Image key={gain ? `side-coin-${gain.at}` : "side-coin"} src="/challenge/coin.webp" alt="" width={32} height={32} className={gain ? "animate-coin-pop" : undefined} />
          <span className="font-semibold">
            <span translate="no" className="notranslate mr-[0.25em] font-fredoka text-2xl">{state.points}</span>points
          </span>
          {gain && (
            <span
              key={`side-gain-${gain.at}`}
              translate="no"
              aria-hidden="true"
              className="notranslate pointer-events-none absolute -top-2 left-10 animate-points-float whitespace-nowrap rounded-full bg-[#8DB255] px-2 py-0.5 text-xs font-bold text-[#0D2A1F] shadow"
            >
              +{gain.amount}
            </span>
          )}
        </Link>
        <Link href="/profile" className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white/5">
          <span translate="no" className="notranslate flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9E6DF] font-fredoka font-semibold text-[#12372A]">
            {initialsOf(state.user?.name ?? "")}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold capitalize">{state.user?.name}</span>
            <span className="block truncate text-xs text-[#ADBC9F]">{state.isGuest ? "Guest mode" : state.user?.email}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}

export default function ParticipantLayout({ children }: { children: ReactNode }) {
  const state = useChallenge();
  const gain = useLastGain();
  const pathname = usePathname();

  if (!state) return <div className="min-h-dvh bg-[#0D2A1F]" />;
  if (!state.user) return <SignInScreen />;

  const scanActive = pathname === "/scan";

  return (
    <div className="min-h-dvh bg-[#F3F4DC]">
      <DesktopSidebar state={state} gain={gain} pathname={pathname} />
      <div className="app-shell relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-[#F3F4DC] text-[#12372A] shadow-xl lg:max-w-none lg:pl-64 lg:shadow-none [&_a]:transition-transform [&_a:active]:scale-[0.97] [&_button]:transition-transform [&_button:active]:scale-[0.97]">
        <header className="sticky top-0 z-30 flex items-center lg:hidden justify-between gap-2 bg-[#0D2A1F] px-4 py-2.5">
          <Link href="/" className="shrink-0">
            <Image
              src="/challenge/logo.webp"
              alt="DhilTrip Explorations"
              width={778}
              height={319}
              priority
              className="h-9 w-auto min-[360px]:h-11"
            />
          </Link>
          <div className="flex items-center gap-1.5 min-[360px]:gap-2.5">
            <LanguageSwitcher />
            <Link
              href="/rewards"
              className="relative flex max-w-[68px] flex-col items-center text-center leading-none text-white [overflow-wrap:anywhere]"
            >
              <Image
                key={gain ? `coin-${gain.at}` : "coin"}
                src="/challenge/coin.webp"
                alt=""
                width={24}
                height={24}
                className={gain ? "animate-coin-pop" : undefined}
              />
              <span className="mt-1 text-[11px] font-semibold">
                <span translate="no" className="notranslate mr-[0.25em]">{state.points}</span>points
              </span>
              {gain && (
                <span
                  key={`gain-${gain.at}`}
                  translate="no"
                  aria-hidden="true"
                  className="notranslate pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 animate-points-float whitespace-nowrap rounded-full bg-[#8DB255] px-2 py-0.5 text-xs font-bold text-[#0D2A1F] shadow"
                >
                  +{gain.amount}
                </span>
              )}
            </Link>
            <Link
              href="/profile"
              aria-label="Profile"
              translate="no"
              className="notranslate flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E9E6DF] font-fredoka text-base font-semibold text-[#12372A] min-[360px]:h-10 min-[360px]:w-10"
            >
              {initialsOf(state.user.name)}
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-[calc(8rem+env(safe-area-inset-bottom))] [overflow-wrap:break-word] lg:pb-14">
          <div className="lg:mx-auto lg:max-w-5xl lg:px-6 lg:pt-4">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-40 flex lg:hidden h-[calc(68px+env(safe-area-inset-bottom))] w-full max-w-[480px] -translate-x-1/2 bg-[#0D2A1F] pb-[env(safe-area-inset-bottom)]">
          <TabLink tab={tabs[0]} active={pathname === "/"} />
          <TabLink tab={tabs[1]} active={pathname === "/map"} />
          <div className="relative w-24 shrink-0">
            <Link
              href="/scan"
              aria-current={scanActive ? "page" : undefined}
              className={`absolute -top-6 left-1/2 flex h-[72px] w-[72px] -translate-x-1/2 items-center justify-center rounded-3xl bg-gradient-to-b text-white shadow-lg ${
                scanActive ? "from-[#B6DC7A] to-[#3E8560]" : "from-[#6F9148] to-[#1F4D33]"
              }`}
            >
              <ScanLine className="h-9 w-9" strokeWidth={1.75} />
              <span translate="no" className="notranslate sr-only">Eco Mission</span>
            </Link>
            <span
              aria-hidden="true"
              translate="no"
              className="notranslate absolute inset-x-0 bottom-1.5 line-clamp-2 px-0.5 text-center text-[10px] font-semibold leading-[1.1] text-white [overflow-wrap:anywhere]"
            >
              Eco Mission
            </span>
          </div>
          <TabLink tab={tabs[2]} active={pathname === "/rewards"} />
          <TabLink tab={tabs[3]} active={pathname === "/profile"} />
        </nav>
      </div>
    </div>
  );
}
