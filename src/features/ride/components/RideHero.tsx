import { formatRideDate, formatRideTime } from "@/lib/dates";
import { mapsSearchUrl } from "@/lib/maps";

export function RideHero(props: {
  title: string;
  startsAt: Date;
  timeZone: string;
  locationName: string;
  locationAddress: string;
}) {
  const { title, startsAt, timeZone, locationName, locationAddress } = props;
  return (
    <section aria-labelledby="ride-title" className="space-y-4">
      <h1 id="ride-title" className="text-4xl font-black sm:text-5xl">
        {title}
      </h1>
      <dl className="grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-[auto_1fr] sm:gap-x-6">
        <dt className="text-sm tracking-wide text-muted uppercase">When</dt>
        <dd className="text-lg">
          <span data-testid="ride-date" className="font-semibold">
            {formatRideDate(startsAt, timeZone)}
          </span>
          <span aria-hidden="true"> · </span>
          <span data-testid="ride-time" className="font-semibold">
            {formatRideTime(startsAt, timeZone)}
          </span>
        </dd>
        <dt className="text-sm tracking-wide text-muted uppercase">Where</dt>
        <dd className="text-lg" data-testid="ride-location">
          <span className="font-semibold">{locationName}</span>
          <span className="block text-base text-muted">{locationAddress}</span>
          <a
            href={mapsSearchUrl(locationName, locationAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-base"
          >
            Open in Maps<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </dd>
      </dl>
    </section>
  );
}
