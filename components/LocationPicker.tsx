"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";

const JOGJA: [number, number] = [-7.7956, 110.3695];

/** A teardrop pin whose tip sits on the chosen point. */
function pinElement() {
  const root = document.createElement("div");
  root.style.transform = "translate(-50%, -100%)";
  root.style.width = "28px";
  root.style.paddingBottom = "4px";
  const drop = document.createElement("span");
  drop.style.cssText =
    "display:block;width:28px;height:28px;border-radius:50% 50% 0 50%;transform:rotate(45deg);background:#03603F;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)";
  root.append(drop);
  return root;
}

/** Tap the map (or paste coordinates from Google Maps) to set where a place is. */
export function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const onChangeRef = useRef(onChange);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const placeMarker = (L: typeof import("leaflet"), map: LeafletMap, at: [number, number]) => {
    if (markerRef.current) markerRef.current.setLatLng(at);
    else {
      markerRef.current = L.marker(at, {
        icon: L.divIcon({ html: pinElement(), className: "", iconSize: [0, 0] }),
        keyboard: false,
      }).addTo(map);
    }
  };

  useEffect(() => {
    let disposed = false;
    import("leaflet").then((module) => {
      const L = module.default;
      if (disposed || !containerRef.current) return;
      leafletRef.current = L;
      const start: [number, number] = lat !== null && lng !== null ? [lat, lng] : JOGJA;
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(start, lat !== null ? 15 : 12);
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      if (lat !== null && lng !== null) placeMarker(L, map, [lat, lng]);
      map.on("click", (event) => {
        placeMarker(L, map, [event.latlng.lat, event.latlng.lng]);
        onChangeRef.current(event.latlng.lat, event.latlng.lng);
      });
    });
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // The map is created once; later changes come from clicks or the paste box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPaste = () => {
    const match = /(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)/.exec(paste);
    const nextLat = match ? Number(match[1]) : NaN;
    const nextLng = match ? Number(match[2]) : NaN;
    if (!match || Math.abs(nextLat) > 90 || Math.abs(nextLng) > 180) {
      setPasteError(true);
      return;
    }
    setPasteError(false);
    setPaste("");
    const L = leafletRef.current;
    const map = mapRef.current;
    if (L && map) {
      placeMarker(L, map, [nextLat, nextLng]);
      map.setView([nextLat, nextLng], 16);
    }
    onChange(nextLat, nextLng);
  };

  return (
    <div className="space-y-2">
      {/* isolate keeps Leaflet's own layers (z-index 400+) from covering the save bar. */}
      <div ref={containerRef} className="relative isolate z-0 h-56 w-full overflow-hidden rounded-2xl bg-[#DDE5BE] ring-1 ring-[#ADBC9F]" />
      <p key={lat !== null ? "set" : "unset"} className="text-xs text-[#436850]">
        {lat !== null && lng !== null ? (
          <>
            Pin set at{" "}
            <span translate="no" className="notranslate font-mono">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
            <span className="block">Tap the map to move it.</span>
          </>
        ) : (
          "Tap the map where this place is."
        )}
      </p>
      <div className="flex gap-2">
        <input
          value={paste}
          onChange={(event) => {
            setPaste(event.target.value);
            setPasteError(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyPaste();
            }
          }}
          placeholder="Or paste coordinates, e.g. -7.7829, 110.3691"
          aria-label="Paste coordinates"
          className="min-w-0 flex-1 rounded-xl border border-[#ADBC9F] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8DB255]"
        />
        <button
          type="button"
          onClick={applyPaste}
          disabled={!paste.trim()}
          className="shrink-0 rounded-xl bg-[#0D2A1F] px-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Set
        </button>
      </div>
      {pasteError && <p className="text-xs font-semibold text-[#A33A12]">Could not read those coordinates.</p>}
    </div>
  );
}
