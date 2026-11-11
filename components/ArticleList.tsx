"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Newspaper, Share2 } from "lucide-react";
import { articleDate, type Article } from "@/data/articles";
import { focusStyle } from "@/data/focus";
import { useSiteLanguage } from "@/lib/currency";

/** Opens the phone's share sheet, or copies the link where that isn't available. */
export function ShareArticle({ article, className = "" }: { article: Pick<Article, "id" | "title" | "excerpt">; className?: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/articles/${article.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, text: article.excerpt, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Closing the share sheet is not an error.
    }
  };
  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label={copied ? "Link copied" : "Share this article"}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-[#436850] hover:bg-black/5 ${className}`}
    >
      {copied ? <Check className="h-5 w-5 text-[#03603F]" /> : <Share2 className="h-5 w-5" />}
    </button>
  );
}

/** Small round logo used as the author picture. */
export function AuthorAvatar({ size = 36 }: { size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0D2A1F]" style={{ width: size, height: size }}>
      <Image src="/challenge/logo.webp" alt="" width={778} height={319} className="w-[86%] object-contain" />
    </span>
  );
}

function ArticleRow({ article, language }: { article: Article; language: string }) {
  const href = `/articles/${article.id}`;
  return (
    <li className="flex gap-4 border-b border-[#12372A]/10 py-4 last:border-b-0">
      <Link href={href} className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-3 text-pretty text-[15px] font-semibold leading-snug text-black">{article.title}</h3>
        <div className="mt-auto flex items-center gap-2.5 pt-3">
          <AuthorAvatar />
          <span className="min-w-0 text-xs leading-tight text-[#436850]">
            <span translate="no" className="notranslate block truncate">{article.author}</span>
            <span className="block">{articleDate(article.publishedAt, language)}</span>
          </span>
        </div>
      </Link>
      <div className="flex w-[40%] max-w-[13rem] shrink-0 flex-col items-end">
        {/* Same link as the title; hidden from screen readers so it isn't announced twice. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="relative block aspect-[5/3] w-full overflow-hidden rounded-xl bg-[#DDE5BE]">
          {article.cover ? (
            <Image src={article.cover} alt="" fill sizes="(min-width: 1024px) 208px, 40vw" className="object-cover" style={focusStyle(article.coverFocus)} />
          ) : (
            <span className="flex h-full items-center justify-center text-[#8DB255]">
              <Newspaper className="h-8 w-8" />
            </span>
          )}
        </Link>
        <ShareArticle article={article} className="-mr-2 mt-1" />
      </div>
    </li>
  );
}

/** List of article rows: title and author on the left, picture on the right, share button below it. */
export function ArticleList({ articles }: { articles: Article[] }) {
  const language = useSiteLanguage();
  return (
    <ul>
      {articles.map((article) => (
        <ArticleRow key={article.id} article={article} language={language} />
      ))}
    </ul>
  );
}
