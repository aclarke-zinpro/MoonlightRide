"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/route", label: "Route" },
  { href: "/register", label: "Register" },
  { href: "/updates", label: "Updates" },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="border-b border-line bg-surface">
      <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-1 px-2 sm:gap-4">
        {LINKS.map(({ href, label }) => {
          const current = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`inline-block px-3 py-3 font-medium no-underline sm:px-4 ${
                  current ? "text-accent underline decoration-2" : "text-text hover:text-accent"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
