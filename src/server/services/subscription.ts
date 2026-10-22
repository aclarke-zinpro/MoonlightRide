import { createHmac } from "node:crypto";
import { and, asc, count, eq, inArray, lt } from "drizzle-orm";
import { getEnv } from "@/lib/env";
import { getDb } from "@/server/db/client";
import { subscriber, type Subscriber, type SubscriberStatus } from "@/server/db/schema";
import { sendEmail } from "@/server/email/mailer";
import { postNotificationEmail, subscriptionConfirmEmail } from "@/server/email/templates/updates";
import { logger } from "@/server/logger";
import { createToken, hashToken } from "@/server/security/tokens";
import { getPostById, markNotified } from "./post";

const CONFIRM_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESEND_AFTER_MS = 10 * 60 * 1000;
const PENDING_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const CONFIRM_EXPIRED_MESSAGE =
  "This confirmation link has expired. Sign up again to get a new one.";

/**
 * Unsubscribe links must work in every email ever sent, so the token is derived from the
 * subscriber id with a keyed hash rather than stored. Only its SHA-256 hash is kept for lookup.
 */
export function unsubscribeTokenFor(subscriberId: string): string {
  return createHmac("sha256", getEnv().AUTH_SECRET).update(`unsubscribe:${subscriberId}`).digest("base64url");
}

/** Pure transition rules for a subscribe request (data-model.md, subscriber). */
export function nextSubscribeStep(
  existing: { status: SubscriberStatus; confirmSentAt: Date } | null,
  now: Date,
): { status: SubscriberStatus; sendConfirmation: boolean } {
  if (!existing || existing.status === "unsubscribed") {
    return { status: "pending", sendConfirmation: true };
  }
  if (existing.status === "active") return { status: "active", sendConfirmation: false };
  const canResend = now.getTime() - existing.confirmSentAt.getTime() >= RESEND_AFTER_MS;
  return { status: "pending", sendConfirmation: canResend };
}

/**
 * Records a subscribe request. Returns the raw confirmation token when a confirmation email
 * should be sent (the caller sends it), or null when nothing should be sent.
 */
export async function subscribe(
  emailInput: string,
  now = new Date(),
): Promise<{ subscriberId: string; token: string | null }> {
  const email = emailInput.trim().toLowerCase();
  const db = getDb();
  const [existing] = await db.select().from(subscriber).where(eq(subscriber.email, email));
  const step = nextSubscribeStep(existing ?? null, now);

  if (!existing) {
    const { token, hash } = createToken();
    const [row] = await db
      .insert(subscriber)
      .values({ email, status: "pending", confirmTokenHash: hash, confirmSentAt: now, unsubscribeTokenHash: "" })
      .returning();
    if (!row) throw new Error("Could not save the subscription.");
    await db
      .update(subscriber)
      .set({ unsubscribeTokenHash: hashToken(unsubscribeTokenFor(row.id)) })
      .where(eq(subscriber.id, row.id));
    return { subscriberId: row.id, token };
  }

  if (!step.sendConfirmation) return { subscriberId: existing.id, token: null };
  const { token, hash } = createToken();
  await db
    .update(subscriber)
    .set({ status: "pending", confirmTokenHash: hash, confirmSentAt: now, unsubscribedAt: null })
    .where(eq(subscriber.id, existing.id));
  return { subscriberId: existing.id, token };
}

export async function sendConfirmation(email: string, subscriberId: string, token: string) {
  return sendEmail({
    kind: "subscription_confirm",
    relatedId: subscriberId,
    message: subscriptionConfirmEmail({ to: email, token, siteUrl: getEnv().SITE_URL }),
  });
}

export type ConfirmResult = "confirmed" | "already_confirmed" | "expired" | "invalid";

export async function confirm(token: string, now = new Date()): Promise<ConfirmResult> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return "invalid";
  const db = getDb();
  const [row] = await db.select().from(subscriber).where(eq(subscriber.confirmTokenHash, hashToken(token)));
  if (!row) return "invalid";
  if (row.status === "active") return "already_confirmed";
  if (row.status !== "pending") return "invalid";
  if (now.getTime() - row.confirmSentAt.getTime() > CONFIRM_TTL_MS) return "expired";
  await db
    .update(subscriber)
    .set({ status: "active", confirmedAt: now })
    .where(and(eq(subscriber.id, row.id), eq(subscriber.status, "pending")));
  return "confirmed";
}

/** Idempotent; unknown tokens are ignored so the response never reveals who is subscribed. */
export async function unsubscribe(token: string, now = new Date()): Promise<void> {
  if (!token) return;
  await getDb()
    .update(subscriber)
    .set({ status: "unsubscribed", unsubscribedAt: now, confirmTokenHash: null })
    .where(
      and(
        eq(subscriber.unsubscribeTokenHash, hashToken(token)),
        inArray(subscriber.status, ["active", "pending"]),
      ),
    );
}

export async function listSubscribers(status?: SubscriberStatus): Promise<Subscriber[]> {
  return getDb()
    .select()
    .from(subscriber)
    .where(status ? eq(subscriber.status, status) : undefined)
    .orderBy(asc(subscriber.createdAt));
}

export async function activeCount(): Promise<number> {
  const [row] = await getDb().select({ n: count() }).from(subscriber).where(eq(subscriber.status, "active"));
  return row?.n ?? 0;
}

const BATCH_SIZE = 100;

/** Emails a published post to every active subscriber, at most once per post (FR-022). */
export async function notifySubscribers(
  postId: string,
  now = new Date(),
): Promise<{ sent: number; failed: number; alreadyNotified: boolean }> {
  const target = await getPostById(postId);
  if (!target || target.status !== "published") throw new Error("Only published posts can be emailed.");
  if (target.notifiedAt) return { sent: 0, failed: 0, alreadyNotified: true };
  // Mark first so a retry or double-click can never send the post twice.
  await markNotified(postId, now);

  const recipients = await listSubscribers("active");
  const siteUrl = getEnv().SITE_URL;
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((s) =>
        sendEmail({
          kind: "post_notification",
          relatedId: postId,
          message: postNotificationEmail({
            to: s.email,
            post: target,
            siteUrl,
            unsubscribeToken: unsubscribeTokenFor(s.id),
          }),
        }),
      ),
    );
    sent += results.filter((r) => r.ok).length;
    failed += results.filter((r) => !r.ok).length;
  }
  logger.info({ event: "post_notified", postId, sent, failed }, "Post emailed to subscribers");
  return { sent, failed, alreadyNotified: false };
}

/** Pending subscriptions nobody confirmed within 30 days are deleted (research.md R11). */
export async function purgeStalePending(now = new Date()): Promise<number> {
  const rows = await getDb()
    .delete(subscriber)
    .where(and(eq(subscriber.status, "pending"), lt(subscriber.confirmSentAt, new Date(now.getTime() - PENDING_TTL_MS))))
    .returning({ id: subscriber.id });
  return rows.length;
}
