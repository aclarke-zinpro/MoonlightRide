"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/Button";
import { FormMessage } from "@/components/FormField";
import { idle } from "@/lib/action-result";
import { cancelRegistration } from "../actions";

export function CancelForm({ token }: { token: string }) {
  const [state, action] = useActionState(cancelRegistration, idle);
  if (state.ok) {
    return (
      <div className="space-y-3">
        <FormMessage kind="success">{state.message}</FormMessage>
        <p>
          We sent a confirmation email. Changed your mind? <Link href="/register">Register again</Link>{" "}
          while registration is open.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      {state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}
      <input type="hidden" name="token" value={token} />
      <SubmitButton variant="danger" pendingLabel="Cancelling…">
        Cancel my registration
      </SubmitButton>
    </form>
  );
}
