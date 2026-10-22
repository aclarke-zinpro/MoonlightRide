"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/Button";
import { FormMessage } from "@/components/FormField";
import { idle } from "@/lib/action-result";
import { unsubscribe } from "../actions";

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action] = useActionState(unsubscribe, idle);
  if (state.ok) return <FormMessage kind="success">{state.message}</FormMessage>;
  return (
    <form action={action} className="space-y-4">
      {state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}
      <input type="hidden" name="token" value={token} />
      <SubmitButton pendingLabel="Unsubscribing…">Unsubscribe</SubmitButton>
    </form>
  );
}
