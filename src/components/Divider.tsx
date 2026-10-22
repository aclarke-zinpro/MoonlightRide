/** Thin orange rules with a centered star, as on the info sheet. Decorative only. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-accent/80" />
      <Star className="h-5 w-5 text-accent" />
      <span className="h-px flex-1 bg-accent/80" />
    </div>
  );
}

export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 0l2.2 8.3L21 4.5l-4.3 6.3L24 12l-7.3 1.2 4.3 6.3-6.8-3.8L12 24l-2.2-8.3L3 19.5l4.3-6.3L0 12l7.3-1.2L3 4.5l6.8 3.8z" />
    </svg>
  );
}
