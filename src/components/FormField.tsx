import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const control =
  "mt-1 block w-full rounded-md border border-line bg-surface-2 px-3 py-2.5 text-text placeholder:text-muted/70 focus:border-accent aria-[invalid=true]:border-danger";

type Common = { name: string; label: ReactNode; hint?: ReactNode; errors?: string[] };

function describedBy(name: string, hint?: ReactNode, errors?: string[]) {
  return [hint ? `${name}-hint` : null, errors?.length ? `${name}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;
}

function Messages({ name, hint, errors }: Omit<Common, "label">) {
  return (
    <>
      {hint ? (
        <p id={`${name}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {errors?.length ? (
        <p id={`${name}-error`} className="mt-1 text-sm font-medium text-danger">
          {errors.join(" ")}
        </p>
      ) : null}
    </>
  );
}

/** Labeled input with a hint and an error message linked through aria-describedby. */
export function TextField({
  name,
  label,
  hint,
  errors,
  ...rest
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={rest.id ?? name} className="block font-medium">
        {label}
        {rest.required ? null : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      <input
        id={rest.id ?? name}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(name, hint, errors)}
        className={control}
        {...rest}
      />
      <Messages name={name} hint={hint} errors={errors} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  errors,
  ...rest
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={rest.id ?? name} className="block font-medium">
        {label}
        {rest.required ? null : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      <textarea
        id={rest.id ?? name}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(name, hint, errors)}
        className={`${control} font-mono text-sm`}
        {...rest}
      />
      <Messages name={name} hint={hint} errors={errors} />
    </div>
  );
}

/** Form-level message (error or success), announced to screen readers. */
export function FormMessage({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      tabIndex={-1}
      className={`rounded-md border px-4 py-3 ${
        kind === "error" ? "border-danger text-danger" : "border-success text-success"
      }`}
    >
      {children}
    </div>
  );
}
