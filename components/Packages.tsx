"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, X, MapPin, Users, Leaf, ArrowRight, ChevronLeft, ChevronRight, Sparkles, FileText } from "lucide-react";
import Image from 'next/image'
import {client} from '@/sanity/lib/client'

// Ganti link ini dengan link file PDF / Google Drive Katalog kamu
const CATALOG_URL = "https://drive.google.com/drive/folders/1VGSBJZ6RyvPBQsz8byY-8D4XsnKyvy3c?usp=sharing";

type TourItineraryItem = { 
  _key: string 
  day: number 
  title: string 
  activities: string[] 
} 
type TourPackage = { 
  _id: string 
  title: string 
  days: number
  nights: number
  price: number 
  unit: string 
  badge: string 
  metaDetail: string 
  image: string 
  images: string[] 
  tags: string[] 
  tagline: string 
  description: string 
  groupSizeType?: 'min' | 'max'
  maxGroup: number 
  minAge: number 
  includes: string[] 
  highlights: string[] 
  itinerary: TourItineraryItem[] 
  whatsapp: string 
  difficulty: 'Easy' | 'Moderate' | 'Hard' 
} 

const packagesQuery = `*[_type == "tourPackage"] | order(_createdAt asc){
  _id, 
  title, 
  days, 
  nights, 
  price, 
  unit, 
  badge, 
  metaDetail, 
  "image": image.asset->url, 
  "images": images[].asset->url,
  tags, 
  tagline, 
  description,
  groupSizeType,
  maxGroup, 
  minAge, 
  includes, 
  highlights, 
  itinerary[]{ 
      _key, 
      day,
      title, 
      activities
    }, 
  whatsapp, 
  difficulty
}`

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)

