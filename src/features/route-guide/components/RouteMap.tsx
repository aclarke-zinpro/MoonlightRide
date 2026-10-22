"use client";

import { useEffect, useState } from "react";

const LOAD_TIMEOUT_MS = 8_000;

/**
 * Embeds the RideWithGPS route. If the service is unreachable (a probe request fails) or the
 * map hasn't loaded within 8 seconds, shows the static route image instead (FR-008).
 */
export function RouteMap(props: {
  routeId: string;
  eventUrl: string;
  staticImageUrl: string;
  year: number;
}) {
  const { routeId, eventUrl, staticImageUrl, year } = props;
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">("loading");

  useEffect(() => {
    const timer = setTimeout(
      () => setStatus((s) => (s === "loading" ? "failed" : s)),
      LOAD_TIMEOUT_MS,
    );
    // An iframe's load event also fires for error pages, so probe the host directly.
    const probe = new Image();
    probe.onerror = () => setStatus("failed");
    probe.src = `https://ridewithgps.com/favicon.ico?probe=${Date.now()}`;
    return () => {
      clearTimeout(timer);
      probe.onerror = null;
    };
  }, []);

  if (status === "failed") {
    return (
      <figure className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- static fallback, sized by CSS */}
        <img
          src={staticImageUrl}
          alt={`Route map for Moonlight Ride ${year}: a loop east from Northfield along the Cannon River to Randolph and back on the north side of the river.`}
          className="w-full rounded-lg border border-line"
        />
        <figcaption className="text-sm text-muted">
          We couldn&apos;t load the interactive map right now, so this is a picture of the route.
          The directions below have every turn.{" "}
          <a href={eventUrl} target="_blank" rel="noopener noreferrer">
            Try the route on RideWithGPS
          </a>
          .
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-line bg-surface sm:aspect-[16/10]">
      <iframe
        src={`https://ridewithgps.com/embeds?type=route&id=${encodeURIComponent(routeId)}&sampleGraph=true`}
        title={`Route map for Moonlight Ride ${year}`}
        loading="lazy"
        className="h-full w-full"
        onLoad={() => setStatus((s) => (s === "loading" ? "loaded" : s))}
      />
    </div>
  );
}
