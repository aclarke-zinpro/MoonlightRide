"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/Button";
import { FormMessage, TextAreaField, TextField } from "@/components/FormField";
import { idle } from "@/lib/action-result";
import { updateRideEdition } from "../actions";

export type RideEditorValues = Record<
  | "title"
  | "date"
  | "time"
  | "timeZone"
  | "startLocationName"
  | "startLocationAddress"
  | "startLat"
  | "startLng"
  | "parkingNotes"
  | "intro"
  | "whyThisDate"
  | "ridePrep"
  | "routeDescription"
  | "organizerIntro"
  | "distanceMiles"
  | "pctGravel"
  | "pctTrail"
  | "pctPaved"
  | "elevationGainFt"
  | "rwgpsRouteId"
  | "rwgpsEventUrl"
  | "staticMapImageUrl",
  string
>;

export function RideEditorForm({ initial }: { initial: RideEditorValues }) {
  const [state, action] = useActionState(updateRideEdition, idle);
  const errors = !state.ok ? state.fieldErrors : undefined;
  const v = (!state.ok && state.values ? state.values : initial) as RideEditorValues;
  // Remount fields after a save so they show what was stored.
  const key = state.ok ? "saved" : "editing";

  return (
    <form action={action} className="space-y-8" noValidate key={key}>
      {state.ok && state.message ? <FormMessage kind="success">{state.message}</FormMessage> : null}
      {!state.ok && state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}
      {!state.ok && errors ? (
        <FormMessage kind="error">Some fields need attention. They are marked below.</FormMessage>
      ) : null}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-2 font-serif text-xl font-bold text-accent">When and where</legend>
        <TextField name="title" label="Title" required defaultValue={v.title} errors={errors?.title} />
        <TextField name="timeZone" label="Time zone" required defaultValue={v.timeZone} errors={errors?.timeZone} hint="For example America/Chicago." />
        <TextField name="date" label="Date" type="date" required defaultValue={v.date} errors={errors?.date} />
        <TextField name="time" label="Start time" type="time" required defaultValue={v.time} errors={errors?.time} />
        <TextField name="startLocationName" label="Start location name" required defaultValue={v.startLocationName} errors={errors?.startLocationName} />
        <TextField name="startLocationAddress" label="Start location address or directions" required defaultValue={v.startLocationAddress} errors={errors?.startLocationAddress} />
        <TextField name="startLat" label="Start latitude" required inputMode="decimal" defaultValue={v.startLat} errors={errors?.startLat} />
        <TextField name="startLng" label="Start longitude" required inputMode="decimal" defaultValue={v.startLng} errors={errors?.startLng} />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-3">
        <legend className="mb-2 font-serif text-xl font-bold text-accent">Route summary</legend>
        <TextField name="distanceMiles" label="Distance (miles)" required inputMode="decimal" defaultValue={v.distanceMiles} errors={errors?.distanceMiles} />
        <TextField name="elevationGainFt" label="Elevation gain (ft)" required inputMode="numeric" defaultValue={v.elevationGainFt} errors={errors?.elevationGainFt} />
        <span />
        <TextField name="pctGravel" label="Gravel (%)" required inputMode="numeric" defaultValue={v.pctGravel} errors={errors?.pctGravel} />
        <TextField name="pctTrail" label="Trail (%)" required inputMode="numeric" defaultValue={v.pctTrail} errors={errors?.pctTrail} />
        <TextField name="pctPaved" label="Paved (%)" required inputMode="numeric" defaultValue={v.pctPaved} errors={errors?.pctPaved} />
        <TextField name="rwgpsRouteId" label="RideWithGPS route id" required defaultValue={v.rwgpsRouteId} errors={errors?.rwgpsRouteId} />
        <TextField name="rwgpsEventUrl" label="RideWithGPS event link" required defaultValue={v.rwgpsEventUrl} errors={errors?.rwgpsEventUrl} />
        <TextField name="staticMapImageUrl" label="Fallback map image" required defaultValue={v.staticMapImageUrl} errors={errors?.staticMapImageUrl} />
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-2 font-serif text-xl font-bold text-accent">Page text (Markdown)</legend>
        <TextAreaField name="intro" label="Introduction" rows={3} defaultValue={v.intro} errors={errors?.intro} />
        <TextAreaField name="routeDescription" label="Route description" rows={3} defaultValue={v.routeDescription} errors={errors?.routeDescription} />
        <TextAreaField name="whyThisDate" label="Why this date?" rows={4} defaultValue={v.whyThisDate} errors={errors?.whyThisDate} />
        <TextAreaField name="ridePrep" label="Ride prep" rows={5} defaultValue={v.ridePrep} errors={errors?.ridePrep} />
        <TextAreaField name="parkingNotes" label="Parking" rows={3} defaultValue={v.parkingNotes} errors={errors?.parkingNotes} />
        <TextAreaField name="organizerIntro" label="Who's organizing" rows={3} defaultValue={v.organizerIntro} errors={errors?.organizerIntro} />
      </fieldset>

      <SubmitButton pendingLabel="Saving…">Save ride details</SubmitButton>
    </form>
  );
}
