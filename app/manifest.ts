import type { MetadataRoute } from "next";

/** Lets phones add the site to the home screen with the DhilTrip icon and colors. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DhilTrip Explorations",
    short_name: "DhilTrip",
    description: "Explore Jogja and join the Leave No Trace Challenge.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F4DC",
    theme_color: "#0D2A1F",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
