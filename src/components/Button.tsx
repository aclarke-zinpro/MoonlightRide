"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { buttonStyles } from "./button-styles";

export { buttonStyles };


type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles;
  pendingLabel?: string;
};

/** A submit button that disables itself and shows progress while its form is submitting. */
export function SubmitButton({
  variant = "primary",
  pendingLabel,
  children,
  className = "",
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...rest}
      disabled={pending || rest.disabled}
      aria-disabled={pending || rest.disabled}
      className={`${buttonStyles[variant]} ${className}`}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
