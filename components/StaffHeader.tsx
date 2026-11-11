import type { ReactNode } from "react";

type Stat = { value: number | string; label: string };

/** Dark header card for the staff pages, in the same style as the profile card. */
export function StaffHeader({ icon, title, subtitle, stats }: { icon: ReactNode; title: string; subtitle: string; stats?: Stat[] }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#0D2A1F] px-5 pb-5 pt-6 text-white shadow-lg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle, #ADBC9F 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#8DB255]/25 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#8DB255] text-[#0D2A1F]">{icon}</div>
          <div className="min-w-0">
            <h1 className="title-page">{title}</h1>
            <p className="text-pretty text-sm text-[#ADBC9F]">{subtitle}</p>
          </div>
        </div>
        {stats && stats.length > 0 && (
          <dl className="mt-5 grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-0 rounded-2xl bg-white/10 px-3 py-2.5">
                <dd translate="no" className="notranslate font-fredoka text-2xl font-semibold leading-none">{stat.value}</dd>
                <dt className="mt-1 text-[11px] font-semibold leading-snug text-white/80">{stat.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

/** Small round step number used in front of section titles. */
export function StepBadge({ n }: { n: number }) {
  return (
    <span translate="no" className="notranslate flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0D2A1F] font-fredoka text-sm font-semibold text-white">
      {n}
    </span>
  );
}
