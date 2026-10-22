import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { waiverVersion, type WaiverVersion } from "@/server/db/schema";

/** The current waiver is the highest version for the edition. */
export async function getCurrentWaiver(editionId: string): Promise<WaiverVersion | null> {
  const [row] = await getDb()
    .select()
    .from(waiverVersion)
    .where(eq(waiverVersion.rideEditionId, editionId))
    .orderBy(desc(waiverVersion.version))
    .limit(1);
  return row ?? null;
}

export async function getWaiverVersion(id: string): Promise<WaiverVersion | null> {
  const [row] = await getDb().select().from(waiverVersion).where(eq(waiverVersion.id, id));
  return row ?? null;
}

/** Every edit creates a new, unapproved version, so riders' acceptances stay traceable. */
export async function saveWaiver(editionId: string, body: string): Promise<WaiverVersion> {
  return getDb().transaction(async (tx) => {
    const [latest] = await tx
      .select({ version: waiverVersion.version })
      .from(waiverVersion)
      .where(eq(waiverVersion.rideEditionId, editionId))
      .orderBy(desc(waiverVersion.version))
      .limit(1);
    const [row] = await tx
      .insert(waiverVersion)
      .values({ rideEditionId: editionId, version: (latest?.version ?? 0) + 1, body })
      .returning();
    if (!row) throw new Error("Could not save the waiver.");
    return row;
  });
}

/** Only the current version can be approved. */
export async function approveWaiver(
  editionId: string,
  versionId: string,
  organizerId: string | null,
): Promise<WaiverVersion> {
  const current = await getCurrentWaiver(editionId);
  if (!current || current.id !== versionId) {
    throw new Error("Only the latest version of the waiver can be approved.");
  }
  const [row] = await getDb()
    .update(waiverVersion)
    .set({ approvedAt: new Date(), approvedBy: organizerId })
    .where(and(eq(waiverVersion.id, versionId), eq(waiverVersion.rideEditionId, editionId)))
    .returning();
  if (!row) throw new Error("Waiver version not found.");
  return row;
}
