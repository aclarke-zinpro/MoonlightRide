import type { Metadata } from "next";
import { RouteEditor } from "@/features/route-guide/components/RouteEditor";
import { requireCurrentEdition } from "@/server/services/ride";
import { listCues, listPois } from "@/server/services/route";

export const metadata: Metadata = { title: "Route and stops" };

export default async function AdminRoutePage() {
  const edition = await requireCurrentEdition();
  const [cues, stops] = await Promise.all([listCues(edition.id), listPois(edition.id)]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Route and stops</h1>
      <p className="text-muted">
        Changes show on the public Route page right away. Miles must be between 0 and{" "}
        {edition.distanceMiles}.
      </p>
      <RouteEditor cues={cues} stops={stops} />
    </div>
  );
}
