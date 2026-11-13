import type { Focus } from "@/data/focus";

/** An insight article written by an admin, shown under the FAQ on Home and on /articles. */
export type Article = {
  id: string;
  title: string;
  excerpt: string;
  /** Plain text with a few simple marks: "## Heading", "### Small heading", "- list item", **bold**. */
  body: string;
  cover: string | null;
  /** Which part of the cover to keep in view when it is cropped. */
  coverFocus: Focus | null;
  author: string;
  published: boolean;
  /** Milliseconds; set the first time the article is published. */
  publishedAt: number | null;
  updatedAt: number | null;
};

export const ARTICLE_AUTHOR = "DhilTrip Team";
export const ARTICLE_BODY_MAX = 20000;

/** First sentences of the body, without the formatting marks, for cards and link previews. */
export function excerptOf(body: string, max = 180) {
  const plain = body
    .split("\n")
    .filter((line) => !/^#{2,3}\s/.test(line.trim()))
    .join(" ")
    .replace(/^\s*-\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max).replace(/\s+\S*$/, "")}…` : plain;
}

export type Block =
  | { kind: "h2" | "h3" | "p"; text: string }
  | { kind: "list"; items: string[] };

/** Splits the body into headings, paragraphs and lists. Text is rendered as text, never as HTML. */
export function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "p", text: paragraph.join(" ") });
    if (list.length) blocks.push({ kind: "list", items: list });
    paragraph = [];
    list = [];
  };
  for (const raw of body.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (line.startsWith("### ")) {
      flush();
      blocks.push({ kind: "h3", text: line.slice(4) });
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push({ kind: "h2", text: line.slice(3) });
    } else if (/^[-•*]\s+/.test(line)) {
      if (paragraph.length) {
        blocks.push({ kind: "p", text: paragraph.join(" ") });
        paragraph = [];
      }
      list.push(line.replace(/^[-•*]\s+/, ""));
    } else {
      if (list.length) {
        blocks.push({ kind: "list", items: list });
        list = [];
      }
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

/** "**bold**" pieces of a line, for rendering as <strong>. */
export const boldParts = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part) =>
    part.startsWith("**") && part.endsWith("**") ? { bold: true, text: part.slice(2, -2) } : { bold: false, text: part },
  );

/** Reading time in minutes, at about 200 words a minute. */
export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));

const LOCALES: Record<string, string> = { id: "id-ID", jw: "id-ID", su: "id-ID", ko: "ko-KR", ja: "ja-JP", "zh-CN": "zh-CN", "zh-TW": "zh-TW" };

/** "21 Okt 2026" in Indonesian, "21 Oct 2026" in English, and so on. */
export function articleDate(ms: number | null, language = "en") {
  if (!ms) return "";
  try {
    return new Date(ms).toLocaleDateString(LOCALES[language] ?? (language === "en" ? "en-GB" : language), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
}
