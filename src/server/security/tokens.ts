import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Hashes a token for storage; only hashes are kept in the database (research.md R8). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A random 32-byte, URL-safe token and the hash to store for it. */
export function createToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function verifyToken(token: string, storedHash: string): boolean {
  const actual = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
