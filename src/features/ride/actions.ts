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
import { requireCurrentEdition, updateEdition } from "@/server/services/ride";
import { updateRideEditionSchema } from "./schema";

export async function updateRideEdition(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireOrganizer();
    const parsed = updateRideEditionSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(form) };
    }
    const edition = await requireCurrentEdition();
    await updateEdition(edition.id, parsed.data);
    for (const path of ["/", "/route", "/register"]) revalidatePath(path);
    return { ok: true, message: "Ride details saved." };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, formError: SIGN_IN_AGAIN };
    logger.error({ err: describeError(error) }, "updateRideEdition failed");
    return { ok: false, formError: GENERIC_ERROR, values: formValues(form) };
  }
}
