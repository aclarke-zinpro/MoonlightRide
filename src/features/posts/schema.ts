import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

const blankToNull = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null));

export const postSchema = z.object({
  title: z
    .string({ error: "Enter a title." })
    .trim()
    .min(3, { error: "Titles must be at least 3 characters." })
    .max(150, { error: "Titles can be at most 150 characters." }),
  slug: blankToNull.refine((v) => v === null || (SLUG_PATTERN.test(v) && v.length <= 80), {
    error: "Use lowercase letters, numbers, and hyphens, like weather-update.",
  }),
  summary: z
    .string()
    .trim()
    .max(300, { error: "Summaries can be at most 300 characters." })
    .nullish()
    .transform((v) => v ?? ""),
  body: z
    .string({ error: "Write the post." })
    .min(1, { error: "Write the post." })
    .max(50_000, { error: "Posts can be at most 50,000 characters." }),
  coverImageAlt: blankToNull,
});

export type PostInput = z.output<typeof postSchema>;

export const COVER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const COVER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Validates an uploaded cover image and its alt text. Returns field errors, or null if valid. */
export function validateCoverImage(
  file: File,
  alt: string | null,
): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};
  if (!(COVER_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    errors.coverImage = ["Upload a JPEG, PNG, or WebP image."];
  } else if (file.size > COVER_IMAGE_MAX_BYTES) {
    errors.coverImage = ["Images can be at most 5 MB."];
  }
  if (!alt?.trim()) errors.coverImageAlt = ["Describe the image for people who can't see it."];
  else if (alt.trim().length > 200) {
    errors.coverImageAlt = ["Image descriptions can be at most 200 characters."];
  }
  return Object.keys(errors).length ? errors : null;
}
