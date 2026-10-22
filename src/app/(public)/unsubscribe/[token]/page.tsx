import type { Metadata } from "next";
import { UnsubscribeForm } from "@/features/subscriptions/components/UnsubscribeForm";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

/** Unsubscribing takes a button press (POST), so email link scanners can't trigger it. */
export default async function UnsubscribePage({ params }: PageProps<"/unsubscribe/[token]">) {
  const { token } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-black">Unsubscribe from ride updates</h1>
      <p className="text-lg">You&apos;ll stop getting Moonlight Ride update emails.</p>
      <UnsubscribeForm token={token} />
    </div>
  );
}
