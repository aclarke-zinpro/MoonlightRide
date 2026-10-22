import bcrypt from "bcryptjs";
import { and, count, eq, gte, lt, or } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { loginAttempt, organizer, type Organizer } from "@/server/db/schema";
import { logger } from "@/server/logger";
import { hashIp } from "@/server/security/rate-limit";

const BCRYPT_COST = 12;

// Compared against when an email is unknown, so response timing does not reveal accounts.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("not-a-real-password", BCRYPT_COST));
const MAX_FAILURES = 5;
const THROTTLE_WINDOW_MS = 15 * 60 * 1000;

export const SIGN_IN_ERRORS = {
  invalid: "Email or password is incorrect.",
  throttled: "Too many sign-in attempts. Try again in 15 minutes.",
} as const;

export async function createOrganizer(input: {
  name: string;
  email: string;
  password: string;
}): Promise<Organizer> {
  if (input.password.length < 12) throw new Error("Password must be at least 12 characters.");
  const email = input.email.trim().toLowerCase();
  const [existing] = await getDb().select({ id: organizer.id }).from(organizer).where(eq(organizer.email, email));
  if (existing) throw new Error("An organizer with that email already exists.");
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const [row] = await getDb()
    .insert(organizer)
    .values({ name: input.name.trim(), email, passwordHash })
    .returning();
  if (!row) throw new Error("Could not create organizer.");
  return row;
}

export async function getOrganizerById(id: string): Promise<Organizer | null> {
  const [row] = await getDb().select().from(organizer).where(eq(organizer.id, id));
  return row ?? null;
}

async function recentFailures(email: string, ipHash: string, now: Date): Promise<number> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(loginAttempt)
    .where(
      and(
        eq(loginAttempt.succeeded, false),
        gte(loginAttempt.attemptedAt, new Date(now.getTime() - THROTTLE_WINDOW_MS)),
        or(eq(loginAttempt.email, email), eq(loginAttempt.ipHash, ipHash)),
      ),
    );
  return row?.n ?? 0;
}

export type AuthResult = { ok: true; organizer: Organizer } | { ok: false; error: string };

/** Checks credentials with throttling (FR-028). Error messages never reveal which part was wrong. */
export async function authenticate(input: {
  email: string;
  password: string;
  ip: string;
  now?: Date;
}): Promise<AuthResult> {
  const now = input.now ?? new Date();
  const email = input.email.trim().toLowerCase();
  const ipHash = hashIp(input.ip);
  const db = getDb();

  if ((await recentFailures(email, ipHash, now)) >= MAX_FAILURES) {
    logger.warn({ event: "sign_in_throttled" }, "Sign-in throttled");
    return { ok: false, error: SIGN_IN_ERRORS.throttled };
  }

  const [found] = await db.select().from(organizer).where(eq(organizer.email, email));
  const hash = found?.passwordHash ?? (await getDummyHash());
  const valid = await bcrypt.compare(input.password, hash);
  const succeeded = Boolean(found && valid);

  await db.insert(loginAttempt).values({ email, ipHash, succeeded, attemptedAt: now });
  if (!found || !succeeded) return { ok: false, error: SIGN_IN_ERRORS.invalid };

  await db.update(organizer).set({ lastLoginAt: now }).where(eq(organizer.id, found.id));
  logger.info({ event: "sign_in", organizerId: found.id }, "Organizer signed in");
  return { ok: true, organizer: found };
}

export async function purgeLoginAttempts(olderThan: Date): Promise<number> {
  const rows = await getDb()
    .delete(loginAttempt)
    .where(lt(loginAttempt.attemptedAt, olderThan))
    .returning({ id: loginAttempt.id });
  return rows.length;
}
