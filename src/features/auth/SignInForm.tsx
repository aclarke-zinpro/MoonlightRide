"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/Button";
import { FormMessage, TextField } from "@/components/FormField";
import { idle } from "@/lib/action-result";
import { signIn } from "./actions";

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, idle);
  const values = !state.ok ? state.values : undefined;
  return (
    <form action={action} className="space-y-5" noValidate>
      {!state.ok && state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField
        name="email"
        label="Email"
        type="email"
        autoComplete="username"
        required
        defaultValue={values?.email}
      />
      <TextField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
      />
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
