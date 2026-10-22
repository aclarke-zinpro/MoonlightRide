import type { z } from "zod";

/** The result every server action returns (contracts/server-actions.md). Actions never throw. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: Record<string, string[]>;
      values?: Record<string, string>;
    };

/** Initial state for useActionState. */
export const idle = { ok: false } as ActionResult<never>;

export const GENERIC_ERROR = "Something went wrong on our side. Please try again in a minute.";
export const SIGN_IN_AGAIN = "Please sign in again.";

export function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Echoes submitted text values (minus secrets and files) so forms keep what people typed. */
export function formValues(form: FormData, exclude: string[] = []): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !exclude.includes(key) && !key.startsWith("$")) {
      out[key] = value;
    }
  }
  return out;
}
