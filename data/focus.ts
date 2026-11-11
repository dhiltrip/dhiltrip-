import type { CSSProperties } from "react";

/**
 * Where the important part of a photo is (x and y in percent, 50/50 = centre) and how far to zoom in.
 * Every place that crops the photo keeps this point in view, whatever its shape.
 */
export type Focus = { x: number; y: number; zoom: number };

export const CENTER: Focus = { x: 50, y: 50, zoom: 1 };
export const MAX_ZOOM = 2.5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Accepts anything and returns a valid focus, or null when there is none. */
export function readFocus(value: unknown): Focus | null {
  if (!value || typeof value !== "object") return null;
  const { x, y, zoom } = value as Record<string, unknown>;
  const nx = Number(x);
  const ny = Number(y);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return null;
  const nz = Number(zoom);
  return {
    x: Math.round(clamp(nx, 0, 100) * 10) / 10,
    y: Math.round(clamp(ny, 0, 100) * 10) / 10,
    zoom: Math.round(clamp(Number.isFinite(nz) ? nz : 1, 1, MAX_ZOOM) * 100) / 100,
  };
}

/** Style for an <img>/<Image> with object-cover inside an overflow-hidden box. */
export function focusStyle(focus: Focus | null | undefined): CSSProperties | undefined {
  if (!focus) return undefined;
  const origin = `${focus.x}% ${focus.y}%`;
  return focus.zoom > 1
    ? { objectPosition: origin, transform: `scale(${focus.zoom})`, transformOrigin: origin }
    : { objectPosition: origin };
}
