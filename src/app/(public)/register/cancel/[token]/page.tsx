import type { Metadata } from "next";
import Link from "next/link";
import { CancelForm } from "@/features/registration/components/CancelForm";
import { formatRideDateTime, getRidePhase } from "@/lib/dates";
import { findActiveByCancelToken } from "@/server/services/registration";

export const metadata: Metadata = { title: "Cancel registration", robots: { index: false } };

export default async function CancelPage({ params }: PageProps<"/register/cancel/[token]">) {
  const { token } = await params;
  const found = await findActiveByCancelToken(token);
  const valid = found && getRidePhase(found.edition.startsAt, new Date()) !== "past";

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black">Cancel your registration</h1>
      {valid && found ? (
        <>
          <p className="text-lg">
            {found.registration.fullName}, you&apos;re registered for {found.edition.title} (
            {formatRideDateTime(found.edition.startsAt, found.edition.timeZone)}) with{" "}
            {found.registration.partySize === 1
              ? "1 rider"
              : `${found.registration.partySize} riders`}
            . Can&apos;t make it? Cancelling frees up your spot.
          </p>
          <CancelForm token={token} />
        </>
      ) : (
        <p className="text-lg">
          This cancellation link is no longer valid. It may have been used already. If you still
          need help, see the <Link href="/updates">latest updates</Link>.
        </p>
      )}
    </div>
  );
}
