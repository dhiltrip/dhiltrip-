import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { readingMinutes } from "@/data/articles";
import { focusStyle } from "@/data/focus";
import { ArticleContent } from "@/components/ArticleContent";
import { publishedArticle, publishedArticles } from "@/lib/server/articles";
import { ArticleList, AuthorAvatar, ShareArticle } from "@/components/ArticleList";
import { ArticleDate, ArticleHeader } from "@/components/ArticleBits";

// Pages are cached and refreshed when an admin saves (and at least every 10 minutes).
export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await publishedArticle(slug);
  if (!article) return { title: "Article not found | Dhil Trip Explorations" };
  return {
    title: `${article.title} | Dhil Trip Explorations`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      ...(article.cover ? { images: [article.cover] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await publishedArticle(slug);
  if (!article) notFound();
  // Lists only need the card details, not the full text.
  const more = (await publishedArticles())
    .filter((item) => item.id !== article.id)
    .slice(0, 3)
    .map((item) => ({ ...item, body: "" }));

  return (
    <div className="min-h-dvh bg-[#F3F4DC] text-[#12372A]">
      <ArticleHeader back="/articles" backLabel="Articles" />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <article>
          <h1 className="title-page text-pretty text-[1.875rem] leading-tight text-black lg:text-[2.25rem]">{article.title}</h1>
          <div className="mt-4 flex items-center gap-3">
            <AuthorAvatar size={40} />
            <div className="min-w-0 flex-1 text-sm leading-tight">
              <p translate="no" className="notranslate font-semibold">{article.author}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-[#436850]">
                <ArticleDate ms={article.publishedAt} />
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span translate="no" className="notranslate">{readingMinutes(article.body)}</span> min read
                </span>
              </p>
            </div>
            <ShareArticle article={{ id: article.id, title: article.title, excerpt: article.excerpt }} />
          </div>

          {article.cover && (
            <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-3xl bg-[#DDE5BE]">
              <Image src={article.cover} alt="" fill priority sizes="(min-width: 768px) 720px, 100vw" className="object-cover" style={focusStyle(article.coverFocus)} />
            </div>
          )}

          <div className="mt-6">
            <ArticleContent body={article.body} />
          </div>
        </article>

        <section className="mt-10 rounded-3xl bg-gradient-to-br from-[#8DB255] to-[#3F5F2A] p-6 text-center text-white shadow">
          <h2 className="title-card">Ready to explore Jogja the green way?</h2>
          <p className="mt-1 text-sm text-white/90">Choose a trip and join the Leave No Trace Challenge.</p>
          <Link href="/" className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-[#0D2A1F] px-6 font-fredoka text-lg font-semibold">
            See our trips
          </Link>
        </section>

        {more.length > 0 && (
          <section className="mt-10">
            <h2 className="title-section text-black">More articles</h2>
            <div className="mt-2 rounded-3xl bg-white px-4 shadow-sm">
              <ArticleList articles={more} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
