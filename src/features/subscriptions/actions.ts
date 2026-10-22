"use server";

import { z } from "zod";
import { fieldErrorsFrom, GENERIC_ERROR, type ActionResult } from "@/lib/action-result";
import { describeError, logger } from "@/server/logger";
import { getClientIp } from "@/server/request";
import { checkRateLimit } from "@/server/security/rate-limit";
import { checkSpam } from "@/server/security/spam";
import * as subscription from "@/server/services/subscription";

const NEUTRAL = "Thanks! Check your email to confirm your subscription.";

const subscribeSchema = z.object({
  email: z
    .string({ error: "Enter an email address like name@example.com." })
    .trim()
    .toLowerCase()
    .max(254, { error: "Enter an email address like name@example.com." })
    .pipe(z.email({ error: "Enter an email address like name@example.com." })),
});

/** Always answers the same way, so the form never reveals who is subscribed (US4 scenario 5). */
export async function subscribe(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    if (checkSpam(form).isBot) return { ok: true, message: NEUTRAL };
    if (!(await checkRateLimit("subscribe", await getClientIp())).allowed) {
      return { ok: true, message: NEUTRAL };
    }
    const parsed = subscribeSchema.safeParse({ email: form.get("email") });
    if (!parsed.success) {
      return {
        ok: false,
        fieldErrors: fieldErrorsFrom(parsed.error),
        values: { email: String(form.get("email") ?? "") },
      };
    }
    const { subscriberId, token } = await subscription.subscribe(parsed.data.email);
    if (token) await subscription.sendConfirmation(parsed.data.email, subscriberId, token);
    return { ok: true, message: NEUTRAL };
  } catch (error) {
    logger.error({ err: describeError(error) }, "subscribe failed");
    return { ok: false, formError: GENERIC_ERROR };
  }
}

export async function unsubscribe(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    if ((await checkRateLimit("unsubscribe", await getClientIp())).allowed) {
      await subscription.unsubscribe(String(form.get("token") ?? ""));
    }
    return { ok: true, message: "You're unsubscribed. You won't get any more Moonlight Ride updates." };
  } catch (error) {
    logger.error({ err: describeError(error) }, "unsubscribe failed");
    return { ok: false, formError: GENERIC_ERROR };
  }
}
