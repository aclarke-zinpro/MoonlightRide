"use server";

import { revalidatePath } from "next/cache";
import { fieldErrorsFrom, formValues, GENERIC_ERROR, type ActionResult } from "@/lib/action-result";
import { getEnv } from "@/lib/env";
import { sendEmail } from "@/server/email/mailer";
import {
  registrationCancelledEmail,
  registrationConfirmationEmail,
} from "@/server/email/templates/registration";
import { describeError, logger } from "@/server/logger";
import { getClientIp } from "@/server/request";
import { checkRateLimit } from "@/server/security/rate-limit";
import { checkSpam } from "@/server/security/spam";
import { cancelByToken, register } from "@/server/services/registration";
import { CLOSED_REASON_TEXT, getCurrentEdition } from "@/server/services/ride";
import { REGISTERED_MESSAGE, registerSchema } from "./schema";

const SECRET_FIELDS = ["website", "formTs", "acceptWaiver", "waiverVersionId"];

export async function registerRider(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const values = formValues(form, SECRET_FIELDS);
  try {
    // Bots get the normal success response and learn nothing (research.md R7).
    if (checkSpam(form).isBot) return { ok: true, message: REGISTERED_MESSAGE };
    if (!(await checkRateLimit("register", await getClientIp())).allowed) {
      return { ok: true, message: REGISTERED_MESSAGE };
    }

    const parsed = registerSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values };

    const edition = await getCurrentEdition();
    if (!edition) return { ok: false, formError: `Registration is closed: ${CLOSED_REASON_TEXT.organizer_closed}.` };

    const { acceptWaiver: _accepted, ...input } = parsed.data;
    const result = await register({
      ...input,
      editionId: edition.id,
      waiverVersionId: String(form.get("waiverVersionId") ?? ""),
    });

    if (!result.ok) {
      switch (result.error) {
        case "duplicate":
          return {
            ok: false,
            formError:
              "This email is already registered for this year's ride. Check your inbox for your confirmation email.",
            values,
          };
        case "stale_waiver":
          return {
            ok: false,
            formError: "The waiver was just updated. Please review it and accept again.",
            values,
          };
        case "too_many":
          return {
            ok: false,
            fieldErrors: {
              partySize: [
                `Only ${result.spotsLeft} ${result.spotsLeft === 1 ? "spot is" : "spots are"} left. Lower your party size.`,
              ],
            },
            values,
          };
        case "closed":
          return { ok: false, formError: `Registration is closed: ${CLOSED_REASON_TEXT[result.reason]}.` };
      }
    }

    await sendEmail({
      kind: "registration_confirmation",
      relatedId: result.registration.id,
      message: registrationConfirmationEmail({
        registration: result.registration,
        edition: result.edition,
        siteUrl: getEnv().SITE_URL,
        cancelToken: result.cancelToken,
      }),
    });
    revalidatePath("/register");
    logger.info({ event: "registered", registrationId: result.registration.id }, "Rider registered");
    return { ok: true, message: REGISTERED_MESSAGE };
  } catch (error) {
    logger.error({ err: describeError(error) }, "registerRider failed");
    return { ok: false, formError: GENERIC_ERROR, values };
  }
}

export async function cancelRegistration(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    if (!(await checkRateLimit("cancel", await getClientIp())).allowed) {
      return { ok: false, formError: "This cancellation link is no longer valid." };
    }
    const cancelled = await cancelByToken(String(form.get("token") ?? ""));
    if (!cancelled) return { ok: false, formError: "This cancellation link is no longer valid." };
    await sendEmail({
      kind: "registration_cancelled",
      relatedId: cancelled.registration.id,
      message: registrationCancelledEmail({
        registration: cancelled.registration,
        edition: cancelled.edition,
        siteUrl: getEnv().SITE_URL,
      }),
    });
    // No revalidatePath here: refreshing this page would replace the confirmation with the
    // "link no longer valid" message, and every page already renders on request.
    return { ok: true, message: "Your registration is cancelled." };
  } catch (error) {
    logger.error({ err: describeError(error) }, "cancelRegistration failed");
    return { ok: false, formError: GENERIC_ERROR };
  }
}
