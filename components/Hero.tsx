"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Leaf, Star, Wind, MapPin, Users } from "lucide-react";
import Image from 'next/image'

const marqueeItems = [
  "Healing Journeys", "Eco Challenge", "Karimunjawa", "Deep Talk",
  "Journaling", "Yogyakarta", "Sustainability", "Cultural Immersion",
  "Waste Bank Tour", "Self Recovery", "Nature Retreats", "Community",
];

const photos = [
  { src: "/Karimun_5.JPG", alt: "Karimunjawa beach" },
  { src: "/kar5.jpg", alt: "Lush green forest" },
  { src: "/swn1.JPG", alt: "Yogyakarta temple" },
  { src: "/brm1.jpg", alt: "Serene lake" },
];

function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      <div className="absolute inset-0 bg-gradient-to-br from-[#0d2a1e] via-[#12372A] to-[#1a4835]" />

      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(173,188,159,0.14) 0%, transparent 65%)" }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(67,104,80,0.22) 0%, transparent 65%)" }}
      />
      <div
        className="absolute top-1/2 left-[40%] -translate-y-1/2 w-[350px] h-[350px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(67,104,80,0.16) 0%, transparent 65%)" }}
      />

      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        {[0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800].map((y, i) => (
          <path key={i}
            d={`M-200,${y} C150,${y - 50} 400,${y + 50} 700,${y} S1100,${y - 50} 1400,${y} S1800,${y + 50} 2100,${y}`}
            fill="none" stroke="#ADBC9F" strokeWidth="1"
          />
        ))}
      </svg>

      <div className="absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage: "radial-gradient(circle, #ADBC9F 1px, transparent 1px)", backgroundSize: "42px 42px" }} />

      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 70% at 22% 50%, transparent 20%, #0d2a1e 85%)" }} />
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

  const yLeft = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const yRight = useTransform(scrollYProgress, [0, 1], [0, -15]);

  const handleScrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen overflow-x-hidden flex flex-col justify-between"
    >
      <Background />

      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.022] pointer-events-none z-[2]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-12 lg:py-0 items-center justify-center gap-8 lg:gap-0">

        {/* LEFT — text column */}
        <motion.div
          style={{ y: typeof window !== "undefined" && window.innerWidth > 1024 ? yLeft : 0 }}
          className="w-full lg:w-[48%] flex flex-col justify-center pr-0 lg:pr-6 xl:pr-12 text-left"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 self-start mb-4 px-4 py-1.5 rounded-full bg-white/10 border border-white/20"
          >
            <Leaf className="w-3 h-3 text-[#ADBC9F]" />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#ADBC9F]">
              Sustainable Healing Tourism
            </span>
          </motion.div>

          {[
            { word: "Heal.", color: "#FBFADA", delay: 0.1 },
            { word: "Explore.", color: "#ADBC9F", delay: 0.22 },
            { word: "Grow.", color: "#436850", delay: 0.34 },
          ].map(({ word, color, delay }) => (
            <div key={word} className="overflow-hidden mb-1">
              <motion.h1
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
                className="font-sora font-extrabold leading-[0.9] tracking-tight"
                style={{
                  color,
                  fontSize: "clamp(3.5rem, 8vw, 7rem)",
                }}
              >
                {word}
              </motion.h1>
            </div>
          ))}

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="text-sm sm:text-base text-white/60 max-w-md leading-relaxed mt-4 mb-6"
          >
            Where every journey becomes a space for self-recovery, environmental
            awareness, and genuine human connection. Based in Yogyakarta, Indonesia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.68 }}
            className="flex flex-row items-center gap-4"
          >
            <button
              onClick={() => handleScrollTo("#packages")}
              className="group flex items-center gap-3 px-6 py-3.5 bg-[#FBFADA] text-[#12372A] font-bold rounded-2xl text-sm hover:bg-white transition-all duration-300 shadow-xl shadow-black/20"
            >
              Book a Trip
              <span className="w-5 h-5 rounded-full bg-[#12372A] text-[#FBFADA] flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                <ArrowRight className="w-3 h-3" />
              </span>
            </button>
            <button
              onClick={() => handleScrollTo("#why-us")}
              className="flex items-center gap-2 px-6 py-3.5 border border-white/20 text-white/80 font-semibold rounded-2xl text-sm hover:border-white/50 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              Our Story
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-8 pt-4 border-t border-white/5"
          >
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-[#ADBC9F] fill-[#ADBC9F]" />
                ))}
              </div>
              <span className="text-xs text-white/45 ml-1">5.0 avg rating</span>
            </div>
            <div className="hidden sm:block w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5 text-xs text-white/45">
              <Wind className="w-3 h-3 text-[#ADBC9F]" />
              <span>200+ travelers healed</span>
            </div>
            <div className="hidden sm:block w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5 text-xs text-white/45">
              <Users className="w-3 h-3 text-[#ADBC9F]" />
              <span>SDGs Aligned</span>
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT — photo mosaic */}
        <motion.div
          style={{ y: typeof window !== "undefined" && window.innerWidth > 1024 ? yRight : 0 }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[52%] flex items-center justify-center relative mt-4 lg:mt-0"
        >
          <div className="relative w-full aspect-[4/3] sm:aspect-[1.2] max-h-[420px] sm:max-h-[480px] lg:max-h-[calc(100vh-180px)] grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3.5">
            
            {/* Foto 1: Karimunjawa (Kiri Atas Besar) */}
            <motion.div whileHover={{ scale: 1.015 }} transition={{ duration: 0.4 }}
              className="col-span-2 row-span-2 rounded-2xl sm:rounded-3xl overflow-hidden relative group shadow-xl shadow-black/30 bg-[#12372A]">
              <Image
                src={photos[0].src}
                alt={photos[0].alt}
                fill
                sizes="(max-width: 1024px) 66vw, 34vw"
                loading="eager"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12372A]/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 bg-black/55 px-2.5 py-1.5 rounded-full z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ADBC9F] animate-pulse" />
                <span className="text-[11px] text-white font-medium">Karimunjawa</span>
              </div>
            </motion.div>

            {/* Foto 2: Kanan Atas DENGAN GAMBAR + Lencana 50+ Trips Completed */}
            <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.4 }}
              className="col-span-1 row-span-1 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-black/20 relative group bg-[#12372A]">
              <Image
                src={photos[1].src}
                alt={photos[1].alt}
                fill
                sizes="(max-width: 1024px) 33vw, 17vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 pointer-events-none" />
              
              <div className="absolute inset-0 p-2.5 sm:p-3.5 flex flex-col justify-between z-10">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#ADBC9F]" />
                </div>
                <div>
                  <p className="font-sora text-base sm:text-xl font-extrabold text-[#FBFADA] leading-none drop-shadow-md">50+</p>
                  <p className="text-[8.5px] sm:text-[10px] font-semibold text-white/90 mt-0.5 leading-tight drop-shadow">Trips Completed</p>
                </div>
              </div>
            </motion.div>

            {/* Foto 3: Temple & Eco Label (Kanan Tengah) */}
            <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.4 }}
              className="col-span-1 row-span-1 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-black/20 relative group bg-[#12372A]">
              <Image
                src={photos[2].src}
                alt={photos[2].alt}
                fill
                sizes="(max-width: 1024px) 33vw, 17vw"
                className="object-cover hover:scale-110 transition-transform duration-700"
              />
              
              <div className="absolute bottom-2 right-2 z-20">
                <div className="flex items-center gap-1 bg-[#1a4a35] border border-[#ADBC9F]/30 rounded-lg p-1 sm:p-1.5 shadow-md">
                  <Leaf className="w-2.5 h-2.5 text-[#ADBC9F]" />
                  <p className="text-[7.5px] font-bold text-[#FBFADA] leading-none tracking-wide uppercase">Eco-Certified</p>
                </div>
              </div>
            </motion.div>

            {/* Foto 4: Bromo (Bawah Lebar) + Lencana 3K+ */}
            <motion.div whileHover={{ scale: 1.015 }} transition={{ duration: 0.4 }}
              className="col-span-3 row-span-1 rounded-xl sm:rounded-2xl overflow-hidden relative group shadow-lg shadow-black/20 bg-[#12372A]">
              <Image
                src={photos[3].src}
                alt={photos[3].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#12372A]/70 via-[#12372A]/30 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 sm:bottom-3.5 sm:left-4 z-20 flex items-center gap-2.5 sm:gap-3 bg-[#0c251d]/95 border border-[#ADBC9F]/30 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-lg">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#ADBC9F]/20 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#ADBC9F]" />
                </div>
                <div>
                  <p className="font-sora text-sm sm:text-base font-extrabold text-[#FBFADA] leading-none">3K+</p>
                  <p className="text-[8px] sm:text-[9.5px] text-white/70 mt-0.5 font-medium leading-none">Travelers Healed</p>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>

      {/* Marquee ticker */}
      <div className="relative z-10 border-t border-white/10 bg-[#0c251d]/90 overflow-hidden py-3 mt-4 lg:mt-0 flex-shrink-0">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="flex items-center gap-4 px-6 text-[10px] font-semibold tracking-widest uppercase text-white/35">
              <span className="w-1 h-1 rounded-full bg-[#ADBC9F] inline-block flex-shrink-0" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}