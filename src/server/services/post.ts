import { and, count, desc, eq, ne } from "drizzle-orm";
import { slugify } from "@/lib/slug";
import { getDb } from "@/server/db/client";
import { post, type Post } from "@/server/db/schema";

export const POSTS_PER_PAGE = 10;

export class SlugTakenError extends Error {
  constructor() {
    super("Another post already uses this web address. Choose a different one.");
  }
}

async function slugInUse(slug: string, exceptId?: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: post.id })
    .from(post)
    .where(exceptId ? and(eq(post.slug, slug), ne(post.id, exceptId)) : eq(post.slug, slug));
  return Boolean(row);
}

/** A generated slug gets -2, -3, … when taken; a slug the organizer typed must be free. */
async function resolveSlug(title: string, requested: string | null, exceptId?: string) {
  if (requested) {
    if (await slugInUse(requested, exceptId)) throw new SlugTakenError();
    return requested;
  }
  const base = slugify(title);
  let candidate = base;
  for (let n = 2; await slugInUse(candidate, exceptId); n++) candidate = `${base}-${n}`;
  return candidate;
}

export type SavePostInput = {
  id?: string;
  title: string;
  slug: string | null;
  summary: string;
  body: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
};

/** Creates a draft, or updates an existing post (keeping its status and slug unless changed). */
export async function savePost(authorId: string, input: SavePostInput): Promise<Post> {
  const db = getDb();
  if (input.id) {
    const existing = await getPostById(input.id);
    if (!existing) throw new Error("Post not found.");
    const slug = input.slug ? await resolveSlug(input.title, input.slug, input.id) : existing.slug;
    const [row] = await db
      .update(post)
      .set({
        title: input.title,
        slug,
        summary: input.summary,
        body: input.body,
        // Keep the existing image unless a new one was uploaded.
        coverImageUrl: input.coverImageUrl ?? existing.coverImageUrl,
        coverImageAlt: input.coverImageAlt ?? existing.coverImageAlt,
      })
      .where(eq(post.id, input.id))
      .returning();
    if (!row) throw new Error("Post not found.");
    return row;
  }
  const slug = await resolveSlug(input.title, input.slug);
  const [row] = await db
    .insert(post)
    .values({
      title: input.title,
      slug,
      summary: input.summary,
      body: input.body,
      coverImageUrl: input.coverImageUrl,
      coverImageAlt: input.coverImageAlt,
      authorId,
    })
    .returning();
  if (!row) throw new Error("Could not save the post.");
  return row;
}

export async function getPostById(id: string): Promise<Post | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await getDb().select().from(post).where(eq(post.id, id));
  return row ?? null;
}

/** Publishes a post; the first publish date is kept if it is later unpublished and republished. */
export async function publishPost(id: string, now = new Date()): Promise<Post> {
  const existing = await getPostById(id);
  if (!existing) throw new Error("Post not found.");
  const [row] = await getDb()
    .update(post)
    .set({ status: "published", publishedAt: existing.publishedAt ?? now })
    .where(eq(post.id, id))
    .returning();
  if (!row) throw new Error("Post not found.");
  return row;
}

export async function unpublishPost(id: string): Promise<Post> {
  const [row] = await getDb().update(post).set({ status: "draft" }).where(eq(post.id, id)).returning();
  if (!row) throw new Error("Post not found.");
  return row;
}

/** Only drafts that were never published can be deleted (published links must not break). */
export async function deletePost(id: string): Promise<void> {
  const existing = await getPostById(id);
  if (!existing) return;
  if (existing.publishedAt) throw new Error("Posts that were published can't be deleted. Unpublish instead.");
  await getDb().delete(post).where(eq(post.id, id));
}

export async function markNotified(id: string, now = new Date()): Promise<void> {
  await getDb().update(post).set({ notifiedAt: now }).where(eq(post.id, id));
}

export async function listPublished(page: number): Promise<{ posts: Post[]; total: number }> {
  const db = getDb();
  const where = eq(post.status, "published");
  const [posts, [totalRow]] = await Promise.all([
    db
      .select()
      .from(post)
      .where(where)
      .orderBy(desc(post.publishedAt), desc(post.createdAt))
      .limit(POSTS_PER_PAGE)
      .offset((page - 1) * POSTS_PER_PAGE),
    db.select({ n: count() }).from(post).where(where),
  ]);
  return { posts, total: totalRow?.n ?? 0 };
}

export async function getPublishedBySlug(slug: string): Promise<Post | null> {
  const [row] = await getDb()
    .select()
    .from(post)
    .where(and(eq(post.slug, slug), eq(post.status, "published")));
  return row ?? null;
}

export async function getLatestPublished(): Promise<Post | null> {
  const { posts } = await listPublished(1);
  return posts[0] ?? null;
}

export async function listAllPosts(): Promise<Post[]> {
  return getDb().select().from(post).orderBy(desc(post.updatedAt));
}

export async function draftCount(): Promise<number> {
  const [row] = await getDb().select({ n: count() }).from(post).where(eq(post.status, "draft"));
  return row?.n ?? 0;
}
