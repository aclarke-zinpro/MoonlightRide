"use client";

import { useActionState } from "react";
import { buttonStyles, SubmitButton } from "@/components/Button";
import { FormMessage, TextAreaField, TextField } from "@/components/FormField";
import { Prose } from "@/components/Prose";
import { idle } from "@/lib/action-result";
import { approveWaiver, saveWaiver, setRegistrationSettings } from "../admin-actions";

export function WaiverEditor(props: {
  current: { id: string; version: number; body: string; approvedAt: string | null } | null;
}) {
  const { current } = props;
  const [state, action] = useActionState(saveWaiver, idle);
  const errors = !state.ok ? state.fieldErrors : undefined;

  return (
    <div className="space-y-5">
      {current ? (
        <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
          <p className="font-semibold">
            Version {current.version}:{" "}
            {current.approvedAt ? (
              <span className="text-success">Approved {current.approvedAt}</span>
            ) : (
              <span className="text-danger">Not approved. Riders can&apos;t register until you approve it.</span>
            )}
          </p>
          <details>
            <summary className="cursor-pointer text-accent">Preview the waiver riders see</summary>
            <div className="mt-3 max-h-80 overflow-y-auto rounded border border-line p-3 text-sm">
              <Prose markdown={current.body} />
            </div>
          </details>
          {!current.approvedAt ? (
            <form action={approveWaiver}>
              <input type="hidden" name="versionId" value={current.id} />
              <button type="submit" className={buttonStyles.primary}>
                Approve this version
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        <p>No waiver yet. Write one below.</p>
      )}

      <form action={action} className="space-y-3" noValidate>
        {state.ok && state.message ? <FormMessage kind="success">{state.message}</FormMessage> : null}
        {!state.ok && state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}
        <TextAreaField
          name="body"
          label="Waiver text (Markdown)"
          required
          rows={12}
          defaultValue={(!state.ok && state.values?.body) || current?.body}
          errors={errors?.body}
          hint="Saving creates a new version that must be approved again. Riders' acceptances record the version they saw."
        />
        <SubmitButton variant="secondary" pendingLabel="Saving…">
          Save as new version
        </SubmitButton>
      </form>
    </div>
  );
}

export function RegistrationSettingsForm(props: {
  open: boolean;
  capacity: number | null;
  riders: number;
}) {
  const [state, action] = useActionState(setRegistrationSettings, idle);
  const errors = !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.ok && state.message ? <FormMessage kind="success">{state.message}</FormMessage> : null}
      {!state.ok && state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}
      <p>{props.riders === 1 ? "1 rider is" : `${props.riders} riders are`} registered.</p>
      <label htmlFor="open" className="flex items-center gap-3">
        <input id="open" name="open" type="checkbox" defaultChecked={props.open} className="h-5 w-5 accent-accent" />
        Registration is open
      </label>
      <div className="max-w-xs">
        <TextField
          name="capacity"
          label="Capacity"
          inputMode="numeric"
          defaultValue={props.capacity ?? ""}
          errors={errors?.capacity}
          hint="Maximum riders. Leave blank for no limit. Registration closes automatically when full."
        />
      </div>
      <SubmitButton pendingLabel="Saving…">Save registration settings</SubmitButton>
    </form>
  );
}
