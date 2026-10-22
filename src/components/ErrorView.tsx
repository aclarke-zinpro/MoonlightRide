"use client";

import { useEffect } from "react";
import { buttonStyles } from "./Button";

/** Shared body for error.tsx boundaries: says what happened and what to do next. */
export function ErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Server errors are logged on the server; this keeps a breadcrumb in the browser console.
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p>
        We couldn&apos;t load this page. It&apos;s probably temporary. Please try again, and if it
        keeps happening, check back in a few minutes.
      </p>
      <button type="button" onClick={() => retry()} className={buttonStyles.primary}>
        Try again
      </button>
    </section>
  );
}
