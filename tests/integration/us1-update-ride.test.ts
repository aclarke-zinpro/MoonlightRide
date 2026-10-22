import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";
import { createTestEdition, createTestOrganizer } from "../helpers/fixtures";
import { cookieJar, resetCookies, revalidatePath } from "../helpers/next-mocks";
import { validRideForm } from "../helpers/forms";

vi.mock("next/headers", async () => (await import("../helpers/next-mocks")).nextHeadersMock);
vi.mock("next/cache", async () => (await import("../helpers/next-mocks")).nextCacheMock);

const { updateRideEdition } = await import("@/features/ride/actions");
const { getCurrentEdition } = await import("@/server/services/ride");
const { createSessionToken, SESSION_COOKIE } = await import("@/server/auth/session");

function toForm(values: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(values)) form.set(k, v);
  return form;
}

async function signInAsOrganizer() {
  const organizer = await createTestOrganizer();
  cookieJar.set(SESSION_COOKIE, await createSessionToken(organizer.id));
}

describe("US1 updateRideEdition action", () => {
  beforeEach(async () => {
    resetCookies();
    revalidatePath.mockClear();
    await createTestDb();
    await createTestEdition();
  });

  it("is refused without an organizer session", async () => {
    const result = await updateRideEdition({ ok: false }, toForm(validRideForm));
    expect(result).toEqual({ ok: false, formError: "Please sign in again." });
  });

  it("saves valid changes and refreshes the public pages", async () => {
    await signInAsOrganizer();
    const result = await updateRideEdition(
      { ok: false },
      toForm({ ...validRideForm, startLocationName: "New Trailhead", time: "18:30" }),
    );
    expect(result.ok).toBe(true);
    const edition = await getCurrentEdition();
    expect(edition?.startLocationName).toBe("New Trailhead");
    expect(edition?.startsAt.toISOString()).toBe("2026-10-24T23:30:00.000Z");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/route");
    expect(revalidatePath).toHaveBeenCalledWith("/register");
  });

  it("returns field errors and echoes values for invalid input", async () => {
    await signInAsOrganizer();
    const result = await updateRideEdition(
      { ok: false },
      toForm({ ...validRideForm, pctGravel: "90", startLocationName: "Kept value" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors?.pctGravel).toContain("Gravel, trail, and paved must add up to 100%.");
    expect(result.values?.startLocationName).toBe("Kept value");
    const edition = await getCurrentEdition();
    expect(edition?.pctGravel).toBe(77);
  });
});
