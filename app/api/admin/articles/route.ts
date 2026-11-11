import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { ARTICLE_AUTHOR, ARTICLE_BODY_MAX, excerptOf } from "@/data/articles";
import { readFocus } from "@/data/focus";
import { toArticle } from "@/lib/server/articles";
import { adminDb } from "@/lib/server/firebase-admin";
import { saveImage } from "@/lib/server/images";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "article";

/** Article pages are cached; refresh them after a change. */
function refreshPages(id?: string) {
  revalidatePath("/articles");
  if (id) revalidatePath(`/articles/${id}`);
}

/** Every article, drafts included, newest first. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const snap = await adminDb().collection("articles").get();
    const items = snap.docs
      .map((doc) => toArticle(doc.id, doc.data()))
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return ok({ items });
  });
}

type Body = {
  id?: string;
  title?: string;
  excerpt?: string;
  body?: string;
  coverData?: string | null;
  removeCover?: boolean;
  coverFocus?: unknown;
  published?: boolean;
};

/** Creates or edits an article; publishing stamps the date the first time. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession(request, ["admin"]);
    const input = await readJson<Body>(request);
    const db = adminDb();

    const title = String(input.title ?? "").trim();
    if (!title) throw new HttpError(400, "Please fill in the title.");
    if (title.length > 140) throw new HttpError(400, "The title is too long (max 140 characters).");
    const body = String(input.body ?? "").trim();
    if (body.length < 50) throw new HttpError(400, "The article is too short. Write at least a few sentences.");
    if (body.length > ARTICLE_BODY_MAX) throw new HttpError(400, `The article is too long (max ${ARTICLE_BODY_MAX} characters).`);
    const excerpt = String(input.excerpt ?? "").trim().slice(0, 240) || excerptOf(body);
    const published = input.published === true;

    let ref;
    let existing: Record<string, unknown> | undefined;
    if (input.id) {
      ref = db.collection("articles").doc(String(input.id));
      const snap = await ref.get();
      if (!snap.exists) throw new HttpError(404, "This article was not found.");
      existing = snap.data();
    } else {
      // The address of the article comes from its first title and never changes, so shared links keep working.
      const base = slug(title);
      let id = base;
      for (let n = 2; (await db.collection("articles").doc(id).get()).exists; n += 1) id = `${base}-${n}`;
      ref = db.collection("articles").doc(id);
    }

    const data: Record<string, unknown> = {
      title,
      excerpt,
      body,
      published,
      coverFocus: input.removeCover ? null : readFocus(input.coverFocus),
      author: ARTICLE_AUTHOR,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.email,
    };
    if (published && !existing?.publishedAt) data.publishedAt = FieldValue.serverTimestamp();
    if (!existing) data.createdAt = FieldValue.serverTimestamp();
    if (input.coverData) data.cover = await saveImage("articleImages", ref.id, input.coverData, "/api/article-image");
    else if (input.removeCover) {
      data.cover = null;
      await db.collection("articleImages").doc(ref.id).delete();
    } else if (!existing) data.cover = null;

    await ref.set(data, { merge: true });
    refreshPages(ref.id);
    return ok({ id: ref.id });
  });
}

/** Deletes an article and its cover for good. */
export async function DELETE(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    const { id } = await readJson<{ id: string }>(request);
    const db = adminDb();
    const ref = db.collection("articles").doc(String(id ?? ""));
    if (!(await ref.get()).exists) throw new HttpError(404, "This article was not found.");
    await ref.delete();
    await db.collection("articleImages").doc(ref.id).delete();
    refreshPages(ref.id);
    return ok({});
  });
}
