import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";
import { createTestOrganizer, TEST_ORGANIZER } from "../helpers/fixtures";
import { cookieJar, resetCookies } from "../helpers/next-mocks";

vi.mock("next/headers", async () => (await import("../helpers/next-mocks")).nextHeadersMock);

const { authenticate } = await import("@/server/services/organizer");
const { createSessionToken, getSession, requireOrganizer, readSessionToken, SESSION_COOKIE } =
  await import("@/server/auth/session");

describe("organizer sign-in (foundation)", () => {
  beforeEach(async () => {
    resetCookies();
    await createTestDb();
    await createTestOrganizer();
  });

  it("signs in with correct credentials and creates a session", async () => {
    const result = await authenticate({
      email: TEST_ORGANIZER.email,
      password: TEST_ORGANIZER.password,
      ip: "198.51.100.1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const token = await createSessionToken(result.organizer.id);
    expect(await readSessionToken(token)).toEqual({ organizerId: result.organizer.id });
  });

  it("matches the email case-insensitively", async () => {
    const result = await authenticate({
      email: TEST_ORGANIZER.email.toUpperCase(),
      password: TEST_ORGANIZER.password,
      ip: "198.51.100.1",
    });
    expect(result.ok).toBe(true);
  });

  it("returns a generic error for a wrong password or unknown email", async () => {
    const wrong = await authenticate({
      email: TEST_ORGANIZER.email,
      password: "wrong-password",
      ip: "198.51.100.1",
    });
    expect(wrong).toEqual({ ok: false, error: "Email or password is incorrect." });
    const unknown = await authenticate({
      email: "nobody@example.com",
      password: "whatever-password",
      ip: "198.51.100.1",
    });
    expect(unknown).toEqual({ ok: false, error: "Email or password is incorrect." });
  });

  it("throttles after 5 failures in 15 minutes, even with the right password", async () => {
    for (let i = 0; i < 5; i++) {
      await authenticate({ email: TEST_ORGANIZER.email, password: "bad", ip: "198.51.100.2" });
    }
    const result = await authenticate({
      email: TEST_ORGANIZER.email,
      password: TEST_ORGANIZER.password,
      ip: "198.51.100.3",
    });
    expect(result).toEqual({
      ok: false,
      error: "Too many sign-in attempts. Try again in 15 minutes.",
    });
  });

  it("rejects a tampered session token", async () => {
    const token = await createSessionToken("00000000-0000-0000-0000-000000000000");
    expect(await readSessionToken(token + "x")).toBeNull();
  });

  it("requireOrganizer rejects when there is no session", async () => {
    expect(await getSession()).toBeNull();
    await expect(requireOrganizer()).rejects.toThrow(/sign in/i);
  });

  it("requireOrganizer returns the organizer when the session cookie is valid", async () => {
    const result = await authenticate({
      email: TEST_ORGANIZER.email,
      password: TEST_ORGANIZER.password,
      ip: "198.51.100.1",
    });
    if (!result.ok) throw new Error("expected sign-in to succeed");
    cookieJar.set(SESSION_COOKIE, await createSessionToken(result.organizer.id));
    const organizer = await requireOrganizer();
    expect(organizer.email).toBe(TEST_ORGANIZER.email);
  });
});
