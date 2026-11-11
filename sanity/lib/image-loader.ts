import type { ImageLoaderProps } from "next/image";

/** Lets Sanity's CDN resize the photo so it never goes through the Next.js optimizer. */
export const sanityImageLoader = ({ src, width, quality }: ImageLoaderProps) =>
  `${src}?w=${width}&q=${quality ?? 75}&auto=format&fit=max`;
