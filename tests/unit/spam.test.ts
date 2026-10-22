import { beforeEach, describe, expect, it } from "vitest";
import { checkSpam, signFormTimestamp } from "@/server/security/spam";
import { checkRateLimit } from "@/server/security/rate-limit";
import { createTestDb } from "../helpers/db";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

describe("spam checks (foundation)", () => {
  const now = Date.parse("2026-10-01T12:00:00Z");

  it("accepts a human submission", () => {
    const formTs = signFormTimestamp(now - 10_000);
    expect(checkSpam(form({ website: "", formTs }), now).isBot).toBe(false);
  });

  it("flags a filled honeypot", () => {
    const formTs = signFormTimestamp(now - 10_000);
    expect(checkSpam(form({ website: "http://spam", formTs }), now).isBot).toBe(true);
  });

  it("flags a form completed in under 3 seconds", () => {
    const formTs = signFormTimestamp(now - 2_000);
    expect(checkSpam(form({ website: "", formTs }), now).isBot).toBe(true);
  });

  it("flags a tampered or missing timestamp", () => {
    const formTs = signFormTimestamp(now - 10_000);
    const [ts] = formTs.split(".");
    expect(checkSpam(form({ website: "", formTs: `${ts}.forged` }), now).isBot).toBe(true);
    expect(checkSpam(form({ website: "" }), now).isBot).toBe(true);
  });
});

describe("rate limiting (foundation)", () => {
  beforeEach(async () => {
    await createTestDb();
  });

  it("allows 10 submissions per IP per bucket per hour and refuses the 11th", async () => {
    const now = new Date("2026-10-01T12:00:00Z");
    for (let i = 0; i < 10; i++) {
      expect((await checkRateLimit("register", "203.0.113.5", now)).allowed).toBe(true);
    }
    expect((await checkRateLimit("register", "203.0.113.5", now)).allowed).toBe(false);
    // Other IPs and buckets are unaffected.
    expect((await checkRateLimit("register", "203.0.113.6", now)).allowed).toBe(true);
    expect((await checkRateLimit("subscribe", "203.0.113.5", now)).allowed).toBe(true);
    // An hour later the window has moved on.
    const later = new Date(now.getTime() + 61 * 60 * 1000);
    expect((await checkRateLimit("register", "203.0.113.5", later)).allowed).toBe(true);
  });
});
