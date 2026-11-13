import { FieldValue } from "firebase-admin/firestore";
import { prefixOf, type ChallengePackage, type Stop } from "@/data/challenge";
import { adminDb } from "@/lib/server/firebase-admin";
import { readFocus } from "@/data/focus";
import { saveImage } from "@/lib/server/images";
import { randomCode } from "@/lib/server/model";
import { readPrices } from "@/lib/server/prices";
import { ensureSeeded, listPackages } from "@/lib/server/packages";
import { HttpError, handle, ok, readJson, requireSession } from "@/lib/server/session";

type StopInput = { id?: string; name?: string; lat?: number; lng?: number; funfact?: string };
type PackageInput = {
  id?: string;
  title?: string;
  tagline?: string;
  description?: string;
  priceLabel?: string;
  prices?: Record<string, unknown>;
  duration?: string;
  tags?: string[];
  destinationLabel?: string;
  destinations?: string[];
  includes?: string[];
  meetingPoints?: string[];
  routeChoice?: boolean;
  stops?: StopInput[];
  /** A new poster as a data URL (image/webp, jpeg or png), already shrunk in the browser. */
  posterData?: string | null;
  posterFocus?: unknown;
};

const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "package";

const text = (value: unknown, label: string, max: number, required = true) => {
  const result = String(value ?? "").trim();
  if (required && !result) throw new HttpError(400, `Please fill in ${label}.`);
  if (result.length > max) throw new HttpError(400, `${label[0].toUpperCase()}${label.slice(1)} is too long (max ${max} characters).`);
  return result;
};

const lines = (value: unknown, max = 12) =>
  (Array.isArray(value) ? value : [])
    .map((item) => String(item ?? "").trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, max);

/** Two to four capital letters from the title, unique among the packages. */
function newPrefix(title: string, taken: Set<string>) {
  const words = title.toUpperCase().replace(/[^A-Z ]/g, " ").split(/\s+/).filter(Boolean);
  const letters = words.join("");
  const candidates = [
    words.map((word) => word[0]).join("").slice(0, 3),
    letters.slice(0, 3),
    ...Array.from({ length: 26 }, (_, i) => `${letters.slice(0, 2)}${String.fromCharCode(65 + i)}`),
  ].filter((value) => value.length >= 2);
  return candidates.find((value) => !taken.has(value)) ?? `P${randomCode(3).replace(/[^A-Z]/g, "X")}`.slice(0, 4);
}

function readStops(input: StopInput[] | undefined, previous: Stop[]): Stop[] {
  const stops = Array.isArray(input) ? input : [];
  if (stops.length === 0) throw new HttpError(400, "Add at least one place on the map.");
  if (stops.length > 15) throw new HttpError(400, "A package can have at most 15 places.");
  const known = new Set(previous.map((stop) => stop.id));
  const used = new Set<string>();
  return stops.map((stop, index) => {
    const name = text(stop.name, `the name of place ${index + 1}`, 60);
    const lat = Number(stop.lat);
    const lng = Number(stop.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new HttpError(400, `Tap the map to set where ${name} is.`);
    }
    // Keeping the id keeps travelers' ticks on this place.
    let id = stop.id && known.has(stop.id) && !used.has(stop.id) ? stop.id : `${slug(name)}-${randomCode(3).toLowerCase()}`;
    while (used.has(id)) id = `${slug(name)}-${randomCode(3).toLowerCase()}`;
    used.add(id);
    return { id, name, lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, funfact: text(stop.funfact, `the fun fact for ${name}`, 700) };
  });
}



async function save(input: PackageInput) {
  const db = adminDb();
  const all = await listPackages();
  const existing = input.id ? all.find((pkg) => pkg.id === input.id) : undefined;
  if (input.id && !existing) throw new HttpError(404, "This package was not found.");

  const title = text(input.title, "the package name", 60);
  let id = existing?.id;
  if (!id) {
    const base = slug(title);
    id = base;
    for (let n = 2; all.some((pkg) => pkg.id === id); n += 1) id = `${base}-${n}`;
  }

  const stops = readStops(input.stops, existing?.stops ?? []);
  const destinations = lines(input.destinations);
  const data: Omit<ChallengePackage, "id" | "poster"> & { poster?: string } = {
    title,
    tagline: text(input.tagline, "the tagline", 120, false),
    description: text(input.description, "the description", 1500),
    priceLabel: text(input.priceLabel, "the default price", 60),
    prices: readPrices(input.prices),
    duration: text(input.duration, "the duration", 40),
    tags: lines(input.tags, 6),
    destinationLabel: text(input.destinationLabel, "the route title", 40, false) || "Route / Destination",
    destinations: destinations.length ? destinations : stops.map((stop) => stop.name),
    includes: lines(input.includes),
    meetingPoints: lines(input.meetingPoints),
    routeChoice: input.routeChoice === true,
    stops,
    posterFocus: readFocus(input.posterFocus),
    prefix: existing ? prefixOf(existing) : newPrefix(title, new Set(all.map(prefixOf))),
    hidden: existing?.hidden ?? false,
    order: existing?.order ?? Math.max(-1, ...all.map((pkg) => pkg.order ?? 0)) + 1,
  };

  if (input.posterData) {
    data.poster = await saveImage("packagePosters", id, input.posterData, "/api/package-poster");
  } else if (!existing) {
    throw new HttpError(400, "Please add a poster photo.");
  }

  await db.collection("packages").doc(id).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return id;
}

/** Moves a package one place up or down in the catalog. */
async function move(id: string, direction: number) {
  const db = adminDb();
  const sorted = (await listPackages()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title));
  const from = sorted.findIndex((pkg) => pkg.id === id);
  const to = from + (direction < 0 ? -1 : 1);
  if (from < 0) throw new HttpError(404, "This package was not found.");
  if (to < 0 || to >= sorted.length) return;
  [sorted[from], sorted[to]] = [sorted[to], sorted[from]];
  const batch = db.batch();
  sorted.forEach((pkg, index) => batch.update(db.collection("packages").doc(pkg.id), { order: index }));
  await batch.commit();
}

/** Admins add, edit, hide and reorder travel packages. */
export async function POST(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    await ensureSeeded();
    const body = await readJson<{ action: string; id?: string; hidden?: boolean; direction?: number; package?: PackageInput }>(request);

    if (body.action === "save") return ok({ id: await save(body.package ?? {}) });

    const id = String(body.id ?? "");
    const ref = adminDb().collection("packages").doc(id);
    if (!(await ref.get()).exists) throw new HttpError(404, "This package was not found.");
    if (body.action === "hide") {
      await ref.update({ hidden: body.hidden === true });
      return ok({});
    }
    if (body.action === "move") {
      await move(id, Number(body.direction));
      return ok({});
    }
    throw new HttpError(400, "Unknown action.");
  });
}

/** Deletes a package that was never used for a booking. Used ones can only be hidden. */
export async function DELETE(request: Request) {
  return handle(async () => {
    await requireSession(request, ["admin"]);
    await ensureSeeded();
    const { id } = await readJson<{ id: string }>(request);
    const db = adminDb();
    const ref = db.collection("packages").doc(String(id ?? ""));
    if (!(await ref.get()).exists) throw new HttpError(404, "This package was not found.");
    const used = await db.collection("bookings").where("packageId", "==", ref.id).limit(1).get();
    if (!used.empty) throw new HttpError(409, "This package already has booking codes. Hide it instead.");
    await ref.delete();
    await db.collection("packagePosters").doc(ref.id).delete();
    return ok({});
  });
}
