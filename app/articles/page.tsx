import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { publishedArticles } from "@/lib/server/articles";
import { ArticleList } from "@/components/ArticleList";
import { ArticleHeader } from "@/components/ArticleBits";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Articles | Dhil Trip Explorations",
  description: "Insights and tips for sustainable travel in Yogyakarta from the Dhil Trip team.",
};

export default async function ArticlesPage() {
  // Lists only need the card details, not the full text.
  const articles = (await publishedArticles()).map((item) => ({ ...item, body: "" }));
  return (
    <div className="min-h-dvh bg-[#F3F4DC] text-[#12372A]">
      <ArticleHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <h1 className="title-page text-black">Latest Articles</h1>
        <p className="mt-1 text-pretty text-[#436850]">Be the first to know the latest travel inspiration.</p>
        {articles.length === 0 ? (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-[#ADBC9F] px-5 py-12 text-center">
            <Newspaper className="mx-auto h-10 w-10 text-[#ADBC9F]" />
            <p className="mt-2 font-semibold">No articles yet. Check back soon!</p>
          </div>
        ) : (
          <div className="mt-4 rounded-3xl bg-white px-4 shadow-sm lg:px-6">
            <ArticleList articles={articles} />
          </div>
        )}
      </main>
    </div>
  );
}
