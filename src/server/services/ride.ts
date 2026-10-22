import { eq } from "drizzle-orm";
import { getRidePhase } from "@/lib/dates";
import { getDb } from "@/server/db/client";
import { rideEdition, type RideEdition } from "@/server/db/schema";

export async function getCurrentEdition(): Promise<RideEdition | null> {
  const [row] = await getDb().select().from(rideEdition).where(eq(rideEdition.isCurrent, true));
  return row ?? null;
}

export async function requireCurrentEdition(): Promise<RideEdition> {
  const edition = await getCurrentEdition();
  if (!edition) throw new Error("No current ride edition is configured. Run the database seed.");
  return edition;
}

export async function updateEdition(
  id: string,
  input: Partial<Omit<typeof rideEdition.$inferInsert, "id" | "isCurrent" | "year">>,
): Promise<RideEdition> {
  const [row] = await getDb().update(rideEdition).set(input).where(eq(rideEdition.id, id)).returning();
  if (!row) throw new Error("Ride edition not found.");
  return row;
}

export type RegistrationClosedReason = "organizer_closed" | "full" | "past" | "waiver_not_approved";

export type RegistrationStatus =
  | { open: true; spotsLeft: number | null }
  | { open: false; reason: RegistrationClosedReason };

export const CLOSED_REASON_TEXT: Record<RegistrationClosedReason, string> = {
  organizer_closed: "registration isn't open right now",
  full: "the ride is full",
  past: "this year's ride has already happened",
  waiver_not_approved: "registration isn't open right now",
};

/**
 * Registration is open only when the organizer opened it, the ride is upcoming, there is room,
 * and the current waiver has been approved (data-model.md, "Derived state").
 */
export function computeRegistrationStatus(input: {
  edition: Pick<RideEdition, "registrationOpen" | "startsAt" | "capacity">;
  now: Date;
  activeRiders: number;
  waiverApproved: boolean;
}): RegistrationStatus {
  const { edition, now, activeRiders, waiverApproved } = input;
  if (getRidePhase(edition.startsAt, now) === "past") return { open: false, reason: "past" };
  if (!edition.registrationOpen) return { open: false, reason: "organizer_closed" };
  if (!waiverApproved) return { open: false, reason: "waiver_not_approved" };
  if (edition.capacity !== null && activeRiders >= edition.capacity) {
    return { open: false, reason: "full" };
  }
  return {
    open: true,
    spotsLeft: edition.capacity === null ? null : edition.capacity - activeRiders,
  };
}
