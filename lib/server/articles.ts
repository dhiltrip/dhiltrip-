import "server-only";
import type { Timestamp } from "firebase-admin/firestore";
import { ARTICLE_AUTHOR, type Article } from "@/data/articles";
import { readFocus } from "@/data/focus";
import { adminDb } from "@/lib/server/firebase-admin";

const millis = (value: unknown) => (value as Timestamp | null | undefined)?.toMillis?.() ?? null;

export function toArticle(id: string, data: Record<string, unknown>): Article {
  return {
    id,
    title: String(data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    body: String(data.body ?? ""),
    cover: (data.cover as string | null) ?? null,
    coverFocus: readFocus(data.coverFocus),
    author: String(data.author ?? ARTICLE_AUTHOR),
    published: data.published === true,
    publishedAt: millis(data.publishedAt),
    updatedAt: millis(data.updatedAt),
  };
}

/** Published articles, newest first. Returns [] if Firebase isn't set up, so pages still render. */
export async function publishedArticles(): Promise<Article[]> {
  try {
    const snap = await adminDb().collection("articles").where("published", "==", true).get();
    return snap.docs.map((doc) => toArticle(doc.id, doc.data())).sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  } catch {
    return [];
  }
}

/** One published article, or null (drafts are never shown to visitors). */
export async function publishedArticle(slug: string): Promise<Article | null> {
  try {
    const snap = await adminDb().collection("articles").doc(slug).get();
    if (!snap.exists) return null;
    const article = toArticle(snap.id, snap.data() ?? {});
    return article.published ? article : null;
  } catch {
    return null;
  }
}
