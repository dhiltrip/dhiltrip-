"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Pixels per millisecond: about 30px a second, a gentle drift.
const SPEED = 0.03;
// After the visitor lets go, wait a moment before moving again.
const RESUME_AFTER_MS = 2500;

type Props = {
  label: string;
  items: { key: string; node: ReactNode }[];
};

/** A row that drifts slowly to the left; touching, holding, hovering or swiping pauses it. */
export function AutoScrollStrip({ label, items }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let position = track.scrollLeft;
    let paused = false;
    let frame = 0;
    let resumeTimer: number | undefined;
    let last = performance.now();

    const step = (now: number) => {
      const elapsed = Math.min(now - last, 64);
      last = now;
      if (!paused) {
        const loop = track.scrollWidth / 2;
        position += elapsed * SPEED;
        if (position >= loop) position -= loop;
        track.scrollLeft = position;
      }
      frame = requestAnimationFrame(step);
    };

    const pause = () => {
      paused = true;
      window.clearTimeout(resumeTimer);
    };
    const resumeLater = () => {
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        position = track.scrollLeft;
        paused = false;
      }, RESUME_AFTER_MS);
    };
    const onScroll = () => {
      if (!paused) return;
      // A manual swipe past the end continues seamlessly into the copy.
      const loop = track.scrollWidth / 2;
      if (track.scrollLeft >= loop) track.scrollLeft -= loop;
    };

    const pauseEvents = ["pointerdown", "touchstart", "mouseenter", "focusin", "wheel"] as const;
    const resumeEvents = ["pointerup", "pointercancel", "touchend", "mouseleave", "focusout", "wheel"] as const;
    pauseEvents.forEach((name) => track.addEventListener(name, pause, { passive: true }));
    resumeEvents.forEach((name) => track.addEventListener(name, resumeLater, { passive: true }));
    track.addEventListener("scroll", onScroll, { passive: true });
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resumeTimer);
      pauseEvents.forEach((name) => track.removeEventListener(name, pause));
      resumeEvents.forEach((name) => track.removeEventListener(name, resumeLater));
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      role="region"
      aria-label={label}
      className="-mx-5 mt-4 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => (
        <div key={item.key} className="shrink-0">{item.node}</div>
      ))}
      {/* A second copy lets the drift loop without a visible jump. */}
      {items.map((item) => (
        <div key={`${item.key}-copy`} className="shrink-0" aria-hidden="true">{item.node}</div>
      ))}
    </div>
  );
}
