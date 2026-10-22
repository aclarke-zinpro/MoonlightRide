import type { Metadata } from "next";
import Link from "next/link";
import { CONFIRM_EXPIRED_MESSAGE, confirm } from "@/server/services/subscription";

export const metadata: Metadata = { title: "Confirm updates", robots: { index: false } };

/** Confirms on load (contracts/routes.md); only ever moves pending → active, so it's idempotent. */
export default async function ConfirmPage({ params }: PageProps<"/subscribe/confirm/[token]">) {
  const result = await confirm((await params).token);
  const ok = result === "confirmed" || result === "already_confirmed";
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-black">{ok ? "You're subscribed!" : "Link not valid"}</h1>
      {ok ? (
        <p className="text-lg">
          We&apos;ll email you when there&apos;s news about the Moonlight Ride.{" "}
          <Link href="/">See this year&apos;s ride details</Link>.
        </p>
      ) : (
        <p className="text-lg">
          {result === "expired"
            ? CONFIRM_EXPIRED_MESSAGE
            : "This confirmation link isn't valid. Sign up again to get a new one."}{" "}
          <Link href="#subscribe">Sign up below</Link>.
        </p>
      )}
    </div>
  );
}
