import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Divider } from "@/components/Divider";
import { CueSheet } from "@/features/route-guide/components/CueSheet";
import { RouteMap } from "@/features/route-guide/components/RouteMap";
import { StopsList } from "@/features/route-guide/components/StopsList";
import { RouteSummary } from "@/features/ride/components/RouteSummary";
import { getCurrentEdition } from "@/server/services/ride";
import { listCues, listPois } from "@/server/services/route";

export const metadata: Metadata = {
  title: "Route, directions, and stops",
  description: "Map, turn-by-turn cue sheet, and rest stops for the Moonlight Ride.",
};

export default async function RoutePage() {
  const edition = await getCurrentEdition();
  if (!edition) notFound();
  const [cues, stops] = await Promise.all([listCues(edition.id), listPois(edition.id)]);

  return (
    <div className="space-y-10">
      <section aria-labelledby="route-heading" className="space-y-4">
        <h1 id="route-heading" className="text-4xl font-black">
          Route, directions, and stops
        </h1>
        <RouteSummary
          distanceMiles={edition.distanceMiles}
          pctGravel={edition.pctGravel}
          pctTrail={edition.pctTrail}
          pctPaved={edition.pctPaved}
          elevationGainFt={edition.elevationGainFt}
        />
        <RouteMap
          routeId={edition.rwgpsRouteId}
          eventUrl={edition.rwgpsEventUrl}
          staticImageUrl={edition.staticMapImageUrl}
          year={edition.year}
        />
        <p>
          <a href={edition.rwgpsEventUrl} target="_blank" rel="noopener noreferrer">
            Open the full route on RideWithGPS
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          to download it to your GPS or phone.
        </p>
      </section>

      <section aria-labelledby="directions-heading" className="space-y-4">
        <Divider className="max-w-xs" />
        <h2 id="directions-heading" className="text-2xl font-bold">
          Turn-by-turn directions
        </h2>
        <p className="text-muted">
          Starting from {edition.startLocationName}. Optional detours are indented and labeled.
        </p>
        <CueSheet cues={cues} />
      </section>

      <section aria-labelledby="stops-heading" className="space-y-4">
        <Divider className="max-w-xs" />
        <h2 id="stops-heading" className="text-2xl font-bold">
          Stops along the way
        </h2>
        <StopsList stops={stops} />
      </section>
    </div>
  );
}
