// Kept out of the "use client" Button module: server components that import a value from a
// client module get a reference placeholder, not the class strings.
const base =
  "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const buttonStyles = {
  primary: `${base} bg-accent text-night hover:bg-accent-strong`,
  secondary: `${base} border border-accent text-accent hover:bg-accent/10`,
  danger: `${base} border border-danger text-danger hover:bg-danger/10`,
  ghost: `${base} text-muted hover:text-text`,
} as const;
