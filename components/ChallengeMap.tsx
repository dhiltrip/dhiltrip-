"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import type { Stop } from "@/data/challenge";

function pin(number: number, name: string, active: boolean, visited: boolean) {
  const root = document.createElement("div");
  root.className = "notranslate flex w-max -translate-x-1/2 flex-col items-center";
  root.setAttribute("translate", "no");
  const label = document.createElement("span");
  label.className = `rounded-lg px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-white shadow ${active ? "bg-[#03603F]" : "bg-[#0D2A1F]"}`;
  label.textContent = name;
  const dot = document.createElement("span");
  dot.className = `mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white text-[11px] font-bold shadow ${
    visited ? "bg-[#8DB255] text-[#0D2A1F]" : active ? "bg-[#03603F] text-white" : "bg-[#1AA7D8] text-white"
  }`;
  dot.textContent = visited ? "✓" : String(number);
  root.append(label, dot);
  return root;
}

type Props = {
  stops: Stop[];
  activeId: string | null;
  visitedIds: string[];
  onSelect: (id: string) => void;
};

type MarkerLike = { setIcon: (icon: unknown) => void };

/** Shows the places of the chosen package only; nothing here reads the visitor's location. */
export function ChallengeMap({ stops, activeId, visitedIds, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, MarkerLike>>(new Map());
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const onSelectRef = useRef(onSelect);
  // Pins can only be repainted once Leaflet has finished loading.
  const readyRef = useRef(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let disposed = false;
    const markers = markersRef.current;

    import("leaflet").then((module) => {
      const L = module.default;
      if (disposed || !containerRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      stops.forEach((stop, index) => {
        const marker = L.marker([stop.lat, stop.lng], {
          icon: L.divIcon({ html: pin(index + 1, stop.name, false, false), className: "", iconSize: [0, 0], iconAnchor: [0, 44] }),
          title: stop.name,
          alt: stop.name,
        }).addTo(map);
        marker.on("click", () => onSelectRef.current(stop.id));
        markers.set(stop.id, marker as unknown as MarkerLike);
      });
      map.fitBounds(L.latLngBounds(stops.map((stop) => [stop.lat, stop.lng])), { padding: [48, 48], maxZoom: 16 });
      readyRef.current = true;
    });

    return () => {
      disposed = true;
      readyRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, [stops]);

  // Repaint the pins whenever the selection or the ticked places change.
  useEffect(() => {
    const paint = () => {
      const L = leafletRef.current;
      if (!L) return;
      stops.forEach((stop, index) => {
        markersRef.current.get(stop.id)?.setIcon(
          L.divIcon({
            html: pin(index + 1, stop.name, stop.id === activeId, visitedIds.includes(stop.id)),
            className: "",
            iconSize: [0, 0],
            iconAnchor: [0, 44],
          }),
        );
      });
    };
    const map = mapRef.current;
    if (map && readyRef.current) paint();
    else {
      const timer = window.setInterval(() => {
        if (mapRef.current && readyRef.current) {
          window.clearInterval(timer);
          paint();
        }
      }, 100);
      return () => window.clearInterval(timer);
    }
  }, [activeId, visitedIds, stops]);

  useEffect(() => {
    const map = mapRef.current;
    const active = stops.find((stop) => stop.id === activeId);
    if (map && active) map.flyTo([active.lat, active.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [activeId, stops]);

  return <div ref={containerRef} className="relative z-0 h-72 w-full overflow-hidden rounded-2xl lg:h-[30rem]" />;
}
