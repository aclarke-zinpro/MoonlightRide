import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { cue, pointOfInterest, rideEdition, waiverVersion } from "./schema";
import { CUES_2026, EDITION_2026, PLACEHOLDER_WAIVER, POIS_2026 } from "./seed-data";

export type SeedOptions = {
  /** Overrides the ride start (end-to-end tests seed a ride 30 days out). */
  startsAt?: Date;
};

/** Loads the 2026 ride from the info sheet. Safe to run more than once. */
export async function seed(options: SeedOptions = {}): Promise<{ editionId: string; created: boolean }> {
  const db = getDb();
  const [existing] = await db.select().from(rideEdition).where(eq(rideEdition.year, EDITION_2026.year));
  if (existing) return { editionId: existing.id, created: false };

  const [edition] = await db
    .insert(rideEdition)
    .values({ ...EDITION_2026, startsAt: options.startsAt ?? EDITION_2026.startsAt, isCurrent: true })
    .returning();
  if (!edition) throw new Error("Seeding the ride edition failed.");
  await seedEditionContent(edition.id);
  return { editionId: edition.id, created: true };
}

/** Per-edition content (cues, stops, waiver). Each user story adds its part. */
async function seedEditionContent(editionId: string): Promise<void> {
  const db = getDb();
  await db.insert(cue).values(
    CUES_2026.map((c, index) => ({
      rideEditionId: editionId,
      position: index + 1,
      text: c.text,
      mile: c.mile ?? null,
      isImportant: c.isImportant ?? false,
      isOptionalDetour: c.isOptionalDetour ?? false,
    })),
  );
  await db.insert(pointOfInterest).values(
    POIS_2026.map((p, index) => ({
      rideEditionId: editionId,
      position: index + 1,
      name: p.name,
      mile: p.mile,
      kind: p.kind,
      description: p.description,
      isOptional: p.isOptional ?? false,
    })),
  );
  // Unapproved on purpose: the organizer must review it before registration can open.
  await db.insert(waiverVersion).values({ rideEditionId: editionId, version: 1, body: PLACEHOLDER_WAIVER });
}
