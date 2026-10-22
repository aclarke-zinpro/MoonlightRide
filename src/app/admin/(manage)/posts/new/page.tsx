import type { Metadata } from "next";
import { PostEditor } from "@/features/posts/components/PostEditor";

export const metadata: Metadata = { title: "New post" };

export default function NewPostPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">New post</h1>
      <p className="text-muted">Save a draft first; you can preview, publish, and email it next.</p>
      <PostEditor />
    </div>
  );
}
