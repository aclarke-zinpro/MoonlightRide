import type { Metadata } from "next";
import {
  RegistrationSettingsForm,
  WaiverEditor,
} from "@/features/registration/components/AdminRegistrationForms";
import { RideEditorForm } from "@/features/ride/components/RideEditorForm";
import { formatShortDate, utcToZonedParts } from "@/lib/dates";
import { activeRiderCount } from "@/server/services/registration";
import { requireCurrentEdition } from "@/server/services/ride";
import { getCurrentWaiver } from "@/server/services/waiver";

export const metadata: Metadata = { title: "Ride details" };

export default async function AdminRidePage() {
  const edition = await requireCurrentEdition();
  const { date, time } = utcToZonedParts(edition.startsAt, edition.timeZone);
  const initial = {
    title: edition.title,
    date,
    time,
    timeZone: edition.timeZone,
    startLocationName: edition.startLocationName,
    startLocationAddress: edition.startLocationAddress,
    startLat: String(edition.startLat),
    startLng: String(edition.startLng),
    parkingNotes: edition.parkingNotes,
    intro: edition.intro,
    whyThisDate: edition.whyThisDate,
    ridePrep: edition.ridePrep,
    routeDescription: edition.routeDescription,
    organizerIntro: edition.organizerIntro,
    distanceMiles: String(edition.distanceMiles),
    pctGravel: String(edition.pctGravel),
    pctTrail: String(edition.pctTrail),
    pctPaved: String(edition.pctPaved),
    elevationGainFt: String(edition.elevationGainFt),
    rwgpsRouteId: edition.rwgpsRouteId,
    rwgpsEventUrl: edition.rwgpsEventUrl,
    staticMapImageUrl: edition.staticMapImageUrl,
  };

  const [waiver, riders] = await Promise.all([
    getCurrentWaiver(edition.id),
    activeRiderCount(edition.id),
  ]);

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold">Ride details</h1>
      <section aria-label="Registration settings" className="space-y-4">
        <h2 className="text-2xl font-bold">Registration</h2>
        <RegistrationSettingsForm open={edition.registrationOpen} capacity={edition.capacity} riders={riders} />
      </section>
      <section aria-label="Waiver" className="space-y-4">
        <h2 className="text-2xl font-bold">Waiver</h2>
        <WaiverEditor
          current={
            waiver
              ? {
                  id: waiver.id,
                  version: waiver.version,
                  body: waiver.body,
                  approvedAt: waiver.approvedAt ? formatShortDate(waiver.approvedAt) : null,
                }
              : null
          }
        />
      </section>
      <section aria-labelledby="ride-details-heading" className="space-y-4">
        <h2 id="ride-details-heading" className="text-2xl font-bold">
          Details shown on the site
        </h2>
        <RideEditorForm initial={initial} />
      </section>
    </div>
  );
}
