"use client";

import { useRef, type PointerEvent } from "react";
import { Crosshair, RotateCcw, ZoomIn } from "lucide-react";
import { CENTER, MAX_ZOOM, focusStyle, type Focus } from "@/data/focus";

export type FocusShape = { label: string; aspect: string; width: string };

/**
 * Tap (or drag) on the photo to mark its most important part, and zoom in if needed.
 * The previews use the exact shapes the photo is shown in on the site.
 */
export function FocusPicker({
  src,
  focus,
  onChange,
  shapes,
}: {
  src: string;
  focus: Focus | null;
  onChange: (focus: Focus) => void;
  shapes: FocusShape[];
}) {
  const value = focus ?? CENTER;
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const place = (event: PointerEvent<HTMLDivElement>) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    onChange({ ...value, x: Math.round(Math.min(100, Math.max(0, x))), y: Math.round(Math.min(100, Math.max(0, y))) });
  };

  return (
    <div className="@container space-y-3 rounded-2xl bg-[#F3F4DC] p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <Crosshair className="h-4 w-4 text-[#03603F]" />
        Tap the most important part of the photo
      </p>
      <div className="grid gap-3 @md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @md:items-start">
        {/* The whole photo, so the admin can see what is being cropped away. */}
        <div
          ref={boxRef}
          role="slider"
          tabIndex={0}
          aria-label="Focus point"
          aria-valuenow={Math.round(value.x)}
          aria-valuetext={`${Math.round(value.x)}% across, ${Math.round(value.y)}% down`}
          onPointerDown={(event) => {
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            place(event);
          }}
          onPointerMove={(event) => dragging.current && place(event)}
          onPointerUp={() => (dragging.current = false)}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 10 : 2;
            const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
            const move = moves[event.key];
            if (!move) return;
            event.preventDefault();
            onChange({ ...value, x: Math.min(100, Math.max(0, value.x + move[0])), y: Math.min(100, Math.max(0, value.y + move[1])) });
          }}
          className="relative w-full cursor-crosshair touch-none select-none overflow-hidden rounded-xl bg-black/5 outline-none ring-[#03603F] focus-visible:ring-2"
        >
          {/* The full photo; a data URL or a stored image, so a plain img is used. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} className="block h-auto max-h-80 w-full object-contain" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#03603F]/40 shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
            style={{ left: `${value.x}%`, top: `${value.y}%` }}
          >
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#436850]">How it will look</p>
          <div className="flex flex-wrap items-end gap-3">
            {shapes.map((shape) => (
              <figure key={shape.label} style={{ width: shape.width }} className="min-w-0">
                <div className="relative overflow-hidden rounded-xl bg-[#DDE5BE] ring-1 ring-[#ADBC9F]" style={{ aspectRatio: shape.aspect }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={focusStyle(value)} />
                </div>
                <figcaption className="mt-1 text-[11px] leading-tight text-[#436850]">{shape.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ZoomIn className="h-4 w-4 shrink-0 text-[#436850]" />
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.05}
          value={value.zoom}
          onChange={(event) => onChange({ ...value, zoom: Number(event.target.value) })}
          aria-label="Zoom"
          className="min-w-0 flex-1 accent-[#03603F]"
        />
        <span translate="no" className="notranslate w-10 text-right text-xs font-semibold">{value.zoom.toFixed(1)}×</span>
        <button
          type="button"
          onClick={() => onChange(CENTER)}
          className="flex min-h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-[#436850] hover:bg-black/5"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}
