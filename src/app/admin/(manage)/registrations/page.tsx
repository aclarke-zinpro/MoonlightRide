import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/button-styles";
import { formatShortDate } from "@/lib/dates";
import { failedEmailIds } from "@/server/services/email-log";
import { activeRiderCount, listForEdition } from "@/server/services/registration";
import { requireCurrentEdition } from "@/server/services/ride";

export const metadata: Metadata = { title: "Registrations" };

const FILTERS = [
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
] as const;

export default async function RegistrationsPage({ searchParams }: PageProps<"/admin/registrations">) {
  const { status: raw } = await searchParams;
  const status = raw === "cancelled" || raw === "all" ? raw : "active";
  const edition = await requireCurrentEdition();
  const [rows, riders] = await Promise.all([
    listForEdition(edition.id, status === "all" ? undefined : status),
    activeRiderCount(edition.id),
  ]);
  const failed = await failedEmailIds(rows.map((r) => r.id));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Registrations: {edition.title}</h1>
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-2xl font-bold">
          <span data-testid="rider-total">{riders === 1 ? "1 rider" : `${riders} riders`}</span>
          {edition.capacity !== null ? <span className="text-muted"> of {edition.capacity}</span> : null}
        </p>
        <a href="/admin/registrations/export" className={buttonStyles.secondary} download>
          Download CSV
        </a>
      </div>

      <nav aria-label="Filter registrations" className="flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/registrations?status=${f.value}`}
            aria-current={status === f.value ? "page" : undefined}
            className={status === f.value ? buttonStyles.primary : buttonStyles.ghost}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p>No registrations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <caption className="sr-only">Registrations ({status})</caption>
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="py-2 pr-4">Name</th>
                <th scope="col" className="py-2 pr-4">Email</th>
                <th scope="col" className="py-2 pr-4">Phone</th>
                <th scope="col" className="py-2 pr-4">Riders</th>
                <th scope="col" className="py-2 pr-4">Emergency contact</th>
                <th scope="col" className="py-2 pr-4">Registered</th>
                <th scope="col" className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line align-top">
                  <td className="py-2 pr-4">{r.fullName}</td>
                  <td className="py-2 pr-4">
                    {r.email}
                    {failed.has(r.id) ? (
                      <span className="block text-xs font-semibold text-danger">Confirmation email failed</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-4">{r.phone ?? "—"}</td>
                  <td className="py-2 pr-4">{r.partySize}</td>
                  <td className="py-2 pr-4">
                    {r.emergencyContactName}
                    <span className="block text-muted">{r.emergencyContactPhone}</span>
                  </td>
                  <td className="py-2 pr-4">{formatShortDate(r.createdAt)}</td>
                  <td className="py-2 pr-4">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
