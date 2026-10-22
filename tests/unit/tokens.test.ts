import { describe, expect, it } from "vitest";
import { createToken, hashToken, verifyToken } from "@/server/security/tokens";

describe("email link tokens (foundation)", () => {
  it("creates a 32-byte base64url token and its SHA-256 hash", () => {
    const { token, hash } = createToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(token)).toBe(hash);
  });

  it("creates different tokens each time", () => {
    expect(createToken().token).not.toBe(createToken().token);
  });

  it("verifies a token against its stored hash", () => {
    const { token, hash } = createToken();
    expect(verifyToken(token, hash)).toBe(true);
    expect(verifyToken(createToken().token, hash)).toBe(false);
    expect(verifyToken(token, "not-a-hash")).toBe(false);
  });
});
