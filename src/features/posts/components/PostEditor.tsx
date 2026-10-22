"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { buttonStyles, SubmitButton } from "@/components/Button";
import { FormMessage, TextAreaField, TextField } from "@/components/FormField";
import { Prose } from "@/components/Prose";
import { idle, type ActionResult } from "@/lib/action-result";
import { deletePost, publishPost, savePost, unpublishPost } from "../actions";

export type EditablePost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  status: "draft" | "published";
  everPublished: boolean;
  notified: boolean;
};

/** Write and preview a post. New posts move to their edit page after the first save. */
export function PostEditor({ post }: { post?: EditablePost }) {
  const router = useRouter();
  const [state, action] = useActionState(savePost, idle as ActionResult<{ id: string }>);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [body, setBody] = useState(post?.body ?? "");
  const errors = !state.ok ? state.fieldErrors : undefined;
  const values = !state.ok ? state.values : undefined;

  useEffect(() => {
    if (!post && state.ok && state.data?.id) router.replace(`/admin/posts/${state.data.id}`);
  }, [post, state, router]);

  return (
    <form action={action} className="space-y-5" noValidate encType="multipart/form-data">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      {state.ok && post ? <FormMessage kind="success">{state.message}</FormMessage> : null}
      {!state.ok && state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}

      <TextField name="title" label="Title" required defaultValue={values?.title ?? post?.title} errors={errors?.title} />
      <TextField
        name="slug"
        label="Web address (slug)"
        defaultValue={values?.slug ?? post?.slug}
        errors={errors?.slug}
        hint={post ? `This post lives at /updates/${post.slug}.` : "Leave blank to make one from the title."}
      />
      <TextAreaField
        name="summary"
        label="Summary"
        rows={2}
        defaultValue={values?.summary ?? post?.summary}
        errors={errors?.summary}
        hint="One or two sentences for the Updates list and subscriber emails (up to 300 characters)."
      />

      <div>
        <div role="tablist" aria-label="Body editor" className="flex gap-2">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              onClick={() => setTab(t)}
              className={tab === t ? buttonStyles.secondary : buttonStyles.ghost}
            >
              {t === "write" ? "Write" : "Preview"}
            </button>
          ))}
        </div>
        <div id="panel-write" role="tabpanel" aria-labelledby="tab-write" hidden={tab !== "write"}>
          <TextAreaField
            name="body"
            label="Body (Markdown)"
            required
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            errors={errors?.body}
            hint="Use **bold**, - lists, and [links](https://example.com)."
          />
        </div>
        <div
          id="panel-preview"
          role="tabpanel"
          aria-labelledby="tab-preview"
          hidden={tab !== "preview"}
          className="mt-3 rounded-md border border-line bg-surface p-4"
        >
          {body.trim() ? <Prose markdown={body} /> : <p className="text-muted">Nothing to preview yet.</p>}
        </div>
      </div>

      <fieldset className="space-y-3 rounded-md border border-line p-4">
        <legend className="px-1 font-semibold">Cover image</legend>
        {post?.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview of an uploaded image
          <img src={post.coverImageUrl} alt={post.coverImageAlt ?? ""} className="max-h-48 rounded" />
        ) : null}
        <div>
          <label htmlFor="coverImage" className="block font-medium">
            {post?.coverImageUrl ? "Replace image" : "Image"} <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="coverImage"
            name="coverImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={errors?.coverImage ? "coverImage-error" : "coverImage-hint"}
            className="mt-1 block"
          />
          <p id="coverImage-hint" className="mt-1 text-sm text-muted">JPEG, PNG, or WebP, up to 5 MB.</p>
          {errors?.coverImage ? (
            <p id="coverImage-error" className="mt-1 text-sm font-medium text-danger">{errors.coverImage.join(" ")}</p>
          ) : null}
        </div>
        <TextField
          name="coverImageAlt"
          label="Cover image description"
          defaultValue={values?.coverImageAlt ?? post?.coverImageAlt ?? ""}
          errors={errors?.coverImageAlt}
          hint="Required with an image: describe it for people who can't see it."
        />
      </fieldset>

      <SubmitButton pendingLabel="Saving…">{post ? "Save changes" : "Save draft"}</SubmitButton>
    </form>
  );
}

export function PublishControls({ post }: { post: EditablePost }) {
  const [state, action] = useActionState(publishPost, idle);
  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface p-4">
      <p>
        Status:{" "}
        <strong className={post.status === "published" ? "text-success" : "text-accent"}>
          {post.status === "published" ? "Published" : "Draft"}
        </strong>
        {post.status === "published" ? (
          <>
            {" · "}
            <a href={`/updates/${post.slug}`} target="_blank" rel="noopener noreferrer">
              View on site
            </a>
          </>
        ) : null}
      </p>
      {state.ok ? <FormMessage kind="success">{state.message}</FormMessage> : null}
      {!state.ok && state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}

      {post.status === "draft" ? (
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={post.id} />
          {post.notified ? (
            <p className="text-sm text-muted">Subscribers were already emailed about this post.</p>
          ) : (
            <label htmlFor="notifySubscribers" className="flex items-center gap-3">
              <input id="notifySubscribers" name="notifySubscribers" type="checkbox" className="h-5 w-5 accent-accent" />
              Email this post to subscribers
            </label>
          )}
          <SubmitButton pendingLabel="Publishing…">Publish</SubmitButton>
        </form>
      ) : (
        <form action={unpublishPost}>
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className={buttonStyles.secondary}>
            Unpublish
          </button>
        </form>
      )}

      {!post.everPublished ? (
        <form action={deletePost}>
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className={buttonStyles.danger}>
            Delete draft
          </button>
        </form>
      ) : null}
    </div>
  );
}
