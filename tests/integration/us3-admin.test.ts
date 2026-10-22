import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";
import { createTestEdition, createTestOrganizer } from "../helpers/fixtures";
import { cookieJar, resetCookies } from "../helpers/next-mocks";

vi.mock("next/headers", async () => (await import("../helpers/next-mocks")).nextHeadersMock);
vi.mock("next/cache", async () => (await import("../helpers/next-mocks")).nextCacheMock);

const admin = await import("@/features/registration/admin-actions");
const waiver = await import("@/server/services/waiver");
const registration = await import("@/server/services/registration");
const { getCurrentEdition } = await import("@/server/services/ride");
const { createSessionToken, SESSION_COOKIE } = await import("@/server/auth/session");
const { GET: exportCsv } = await import("@/app/admin/(manage)/registrations/export/route");

const form = (values: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
};

describe("US3 waiver and registration administration", () => {
  let editionId: string;

  beforeEach(async () => {
    resetCookies();
    await createTestDb();
    editionId = (await createTestEdition({ startsAt: new Date(Date.now() + 30 * 86_400_000) })).id;
    const organizer = await createTestOrganizer();
    cookieJar.set(SESSION_COOKIE, await createSessionToken(organizer.id));
  });

  it("saving the waiver creates a new, unapproved version each time", async () => {
    const body = "You ride at your own risk on gravel at night. ".repeat(3);
    expect((await admin.saveWaiver({ ok: false }, form({ body }))).ok).toBe(true);
    expect((await admin.saveWaiver({ ok: false }, form({ body: body + " Updated." }))).ok).toBe(true);
    const current = await waiver.getCurrentWaiver(editionId);
    expect(current).toMatchObject({ version: 2, approvedAt: null });
  });

  it("requires the waiver to be 50-20,000 characters", async () => {
    const result = await admin.saveWaiver({ ok: false }, form({ body: "too short" }));
    expect(result.ok).toBe(false);
  });

  it("refuses to open registration until the current waiver is approved", async () => {
    await admin.saveWaiver({ ok: false }, form({ body: "x".repeat(60) }));
    expect(await admin.setRegistrationSettings({ ok: false }, form({ open: "on", capacity: "" }))).toEqual({
      ok: false,
      formError: "Approve the waiver before opening registration.",
    });
    const current = await waiver.getCurrentWaiver(editionId);
    await admin.approveWaiver(form({ versionId: current!.id }));
    expect((await admin.setRegistrationSettings({ ok: false }, form({ open: "on", capacity: "50" }))).ok).toBe(true);
    expect(await getCurrentEdition()).toMatchObject({ registrationOpen: true, capacity: 50 });
  });

  it("refuses a capacity below the current number of active riders", async () => {
    await admin.saveWaiver({ ok: false }, form({ body: "x".repeat(60) }));
    const current = await waiver.getCurrentWaiver(editionId);
    await admin.approveWaiver(form({ versionId: current!.id }));
    await admin.setRegistrationSettings({ ok: false }, form({ open: "on", capacity: "" }));
    await registration.register({
      editionId,
      waiverVersionId: current!.id,
      fullName: "Riley Rider",
      email: "riley@example.com",
      phone: null,
      emergencyContactName: "Sam",
      emergencyContactPhone: "5075550199",
      partySize: 3,
    });
    const result = await admin.setRegistrationSettings({ ok: false }, form({ open: "on", capacity: "2" }));
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.fieldErrors?.capacity?.[0]).toMatch(/3 riders are already registered/);
  });

  it("exports registrations as CSV with the right headers, columns, and formula guard", async () => {
    await admin.saveWaiver({ ok: false }, form({ body: "x".repeat(60) }));
    const current = await waiver.getCurrentWaiver(editionId);
    await admin.approveWaiver(form({ versionId: current!.id }));
    await admin.setRegistrationSettings({ ok: false }, form({ open: "on", capacity: "" }));
    await registration.register({
      editionId,
      waiverVersionId: current!.id,
      fullName: "=HYPERLINK(evil)",
      email: "rider@example.com",
      phone: "507-555-0100",
      emergencyContactName: "Sam",
      emergencyContactPhone: "507-555-0199",
      partySize: 2,
    });

    const response = await exportCsv();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="moonlight-ride-2026-registrations.csv"',
    );
    const body = await response.text();
    const [header, row] = body.replace("﻿", "").split("\r\n");
    expect(header).toBe(
      "Registered At,Full Name,Email,Phone,Party Size,Emergency Contact,Emergency Phone,Status,Waiver Version",
    );
    expect(row).toContain("'=HYPERLINK(evil)");
    expect(row).toContain("rider@example.com,507-555-0100,2,Sam,507-555-0199,active,1");
  });

  it("returns 401 for the export without a session", async () => {
    resetCookies();
    const response = await exportCsv();
    expect(response.status).toBe(401);
  });
});
