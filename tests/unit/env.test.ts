import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const productionBase = {
  NODE_ENV: "production",
  DATABASE_URL: "postgres://user:pass@db.example.com:5432/ride",
  AUTH_SECRET: "a".repeat(40),
  IP_HASH_SECRET: "ip-secret-value",
  RESEND_API_KEY: "re_test_key",
  MAIL_FROM: "Moonlight Ride <ride@example.com>",
  SITE_URL: "https://moonlightride.example.com",
  CRON_SECRET: "cron-secret-value",
};

describe("env validation (foundation)", () => {
  it("accepts a complete production configuration", () => {
    const env = parseEnv(productionBase);
    expect(env.SITE_URL).toBe("https://moonlightride.example.com");
    expect(env.isProduction).toBe(true);
  });

  it("throws a clear message when AUTH_SECRET is missing", () => {
    const { AUTH_SECRET: _omit, ...rest } = productionBase;
    expect(() => parseEnv(rest)).toThrow(/AUTH_SECRET/);
  });

  it("requires DATABASE_URL in production", () => {
    const { DATABASE_URL: _omit, ...rest } = productionBase;
    expect(() => parseEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it("makes DATABASE_URL optional outside production", () => {
    const env = parseEnv({ NODE_ENV: "development" });
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it("treats E2E=1 as a non-production runtime", () => {
    const env = parseEnv({ NODE_ENV: "production", E2E: "1", AUTH_SECRET: "b".repeat(40) });
    expect(env.isE2E).toBe(true);
    expect(env.isProduction).toBe(false);
  });
});
