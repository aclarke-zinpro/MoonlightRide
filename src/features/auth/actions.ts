"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { GENERIC_ERROR, type ActionResult } from "@/lib/action-result";
import { safeNext } from "@/lib/safe-next";
import { endSession, startSession } from "@/server/auth/session";
import { describeError, logger } from "@/server/logger";
import { getClientIp } from "@/server/request";
import { authenticate } from "@/server/services/organizer";

const signInSchema = z.object({
  email: z.string().trim().min(1, { error: "Enter your email address." }),
  password: z.string().min(1, { error: "Enter your password." }),
  next: z.string().optional(),
});

export async function signIn(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    next: form.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      formError: "Email or password is incorrect.",
      values: { email: String(form.get("email") ?? "") },
    };
  }

  let destination: string;
  try {
    const result = await authenticate({
      email: parsed.data.email,
      password: parsed.data.password,
      ip: await getClientIp(),
    });
    if (!result.ok) {
      return { ok: false, formError: result.error, values: { email: parsed.data.email } };
    }
    await startSession(result.organizer.id);
    destination = safeNext(parsed.data.next);
  } catch (error) {
    logger.error({ err: describeError(error) }, "Sign-in failed");
    return { ok: false, formError: GENERIC_ERROR };
  }
  redirect(destination);
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}
