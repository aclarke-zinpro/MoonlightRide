import Link from "next/link";
import { Banner } from "@/components/Banner";

export default function NotFound() {
  return (
    <>
      <Banner title="Moonlight Ride" />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-12">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p>
          We couldn&apos;t find that page. It may have moved, or the link may be mistyped.
        </p>
        <p>
          <Link href="/">Go to the ride details</Link> or <Link href="/updates">read the latest updates</Link>.
        </p>
      </main>
    </>
  );
}
