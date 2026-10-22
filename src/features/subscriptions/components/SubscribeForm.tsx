"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/Button";
import { SpamFields } from "@/components/SpamFields";
import { idle } from "@/lib/action-result";
import { subscribe } from "../actions";

/** Footer sign-up for ride updates (FR-019). */
export function SubscribeForm({ formTs }: { formTs: string }) {
  const [state, action] = useActionState(subscribe, idle);
  const error = !state.ok ? (state.fieldErrors?.email?.join(" ") ?? state.formError) : undefined;

  return (
    <section id="subscribe" aria-labelledby="subscribe-heading" className="space-y-3">
      <h2 id="subscribe-heading" className="text-2xl font-bold">
        Get ride updates
      </h2>
      <p className="text-muted">
        News about this year&apos;s ride and next year&apos;s date. No spam; unsubscribe anytime.
      </p>
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
        <SpamFields formTs={formTs} />
        <div className="flex-1">
          <label htmlFor="subscribe-email" className="block font-medium">
            Email for updates
          </label>
          <input
            id="subscribe-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={!state.ok ? state.values?.email : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "subscribe-error" : undefined}
            className="mt-1 block w-full rounded-md border border-line bg-surface-2 px-3 py-2.5 aria-[invalid=true]:border-danger"
          />
        </div>
        <SubmitButton pendingLabel="Signing up…">Sign me up</SubmitButton>
      </form>
      <div aria-live="polite">
        {state.ok ? <p className="font-medium text-success">{state.message}</p> : null}
        {error ? (
          <p id="subscribe-error" className="font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
