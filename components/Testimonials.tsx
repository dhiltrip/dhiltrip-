"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { client } from '@/sanity/lib/client'

type Testimonial = {
  _id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
};

const testimonialsQuery = `*[_type == "testimonial"] | order(_createdAt asc) {
  _id,
  name,
  role,
  text,
  rating
}`

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchTestimonials() {
      try {
        const data = await client.fetch<Testimonial[]>(testimonialsQuery);
        if (!cancelled) setTestimonials(data ?? []);
      } catch (err) {
        console.error('Failed to fetch testimonials:', err);
        if (!cancelled) setError('Unable to load testimonials right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTestimonials();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (currentIndex >= testimonials.length) setCurrentIndex(0);
  }, [testimonials.length, currentIndex]);

  useEffect(() => {
    if (isPaused || testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, testimonials.length]);

  if (loading) {
    return (
      <section id="testimonials" className="py-24 bg-background">
        <p className="text-center text-muted-foreground">Loading testimonials…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section id="testimonials" className="py-24 bg-background">
        <p className="text-center text-red-600">{error}</p>
      </section>
    );
  }

  if (!testimonials.length) return null;

  const current = testimonials[currentIndex];
  if (!current) return null;

  return (
    <section id="testimonials" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-sora font-bold text-foreground mb-4"
          >
            What Our Travelers Say
          </motion.h2>
        </div>

        <div
          className="relative w-full mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current._id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full flex flex-col items-center text-center bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl border border-border/50 min-h-[380px] sm:min-h-[320px]"
            >
              <Quote className="w-10 h-10 text-accent mb-3 opacity-30" />

              <div className="flex gap-1 mb-4">
                {[...Array(Math.min(5, current.rating))].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-lg sm:text-xl md:text-2xl font-medium text-foreground leading-relaxed mb-6 flex-grow flex items-center justify-center">
                "{current.text}"
              </p>
              <div className="mt-auto">
                <p className="font-bold font-sora text-lg text-primary">{current.name}</p>
                <p className="text-sm text-muted-foreground">{current.role}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-3 mt-8">
          {testimonials.map((t, idx) => (
            <button
              key={t._id}
              onClick={() => {
                setCurrentIndex(idx);
                setIsPaused(true);
                setTimeout(() => setIsPaused(false), 10000);
              }}
              className={`transition-all duration-300 rounded-full h-2 ${
                idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-primary/20 hover:bg-primary/40"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}