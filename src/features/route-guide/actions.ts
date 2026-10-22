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
import { requireCurrentEdition } from "@/server/services/ride";
import * as route from "@/server/services/route";
import { cueSchema, poiSchema } from "./schema";

function refresh() {
  revalidatePath("/route");
  revalidatePath("/admin/route");
}

function failure(error: unknown, form: FormData, label: string): ActionResult {
  if (error instanceof UnauthorizedError) return { ok: false, formError: SIGN_IN_AGAIN };
  if (error instanceof route.RouteValidationError) {
    return error.field === "_form"
      ? { ok: false, formError: error.message, values: formValues(form) }
      : { ok: false, fieldErrors: { [error.field]: [error.message] }, values: formValues(form) };
  }
  logger.error({ err: describeError(error) }, `${label} failed`);
  return { ok: false, formError: GENERIC_ERROR, values: formValues(form) };
}

export async function saveCue(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    await requireOrganizer();
    const parsed = cueSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(form) };
    }
    await route.saveCue(await requireCurrentEdition(), parsed.data);
    refresh();
    return { ok: true, message: "Saved." };
  } catch (error) {
    return failure(error, form, "saveCue");
  }
}

export async function savePoi(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    await requireOrganizer();
    const parsed = poiSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(form) };
    }
    await route.savePoi(await requireCurrentEdition(), parsed.data);
    refresh();
    return { ok: true, message: "Saved." };
  } catch (error) {
    return failure(error, form, "savePoi");
  }
}

// The actions below back plain <form> buttons (delete, move up/down); they need no result state.

async function withOrganizer(label: string, fn: (editionId: string) => Promise<void>) {
  try {
    await requireOrganizer();
    await fn((await requireCurrentEdition()).id);
    refresh();
  } catch (error) {
    if (error instanceof UnauthorizedError) return;
    logger.error({ err: describeError(error) }, `${label} failed`);
    throw error;
  }
}

const idsFrom = (form: FormData) => String(form.get("ids") ?? "").split(",").filter(Boolean);

export async function deleteCue(form: FormData): Promise<void> {
  await withOrganizer("deleteCue", (editionId) => route.deleteCue(editionId, String(form.get("id"))));
}

export async function deletePoi(form: FormData): Promise<void> {
  await withOrganizer("deletePoi", (editionId) => route.deletePoi(editionId, String(form.get("id"))));
}

export async function reorderCues(form: FormData): Promise<void> {
  await withOrganizer("reorderCues", (editionId) => route.reorderCues(editionId, idsFrom(form)));
}

export async function reorderPois(form: FormData): Promise<void> {
  await withOrganizer("reorderPois", (editionId) => route.reorderPois(editionId, idsFrom(form)));
}
