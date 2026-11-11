import type { Memory } from "@/data/content";
import { readFocus } from "@/data/focus";
import { ensureContentSeeded } from "@/lib/server/content";
import { adminDb } from "@/lib/server/firebase-admin";
import { saveImage } from "@/lib/server/images";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

type Body = { action: string; id?: string; caption?: string; imageData?: string; hidden?: boolean; direction?: number; focus?: unknown };

const caption = (value: unknown) => String(value ?? "").trim().slice(0, 120);

async function sortedMemories() {
  const snap = await adminDb().collection("memories").get();
  return snap.docs
    .map((doc) => ({ ...(doc.data() as Omit<Memory, "id">), id: doc.id }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Admins add, caption, hide and reorder the photos in "Memories from Jogja". */
export async function POST(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    await ensureContentSeeded();
    const body = await readJson<Body>(request);
    const db = adminDb();

    if (body.action === "add") {
      if (!body.imageData) throw new HttpError(400, "Please choose a photo.");
      const all = await sortedMemories();
      if (all.length >= 40) throw new HttpError(409, "There are already 40 photos. Delete some before adding more.");
      const ref = db.collection("memories").doc();
      const src = await saveImage("memoryImages", ref.id, body.imageData, "/api/memory-photo");
      // New photos go first so visitors see them right away.
      const order = Math.min(0, ...all.map((item) => item.order ?? 0)) - 1;
      await ref.set({ src, caption: caption(body.caption), order, hidden: false, focus: readFocus(body.focus) });
      return ok({ id: ref.id });
    }

    const ref = db.collection("memories").doc(String(body.id ?? ""));
    if (!(await ref.get()).exists) throw new HttpError(404, "This photo was not found.");

    if (body.action === "update") {
      const updates: Partial<Memory> = { caption: caption(body.caption), focus: readFocus(body.focus) };
      if (body.imageData) updates.src = await saveImage("memoryImages", ref.id, body.imageData, "/api/memory-photo");
      await ref.update(updates);
      return ok({});
    }
    if (body.action === "hide") {
      await ref.update({ hidden: body.hidden === true });
      return ok({});
    }
    if (body.action === "move") {
      const all = await sortedMemories();
      const from = all.findIndex((item) => item.id === ref.id);
      const to = from + (Number(body.direction) < 0 ? -1 : 1);
      if (to >= 0 && to < all.length) {
        [all[from], all[to]] = [all[to], all[from]];
        const batch = db.batch();
        all.forEach((item, index) => batch.update(db.collection("memories").doc(item.id), { order: index }));
        await batch.commit();
      }
      return ok({});
    }
    throw new HttpError(400, "Unknown action.");
  });
}

/** Deletes a photo for good. */
export async function DELETE(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    await ensureContentSeeded();
    const { id } = await readJson<{ id: string }>(request);
    const db = adminDb();
    const ref = db.collection("memories").doc(String(id ?? ""));
    if (!(await ref.get()).exists) throw new HttpError(404, "This photo was not found.");
    await ref.delete();
    await db.collection("memoryImages").doc(ref.id).delete();
    return ok({});
  });
}
