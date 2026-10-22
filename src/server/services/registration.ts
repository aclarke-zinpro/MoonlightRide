import { and, asc, eq, sql, sum } from "drizzle-orm";
import type { RegisterInput } from "@/features/registration/schema";
import { getRidePhase } from "@/lib/dates";
import { getDb, type Tx } from "@/server/db/client";
import {
  registration,
  rideEdition,
  waiverVersion,
  type Registration,
  type RideEdition,
} from "@/server/db/schema";
import { createToken, hashToken } from "@/server/security/tokens";
import {
  computeRegistrationStatus,
  type RegistrationClosedReason,
  type RegistrationStatus,
} from "./ride";
import { getCurrentWaiver } from "./waiver";

async function activeRidersIn(db: Tx | ReturnType<typeof getDb>, editionId: string) {
  const [row] = await db
    .select({ riders: sum(registration.partySize) })
    .from(registration)
    .where(and(eq(registration.rideEditionId, editionId), eq(registration.status, "active")));
  return Number(row?.riders ?? 0);
}

/** Total riders (sum of party sizes) across active registrations. */
export async function activeRiderCount(editionId: string): Promise<number> {
  return activeRidersIn(getDb(), editionId);
}

export async function getRegistrationStatus(
  edition: RideEdition,
  now = new Date(),
): Promise<RegistrationStatus> {
  const [activeRiders, waiver] = await Promise.all([
    activeRiderCount(edition.id),
    getCurrentWaiver(edition.id),
  ]);
  return computeRegistrationStatus({
    edition,
    now,
    activeRiders,
    waiverApproved: Boolean(waiver?.approvedAt),
  });
}

export type RegisterResult =
  | { ok: true; registration: Registration; cancelToken: string; edition: RideEdition }
  | { ok: false; error: "duplicate" | "stale_waiver" }
  | { ok: false; error: "closed"; reason: RegistrationClosedReason }
  | { ok: false; error: "too_many"; spotsLeft: number };

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  ((error as { code?: string }).code === "23505" ||
    (error as { cause?: { code?: string } }).cause?.code === "23505");

/**
 * Registers riders. The edition row is locked for the transaction so two people can't both
 * take the last spot.
 */
export async function register(
  input: Omit<RegisterInput, "acceptWaiver"> & { editionId: string; waiverVersionId: string },
  now = new Date(),
): Promise<RegisterResult> {
  const { token, hash } = createToken();
  try {
    return await getDb().transaction(async (tx) => {
      const [edition] = await tx
        .select()
        .from(rideEdition)
        .where(eq(rideEdition.id, input.editionId))
        .for("update");
      if (!edition) return { ok: false, error: "closed", reason: "organizer_closed" } as const;

      const [waiver] = await tx
        .select()
        .from(waiverVersion)
        .where(eq(waiverVersion.rideEditionId, edition.id))
        .orderBy(sql`${waiverVersion.version} desc`)
        .limit(1);
      const activeRiders = await activeRidersIn(tx, edition.id);
      const status = computeRegistrationStatus({
        edition,
        now,
        activeRiders,
        waiverApproved: Boolean(waiver?.approvedAt),
      });
      if (!status.open) return { ok: false, error: "closed", reason: status.reason } as const;
      if (!waiver || waiver.id !== input.waiverVersionId) {
        return { ok: false, error: "stale_waiver" } as const;
      }
      if (status.spotsLeft !== null && input.partySize > status.spotsLeft) {
        return { ok: false, error: "too_many", spotsLeft: status.spotsLeft } as const;
      }

      const [existing] = await tx
        .select({ id: registration.id })
        .from(registration)
        .where(
          and(
            eq(registration.rideEditionId, edition.id),
            eq(registration.email, input.email),
            eq(registration.status, "active"),
          ),
        );
      if (existing) return { ok: false, error: "duplicate" } as const;

      const [row] = await tx
        .insert(registration)
        .values({
          rideEditionId: edition.id,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
          partySize: input.partySize,
          waiverVersionId: waiver.id,
          waiverAcceptedAt: now,
          cancelTokenHash: hash,
        })
        .returning();
      if (!row) throw new Error("Could not save the registration.");
      return { ok: true, registration: row, cancelToken: token, edition } as const;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "duplicate" };
    throw error;
  }
}

export async function findActiveByCancelToken(
  token: string,
): Promise<{ registration: Registration; edition: RideEdition } | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await getDb()
    .select({ registration, edition: rideEdition })
    .from(registration)
    .innerJoin(rideEdition, eq(rideEdition.id, registration.rideEditionId))
    .where(and(eq(registration.cancelTokenHash, hashToken(token)), eq(registration.status, "active")));
  return row ?? null;
}

/** Cancels via the emailed link. The link works until the ride has happened. */
export async function cancelByToken(
  token: string,
  now = new Date(),
): Promise<{ registration: Registration; edition: RideEdition } | null> {
  const found = await findActiveByCancelToken(token);
  if (!found || getRidePhase(found.edition.startsAt, now) === "past") return null;
  const [row] = await getDb()
    .update(registration)
    .set({ status: "cancelled", cancelledAt: now, cancelTokenHash: null })
    .where(and(eq(registration.id, found.registration.id), eq(registration.status, "active")))
    .returning();
  return row ? { registration: row, edition: found.edition } : null;
}

export async function listForEdition(
  editionId: string,
  status?: "active" | "cancelled",
): Promise<(Registration & { waiverVersion: number })[]> {
  const rows = await getDb()
    .select({ registration, waiverVersion: waiverVersion.version })
    .from(registration)
    .innerJoin(waiverVersion, eq(waiverVersion.id, registration.waiverVersionId))
    .where(
      status
        ? and(eq(registration.rideEditionId, editionId), eq(registration.status, status))
        : eq(registration.rideEditionId, editionId),
    )
    .orderBy(asc(registration.createdAt));
  return rows.map((r) => ({ ...r.registration, waiverVersion: r.waiverVersion }));
}

export const REGISTRATION_CSV_HEADERS = [
  "Registered At",
  "Full Name",
  "Email",
  "Phone",
  "Party Size",
  "Emergency Contact",
  "Emergency Phone",
  "Status",
  "Waiver Version",
];

export function toCsvRows(rows: Awaited<ReturnType<typeof listForEdition>>) {
  return rows.map((r) => [
    r.createdAt,
    r.fullName,
    r.email,
    r.phone,
    r.partySize,
    r.emergencyContactName,
    r.emergencyContactPhone,
    r.status,
    r.waiverVersion,
  ]);
}
