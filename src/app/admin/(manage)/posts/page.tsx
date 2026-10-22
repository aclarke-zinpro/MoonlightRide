import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/button-styles";
import { formatShortDate } from "@/lib/dates";
import { listAllPosts } from "@/server/services/post";

export const metadata: Metadata = { title: "Posts" };

export default async function AdminPostsPage() {
  const posts = await listAllPosts();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Link href="/admin/posts/new" className={buttonStyles.primary}>
          New post
        </Link>
      </div>
      {posts.length === 0 ? (
        <p>No posts yet. Write the first update for riders.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">All posts</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-2 pr-4">Title</th>
              <th scope="col" className="py-2 pr-4">Status</th>
              <th scope="col" className="py-2 pr-4">Published</th>
              <th scope="col" className="py-2 pr-4">Emailed</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="py-2 pr-4">
                  <Link href={`/admin/posts/${p.id}`}>{p.title}</Link>
                </td>
                <td className="py-2 pr-4">{p.status === "published" ? "Published" : "Draft"}</td>
                <td className="py-2 pr-4">{p.publishedAt ? formatShortDate(p.publishedAt) : "—"}</td>
                <td className="py-2 pr-4">{p.notifiedAt ? formatShortDate(p.notifiedAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
