import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";
import { createTestEdition, createTestOrganizer } from "../helpers/fixtures";
import { validRegistration } from "../helpers/forms";
import { resetCookies } from "../helpers/next-mocks";

vi.mock("next/headers", async () => (await import("../helpers/next-mocks")).nextHeadersMock);
vi.mock("next/cache", async () => (await import("../helpers/next-mocks")).nextCacheMock);

const { registerRider, cancelRegistration } = await import("@/features/registration/actions");
const registration = await import("@/server/services/registration");
const waiver = await import("@/server/services/waiver");
const { signFormTimestamp } = await import("@/server/security/spam");
const { MemoryMailer, setMailer } = await import("@/server/email/mailer");
const { getDb } = await import("@/server/db/client");
const { emailLog } = await import("@/server/db/schema");
const { zonedDateTimeToUtc } = await import("@/lib/dates");

const mailer = new MemoryMailer();
setMailer(mailer);

function form(values: Record<string, string>, opts: { bot?: boolean } = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  f.set("website", opts.bot ? "http://spam.example" : "");
  f.set("formTs", signFormTimestamp(Date.now() - 10_000));
  return f;
}

describe("US3 registration", () => {
  let editionId: string;
  let waiverVersionId: string;

  async function openRegistration(capacity: number | null = null) {
    const organizer = await createTestOrganizer();
    const day = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const edition = await createTestEdition({
      startsAt: zonedDateTimeToUtc(day, "18:00", "America/Chicago"),
      registrationOpen: true,
      capacity,
    });
    editionId = edition.id;
    const version = await waiver.saveWaiver(editionId, "Ride at your own risk. ".repeat(5));
    await waiver.approveWaiver(editionId, version.id, organizer.id);
    waiverVersionId = version.id;
  }

  const submit = (overrides: Record<string, string> = {}, opts?: { bot?: boolean }) =>
    registerRider({ ok: false }, form({ ...validRegistration, waiverVersionId, ...overrides }, opts));

  beforeEach(async () => {
    resetCookies();
    mailer.clear();
    await createTestDb();
  });

  it("saves a registration and emails a confirmation with ride details and a cancel link", async () => {
    await openRegistration();
    const result = await submit();
    expect(result.ok).toBe(true);
    const rows = await registration.listForEdition(editionId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ fullName: "Riley Rider", email: "riley@example.com", partySize: 2, status: "active" });
    expect(rows[0]?.waiverVersionId).toBe(waiverVersionId);
    expect(rows[0]?.waiverAcceptedAt).toBeInstanceOf(Date);

    expect(mailer.sent).toHaveLength(1);
    const email = mailer.sent[0]!;
    expect(email.to).toBe("riley@example.com");
    expect(email.subject).toBe("You're registered for Moonlight Ride 2026");
    expect(email.text).toContain("Carleton Arboretum North Trailhead");
    expect(email.text).toMatch(/6:00 PM C[DS]T/);
    expect(email.text).toMatch(/headlight and taillight/);
    expect(email.text).toContain("/route");
    expect(email.text).toMatch(/\/register\/cancel\/[A-Za-z0-9_-]{43}/);
    expect(email.html).toContain("Riley Rider");
  });

  it("refuses a duplicate active registration for the same email", async () => {
    await openRegistration();
    await submit();
    const again = await submit({ email: "RILEY@example.com" });
    expect(again).toMatchObject({
      ok: false,
      formError:
        "This email is already registered for this year's ride. Check your inbox for your confirmation email.",
    });
    expect(await registration.listForEdition(editionId)).toHaveLength(1);
  });

  it("refuses registration when closed, full, or past, with the reason", async () => {
    await openRegistration(2);
    expect((await submit({ partySize: "3" })).ok).toBe(false); // would exceed capacity
    await submit({ partySize: "2" });
    const full = await submit({ email: "late@example.com", partySize: "1" });
    expect(full).toMatchObject({ ok: false, formError: "Registration is closed: the ride is full." });

    await createTestDb();
    await openRegistration();
    const { updateEdition } = await import("@/server/services/ride");
    await updateEdition(editionId, { registrationOpen: false });
    expect(await submit()).toMatchObject({
      ok: false,
      formError: "Registration is closed: registration isn't open right now.",
    });
    await updateEdition(editionId, { registrationOpen: true, startsAt: new Date("2020-10-24T23:00:00Z") });
    expect(await submit()).toMatchObject({
      ok: false,
      formError: "Registration is closed: this year's ride has already happened.",
    });
  });

  it("does not let two riders take the last spot at the same time", async () => {
    await openRegistration(1);
    const results = await Promise.all([
      submit({ email: "a@example.com", partySize: "1" }),
      submit({ email: "b@example.com", partySize: "1" }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await registration.activeRiderCount(editionId)).toBe(1);
  });

  it("asks the rider to re-accept when the waiver changed after the page loaded", async () => {
    await openRegistration();
    const stale = waiverVersionId;
    const newer = await waiver.saveWaiver(editionId, "Updated waiver text. ".repeat(5));
    const organizer = await createTestOrganizer().catch(() => null);
    await waiver.approveWaiver(editionId, newer.id, organizer?.id ?? null);
    const result = await registerRider({ ok: false }, form({ ...validRegistration, waiverVersionId: stale }));
    expect(result).toMatchObject({
      ok: false,
      formError: "The waiver was just updated. Please review it and accept again.",
    });
  });

  it("still succeeds when the confirmation email fails, and logs the failure", async () => {
    await openRegistration();
    mailer.failNext = true;
    expect((await submit()).ok).toBe(true);
    const logs = await getDb().select().from(emailLog);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ kind: "registration_confirmation", status: "failed" });
  });

  it("cancels with the emailed link, sends a cancellation email, and allows re-registering", async () => {
    await openRegistration();
    await submit();
    const token = mailer.sent[0]!.text.match(/\/register\/cancel\/([A-Za-z0-9_-]{43})/)![1]!;
    const cancelForm = new FormData();
    cancelForm.set("token", token);
    expect((await cancelRegistration({ ok: false }, cancelForm)).ok).toBe(true);
    expect(await registration.activeRiderCount(editionId)).toBe(0);
    expect(mailer.sent.at(-1)?.subject).toBe("Your Moonlight Ride registration is cancelled");

    expect(await cancelRegistration({ ok: false }, cancelForm)).toEqual({
      ok: false,
      formError: "This cancellation link is no longer valid.",
    });
    expect((await submit()).ok).toBe(true);
    expect(await registration.activeRiderCount(editionId)).toBe(2);
  });

  it("rejects an invalid cancellation token", async () => {
    await openRegistration();
    const f = new FormData();
    f.set("token", "not-a-real-token");
    expect(await cancelRegistration({ ok: false }, f)).toEqual({
      ok: false,
      formError: "This cancellation link is no longer valid.",
    });
  });

  it("quietly ignores spam: it looks successful but saves nothing", async () => {
    await openRegistration();
    const result = await submit({}, { bot: true });
    expect(result.ok).toBe(true);
    expect(await registration.listForEdition(editionId)).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("returns field errors and keeps entered values for invalid input", async () => {
    await openRegistration();
    const result = await submit({ email: "bad", fullName: "Kept Name" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors?.email).toEqual(["Enter an email address like name@example.com."]);
    expect(result.values?.fullName).toBe("Kept Name");
  });
});
