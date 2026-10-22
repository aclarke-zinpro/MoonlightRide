import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RegisterForm } from "@/features/registration/components/RegisterForm";
import { formatRideDateTime } from "@/lib/dates";
import { signFormTimestamp } from "@/server/security/spam";
import { getRegistrationStatus } from "@/server/services/registration";
import { CLOSED_REASON_TEXT, getCurrentEdition } from "@/server/services/ride";
import { getCurrentWaiver } from "@/server/services/waiver";

export const metadata: Metadata = {
  title: "Register",
  description: "Register for the Moonlight Ride. It's free.",
};

export default async function RegisterPage() {
  const edition = await getCurrentEdition();
  if (!edition) notFound();
  const [status, waiver] = await Promise.all([
    getRegistrationStatus(edition),
    getCurrentWaiver(edition.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black">Register for {edition.title}</h1>
      <p className="text-lg">
        {formatRideDateTime(edition.startsAt, edition.timeZone)} at {edition.startLocationName}.
        Registration is free. It tells us how many riders to expect and how to reach you on ride
        day.
      </p>
      {status.open && waiver ? (
        <>
          {status.spotsLeft !== null ? (
            <p className="font-semibold">
              {status.spotsLeft} {status.spotsLeft === 1 ? "spot" : "spots"} left.
            </p>
          ) : null}
          <RegisterForm
            waiverVersionId={waiver.id}
            waiverBody={waiver.body}
            formTs={signFormTimestamp()}
            spotsLeft={status.spotsLeft}
          />
        </>
      ) : (
        <div className="space-y-3 rounded-lg border border-line bg-surface p-6">
          <p className="text-lg font-semibold">
            Registration is closed: {status.open ? CLOSED_REASON_TEXT.organizer_closed : CLOSED_REASON_TEXT[status.reason]}.
          </p>
          <p>
            Check the <Link href="/updates">latest updates</Link>, or{" "}
            <Link href="#subscribe">sign up for updates</Link> to hear when it opens.
          </p>
        </div>
      )}
    </div>
  );
}
