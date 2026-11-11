"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, Leaf, MapPin, ArrowRight, X } from "lucide-react";
import { packages, whatsappLink, type ChallengePackage } from "@/data/challenge";
import { useMinWidth } from "@/hooks/use-min-width";

const CATALOG_URL = "https://drive.google.com/drive/folders/1VGSBJZ6RyvPBQsz8byY-8D4XsnKyvy3c?usp=sharing";

const bookingLink = (pkg: ChallengePackage) =>
  whatsappLink(`Hello Dhil Trip, I would like to book ${pkg.title}.`);

function PackageModal({ pkg, onClose }: { pkg: ChallengePackage; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={pkg.title}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/55 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6">
          <div className="grid sm:grid-cols-[220px_1fr] gap-5">
            <Image src={pkg.poster} alt={`${pkg.title} poster`} width={1000} height={1414} sizes="(max-width: 640px) 100vw, 220px" className="w-full h-auto rounded-2xl" />
            <div>
              <p className="text-muted-foreground text-sm mb-1">{pkg.tagline}</p>
              <h2 className="text-2xl font-bold text-foreground">{pkg.title}</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-sm text-foreground/80">
                  <Clock className="w-4 h-4 text-[#436850]" />
                  {pkg.duration}
                </span>
                <span className="bg-[#12372A]/10 border border-[#ADBC9F]/40 px-3 py-1.5 rounded-full text-sm font-bold text-[#12372A]">{pkg.priceLabel}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mt-4">{pkg.description}</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-3 text-base">{pkg.destinationLabel}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pkg.destinations.map((item) => (
                <div key={item} className="flex items-center gap-2 bg-[#12372A]/5 rounded-xl px-3 py-2.5">
                  <MapPin className="w-4 h-4 text-[#436850] flex-shrink-0" />
                  <span className="text-sm text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-3 text-base">What&apos;s Included</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pkg.includes.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#436850] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-2 text-base">Meeting Point</h3>
            <p className="text-sm text-foreground/80">{pkg.meetingPoints.join(" · ")}</p>
          </div>
        </div>

        <div className="flex-shrink-0 p-5 sm:p-7 pt-4 border-t border-border/50 bg-background flex flex-col sm:flex-row gap-3">
          <a href={bookingLink(pkg)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#12372A] text-[#FBFADA] font-bold rounded-2xl hover:bg-[#1a4a35] transition-colors shadow-lg">
            Book This Trip
            <ArrowRight className="w-4 h-4" />
          </a>
          <button onClick={onClose} className="sm:w-32 py-4 border border-border rounded-2xl text-foreground/70 font-semibold hover:bg-muted transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function Packages() {
  const [selectedPkg, setSelectedPkg] = useState<ChallengePackage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDesktop = useMinWidth(769);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = (index: number) => {
    const next = (index + packages.length) % packages.length;
    setCurrentIndex(next);
    if (!isDesktop) {
      trackRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  return (
    <section id="packages" className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#12372A]/8 border border-[#ADBC9F]/30 mb-4">
            <Leaf className="w-3.5 h-3.5 text-[#436850]" />
            <span className="text-xs font-semibold tracking-widest uppercase text-[#436850]">Curated Experiences</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="text-4xl md:text-5xl font-sora font-bold text-foreground mb-4">
            Our Signature Packages
          </motion.h2>
          <motion.p initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg text-muted-foreground max-w-2xl">
            Carefully curated experiences that balance exploration with personal growth and positive community impact.
          </motion.p>
        </div>

        <div className="relative w-full flex flex-col items-center justify-center">
          <button onClick={() => goTo(currentIndex - 1)} aria-label="Previous package" className="hidden md:flex absolute left-2 z-30 w-12 h-12 rounded-full border border-border items-center justify-center bg-card text-[#12372A] hover:bg-[#12372A] hover:text-white shadow-lg transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => goTo(currentIndex + 1)} aria-label="Next package" className="hidden md:flex absolute right-2 z-30 w-12 h-12 rounded-full border border-border items-center justify-center bg-card text-[#12372A] hover:bg-[#12372A] hover:text-white shadow-lg transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-full py-2 overflow-x-auto md:overflow-hidden snap-x snap-mandatory [scrollbar-width:none]">
            <motion.div
              ref={trackRef}
              className="flex gap-6 md:gap-8 items-stretch px-2 md:px-0"
              animate={isDesktop ? { x: `calc(33.333% - 16px - (${currentIndex * 33.333}% + ${currentIndex * 32}px))` } : { x: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            >
              {packages.map((pkg, idx) => {
                const isCenter = idx === currentIndex;
                return (
                  <motion.div
                    key={pkg.id}
                    onClick={() => {
                      if (isDesktop && !isCenter) setCurrentIndex(idx);
                    }}
                    animate={isDesktop ? { scale: isCenter ? 1 : 0.9, opacity: isCenter ? 1 : 0.45 } : { scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className={`w-[82vw] sm:w-[45vw] md:w-[calc(33.333%-22px)] shrink-0 bg-card rounded-[2rem] overflow-hidden shadow-lg border flex flex-col group snap-center ${isCenter ? "border-[#ADBC9F]/60 shadow-2xl md:z-20" : "border-border/40 md:z-10"}`}
                  >
                    <div className="relative h-56 overflow-hidden">
                      <Image src={pkg.poster} alt={pkg.title} className="object-cover object-top transition-transform duration-700 group-hover:scale-105" fill sizes="(max-width: 640px) 82vw, (max-width: 768px) 45vw, 33vw" />
                      <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                        {pkg.tags.map((tag) => (
                          <span key={tag} className="px-3 py-1 bg-black/55 text-white text-xs font-semibold rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-5 sm:p-7 flex flex-col flex-grow bg-card">
                      <div className="text-xs font-semibold text-[#436850] tracking-wide mb-1">{pkg.duration}</div>
                      <h3 className="text-lg sm:text-xl font-sora font-bold text-foreground mb-1">{pkg.title}</h3>
                      <p className="text-lg font-bold text-[#12372A] mb-4">{pkg.priceLabel}</p>
                      <div className="space-y-2.5 mb-6 flex-grow">
                        {pkg.includes.slice(0, 3).map((item) => (
                          <div key={item} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-[#436850] shrink-0 mt-0.5" />
                            <span className="text-foreground/75 text-xs sm:text-sm leading-snug">{item}</span>
                          </div>
                        ))}
                        {pkg.includes.length > 3 && (
                          <p className="text-xs text-[#436850] font-medium pl-6">+{pkg.includes.length - 3} more included</p>
                        )}
                      </div>
                      <div className="flex gap-2 sm:gap-3 mt-auto">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedPkg(pkg); }} className="flex-1 py-3 rounded-xl border-2 border-[#12372A]/20 text-[#12372A] font-semibold text-xs sm:text-sm hover:border-[#12372A]/50 hover:bg-[#12372A]/5 transition-all duration-200">
                          View Details
                        </button>
                        <a href={bookingLink(pkg)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 py-3 rounded-xl bg-[#12372A] text-[#FBFADA] font-semibold text-xs sm:text-sm hover:bg-[#1a4a35] transition-all duration-200 flex items-center justify-center gap-1.5">
                          Book Now
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6 md:hidden">
            <button onClick={() => goTo(currentIndex - 1)} className="w-11 h-11 rounded-full border border-[#12372A]/15 bg-white flex items-center justify-center text-[#12372A] active:scale-90 transition-transform shadow-md" aria-label="Previous package">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[11px] font-bold text-[#12372A]/50 uppercase tracking-widest">Swipe or Tap</span>
            <button onClick={() => goTo(currentIndex + 1)} className="w-11 h-11 rounded-full border border-[#12372A]/15 bg-white flex items-center justify-center text-[#12372A] active:scale-90 transition-transform shadow-md" aria-label="Next package">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="w-full mt-12 flex justify-center px-4">
            <a href={CATALOG_URL} target="_blank" rel="noopener noreferrer" className="w-full max-w-2xl py-4 sm:py-5 px-8 rounded-full border-2 border-[#12372A] text-[#12372A] hover:bg-[#12372A] hover:text-[#FBFADA] font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-md hover:shadow-xl group">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>View Our Catalog</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>
        </div>
      </div>

      {selectedPkg && <PackageModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />}
    </section>
  );
}
