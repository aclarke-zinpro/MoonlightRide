import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose } from "@/components/Prose";
import { formatShortDate } from "@/lib/dates";
import { getPublishedBySlug } from "@/server/services/post";

export async function generateMetadata({ params }: PageProps<"/updates/[slug]">): Promise<Metadata> {
  const post = await getPublishedBySlug((await params).slug);
  if (!post) return { title: "Update not found" };
  return {
    title: post.title,
    description: post.summary || undefined,
    openGraph: {
      title: post.title,
      description: post.summary || undefined,
      type: "article",
      images: [post.coverImageUrl ?? "/images/og-2026.jpg"],
    },
  };
}

export default async function PostPage({ params }: PageProps<"/updates/[slug]">) {
  const post = await getPublishedBySlug((await params).slug);
  if (!post) notFound();
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted">
          <Link href="/updates">Updates</Link>
          {post.publishedAt ? (
            <>
              {" · "}
              <time dateTime={post.publishedAt.toISOString()}>{formatShortDate(post.publishedAt)}</time>
            </>
          ) : null}
        </p>
        <h1 className="text-4xl font-black">{post.title}</h1>
      </header>
      {post.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- organizer uploads of unknown size
        <img src={post.coverImageUrl} alt={post.coverImageAlt ?? ""} className="w-full rounded-lg" />
      ) : null}
      <Prose markdown={post.body} className="text-lg" />
    </article>
  );
}
