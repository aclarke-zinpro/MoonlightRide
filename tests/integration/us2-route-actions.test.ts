import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";
import { createTestEdition, createTestOrganizer } from "../helpers/fixtures";
import { cookieJar, resetCookies, revalidatePath } from "../helpers/next-mocks";

vi.mock("next/headers", async () => (await import("../helpers/next-mocks")).nextHeadersMock);
vi.mock("next/cache", async () => (await import("../helpers/next-mocks")).nextCacheMock);

const actions = await import("@/features/route-guide/actions");
const route = await import("@/server/services/route");
const { createSessionToken, SESSION_COOKIE } = await import("@/server/auth/session");

const form = (values: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
};

describe("US2 route service and actions", () => {
  let editionId: string;

  beforeEach(async () => {
    resetCookies();
    revalidatePath.mockClear();
    await createTestDb();
    editionId = (await createTestEdition()).id;
    const organizer = await createTestOrganizer();
    cookieJar.set(SESSION_COOKIE, await createSessionToken(organizer.id));
  });

  it("adds cues at the end, in order", async () => {
    for (const text of ["First", "Second", "Third"]) {
      const result = await actions.saveCue({ ok: false }, form({ text }));
      expect(result.ok).toBe(true);
    }
    const cues = await route.listCues(editionId);
    expect(cues.map((c) => c.text)).toEqual(["First", "Second", "Third"]);
    expect(cues.map((c) => c.position)).toEqual([1, 2, 3]);
    expect(revalidatePath).toHaveBeenCalledWith("/route");
  });

  it("edits and deletes a cue", async () => {
    await actions.saveCue({ ok: false }, form({ text: "Old" }));
    const [cue] = await route.listCues(editionId);
    await actions.saveCue({ ok: false }, form({ id: cue!.id, text: "New", isImportant: "on" }));
    expect((await route.listCues(editionId))[0]).toMatchObject({ text: "New", isImportant: true });
    await actions.deleteCue(form({ id: cue!.id }));
    expect(await route.listCues(editionId)).toHaveLength(0);
  });

  it("refuses a mile beyond the route distance", async () => {
    const result = await actions.saveCue({ ok: false }, form({ text: "Too far", mile: "20" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.mile?.[0]).toMatch(/between 0 and 15.8/);
  });

  it("reorders cues with the full id list, keeping positions unique", async () => {
    for (const text of ["A", "B", "C"]) await actions.saveCue({ ok: false }, form({ text }));
    const ids = (await route.listCues(editionId)).map((c) => c.id);
    await actions.reorderCues(form({ ids: [ids[2], ids[0], ids[1]].join(",") }));
    const reordered = await route.listCues(editionId);
    expect(reordered.map((c) => c.text)).toEqual(["C", "A", "B"]);
    expect(new Set(reordered.map((c) => c.position)).size).toBe(3);
  });

  it("refuses a mismatched reorder list", async () => {
    for (const text of ["A", "B"]) await actions.saveCue({ ok: false }, form({ text }));
    const ids = (await route.listCues(editionId)).map((c) => c.id);
    await expect(route.reorderCues(editionId, [ids[0]!])).rejects.toThrow(/every item/);
    await expect(route.reorderCues(editionId, [ids[0]!, ids[0]!])).rejects.toThrow(/every item/);
  });

  it("saves, reorders, and deletes stops", async () => {
    await actions.savePoi({ ok: false }, form({ name: "Bar", mile: "8.7", kind: "food_drink", description: "" }));
    await actions.savePoi({ ok: false }, form({ name: "Beach", mile: "10", kind: "scenic", description: "Fire" }));
    const pois = await route.listPois(editionId);
    expect(pois.map((p) => p.name)).toEqual(["Bar", "Beach"]);
    await actions.reorderPois(form({ ids: [pois[1]!.id, pois[0]!.id].join(",") }));
    expect((await route.listPois(editionId)).map((p) => p.name)).toEqual(["Beach", "Bar"]);
    await actions.deletePoi(form({ id: pois[0]!.id }));
    expect((await route.listPois(editionId)).map((p) => p.name)).toEqual(["Beach"]);
  });

  it("refuses organizer actions without a session", async () => {
    resetCookies();
    expect(await actions.saveCue({ ok: false }, form({ text: "X" }))).toEqual({
      ok: false,
      formError: "Please sign in again.",
    });
    expect(await route.listCues(editionId)).toHaveLength(0);
  });
});
