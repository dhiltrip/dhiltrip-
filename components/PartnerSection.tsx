"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Recycle } from "lucide-react";
import { PosterViewer } from "@/components/PosterViewer";
import { formatWeight, useImpact } from "@/lib/site-content";

type Stage = "Before" | "Process" | "After";

const PHOTOS: { src: string; stage: Stage; caption: string }[] = [
  { src: "/partner/before-travelers-collecting.webp", stage: "Before", caption: "Travelers collect plastic during the trip" },
  { src: "/partner/before-sorting-caps.webp", stage: "Before", caption: "Bottle caps sorted by colour" },
  { src: "/partner/before-collected-bottles.webp", stage: "Before", caption: "Collected PET bottles, cleaned and cut" },
  { src: "/partner/process-workshop.webp", stage: "Process", caption: "Shaping and burning in the details by hand" },
  { src: "/partner/after-bottle-wayang.webp", stage: "After", caption: "Wayang characters made from plastic bottles" },
];

const STAGE_STYLE: Record<Stage, string> = {
  Before: "bg-[#A33A12] text-white",
  Process: "bg-[#C2A44E] text-[#0D2A1F]",
  After: "bg-[#8DB255] text-[#0D2A1F]",
};

// Starts a sentence, so only the gap after the name is needed.
const NAME = (
  <span translate="no" className="notranslate mr-[0.25em] font-semibold">
    Bank Sampah Pa-Q-One
  </span>
);

/** Our waste bank partner: who they are, and how collected bottles become souvenirs. */
export function PartnerSection() {
  const impact = useImpact();
  const [viewing, setViewing] = useState<(typeof PHOTOS)[number] | null>(null);

  return (
    <section id="partner" aria-labelledby="partner-heading" className="scroll-mt-24">
      <h2 id="partner-heading" className="title-section text-center text-black">Our Waste Bank Partner</h2>
      <p className="mx-auto mt-1 max-w-md text-pretty text-center text-sm text-[#436850]">Where the bottles from every trip end up.</p>

      <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="relative aspect-[1200/1118] bg-[#DDE5BE] lg:aspect-auto lg:min-h-full">
          <Image src="/partner/paqone-founder.webp" alt="Budi, founder of Bank Sampah Pa-Q-One, holding wayang made from plastic bottles" fill sizes="(min-width: 1024px) 352px, 100vw" className="object-cover" />
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h3 translate="no" className="notranslate title-card text-2xl">Bank Sampah Pa-Q-One</h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#436850]">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span translate="no" className="notranslate">Gedongkiwo, Mantrijeron, Yogyakarta</span>
            </p>
          </div>
          <p className="text-pretty text-sm leading-relaxed">
            {NAME}is the waste bank partner of DhilTrip Explorations. It was founded out of concern about pollution in the Winongo
            River.
          </p>
          <p className="text-pretty text-sm leading-relaxed">
            The name comes from the Javanese word &ldquo;pakiwan&rdquo;, which means the back of a house, such as the bathroom or
            kitchen: a place often seen as dirty, yet vital for keeping life clean and going.
          </p>
          <p className="text-pretty text-sm leading-relaxed">
            Instead of only collecting and selling raw waste, they upcycle it, especially PET plastic bottles, into crafts with real
            value. Their signature work is <strong>wayang characters made from plastic bottles</strong>, which promote both nature and
            culture.
          </p>
          <div className="flex items-center gap-3 rounded-2xl bg-[#0D2A1F] px-4 py-3 text-white">
            <Recycle className="h-6 w-6 shrink-0 text-[#B6DC7A]" />
            <p className="text-sm">
              Total waste our guides have brought here:
              <span translate="no" className="notranslate ml-[0.25em] font-fredoka text-lg font-semibold">
                {formatWeight(impact.deliveredGrams)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <h3 className="title-card mt-6 text-center text-xl text-black">From waste to souvenir</h3>
      <ul className="-mx-5 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {PHOTOS.map((photo) => (
          <li key={photo.src} className="w-[62vw] max-w-[15rem] shrink-0 snap-start lg:w-auto lg:max-w-none">
            <button onClick={() => setViewing(photo)} className="block w-full text-left" aria-label={`View photo: ${photo.caption}`}>
              <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-[#DDE5BE] shadow">
                <Image src={photo.src} alt={photo.caption} fill sizes="(min-width: 1024px) 200px, 62vw" className="object-cover" />
                <span key={photo.stage} className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-bold shadow ${STAGE_STYLE[photo.stage]}`}>
                  {photo.stage}
                </span>
              </span>
              <span className="mt-1.5 block text-pretty text-xs leading-snug text-[#436850]">{photo.caption}</span>
            </button>
          </li>
        ))}
      </ul>

      {viewing && <PosterViewer src={viewing.src} alt={viewing.caption} onClose={() => setViewing(null)} />}
    </section>
  );
}
