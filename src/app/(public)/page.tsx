import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles } from "@/components/button-styles";
import { Prose } from "@/components/Prose";
import { Countdown } from "@/features/ride/components/Countdown";
import { InfoSection } from "@/features/ride/components/InfoSection";
import { RideHero } from "@/features/ride/components/RideHero";
import { RouteSummary } from "@/features/ride/components/RouteSummary";
import { formatRideDateTime, getRidePhase } from "@/lib/dates";
import { getLatestPublished } from "@/server/services/post";
import { getCurrentEdition } from "@/server/services/ride";

export async function generateMetadata(): Promise<Metadata> {
  const edition = await getCurrentEdition();
  if (!edition) return {};
  return {
    title: { absolute: edition.title },
    description: `${formatRideDateTime(edition.startsAt, edition.timeZone)} at ${edition.startLocationName}. A casual ${edition.distanceMiles}-mile gravel ride by the light of the full moon.`,
    openGraph: { title: edition.title, images: ["/images/og-2026.jpg"] },
  };
}

export default async function HomePage() {
  const [edition, latest] = await Promise.all([getCurrentEdition(), getLatestPublished()]);
  if (!edition) notFound();
  const now = new Date();
  const past = getRidePhase(edition.startsAt, now) === "past";

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <RideHero
          title={edition.title}
          startsAt={edition.startsAt}
          timeZone={edition.timeZone}
          locationName={edition.startLocationName}
          locationAddress={edition.startLocationAddress}
        />
        <div className="flex flex-wrap items-center gap-4">
          <Countdown startsAt={edition.startsAt} timeZone={edition.timeZone} initialNow={now} />
          {past ? (
            <Link href="#subscribe" className={buttonStyles.primary}>
              Sign up for updates about next year&apos;s ride
            </Link>
          ) : (
            <Link href="/register" className={buttonStyles.primary}>
              Register for the ride
            </Link>
          )}
        </div>
        {edition.intro ? <Prose markdown={edition.intro} /> : null}
        {latest ? (
          <p className="rounded-md border-l-4 border-accent bg-surface px-4 py-3">
            <span className="font-semibold">Latest update:</span>{" "}
            <Link href={`/updates/${latest.slug}`}>{latest.title}</Link>
          </p>
        ) : null}
      </div>

      <InfoSection id="route" title="The route" markdown={edition.routeDescription}>
        <RouteSummary
          distanceMiles={edition.distanceMiles}
          pctGravel={edition.pctGravel}
          pctTrail={edition.pctTrail}
          pctPaved={edition.pctPaved}
          elevationGainFt={edition.elevationGainFt}
        />
        <p>
          <Link href="/route">See the map, turn-by-turn directions, and stops along the way</Link>
        </p>
      </InfoSection>

      <InfoSection id="why" title="Why this date?" markdown={edition.whyThisDate} />
      <InfoSection id="prep" title="Ride prep" markdown={edition.ridePrep} />
      <InfoSection id="parking" title="Parking" markdown={edition.parkingNotes} />
      <InfoSection id="organizer" title="Who's organizing" markdown={edition.organizerIntro} />
    </div>
  );
}
