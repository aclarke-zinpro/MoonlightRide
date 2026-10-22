"use server";

import { revalidatePath } from "next/cache";
import {
  fieldErrorsFrom,
  formValues,
  GENERIC_ERROR,
  SIGN_IN_AGAIN,
  type ActionResult,
} from "@/lib/action-result";
import { requireOrganizer, UnauthorizedError } from "@/server/auth/session";
import { describeError, logger } from "@/server/logger";
import { activeRiderCount } from "@/server/services/registration";
import { requireCurrentEdition, updateEdition } from "@/server/services/ride";
import * as waiver from "@/server/services/waiver";
import { registrationSettingsSchema, waiverSchema } from "./schema";

function refresh() {
  revalidatePath("/register");
  revalidatePath("/admin/ride");
}

function failure(error: unknown, label: string, form?: FormData): ActionResult {
  if (error instanceof UnauthorizedError) return { ok: false, formError: SIGN_IN_AGAIN };
  logger.error({ err: describeError(error) }, `${label} failed`);
  return { ok: false, formError: GENERIC_ERROR, values: form ? formValues(form) : undefined };
}

export async function saveWaiver(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    await requireOrganizer();
    const parsed = waiverSchema.safeParse({ body: form.get("body") });
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(form) };
    }
    const edition = await requireCurrentEdition();
    const current = await waiver.getCurrentWaiver(edition.id);
    if (current && current.body === parsed.data.body) {
      return { ok: true, message: "No changes to save." };
    }
    const saved = await waiver.saveWaiver(edition.id, parsed.data.body);
    refresh();
    return {
      ok: true,
      message: `Saved as version ${saved.version}. Approve it before riders can register.`,
    };
  } catch (error) {
    return failure(error, "saveWaiver", form);
  }
}

export async function approveWaiver(form: FormData): Promise<void> {
  try {
    const organizer = await requireOrganizer();
    const edition = await requireCurrentEdition();
    await waiver.approveWaiver(edition.id, String(form.get("versionId")), organizer.id);
    refresh();
  } catch (error) {
    if (error instanceof UnauthorizedError) return;
    logger.error({ err: describeError(error) }, "approveWaiver failed");
    throw error;
  }
}

export async function setRegistrationSettings(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireOrganizer();
    const parsed = registrationSettingsSchema.safeParse({
      open: form.get("open"),
      capacity: form.get("capacity"),
    });
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(form) };
    }
    const edition = await requireCurrentEdition();
    const { open, capacity } = parsed.data;

    if (open) {
      const current = await waiver.getCurrentWaiver(edition.id);
      if (!current?.approvedAt) {
        return { ok: false, formError: "Approve the waiver before opening registration." };
      }
    }
    const riders = await activeRiderCount(edition.id);
    if (capacity !== null && capacity < riders) {
      return {
        ok: false,
        fieldErrors: {
          capacity: [`Capacity can't be lower than ${riders}: ${riders} riders are already registered.`],
        },
        values: formValues(form),
      };
    }
    await updateEdition(edition.id, { registrationOpen: open, capacity });
    refresh();
    revalidatePath("/");
    return { ok: true, message: "Registration settings saved." };
  } catch (error) {
    return failure(error, "setRegistrationSettings", form);
  }
}
