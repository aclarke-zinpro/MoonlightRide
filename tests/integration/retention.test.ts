import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/db";
import { createTestEdition, createTestOrganizer } from "../helpers/fixtures";

const { runRetention } = await import("@/server/services/retention");
const { GET: cronRoute } = await import("@/app/api/cron/retention/route");
const { getDb } = await import("@/server/db/client");
const schema = await import("@/server/db/schema");
const waiver = await import("@/server/services/waiver");

const DAY = 86_400_000;

describe("data retention job (privacy)", () => {
  const now = new Date("2027-12-01T12:00:00Z");
  let oldEditionId: string;
  let newEditionId: string;

  beforeEach(async () => {
    await createTestDb();
    const organizer = await createTestOrganizer();
    const db = getDb();
    // 2026 ride is more than 12 months before `now`; 2027 is not.
    oldEditionId = (await createTestEdition({ isCurrent: false })).id;
    newEditionId = (await createTestEdition({ year: 2027, startsAt: new Date("2027-10-16T23:00:00Z") })).id;

    for (const editionId of [oldEditionId, newEditionId]) {
      const v = await waiver.saveWaiver(editionId, "x".repeat(60));
      await waiver.approveWaiver(editionId, v.id, organizer.id);
      await db.insert(schema.registration).values({
        rideEditionId: editionId,
        fullName: "Riley Rider",
        email: `riley-${editionId}@example.com`,
        phone: "507-555-0100",
        emergencyContactName: "Sam",
        emergencyContactPhone: "507-555-0199",
        partySize: 3,
        waiverVersionId: v.id,
        waiverAcceptedAt: new Date(),
      });
    }
    await db.insert(schema.subscriber).values([
      { email: "stale@example.com", status: "pending", confirmSentAt: new Date(now.getTime() - 31 * DAY), unsubscribeTokenHash: "a" },
      { email: "fresh@example.com", status: "pending", confirmSentAt: new Date(now.getTime() - 2 * DAY), unsubscribeTokenHash: "b" },
      { email: "active@example.com", status: "active", confirmSentAt: new Date(now.getTime() - 400 * DAY), unsubscribeTokenHash: "c" },
    ]);
    await db.insert(schema.emailLog).values([
      { kind: "registration_confirmation", toEmail: "old@example.com", status: "sent", createdAt: new Date(now.getTime() - 400 * DAY) },
      { kind: "registration_confirmation", toEmail: "new@example.com", status: "sent", createdAt: new Date(now.getTime() - DAY) },
    ]);
    await db.insert(schema.loginAttempt).values([
      { email: "a@example.com", ipHash: "h", succeeded: false, attemptedAt: new Date(now.getTime() - 2 * DAY) },
      { email: "a@example.com", ipHash: "h", succeeded: false, attemptedAt: new Date(now.getTime() - 60_000) },
    ]);
    await db.insert(schema.rateLimitEvent).values([
      { bucket: "register", ipHash: "h", occurredAt: new Date(now.getTime() - 2 * DAY) },
      { bucket: "register", ipHash: "h", occurredAt: new Date(now.getTime() - 60_000) },
    ]);
  });

  it("anonymizes registrations 12 months after their ride, keeping party size and year", async () => {
    const result = await runRetention(now);
    expect(result.registrationsAnonymized).toBe(1);
    const rows = await getDb().select().from(schema.registration);
    const old = rows.find((r) => r.rideEditionId === oldEditionId)!;
    const recent = rows.find((r) => r.rideEditionId === newEditionId)!;
    expect(old).toMatchObject({
      fullName: null,
      email: null,
      phone: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      partySize: 3,
    });
    expect(old.anonymizedAt).toBeInstanceOf(Date);
    expect(recent.fullName).toBe("Riley Rider");
  });

  it("deletes pending subscribers older than 30 days and keeps the rest", async () => {
    const result = await runRetention(now);
    expect(result.pendingSubscribersDeleted).toBe(1);
    const emails = (await getDb().select().from(schema.subscriber)).map((s) => s.email).sort();
    expect(emails).toEqual(["active@example.com", "fresh@example.com"]);
  });

  it("removes addresses from old email logs and purges old sign-in and rate-limit rows", async () => {
    const result = await runRetention(now);
    expect(result).toMatchObject({ emailLogsScrubbed: 1, loginAttemptsPurged: 1, rateLimitEventsPurged: 1 });
    const logs = await getDb().select().from(schema.emailLog);
    expect(logs.map((l) => l.toEmail).sort()).toEqual(["new@example.com", null].sort());
  });

  it("is safe to run repeatedly", async () => {
    await runRetention(now);
    expect(await runRetention(now)).toMatchObject({ registrationsAnonymized: 0, pendingSubscribersDeleted: 0 });
  });

  it("the cron endpoint requires the CRON_SECRET bearer token", async () => {
    expect((await cronRoute(new Request("http://localhost/api/cron/retention"))).status).toBe(401);
    const wrong = new Request("http://localhost/api/cron/retention", { headers: { Authorization: "Bearer nope" } });
    expect((await cronRoute(wrong)).status).toBe(401);
    const right = new Request("http://localhost/api/cron/retention", {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const response = await cronRoute(right);
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty("registrationsAnonymized");
  });
});
