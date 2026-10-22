import { createHash } from "node:crypto";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { getEnv } from "@/lib/env";
import { getDb } from "@/server/db/client";
import { rateLimitEvent } from "@/server/db/schema";

export const RATE_LIMIT_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;

/** IP addresses are never stored directly, only a keyed hash. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}|${getEnv().IP_HASH_SECRET}`).digest("hex");
}

export type RateLimitBucket = "register" | "subscribe" | "cancel" | "unsubscribe";

/** Records a submission and reports whether this IP is still under the hourly limit. */
export async function checkRateLimit(
  bucket: RateLimitBucket,
  ip: string,
  now = new Date(),
): Promise<{ allowed: boolean }> {
  const db = getDb();
  const ipHash = hashIp(ip);
  const since = new Date(now.getTime() - WINDOW_MS);
  const [row] = await db
    .select({ n: count() })
    .from(rateLimitEvent)
    .where(
      and(
        eq(rateLimitEvent.bucket, bucket),
        eq(rateLimitEvent.ipHash, ipHash),
        gte(rateLimitEvent.occurredAt, since),
      ),
    );
  // End-to-end runs submit many forms from one address; the limit itself is unit-tested.
  const limit = getEnv().isE2E ? 1000 : RATE_LIMIT_PER_HOUR;
  if ((row?.n ?? 0) >= limit) return { allowed: false };
  await db.insert(rateLimitEvent).values({ bucket, ipHash, occurredAt: now });
  return { allowed: true };
}

export async function purgeRateLimitEvents(olderThan: Date): Promise<number> {
  const rows = await getDb()
    .delete(rateLimitEvent)
    .where(lt(rateLimitEvent.occurredAt, olderThan))
    .returning({ id: rateLimitEvent.id });
  return rows.length;
}
