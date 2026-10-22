"use client";

import { ErrorView } from "@/components/ErrorView";

export default function PublicError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorView error={error} retry={retry} />;
}
