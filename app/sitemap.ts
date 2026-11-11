import type { MetadataRoute } from "next";
import { publishedArticles } from "@/lib/server/articles";

const BASE = "https://www.dhiltrip.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await publishedArticles();
  return [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/about`, priority: 0.9 },
    { url: `${BASE}/articles`, priority: 0.8 },
    ...articles.map((article) => ({
      url: `${BASE}/articles/${article.id}`,
      lastModified: new Date(article.updatedAt ?? article.publishedAt ?? Date.now()),
      priority: 0.7,
    })),
    { url: `${BASE}/legal`, priority: 0.2 },
  ];
}
