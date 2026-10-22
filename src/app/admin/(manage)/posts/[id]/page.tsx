import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostEditor, PublishControls, type EditablePost } from "@/features/posts/components/PostEditor";
import { getPostById } from "@/server/services/post";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  const post = await getPostById((await params).id);
  if (!post) notFound();
  const editable: EditablePost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    body: post.body,
    coverImageUrl: post.coverImageUrl,
    coverImageAlt: post.coverImageAlt,
    status: post.status,
    everPublished: Boolean(post.publishedAt),
    notified: Boolean(post.notifiedAt),
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit post</h1>
        <PostEditor post={editable} />
      </div>
      <aside aria-label="Publishing">
        <PublishControls post={editable} />
      </aside>
    </div>
  );
}
