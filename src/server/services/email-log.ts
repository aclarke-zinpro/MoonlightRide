import { and, count, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { emailLog } from "@/server/db/schema";

/** Ids (registrations, subscribers, posts) whose most important email failed to send. */
export async function failedEmailIds(relatedIds: string[]): Promise<Set<string>> {
  if (relatedIds.length === 0) return new Set();
  const rows = await getDb()
    .select({ relatedId: emailLog.relatedId })
    .from(emailLog)
    .where(and(eq(emailLog.status, "failed"), inArray(emailLog.relatedId, relatedIds)));
  return new Set(rows.map((r) => r.relatedId).filter((id): id is string => Boolean(id)));
}

export async function failedEmailCount(): Promise<number> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(emailLog)
    .where(eq(emailLog.status, "failed"));
  return row?.n ?? 0;
}
