import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";

/** Name of the hidden field real people never fill in. */
export const HONEYPOT_FIELD = "website";
export const FORM_TS_FIELD = "formTs";
const MIN_FILL_MS = 3_000;

function sign(value: string): string {
  return createHmac("sha256", getEnv().AUTH_SECRET).update(`form-ts:${value}`).digest("base64url");
}

/** A signed "form rendered at" timestamp to place in a hidden field. */
export function signFormTimestamp(now = Date.now()): string {
  const ts = String(now);
  return `${ts}.${sign(ts)}`;
}

export type SpamVerdict = { isBot: boolean; reason?: "honeypot" | "too_fast" | "bad_timestamp" };

/** Layered, puzzle-free bot detection (research.md R7). */
export function checkSpam(form: FormData, now = Date.now()): SpamVerdict {
  const honeypot = form.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { isBot: true, reason: "honeypot" };
  }
  const raw = form.get(FORM_TS_FIELD);
  if (typeof raw !== "string") return { isBot: true, reason: "bad_timestamp" };
  const [ts, signature] = raw.split(".");
  if (!ts || !signature) return { isBot: true, reason: "bad_timestamp" };
  const expected = Buffer.from(sign(ts));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { isBot: true, reason: "bad_timestamp" };
  }
  if (now - Number(ts) < MIN_FILL_MS) return { isBot: true, reason: "too_fast" };
  return { isBot: false };
}
