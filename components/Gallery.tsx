"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { client } from "@/sanity/lib/client";

type galleryPhoto = {
  _id: string;
  alt: string;
  image: string;
};

const galleryQuery = `*[_type == "gallery"] | order(_createdAt asc) {
  _id,
  alt,
  "image": image.asset->url
}`;

export function Gallery() {
  const [photos, setPhotos] = useState<galleryPhoto[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPhotos() {
      try {
        const data = await client.fetch<galleryPhoto[]>(galleryQuery);
        const cleaned = (data ?? []).filter((p) => p.image);

        if (!cancelled) {
          setPhotos(cleaned);
          setSelectedIndex(null);
        }
      } catch (err) {
        console.error("Failed to fetch gallery:", err);
        if (!cancelled) {
          setError("Unable to load the gallery. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPhotos();

    return () => {
      cancelled = true;
    };
  }, []);

  const close = useCallback(() => setSelectedIndex(null), []);

  useEffect(() => {
    if (selectedIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") {
        setSelectedIndex((i) =>
          i === null ? i : (i + 1) % photos.length
        );
      }
      if (e.key === "ArrowLeft") {
        setSelectedIndex((i) =>
          i === null ? i : (i - 1 + photos.length) % photos.length
        );
      }
    };

    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedIndex, photos.length, close]);

  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= photos.length) {
      setSelectedIndex(photos.length ? 0 : null);
    }
  }, [photos.length, selectedIndex]);

  const selected = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <section id="gallery" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-sora font-bold text-foreground mb-4"
          >
            Memories We've Created
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Glimpses of healing, connection, and nature from our past journeys.
          </motion.p>
        </div>

        {/* States — mirroring Packages */}
        {loading && (
          <p className="text-center text-muted-foreground">
            Loading gallery…
          </p>
        )}

        {error && (
          <p className="text-center text-red-600">{error}</p>
        )}

        {!loading && !error && photos.length === 0 && (
          <p className="text-center text-muted-foreground">
            No gallery photos available yet.
          </p>
        )}

        {!loading && !error && photos.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {photos.map((photo, idx) => (
              <motion.div
                key={photo._id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 3) * 0.1 }}
                className="relative group overflow-hidden rounded-2xl cursor-pointer break-inside-avoid shadow-sm hover:shadow-xl transition-all"
                onClick={() => setSelectedIndex(idx)}
              >
                <Image
                  src={photo.image}
                  alt={photo.alt || `Gallery photo ${idx + 1}`}
                  width={1200}
                  height={900}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <ZoomIn className="w-10 h-10 text-white scale-50 group-hover:scale-100 transition-transform duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={selected.alt}
          >
            <button
              className="absolute top-6 right-6 z-10 text-white/70 hover:text-white transition-colors"
              onClick={close}
              aria-label="Close"
            >
              <X className="w-8 h-8" />
            </button>

            <motion.div
              key={selected._id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selected.image}
                alt={selected.alt || "Gallery preview"}
                fill
                sizes="90vw"
                className="object-contain rounded-lg"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}