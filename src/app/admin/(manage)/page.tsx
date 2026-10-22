import type { Metadata } from "next";
import Link from "next/link";
import { formatRideDateTime, getRidePhase } from "@/lib/dates";
import { failedEmailCount } from "@/server/services/email-log";
import { draftCount } from "@/server/services/post";
import { activeRiderCount } from "@/server/services/registration";
import { activeCount } from "@/server/services/subscription";
import { requireCurrentEdition } from "@/server/services/ride";

export const metadata: Metadata = { title: "Organizer dashboard" };

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-bold">{href ? <Link href={href}>{value}</Link> : value}</dd>
    </div>
  );
}

export default async function AdminDashboard() {
  const edition = await requireCurrentEdition();
  const phase = getRidePhase(edition.startsAt, new Date());
  const [riders, failedEmails, subscribers, drafts] = await Promise.all([
    activeRiderCount(edition.id),
    failedEmailCount(),
    activeCount(),
    draftCount(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-lg">
        {edition.title}: {formatRideDateTime(edition.startsAt, edition.timeZone)} (
        {phase === "past" ? "this ride has happened" : "upcoming"})
      </p>
      <dl className="grid gap-4 sm:grid-cols-3">
        <Stat label="Ride" value={phase === "past" ? "Happened" : "Upcoming"} href="/admin/ride" />
        <Stat
          label={`Registered riders${edition.registrationOpen ? "" : " (registration closed)"}`}
          value={edition.capacity === null ? String(riders) : `${riders} of ${edition.capacity}`}
          href="/admin/registrations"
        />
        <Stat label="Active update subscribers" value={String(subscribers)} href="/admin/subscribers" />
        <Stat label="Draft posts" value={String(drafts)} href="/admin/posts" />
        <Stat label="Emails that failed to send" value={String(failedEmails)} />
      </dl>
    </div>
  );
}
