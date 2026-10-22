import { getDb } from "@/server/db/client";
import { rideEdition, type RideEdition } from "@/server/db/schema";
import { createOrganizer } from "@/server/services/organizer";
import { EDITION_2026 } from "@/server/db/seed-data";

export const TEST_ORGANIZER = {
  name: "Adam Clarke",
  email: "organizer@example.com",
  password: "correct-horse-battery-staple",
};

export async function createTestOrganizer() {
  return createOrganizer(TEST_ORGANIZER);
}

/** The 2026 edition from the info sheet, with optional overrides. */
export async function createTestEdition(
  overrides: Partial<typeof rideEdition.$inferInsert> = {},
): Promise<RideEdition> {
  const [row] = await getDb()
    .insert(rideEdition)
    .values({ ...EDITION_2026, isCurrent: true, ...overrides })
    .returning();
  if (!row) throw new Error("Could not create edition");
  return row;
}
