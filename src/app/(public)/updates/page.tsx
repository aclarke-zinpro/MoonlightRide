import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles } from "@/components/button-styles";
import { PostCard } from "@/features/posts/components/PostCard";
import { listPublished, POSTS_PER_PAGE } from "@/server/services/post";

export const metadata: Metadata = {
  title: "Updates",
  description: "News, weather calls, and route updates for the Moonlight Ride.",
};

export default async function UpdatesPage({ searchParams }: PageProps<"/updates">) {
  const { page: raw } = await searchParams;
  const page = raw === undefined ? 1 : Number(raw);
  if (!Number.isInteger(page) || page < 1) notFound();
  const { posts, total } = await listPublished(page);
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  if (page > pages) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black">Updates</h1>
      {posts.length === 0 ? (
        <p className="text-lg">No updates yet. Sign up below to hear about news first.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} title={p.title} slug={p.slug} summary={p.summary} publishedAt={p.publishedAt} />
          ))}
        </div>
      )}
      {pages > 1 ? (
        <nav aria-label="Updates pages" className="flex items-center justify-between gap-4">
          {page > 1 ? (
            <Link href={page === 2 ? "/updates" : `/updates?page=${page - 1}`} className={buttonStyles.secondary}>
              Newer updates
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`/updates?page=${page + 1}`} className={buttonStyles.secondary}>
              Older updates
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
