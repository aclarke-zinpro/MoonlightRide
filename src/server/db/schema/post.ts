import { sql } from "drizzle-orm";
import { check, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizer } from "./core";

export const postStatus = pgEnum("post_status", ["draft", "published"]);

export const post = pgTable(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull(),
    coverImageUrl: text("cover_image_url"),
    coverImageAlt: text("cover_image_alt"),
    status: postStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    // Set once when the post is emailed to subscribers; never cleared, so it is never sent twice.
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    authorId: uuid("author_id").references(() => organizer.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("post_slug_key").on(t.slug),
    index("post_published_idx").on(t.status, t.publishedAt),
    check("post_title_length", sql`char_length(${t.title}) between 3 and 150`),
    check("post_summary_length", sql`char_length(${t.summary}) <= 300`),
    check("post_body_length", sql`char_length(${t.body}) between 1 and 50000`),
    check(
      "post_cover_alt_required",
      sql`${t.coverImageUrl} is null or char_length(${t.coverImageAlt}) between 1 and 200`,
    ),
  ],
);

export type Post = typeof post.$inferSelect;
