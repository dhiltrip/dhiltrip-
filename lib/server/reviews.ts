import "server-only";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN } from "@/data/content";
import { HttpError } from "@/lib/server/session";

export function readRating(value: unknown) {
  const rating = Math.round(Number(value));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new HttpError(400, "Choose 1 to 5 stars.");
  return rating;
}

export function readReviewText(value: unknown) {
  const text = String(value ?? "").trim();
  if (text.length < REVIEW_TEXT_MIN) throw new HttpError(400, `Please write at least ${REVIEW_TEXT_MIN} characters.`);
  if (text.length > REVIEW_TEXT_MAX) throw new HttpError(400, `Please keep it under ${REVIEW_TEXT_MAX} characters.`);
  return text;
}

export const readLabel = (value: unknown) => String(value ?? "").trim().slice(0, 60);
