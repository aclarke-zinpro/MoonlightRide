import { describe, expect, it } from "vitest";
import { postSchema, validateCoverImage } from "@/features/posts/schema";
import { slugify } from "@/lib/slug";

const valid = { title: "Weather update", summary: "Clear skies.", body: "It will be clear." };

describe("US5 post schema", () => {
  it("accepts a valid post and treats blank optional fields as empty", () => {
    expect(postSchema.parse({ ...valid, slug: "", coverImageAlt: "" })).toMatchObject({
      title: "Weather update",
      slug: null,
      coverImageAlt: null,
    });
  });

  it("requires a title of 3-150 characters", () => {
    expect(postSchema.safeParse({ ...valid, title: "Hi" }).success).toBe(false);
    expect(postSchema.safeParse({ ...valid, title: "x".repeat(151) }).success).toBe(false);
  });

  it("limits the summary to 300 characters", () => {
    expect(postSchema.safeParse({ ...valid, summary: "x".repeat(301) }).success).toBe(false);
  });

  it("requires a body of 1-50,000 characters", () => {
    expect(postSchema.safeParse({ ...valid, body: "" }).success).toBe(false);
    expect(postSchema.safeParse({ ...valid, body: "x".repeat(50_001) }).success).toBe(false);
  });

  it("only accepts lowercase hyphenated slugs", () => {
    expect(postSchema.safeParse({ ...valid, slug: "Bad Slug!" }).success).toBe(false);
    expect(postSchema.parse({ ...valid, slug: "good-slug-2" }).slug).toBe("good-slug-2");
  });

  it("checks cover images: jpeg/png/webp, max 5 MB, alt text 1-200 characters required", () => {
    const image = (type: string, size: number) => new File([new Uint8Array(size)], "c", { type });
    expect(validateCoverImage(image("image/png", 1000), "Riders at night")).toBeNull();
    expect(validateCoverImage(image("image/gif", 1000), "alt")).toMatchObject({
      coverImage: ["Upload a JPEG, PNG, or WebP image."],
    });
    expect(validateCoverImage(image("image/jpeg", 5 * 1024 * 1024 + 1), "alt")).toMatchObject({
      coverImage: ["Images can be at most 5 MB."],
    });
    expect(validateCoverImage(image("image/webp", 10), "")).toMatchObject({
      coverImageAlt: ["Describe the image for people who can't see it."],
    });
    expect(validateCoverImage(image("image/webp", 10), "x".repeat(201))).toMatchObject({
      coverImageAlt: ["Image descriptions can be at most 200 characters."],
    });
  });
});

describe("US5 slugify", () => {
  it("makes lowercase, hyphenated slugs", () => {
    expect(slugify("Weather Update: Clear Skies!")).toBe("weather-update-clear-skies");
    expect(slugify("  Café & Crêpes  ")).toBe("cafe-and-crepes");
    expect(slugify("!!!")).toBe("post");
  });

  it("keeps slugs to 80 characters without a trailing hyphen", () => {
    const slug = slugify("word ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});
