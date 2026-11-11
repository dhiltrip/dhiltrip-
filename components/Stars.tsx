import { Star } from "lucide-react";

/** Read-only star rating, e.g. 4 of 5 filled. */
export function Stars({ value, size = "h-4 w-4", tone = "fill-amber-300 text-amber-300" }: { value: number; size?: string; tone?: string }) {
  const full = Math.round(value);
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${full} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${size} ${star <= full ? tone : "fill-transparent text-current opacity-35"}`} />
      ))}
    </span>
  );
}

/** Tap a star to choose 1 to 5. */
export function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90"
        >
          <Star className={`h-8 w-8 ${star <= value ? "fill-amber-400 text-amber-400" : "text-[#ADBC9F]"}`} />
        </button>
      ))}
    </div>
  );
}
