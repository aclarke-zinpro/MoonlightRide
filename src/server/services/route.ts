import { and, asc, eq, max } from "drizzle-orm";
import type { CueInput, PoiInput } from "@/features/route-guide/schema";
import { getDb, type Tx } from "@/server/db/client";
import { cue, pointOfInterest, type Cue, type PointOfInterest } from "@/server/db/schema";

export class RouteValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

function checkMile(value: number | null, distanceMiles: number) {
  if (value !== null && (value < 0 || value > distanceMiles)) {
    throw new RouteValidationError("mile", `Mile must be between 0 and ${distanceMiles}.`);
  }
}

export async function listCues(editionId: string): Promise<Cue[]> {
  return getDb().select().from(cue).where(eq(cue.rideEditionId, editionId)).orderBy(asc(cue.position));
}

export async function listPois(editionId: string): Promise<PointOfInterest[]> {
  return getDb()
    .select()
    .from(pointOfInterest)
    .where(eq(pointOfInterest.rideEditionId, editionId))
    .orderBy(asc(pointOfInterest.position));
}

export async function saveCue(
  edition: { id: string; distanceMiles: number },
  input: CueInput,
): Promise<Cue> {
  checkMile(input.mile, edition.distanceMiles);
  const db = getDb();
  const { id, ...fields } = input;
  if (id) {
    const [row] = await db
      .update(cue)
      .set(fields)
      .where(and(eq(cue.id, id), eq(cue.rideEditionId, edition.id)))
      .returning();
    if (!row) throw new RouteValidationError("_form", "That direction no longer exists.");
    return row;
  }
  return db.transaction(async (tx) => {
    const [last] = await tx
      .select({ position: max(cue.position) })
      .from(cue)
      .where(eq(cue.rideEditionId, edition.id));
    const [row] = await tx
      .insert(cue)
      .values({ ...fields, rideEditionId: edition.id, position: (last?.position ?? 0) + 1 })
      .returning();
    if (!row) throw new Error("Could not add the direction.");
    return row;
  });
}

export async function deleteCue(editionId: string, id: string): Promise<void> {
  await getDb().delete(cue).where(and(eq(cue.id, id), eq(cue.rideEditionId, editionId)));
}

export async function savePoi(
  edition: { id: string; distanceMiles: number },
  input: PoiInput,
): Promise<PointOfInterest> {
  checkMile(input.mile, edition.distanceMiles);
  const db = getDb();
  const { id, ...fields } = input;
  if (id) {
    const [row] = await db
      .update(pointOfInterest)
      .set(fields)
      .where(and(eq(pointOfInterest.id, id), eq(pointOfInterest.rideEditionId, edition.id)))
      .returning();
    if (!row) throw new RouteValidationError("_form", "That stop no longer exists.");
    return row;
  }
  return db.transaction(async (tx) => {
    const [last] = await tx
      .select({ position: max(pointOfInterest.position) })
      .from(pointOfInterest)
      .where(eq(pointOfInterest.rideEditionId, edition.id));
    const [row] = await tx
      .insert(pointOfInterest)
      .values({ ...fields, rideEditionId: edition.id, position: (last?.position ?? 0) + 1 })
      .returning();
    if (!row) throw new Error("Could not add the stop.");
    return row;
  });
}

export async function deletePoi(editionId: string, id: string): Promise<void> {
  await getDb()
    .delete(pointOfInterest)
    .where(and(eq(pointOfInterest.id, id), eq(pointOfInterest.rideEditionId, editionId)));
}

/**
 * Applies a complete new order. Positions move to negative values first so the unique
 * (edition, position) constraint holds at every step.
 */
async function reorder(
  table: typeof cue | typeof pointOfInterest,
  editionId: string,
  ids: string[],
): Promise<void> {
  await getDb().transaction(async (tx: Tx) => {
    const current = await tx
      .select({ id: table.id })
      .from(table)
      .where(eq(table.rideEditionId, editionId));
    const known = new Set(current.map((r) => r.id));
    if (ids.length !== known.size || new Set(ids).size !== ids.length || ids.some((id) => !known.has(id))) {
      throw new RouteValidationError("_form", "The new order must include every item exactly once.");
    }
    for (const [index, id] of ids.entries()) {
      await tx.update(table).set({ position: -(index + 1) }).where(eq(table.id, id));
    }
    for (const [index, id] of ids.entries()) {
      await tx.update(table).set({ position: index + 1 }).where(eq(table.id, id));
    }
  });
}

export const reorderCues = (editionId: string, ids: string[]) => reorder(cue, editionId, ids);
export const reorderPois = (editionId: string, ids: string[]) => reorder(pointOfInterest, editionId, ids);
