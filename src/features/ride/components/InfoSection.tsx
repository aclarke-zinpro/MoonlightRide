import type { ReactNode } from "react";
import { Divider } from "@/components/Divider";
import { Prose } from "@/components/Prose";

export function InfoSection({
  title,
  markdown,
  children,
  id,
}: {
  title: string;
  markdown?: string;
  children?: ReactNode;
  id?: string;
}) {
  if (!markdown?.trim() && !children) return null;
  return (
    <section id={id} aria-labelledby={`${id ?? title}-heading`} className="space-y-3">
      <Divider className="max-w-xs" />
      <h2 id={`${id ?? title}-heading`} className="text-2xl font-bold">
        {title}
      </h2>
      {markdown ? <Prose markdown={markdown} /> : null}
      {children}
    </section>
  );
}
