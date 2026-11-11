import { serveImage } from "@/lib/server/images";

/** Serves a "Memories from Jogja" photo an admin uploaded. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  const { id } = await params;
  return serveImage("memoryImages", id);
}
