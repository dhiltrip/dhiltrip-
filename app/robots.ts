import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/map", "/scan", "/rewards", "/profile", "/leader", "/studio"],
    },
    sitemap: "https://www.dhiltrip.com/sitemap.xml",
  };
}
