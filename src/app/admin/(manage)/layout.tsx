import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonStyles } from "@/components/button-styles";
import { signOut } from "@/features/auth/actions";
import { requireOrganizer, UnauthorizedError } from "@/server/auth/session";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/ride", label: "Ride" },
  { href: "/admin/route", label: "Route" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/posts", label: "Posts" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  let name: string;
  try {
    name = (await requireOrganizer()).name;
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/login");
    throw error;
  }

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="font-serif text-xl font-bold text-accent">Moonlight Ride · Organizer</p>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span>Signed in as {name}</span>
            <Link href="/">View site</Link>
            <form action={signOut}>
              <button type="submit" className={buttonStyles.ghost}>
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav aria-label="Organizer" className="mx-auto max-w-6xl px-2">
          <ul className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-block px-3 py-2 text-text no-underline hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
