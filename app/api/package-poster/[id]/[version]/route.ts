import { serveImage } from "@/lib/server/images";

/** Serves a package poster an admin uploaded; the version in the URL changes on every upload. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  const { id } = await params;
  return serveImage("packagePosters", id);
}
