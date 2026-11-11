import type { Focus } from "@/data/focus";
import { jogjaPhotos, testimonials } from "@/data/site";

/** A photo in the "Memories from Jogja" strip on Home. */
export type Memory = {
  id: string;
  src: string;
  caption: string;
  order: number;
  hidden?: boolean;
  /** Which part of the photo to keep in view when it is cropped. */
  focus?: Focus | null;
};

export type ReviewStatus = "published" | "pending" | "hidden";

/** A rating and testimonial. Admins add them, travelers can send one after joining a trip. */
export type Review = {
  id: string;
  name: string;
  /** Short line under the name, e.g. "Teacher" or "From Seoul". */
  label: string;
  rating: number;
  text: string;
  packageId: string | null;
  status: ReviewStatus;
  source: "admin" | "traveler";
  uid?: string | null;
  createdAt?: number;
};

export const REVIEW_TEXT_MIN = 10;
export const REVIEW_TEXT_MAX = 600;

/** What Home showed before this moved to the database; copied in once. */
export const builtInMemories: Memory[] = jogjaPhotos.map((photo, index) => ({
  id: `jogja-${index + 1}`,
  src: photo.src,
  caption: photo.alt,
  order: index,
}));

export const builtInReviews: Review[] = testimonials.map((item, index) => ({
  id: `classic-${index + 1}`,
  name: item.name,
  label: item.role,
  rating: 5,
  text: item.text,
  packageId: null,
  status: "published",
  source: "admin",
  createdAt: index,
}));

export const averageRating = (reviews: Pick<Review, "rating">[]) =>
  reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
