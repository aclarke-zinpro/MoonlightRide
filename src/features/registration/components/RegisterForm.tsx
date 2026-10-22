"use client";

import { useActionState, useEffect, useRef } from "react";
import { SubmitButton } from "@/components/Button";
import { FormMessage, TextField } from "@/components/FormField";
import { Prose } from "@/components/Prose";
import { SpamFields } from "@/components/SpamFields";
import { idle } from "@/lib/action-result";
import { registerRider } from "../actions";

export function RegisterForm(props: {
  waiverVersionId: string;
  waiverBody: string;
  formTs: string;
  spotsLeft: number | null;
}) {
  const { waiverVersionId, waiverBody, formTs, spotsLeft } = props;
  const [state, action] = useActionState(registerRider, idle);
  const summaryRef = useRef<HTMLDivElement>(null);
  const errors = !state.ok ? state.fieldErrors : undefined;
  const values = !state.ok ? state.values : undefined;
  const hasProblem = !state.ok && Boolean(state.formError || state.fieldErrors);

  useEffect(() => {
    if (hasProblem) summaryRef.current?.focus();
  }, [state, hasProblem]);

  if (state.ok) {
    return (
      <section aria-labelledby="registered-heading" className="space-y-3 rounded-lg border border-success p-6" role="status">
        <h2 id="registered-heading" className="text-2xl font-bold">
          You&apos;re registered!
        </h2>
        <p>{state.message}</p>
        <p>The email has the ride details, what to bring, and a link to cancel if your plans change.</p>
      </section>
    );
  }

  const maxParty = Math.min(10, spotsLeft ?? 10);

  return (
    <form action={action} className="space-y-6" noValidate>
      <div ref={summaryRef} tabIndex={-1} className="outline-none">
        {state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}
        {!state.formError && errors ? (
          <FormMessage kind="error">
            Please fix {Object.keys(errors).length === 1 ? "the field" : "the fields"} marked below.
          </FormMessage>
        ) : null}
      </div>
      <SpamFields formTs={formTs} />
      <input type="hidden" name="waiverVersionId" value={waiverVersionId} />

      <fieldset className="space-y-4">
        <legend className="mb-2 font-serif text-xl font-bold text-accent">About you</legend>
        <TextField name="fullName" label="Full name" required autoComplete="name" defaultValue={values?.fullName} errors={errors?.fullName} />
        <TextField name="email" label="Email" type="email" required autoComplete="email" defaultValue={values?.email} errors={errors?.email} hint="We'll send your confirmation here." />
        <TextField name="phone" label="Phone" type="tel" autoComplete="tel" defaultValue={values?.phone} errors={errors?.phone} hint="So we can reach you on ride day." />
        <div>
          <label htmlFor="partySize" className="block font-medium">
            Riders in your party
          </label>
          <select
            id="partySize"
            name="partySize"
            defaultValue={values?.partySize ?? "1"}
            aria-invalid={errors?.partySize ? true : undefined}
            aria-describedby={errors?.partySize ? "partySize-error" : "partySize-hint"}
            className="mt-1 block w-32 rounded-md border border-line bg-surface-2 px-3 py-2.5"
          >
            {Array.from({ length: maxParty }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <p id="partySize-hint" className="mt-1 text-sm text-muted">
            Including you. Up to {maxParty}.
          </p>
          {errors?.partySize ? (
            <p id="partySize-error" className="mt-1 text-sm font-medium text-danger">
              {errors.partySize.join(" ")}
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-serif text-xl font-bold text-accent">Emergency contact</legend>
        <TextField name="emergencyContactName" label="Emergency contact name" required autoComplete="off" defaultValue={values?.emergencyContactName} errors={errors?.emergencyContactName} />
        <TextField name="emergencyContactPhone" label="Emergency contact phone" type="tel" required autoComplete="off" defaultValue={values?.emergencyContactPhone} errors={errors?.emergencyContactPhone} />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-serif text-xl font-bold text-accent">Waiver</legend>
        <div
          role="region"
          aria-label="Ride waiver"
          tabIndex={0}
          className="max-h-72 overflow-y-auto rounded-md border border-line bg-surface p-4 text-sm"
        >
          <Prose markdown={waiverBody} />
        </div>
        <label htmlFor="acceptWaiver" className="flex items-start gap-3">
          <input
            id="acceptWaiver"
            name="acceptWaiver"
            type="checkbox"
            className="mt-1 h-5 w-5 accent-accent"
            aria-invalid={errors?.acceptWaiver ? true : undefined}
            aria-describedby={errors?.acceptWaiver ? "acceptWaiver-error" : undefined}
          />
          <span>I have read and accept the waiver for myself and everyone in my party.</span>
        </label>
        {errors?.acceptWaiver ? (
          <p id="acceptWaiver-error" className="text-sm font-medium text-danger">
            {errors.acceptWaiver.join(" ")}
          </p>
        ) : null}
      </fieldset>

      <SubmitButton pendingLabel="Registering…">Register</SubmitButton>
    </form>
  );
}
