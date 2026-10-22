import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/button-styles";
import { formatShortDate } from "@/lib/dates";
import { activeCount, listSubscribers } from "@/server/services/subscription";

export const metadata: Metadata = { title: "Subscribers" };

const FILTERS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Waiting to confirm" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "all", label: "All" },
] as const;

export default async function SubscribersPage({ searchParams }: PageProps<"/admin/subscribers">) {
  const { status: raw } = await searchParams;
  const status = FILTERS.some((f) => f.value === raw) ? (raw as (typeof FILTERS)[number]["value"]) : "active";
  const [rows, active] = await Promise.all([
    listSubscribers(status === "all" ? undefined : status),
    activeCount(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Update subscribers</h1>
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-2xl font-bold" data-testid="active-subscribers">
          {active === 1 ? "1 active subscriber" : `${active} active subscribers`}
        </p>
        <a href="/admin/subscribers/export" className={buttonStyles.secondary} download>
          Download CSV
        </a>
      </div>
      <p className="text-muted">
        Subscribers get an email when you publish a post with &quot;Email this post to subscribers&quot;
        checked.
      </p>
      <nav aria-label="Filter subscribers" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/subscribers?status=${f.value}`}
            aria-current={status === f.value ? "page" : undefined}
            className={status === f.value ? buttonStyles.primary : buttonStyles.ghost}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p>No subscribers in this list.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Subscribers ({status})</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-2 pr-4">Email</th>
              <th scope="col" className="py-2 pr-4">Status</th>
              <th scope="col" className="py-2 pr-4">Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-line">
                <td className="py-2 pr-4">{s.email}</td>
                <td className="py-2 pr-4">{s.status}</td>
                <td className="py-2 pr-4">{s.confirmedAt ? formatShortDate(s.confirmedAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
