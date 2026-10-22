import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { getEnv } from "@/lib/env";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Local uploads (development and end-to-end tests) live outside public/ and are served by a route. */
export const LOCAL_UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), ".uploads");

/**
 * Stores an already-validated image and returns its public URL: Vercel Blob in production,
 * the local .uploads folder (served at /uploads/<name>) otherwise.
 */
export async function storeImage(file: File): Promise<string> {
  const ext = EXTENSIONS[file.type];
  if (!ext) throw new Error("Unsupported image type.");
  const name = `${randomUUID()}.${ext}`;
  const env = getEnv();
  if (env.BLOB_READ_WRITE_TOKEN && !env.isE2E) {
    const blob = await put(`covers/${name}`, file, {
      access: "public",
      contentType: file.type,
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }
  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

export async function readLocalImage(name: string): Promise<{ data: Buffer; type: string } | null> {
  const match = /^[0-9a-f-]{36}\.(jpg|png|webp)$/.exec(name);
  if (!match) return null;
  const type = Object.entries(EXTENSIONS).find(([, e]) => e === match[1])?.[0];
  try {
    return { data: await readFile(path.join(LOCAL_UPLOAD_DIR, name)), type: type ?? "application/octet-stream" };
  } catch {
    return null;
  }
}
