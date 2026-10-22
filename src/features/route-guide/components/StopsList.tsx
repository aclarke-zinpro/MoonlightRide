import { POI_KIND_LABELS } from "../schema";

export type StopView = {
  id: string;
  name: string;
  mile: number;
  kind: keyof typeof POI_KIND_LABELS;
  description: string;
  isOptional: boolean;
  photoUrl: string | null;
  photoAlt: string | null;
};

export function StopsList({ stops }: { stops: StopView[] }) {
  return (
    <ul aria-label="Stops along the way" className="grid gap-4 sm:grid-cols-2">
      {stops.map((stop) => (
        <li key={stop.id} className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-muted">
            Mile {stop.mile} · {POI_KIND_LABELS[stop.kind]}
            {stop.isOptional ? (
              <span className="ml-2 rounded border border-muted px-1.5 py-0.5 text-xs uppercase">
                Optional
              </span>
            ) : null}
          </p>
          <h3 className="mt-1 text-xl font-bold">{stop.name}</h3>
          {stop.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- organizer-provided URLs of unknown size
            <img src={stop.photoUrl} alt={stop.photoAlt ?? ""} className="mt-2 rounded" loading="lazy" />
          ) : null}
          {stop.description ? <p className="mt-2">{stop.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}
