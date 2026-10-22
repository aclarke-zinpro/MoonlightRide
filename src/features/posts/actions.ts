"use server";

import { revalidatePath } from "next/cache";
import {
  fieldErrorsFrom,
  formValues,
  GENERIC_ERROR,
  SIGN_IN_AGAIN,
  type ActionResult,
} from "@/lib/action-result";
import { requireOrganizer, UnauthorizedError } from "@/server/auth/session";
import { describeError, logger } from "@/server/logger";
import * as posts from "@/server/services/post";
import { notifySubscribers } from "@/server/services/subscription";
import { storeImage } from "@/server/storage";
import { postSchema, validateCoverImage } from "./schema";

function refreshPublic(slug?: string, id?: string) {
  revalidatePath("/");
  revalidatePath("/updates");
  if (slug) revalidatePath(`/updates/${slug}`);
  revalidatePath("/admin/posts");
  if (id) revalidatePath(`/admin/posts/${id}`);
}

function failure(error: unknown, label: string, form?: FormData): ActionResult {
  if (error instanceof UnauthorizedError) return { ok: false, formError: SIGN_IN_AGAIN };
  logger.error({ err: describeError(error) }, `${label} failed`);
  return { ok: false, formError: GENERIC_ERROR, values: form ? formValues(form) : undefined };
}

export async function savePost(
  _prev: ActionResult<{ id: string }>,
  form: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const organizer = await requireOrganizer();
    const parsed = postSchema.safeParse({
      title: form.get("title"),
      slug: form.get("slug"),
      summary: form.get("summary"),
      body: form.get("body"),
      coverImageAlt: form.get("coverImageAlt"),
    });
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(form) };
    }

    let coverImageUrl: string | null = null;
    const file = form.get("coverImage");
    if (file instanceof File && file.size > 0) {
      const imageErrors = validateCoverImage(file, parsed.data.coverImageAlt);
      if (imageErrors) return { ok: false, fieldErrors: imageErrors, values: formValues(form) };
      coverImageUrl = await storeImage(file);
    }

    const id = form.get("id");
    const saved = await posts.savePost(organizer.id, {
      id: typeof id === "string" && id ? id : undefined,
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary,
      body: parsed.data.body,
      coverImageUrl,
      coverImageAlt: parsed.data.coverImageAlt,
    });
    refreshPublic(saved.slug, saved.id);
    return { ok: true, data: { id: saved.id }, message: "Saved." };
  } catch (error) {
    if (error instanceof posts.SlugTakenError) {
      return { ok: false, fieldErrors: { slug: [error.message] }, values: formValues(form) };
    }
    return failure(error, "savePost", form);
  }
}

export async function publishPost(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    await requireOrganizer();
    const published = await posts.publishPost(String(form.get("id")));
    refreshPublic(published.slug, published.id);
    if (form.get("notifySubscribers") !== "on") return { ok: true, message: "Published." };

    const result = await notifySubscribers(published.id);
    if (result.alreadyNotified) {
      return { ok: true, message: "Published. Subscribers were already emailed about this post." };
    }
    const who = result.sent === 1 ? "1 subscriber" : `${result.sent} subscribers`;
    const failed = result.failed ? ` ${result.failed} emails couldn't be sent.` : "";
    return { ok: true, message: `Published and emailed ${who}.${failed}` };
  } catch (error) {
    return failure(error, "publishPost");
  }
}

async function withOrganizer(label: string, fn: () => Promise<void>) {
  try {
    await requireOrganizer();
    await fn();
  } catch (error) {
    if (error instanceof UnauthorizedError) return;
    logger.error({ err: describeError(error) }, `${label} failed`);
    throw error;
  }
}

export async function unpublishPost(form: FormData): Promise<void> {
  await withOrganizer("unpublishPost", async () => {
    const post = await posts.unpublishPost(String(form.get("id")));
    refreshPublic(post.slug, post.id);
  });
}

export async function deletePost(form: FormData): Promise<void> {
  await withOrganizer("deletePost", async () => {
    await posts.deletePost(String(form.get("id")));
    refreshPublic();
  });
}
