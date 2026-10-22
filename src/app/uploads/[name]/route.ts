import { readLocalImage } from "@/server/storage";

/** Serves locally stored cover images (development and end-to-end tests only). */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const image = await readLocalImage((await params).name);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
