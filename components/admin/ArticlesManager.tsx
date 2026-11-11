"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Bold,
  ExternalLink,
  Eye,
  Heading2,
  ImagePlus,
  List,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { ARTICLE_BODY_MAX, articleDate, excerptOf, type Article } from "@/data/articles";
import { callApi } from "@/lib/firebase/client";
import { shrinkPhoto } from "@/lib/shrink-photo";
import { ArticleContent } from "@/components/ArticleContent";
import { FocusPicker } from "@/components/admin/FocusPicker";
import { focusStyle, type Focus } from "@/data/focus";

const field =
  "mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]";

type Draft = {
  id?: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string | null;
  coverData: string | null;
  removeCover: boolean;
  coverFocus: Focus | null;
  published: boolean;
};

const emptyDraft: Draft = { title: "", excerpt: "", body: "", cover: null, coverData: null, removeCover: false, coverFocus: null, published: false };

const draftFrom = (article: Article): Draft => ({
  id: article.id,
  title: article.title,
  excerpt: article.excerpt,
  body: article.body,
  cover: article.cover,
  coverData: null,
  removeCover: false,
  coverFocus: article.coverFocus,
  published: article.published,
});

function Editor({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const cover = draft.coverData ?? (draft.removeCover ? null : draft.cover);

  const pickCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const data = await shrinkPhoto(file);
      // A new photo starts centred again.
      setDraft((current) => ({ ...current, coverData: data, removeCover: false, coverFocus: null }));
    } catch {
      setError("This photo could not be used. Please try another one.");
    }
  };

  /** Adds a formatting mark at the start of the current line, or around the selected words. */
  const format = (kind: "h2" | "list" | "bold") => {
    const area = bodyRef.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end, value } = area;
    let next: string;
    let cursor: number;
    if (kind === "bold") {
      const picked = value.slice(start, end) || "bold text";
      next = `${value.slice(0, start)}**${picked}**${value.slice(end)}`;
      cursor = start + picked.length + 4;
    } else {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const mark = kind === "h2" ? "## " : "- ";
      next = `${value.slice(0, lineStart)}${mark}${value.slice(lineStart)}`;
      cursor = end + mark.length;
    }
    set("body", next);
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(cursor, cursor);
    });
  };

  const save = async (publish: boolean) => {
    setBusy(publish ? "publish" : "draft");
    setError(null);
    const result = await callApi<{ id: string }>("/api/admin/articles", {
      id: draft.id,
      title: draft.title,
      excerpt: draft.excerpt,
      body: draft.body,
      coverData: draft.coverData,
      removeCover: draft.removeCover,
      coverFocus: draft.coverFocus,
      published: publish,
    });
    setBusy(null);
    if (result.ok) onDone();
    else setError(result.message);
  };

  const tool = "flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold hover:bg-[#DDE5BE]";

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onDone} aria-label="Back to articles" className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="title-section min-w-0 flex-1 text-black">{draft.id ? "Edit article" : "New article"}</h2>
        <button
          type="button"
          onClick={() => setPreview((value) => !value)}
          aria-pressed={preview}
          className="flex min-h-10 items-center gap-1.5 rounded-full border border-[#12372A]/30 bg-white px-3 text-sm font-semibold"
        >
          {preview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span key={preview ? "write" : "preview"}>{preview ? "Write" : "Preview"}</span>
        </button>
      </div>

      {preview ? (
        <article className="rounded-3xl bg-[#F3F4DC] p-5 ring-1 ring-[#ADBC9F]">
          <h1 className="title-page text-pretty text-black">{draft.title || "Untitled"}</h1>
          {cover && (
            <div className="mt-4 aspect-[16/9] overflow-hidden rounded-2xl">
              {/* Data URLs from the file picker can't go through the image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" className="h-full w-full object-cover" style={focusStyle(draft.coverFocus)} />
            </div>
          )}
          <div className="mt-4">
            <ArticleContent body={draft.body || "Nothing written yet."} />
          </div>
        </article>
      ) : (
        <div className="space-y-4 rounded-3xl bg-white p-5 shadow">
          <label className="block text-sm font-semibold">
            Title
            <input
              required
              maxLength={140}
              value={draft.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="e.g. 5 Ways to Travel Jogja Without Plastic"
              className={field}
            />
          </label>

          <div>
            <p className="text-sm font-semibold">Cover photo (optional)</p>
            <div className="mt-1.5 flex items-center gap-3">
              <label className="relative flex aspect-[16/9] w-40 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-[#F3F4DC] text-[#436850] ring-1 ring-[#ADBC9F]">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="Cover preview" className="h-full w-full object-cover" style={focusStyle(draft.coverFocus)} />
                ) : (
                  <ImagePlus className="h-7 w-7" />
                )}
                <input type="file" accept="image/*" onChange={(event) => void pickCover(event)} className="sr-only" />
              </label>
              <div className="min-w-0 text-xs text-[#436850]">
                <p className="text-pretty">Tap to choose. A wide photo works best.</p>
                {cover && (
                  <button
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, coverData: null, removeCover: true }))}
                    className="mt-2 flex items-center gap-1 font-semibold text-[#A33A12]"
                  >
                    <X className="h-3.5 w-3.5" /> Remove photo
                  </button>
                )}
              </div>
            </div>
            {cover && (
              <div className="mt-3">
                <FocusPicker
                  src={cover}
                  focus={draft.coverFocus}
                  onChange={(focus) => set("coverFocus", focus)}
                  shapes={[
                    { label: "Card on Home", aspect: "5 / 3", width: "8.5rem" },
                    { label: "Top of the article", aspect: "16 / 9", width: "11rem" },
                  ]}
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-end justify-between gap-2">
              <label htmlFor="article-body" className="text-sm font-semibold">Article</label>
              <div className="flex gap-1" role="toolbar" aria-label="Formatting">
                <button type="button" onClick={() => format("h2")} className={tool} aria-label="Heading">
                  <Heading2 className="h-4 w-4" /> Heading
                </button>
                <button type="button" onClick={() => format("list")} className={tool} aria-label="List">
                  <List className="h-4 w-4" /> List
                </button>
                <button type="button" onClick={() => format("bold")} className={tool} aria-label="Bold">
                  <Bold className="h-4 w-4" />
                </button>
              </div>
            </div>
            <textarea
              id="article-body"
              ref={bodyRef}
              rows={14}
              maxLength={ARTICLE_BODY_MAX}
              value={draft.body}
              onChange={(event) => set("body", event.target.value)}
              placeholder={"Write the article here.\n\nLeave an empty line between paragraphs.\n## A heading\n- A list item\n**Bold words**"}
              className={`${field} resize-y font-inter leading-relaxed`}
            />
            <p className="mt-1 text-pretty text-xs text-[#436850]">
              Empty line = new paragraph. <span translate="no" className="notranslate font-mono">## </span>heading,{" "}
              <span translate="no" className="notranslate font-mono">- </span>list item,{" "}
              <span translate="no" className="notranslate font-mono">**…**</span> bold. Use Preview to check.
            </p>
          </div>

          <label className="block text-sm font-semibold">
            Short summary (optional)
            <textarea
              rows={2}
              maxLength={240}
              value={draft.excerpt}
              onChange={(event) => set("excerpt", event.target.value)}
              placeholder={draft.body ? excerptOf(draft.body) : "Shown when the article is shared. Empty: the first lines are used."}
              className={`${field} resize-y`}
            />
          </label>
        </div>
      )}

      <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 space-y-2 rounded-3xl bg-[#0D2A1F] p-3 shadow-lg lg:bottom-4">
        {error && <p role="alert" className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#A33A12]">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void save(false)}
            disabled={busy !== null}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/30 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === "draft" && <Loader2 className="h-4 w-4 animate-spin" />}
            {draft.published ? "Unpublish (draft)" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => void save(true)}
            disabled={busy !== null}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#8DB255] font-fredoka text-lg font-semibold text-[#0D2A1F] disabled:opacity-60"
          >
            {busy === "publish" && <Loader2 className="h-5 w-5 animate-spin" />}
            {draft.published ? "Save & keep live" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArticleRow({ article, onEdit, onChanged, onError }: { article: Article; onEdit: () => void; onChanged: () => void; onError: (message: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    setBusy(true);
    const result = await callApi("/api/admin/articles", { id: article.id }, "DELETE");
    setBusy(false);
    if (result.ok) onChanged();
    else onError(result.message);
  };

  return (
    <li className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-[#ADBC9F]/60">
      <div className="flex gap-3">
        <div className="relative aspect-[5/3] w-28 shrink-0 overflow-hidden rounded-xl bg-[#DDE5BE]">
          {article.cover ? (
            <Image src={article.cover} alt="" fill sizes="112px" className="object-cover" style={focusStyle(article.coverFocus)} />
          ) : (
            <span className="flex h-full items-center justify-center text-[#8DB255]">
              <Newspaper className="h-6 w-6" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{article.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            <span
              key={article.published ? "live" : "draft"}
              className={`rounded-full px-2 py-0.5 ${article.published ? "bg-[#DDE5BE] text-[#03603F]" : "bg-[#E9E6DF] text-[#5A4300]"}`}
            >
              {article.published ? "Published" : "Draft"}
            </span>
            {article.publishedAt && <span className="text-[#436850]">{articleDate(article.publishedAt)}</span>}
          </div>
        </div>
      </div>
      {confirming ? (
        <div className="mt-3 rounded-2xl bg-[#A33A12]/10 p-3">
          <p className="text-sm font-semibold text-[#A33A12]">Delete this article for good? Shared links will stop working.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirming(false)} className="min-h-10 rounded-2xl border border-[#12372A]/30 bg-white text-sm font-semibold">
              Cancel
            </button>
            <button
              onClick={() => void remove()}
              disabled={busy}
              style={{ backgroundColor: "#A33A12" }}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Yes, delete
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onEdit} className="flex min-h-10 items-center gap-1.5 rounded-full bg-[#0D2A1F] px-4 text-sm font-semibold text-white">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          {article.published && (
            <a
              href={`/articles/${article.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 items-center gap-1.5 rounded-full border border-[#12372A]/30 px-4 text-sm font-semibold"
            >
              <ExternalLink className="h-4 w-4" /> View
            </a>
          )}
          <button
            onClick={() => setConfirming(true)}
            className="flex min-h-10 items-center gap-1.5 rounded-full border border-[#A33A12]/40 px-4 text-sm font-semibold text-[#A33A12]"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </li>
  );
}

/** Admins write insight articles that appear under the FAQ on Home and on /articles. */
export function ArticlesManager() {
  const [items, setItems] = useState<Article[] | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    callApi<{ items: Article[] }>("/api/admin/articles").then((result) => {
      if (cancelled) return;
      if (result.ok) setItems(result.items);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (editing) {
    return (
      <Editor
        key={editing.id ?? "new"}
        initial={editing}
        onDone={() => {
          setEditing(null);
          setVersion((value) => value + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  return (
    <section className="space-y-3">
      <button
        onClick={() => {
          setError(null);
          setEditing(emptyDraft);
        }}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white"
      >
        <Plus className="h-5 w-5" />
        Write an article
      </button>
      <p className="text-pretty text-xs text-[#436850]">
        Published articles appear under the FAQ on Home (newest 4) and on the Articles page. Drafts are only visible here.
      </p>
      {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}
      {items === null && !error && (
        <p className="flex items-center gap-2 text-sm text-[#436850]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      )}
      {items?.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-[#ADBC9F] px-5 py-10 text-center">
          <Newspaper className="mx-auto h-8 w-8 text-[#ADBC9F]" />
          <p className="mt-2 font-semibold">No articles yet</p>
          <p className="mt-1 text-sm text-[#436850]">Write your first insight for travelers.</p>
        </div>
      )}
      <ul className="grid gap-3 lg:grid-cols-2">
        {items?.map((article) => (
          <ArticleRow
            key={article.id}
            article={article}
            onEdit={() => {
              setError(null);
              setEditing(draftFrom(article));
            }}
            onChanged={() => setVersion((value) => value + 1)}
            onError={setError}
          />
        ))}
      </ul>
    </section>
  );
}
