"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ZoomIn, ZoomOut } from "lucide-react";

/** Full-screen poster so the small print can be read; tap the poster to zoom in. */
export function PosterViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90" role="dialog" aria-modal="true" aria-label={alt}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <span className="flex items-center gap-1.5 text-sm">
          {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          {zoomed ? "Tap the poster to zoom out" : "Tap the poster to zoom in"}
        </span>
        <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto px-3 pb-6">
        <button
          onClick={() => setZoomed((value) => !value)}
          className="mx-auto block"
          style={{ width: zoomed ? "200%" : "100%", maxWidth: zoomed ? "none" : "480px" }}
        >
          <Image src={src} alt={alt} width={1000} height={1414} sizes="100vw" className="h-auto w-full rounded-xl" />
        </button>
      </div>
    </div>
  );
}
