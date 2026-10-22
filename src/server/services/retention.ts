import { and, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { emailLog, registration, rideEdition } from "@/server/db/schema";
import { logger } from "@/server/logger";
import { purgeRateLimitEvents } from "@/server/security/rate-limit";
import { purgeLoginAttempts } from "./organizer";
import { purgeStalePending } from "./subscription";

const DAY = 24 * 60 * 60 * 1000;
const RETAIN_PERSONAL_DATA_MS = 365 * DAY;
const RETAIN_SECURITY_EVENTS_MS = DAY;

export type RetentionResult = {
  registrationsAnonymized: number;
  pendingSubscribersDeleted: number;
  emailLogsScrubbed: number;
  loginAttemptsPurged: number;
  rateLimitEventsPurged: number;
};

/**
 * Daily privacy clean-up (research.md R11). Riders' personal details are removed 12 months
 * after their ride; party size and year stay for attendance history.
 */
export async function runRetention(now = new Date()): Promise<RetentionResult> {
  const db = getDb();
  const personalCutoff = new Date(now.getTime() - RETAIN_PERSONAL_DATA_MS);

  const oldEditions = db
    .select({ id: rideEdition.id })
    .from(rideEdition)
    .where(lt(rideEdition.startsAt, personalCutoff));
  const anonymized = await db
    .update(registration)
    .set({
      fullName: null,
      email: null,
      phone: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      cancelTokenHash: null,
      anonymizedAt: now,
    })
    .where(and(isNull(registration.anonymizedAt), inArray(registration.rideEditionId, oldEditions)))
    .returning({ id: registration.id });

  const scrubbed = await db
    .update(emailLog)
    .set({ toEmail: null })
    .where(and(isNotNull(emailLog.toEmail), lt(emailLog.createdAt, personalCutoff)))
    .returning({ id: emailLog.id });

  const securityCutoff = new Date(now.getTime() - RETAIN_SECURITY_EVENTS_MS);
  const result: RetentionResult = {
    registrationsAnonymized: anonymized.length,
    pendingSubscribersDeleted: await purgeStalePending(now),
    emailLogsScrubbed: scrubbed.length,
    loginAttemptsPurged: await purgeLoginAttempts(securityCutoff),
    rateLimitEventsPurged: await purgeRateLimitEvents(securityCutoff),
  };
  logger.info({ event: "retention", ...result }, "Retention job finished");
  return result;
}
