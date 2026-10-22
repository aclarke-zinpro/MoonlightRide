import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const subscriberStatus = pgEnum("subscriber_status", ["pending", "active", "unsubscribed"]);

export const subscriber = pgTable(
  "subscriber",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    status: subscriberStatus("status").notNull().default("pending"),
    confirmTokenHash: text("confirm_token_hash"),
    confirmSentAt: timestamp("confirm_sent_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribeTokenHash: text("unsubscribe_token_hash").notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("subscriber_email_key").on(t.email),
    index("subscriber_confirm_token_idx").on(t.confirmTokenHash),
    index("subscriber_unsubscribe_token_idx").on(t.unsubscribeTokenHash),
  ],
);

export type Subscriber = typeof subscriber.$inferSelect;
export type SubscriberStatus = (typeof subscriberStatus.enumValues)[number];
