import { FieldValue } from "firebase-admin/firestore";
import type { Reward } from "@/data/challenge";
import { readFocus } from "@/data/focus";
import { adminDb } from "@/lib/server/firebase-admin";
import { saveImage } from "@/lib/server/images";
import { randomCode } from "@/lib/server/model";
import { ensureRewardsSeeded, listRewards } from "@/lib/server/rewards";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

type Body = {
  action: string;
  id?: string;
  label?: string;
  category?: string;
  points?: number;
  priceLabel?: string;
  imageData?: string | null;
  imageFocus?: unknown;
  hidden?: boolean;
  direction?: number;
};

const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "reward";

const sorted = (list: Reward[]) => [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

/** Admins add, edit, hide and reorder the souvenirs in the Rewards Store. */
export async function POST(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    await ensureRewardsSeeded();
    const body = await readJson<Body>(request);
    const db = adminDb();

    if (body.action === "save") {
      const label = String(body.label ?? "").trim();
      if (label.length < 2 || label.length > 80) throw new HttpError(400, "Please fill in the souvenir name (up to 80 characters).");
      const category = String(body.category ?? "").trim().slice(0, 24);
      if (!category) throw new HttpError(400, "Choose or type a category.");
      const points = Math.floor(Number(body.points));
      if (!Number.isFinite(points) || points < 1 || points > 100000) throw new HttpError(400, "Points must be 1 or more.");
      const priceLabel = String(body.priceLabel ?? "").trim().slice(0, 60);

      const all = await listRewards();
      const existing = body.id ? all.find((reward) => reward.id === body.id) : undefined;
      if (body.id && !existing) throw new HttpError(404, "This souvenir was not found.");
      const id = existing?.id ?? `${slug(label)}-${randomCode(3).toLowerCase()}`;
      const data: Record<string, unknown> = {
        label,
        category,
        points,
        priceLabel,
        imageFocus: readFocus(body.imageFocus),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (body.imageData) data.image = await saveImage("rewardImages", id, body.imageData, "/api/reward-image");
      else if (!existing) throw new HttpError(400, "Please add a photo.");
      if (!existing) {
        data.hidden = false;
        // New souvenirs go first so travelers notice them.
        data.order = Math.min(0, ...all.map((reward) => reward.order ?? 0)) - 1;
      }
      await db.collection("rewards").doc(id).set(data, { merge: true });
      return ok({ id });
    }

    const ref = db.collection("rewards").doc(String(body.id ?? ""));
    if (!(await ref.get()).exists) throw new HttpError(404, "This souvenir was not found.");
    if (body.action === "hide") {
      await ref.update({ hidden: body.hidden === true });
      return ok({});
    }
    if (body.action === "move") {
      const list = sorted(await listRewards());
      const from = list.findIndex((reward) => reward.id === ref.id);
      const to = from + (Number(body.direction) < 0 ? -1 : 1);
      if (to >= 0 && to < list.length) {
        [list[from], list[to]] = [list[to], list[from]];
        const batch = db.batch();
        list.forEach((reward, index) => batch.update(db.collection("rewards").doc(reward.id), { order: index }));
        await batch.commit();
      }
      return ok({});
    }
    throw new HttpError(400, "Unknown action.");
  });
}

/** Deletes a souvenir for good. Past redemptions keep its name, so history stays readable. */
export async function DELETE(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    await ensureRewardsSeeded();
    const { id } = await readJson<{ id: string }>(request);
    const db = adminDb();
    const ref = db.collection("rewards").doc(String(id ?? ""));
    if (!(await ref.get()).exists) throw new HttpError(404, "This souvenir was not found.");
    await ref.delete();
    await db.collection("rewardImages").doc(ref.id).delete();
    await db.collection("rewardStock").doc(ref.id).delete();
    return ok({});
  });
}