function PackageModal({ pkg, onClose }: { pkg: TourPackage; onClose: () => void }) {
  const [activeImg, setActiveImg] = useState(0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="relative h-56 sm:h-72 flex-shrink-0 bg-[#12372A]">
            <Image src={pkg.images[activeImg]} alt={pkg.title} className="object-cover" fill sizes="(max-width: 640px) 100vw, 768px"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <button onClick={() => setActiveImg((p) => (p - 1 + pkg.images.length) % pkg.images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveImg((p) => (p + 1) % pkg.images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {pkg.images.map((_, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`rounded-full transition-all duration-300 ${i === activeImg ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"}`} />
              ))}
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              {pkg.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-black/45 border border-white/25 text-white text-xs font-semibold rounded-full">{tag}</span>
              ))}
            </div>
            <div className="absolute bottom-8 left-5 right-16">
              <p className="text-white/70 text-sm mb-1">{pkg.tagline}</p>
              <h2 className="text-white text-2xl font-bold leading-tight">{pkg.title}</h2>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6">
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Sparkles, label: pkg.badge },
                { icon: Clock, label: pkg.nights > 0 ? `${pkg.days}D/${pkg.nights}N` : `${pkg.days} Day`},
                { icon: Users, label: pkg.groupSizeType === 'max' ? `${pkg.maxGroup} people` : `Min. ${pkg.maxGroup} pax` },
                { icon: MapPin, label: pkg.minAge > 0 ? `Min age: ${pkg.minAge}+` : `All ages` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-sm text-foreground/80">
                  <Icon className="w-4 h-4 text-[#436850]" />
                  <span>{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 bg-[#12372A]/10 border border-[#ADBC9F]/40 px-3 py-1.5 rounded-full">
                <span className="text-2xl font-bold text-[#12372A]">{formatPrice(pkg.price)}</span>
                <span className="text-muted-foreground text-sm font-normal">{pkg.unit}</span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-foreground mb-2 text-base">About This Package</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{pkg.description}</p>
            </div>

            <div>
              <h3 className="font-bold text-foreground mb-3 text-base">Highlights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pkg.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 bg-[#12372A]/5 rounded-xl px-3 py-2.5">
                    <Leaf className="w-4 h-4 text-[#436850] flex-shrink-0" />
                    <span className="text-sm text-foreground/80">{h}</span>
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
          </div>

          <div className="flex-shrink-0 p-5 sm:p-7 pt-4 border-t border-border/50 bg-background flex flex-col sm:flex-row gap-3">
            <a href={pkg.whatsapp} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#12372A] text-[#FBFADA] font-bold rounded-2xl hover:bg-[#1a4a35] transition-colors shadow-lg">
              Book This Trip
              <ArrowRight className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="sm:w-32 py-4 border border-border rounded-2xl text-foreground/70 font-semibold hover:bg-muted transition-colors">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


export function Packages() {
  const [packages, setPackages] = useState<TourPackage[]>([])
  const [selectedPkg, setSelectedPkg] = useState<TourPackage | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchPackages() {
      try {
        const data = await client.fetch<TourPackage[]>(packagesQuery)

        const appendedImage = data.map((pkg) => ({...pkg, images: [pkg.image, ...(pkg.images ?? []),].filter(
          (url): url is string => Boolean(url)),
        }))

        if (!cancelled) {
          setPackages(appendedImage)
          setCurrentIndex(0)
        }
      } catch (err) {
        console.error('Failed to fetch tour packages:', err)

        if (!cancelled) {
          setError('Unable to load tour packages. Please try again later.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchPackages()

    return () => {
      cancelled = true
    }
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % packages.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + packages.length) % packages.length)
  }

  {loading && <p className="text-center">Loading tour packages...</p>}
  
  {error && <p className="text-center text-red-600">{error}</p>}
  
  {!loading && !error && packages.length === 0 && (<p className="text-center">No tour packages available yet.</p>)}

  return (
    <section id="packages" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(173,188,159,0.12) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(67,104,80,0.10) 0%, transparent 70%)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
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
        </div>

        <div className="relative w-full flex flex-col items-center justify-center">
          <button 
            onClick={prevSlide}
            className="hidden md:flex absolute left-2 z-30 w-12 h-12 rounded-full border border-border items-center justify-center bg-card text-[#12372A] hover:bg-[#12372A] hover:text-white hover:border-[#12372A] shadow-lg transition-all group hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          </button>

          <button 
            onClick={nextSlide}
            className="hidden md:flex absolute right-2 z-30 w-12 h-12 rounded-full border border-border items-center justify-center bg-card text-[#12372A] hover:bg-[#12372A] hover:text-white hover:border-[#12372A] shadow-lg transition-all group hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="w-full py-2 overflow-x-auto md:overflow-hidden snap-x snap-mandatory scrollbar-none">
            <motion.div 
              className="flex gap-6 md:gap-8 items-stretch px-2 md:px-0"
              animate={typeof window !== "undefined" && window.innerWidth > 768 ? { x: `calc(33.333% - 16px - (${currentIndex * 33.333}% + ${currentIndex * 32}px))` } : { x: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            >
              {packages.map((pkg, idx) => {
                const isCenter = idx === currentIndex;
                
                return (
                  <motion.div 
                    key={pkg._id}
                    onClick={() => {
                      if (typeof window !== "undefined" && window.innerWidth > 768 && !isCenter) setCurrentIndex(idx);
                    }}
                    animate={typeof window !== "undefined" && window.innerWidth > 768 ? {
                      scale: isCenter ? 1 : 0.90,
                      opacity: isCenter ? 1 : 0.45,
                    } : { scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className={`w-[82vw] sm:w-[45vw] md:w-[calc(33.333%-22px)] shrink-0 bg-card rounded-[2rem] overflow-hidden shadow-lg border flex flex-col group snap-center ${
                      isCenter 
                        ? "border-[#ADBC9F]/60 shadow-2xl md:z-20" 
                        : "border-border/40 md:z-10"
                    }`}
                  >
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <Image src={pkg.image} alt={pkg.title} className="object-cover transition-transform duration-700 group-hover:scale-110" fill sizes="(max-width: 640px) 82vw, (max-width: 768px) 45vw, 33.333vw"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                      <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                        {pkg.tags.map((tag) => (
                          <span key={tag} className="px-3 py-1 bg-black/45 border border-white/25 text-white text-xs font-semibold rounded-full">{tag}</span>
                        ))}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="flex items-center gap-1.5 text-white bg-black/55 px-3 py-1.5 rounded-lg border border-white/10">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span className="font-semibold text-xs tracking-wide uppercase text-amber-100">{pkg.badge}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white bg-black/55 px-2.5 py-1.5 rounded-lg border border-white/10">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{pkg.nights > 0 ? `${pkg.days}D/${pkg.nights}N` : `${pkg.days} Day`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-7 flex flex-col flex-grow bg-card">
                      <div className="text-xs font-semibold text-[#436850] tracking-wide mb-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-[#436850]" />
                        {pkg.metaDetail}
                      </div>
                      
                      <h3 className="text-lg sm:text-xl font-sora font-bold text-foreground mb-1 group-hover:text-[#12372A] transition-colors">{pkg.title}</h3>
                      <div className="mb-4">
                        <span className="text-xl sm:text-2xl font-bold text-[#12372A]">{formatPrice(pkg.price)}</span>
                        <span className="text-muted-foreground text-sm">{pkg.unit}</span>
                      </div>
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
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPkg(pkg);
                          }} 
                          className="flex-1 py-3 rounded-xl border-2 border-[#12372A]/20 text-[#12372A] font-semibold text-xs sm:text-sm hover:border-[#12372A]/50 hover:bg-[#12372A]/5 transition-all duration-200"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(pkg.whatsapp, "_blank");
                          }} 
                          className="flex-1 py-3 rounded-xl bg-[#12372A] text-[#FBFADA] font-semibold text-xs sm:text-sm hover:bg-[#1a4a35] transition-all duration-200 flex items-center justify-center gap-1.5"
                        >
                          Book Now
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6 md:hidden">
            <button
              onClick={prevSlide}
              className="w-11 h-11 rounded-full border border-[#12372A]/15 bg-white flex items-center justify-center text-[#12372A] active:scale-90 transition-transform shadow-md"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-[11px] font-bold text-[#12372A]/50 uppercase tracking-widest animate-pulse">
              Swipe or Tap
            </span>
            
            <button
              onClick={nextSlide}
              className="w-11 h-11 rounded-full border border-[#12372A]/15 bg-white flex items-center justify-center text-[#12372A] active:scale-90 transition-transform shadow-md"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* ================= TOMBOL VIEW OUR CATALOG ================= */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full mt-12 flex justify-center px-4"
          >
            <a
              href={CATALOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-2xl py-4 sm:py-5 px-8 rounded-full border-2 border-[#12372A] text-[#12372A] hover:bg-[#12372A] hover:text-[#FBFADA] font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-md hover:shadow-xl group"
            >
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#12372A] group-hover:text-[#FBFADA] transition-colors" />
              <span>View Our Catalog</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>
          {/* ============================================================ */}

        </div>
      </div>

      {selectedPkg && (
        <PackageModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />
      )}
    </section>
  );
}