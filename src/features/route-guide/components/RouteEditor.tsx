"use client";

import { useActionState } from "react";
import { buttonStyles, SubmitButton } from "@/components/Button";
import { FormMessage, TextAreaField, TextField } from "@/components/FormField";
import { idle } from "@/lib/action-result";
import {
  deleteCue,
  deletePoi,
  reorderCues,
  reorderPois,
  saveCue,
  savePoi,
} from "../actions";
import { POI_KIND_LABELS, POI_KINDS } from "../schema";
import type { CueView } from "./CueSheet";
import type { StopView } from "./StopsList";

const swap = (ids: string[], a: number, b: number) => {
  const next = [...ids];
  [next[a], next[b]] = [next[b] as string, next[a] as string];
  return next.join(",");
};

function Checkbox({ id, name, label, defaultChecked }: { id: string; name: string; label: string; defaultChecked: boolean }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2">
      <input id={id} type="checkbox" name={name} defaultChecked={defaultChecked} className="h-5 w-5 accent-accent" />
      {label}
    </label>
  );
}

/** Move up/down and delete buttons: each is its own small form, so they work without JavaScript. */
function RowControls(props: {
  id: string;
  ids: string[];
  index: number;
  label: string;
  reorder: (form: FormData) => Promise<void>;
  remove: (form: FormData) => Promise<void>;
}) {
  const { id, ids, index, label, reorder, remove } = props;
  return (
    <div className="flex flex-wrap gap-2">
      <form action={reorder}>
        <input type="hidden" name="ids" value={index > 0 ? swap(ids, index, index - 1) : ids.join(",")} />
        <button type="submit" className={buttonStyles.ghost} disabled={index === 0}>
          Move up<span className="sr-only">: {label}</span>
        </button>
      </form>
      <form action={reorder}>
        <input type="hidden" name="ids" value={index < ids.length - 1 ? swap(ids, index, index + 1) : ids.join(",")} />
        <button type="submit" className={buttonStyles.ghost} disabled={index === ids.length - 1}>
          Move down<span className="sr-only">: {label}</span>
        </button>
      </form>
      <form action={remove}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className={buttonStyles.danger}>
          Delete<span className="sr-only">: {label}</span>
        </button>
      </form>
    </div>
  );
}

function CueForm({ cue }: { cue?: CueView }) {
  const [state, action] = useActionState(saveCue, idle);
  const errors = !state.ok ? state.fieldErrors : undefined;
  const key = cue?.id ?? "new";
  return (
    <form action={action} className="space-y-3">
      {cue ? <input type="hidden" name="id" value={cue.id} /> : null}
      <TextAreaField id={`text-${key}`} name="text" label="Direction" required rows={2} defaultValue={cue?.text} errors={errors?.text} />
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-32">
          <TextField id={`mile-${key}`} name="mile" label="Mile" inputMode="decimal" defaultValue={cue?.mile ?? ""} errors={errors?.mile} />
        </div>
        <Checkbox id={`imp-${key}`} name="isImportant" label="Important" defaultChecked={cue?.isImportant ?? false} />
        <Checkbox id={`opt-${key}`} name="isOptionalDetour" label="Optional detour" defaultChecked={cue?.isOptionalDetour ?? false} />
      </div>
      {state.ok ? <FormMessage kind="success">{state.message}</FormMessage> : null}
      {!state.ok && state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}
      <SubmitButton variant="secondary" pendingLabel="Saving…">{cue ? "Save direction" : "Add direction"}</SubmitButton>
    </form>
  );
}

function PoiForm({ stop }: { stop?: StopView }) {
  const [state, action] = useActionState(savePoi, idle);
  const errors = !state.ok ? state.fieldErrors : undefined;
  const key = stop?.id ?? "new-poi";
  return (
    <form action={action} className="space-y-3">
      {stop ? <input type="hidden" name="id" value={stop.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField id={`name-${key}`} name="name" label="Name" required defaultValue={stop?.name} errors={errors?.name} />
        <TextField id={`pmile-${key}`} name="mile" label="Mile" required inputMode="decimal" defaultValue={stop?.mile} errors={errors?.mile} />
        <div>
          <label htmlFor={`kind-${key}`} className="block font-medium">Kind</label>
          <select id={`kind-${key}`} name="kind" defaultValue={stop?.kind ?? "rest_stop"} className="mt-1 block w-full rounded-md border border-line bg-surface-2 px-3 py-2.5">
            {POI_KINDS.map((k) => (
              <option key={k} value={k}>{POI_KIND_LABELS[k]}</option>
            ))}
          </select>
        </div>
      </div>
      <TextAreaField id={`desc-${key}`} name="description" label="Description" rows={2} defaultValue={stop?.description} errors={errors?.description} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField id={`photo-${key}`} name="photoUrl" label="Photo URL" defaultValue={stop?.photoUrl ?? ""} errors={errors?.photoUrl} />
        <TextField id={`alt-${key}`} name="photoAlt" label="Photo description (alt text)" defaultValue={stop?.photoAlt ?? ""} errors={errors?.photoAlt} hint="Required when there is a photo." />
      </div>
      <Checkbox id={`popt-${key}`} name="isOptional" label="Optional stop" defaultChecked={stop?.isOptional ?? false} />
      {state.ok ? <FormMessage kind="success">{state.message}</FormMessage> : null}
      {!state.ok && state.formError ? <FormMessage kind="error">{state.formError}</FormMessage> : null}
      <SubmitButton variant="secondary" pendingLabel="Saving…">{stop ? "Save stop" : "Add stop"}</SubmitButton>
    </form>
  );
}

export function RouteEditor({ cues, stops }: { cues: CueView[]; stops: StopView[] }) {
  const cueIds = cues.map((c) => c.id);
  const stopIds = stops.map((s) => s.id);
  return (
    <div className="space-y-12">
      <section aria-labelledby="cues-heading" className="space-y-4">
        <h2 id="cues-heading" className="text-2xl font-bold">Turn-by-turn directions</h2>
        <ol className="space-y-4">
          {cues.map((cue, index) => (
            <li key={cue.id}>
              <div role="group" aria-label={`Direction ${index + 1}`} className="space-y-3 rounded-lg border border-line bg-surface p-4">
                <p className="font-semibold text-muted">Direction {index + 1}</p>
                <CueForm cue={cue} />
                <RowControls id={cue.id} ids={cueIds} index={index} label={`direction ${index + 1}`} reorder={reorderCues} remove={deleteCue} />
              </div>
            </li>
          ))}
        </ol>
        <div role="group" aria-label="Add a direction" className="rounded-lg border border-dashed border-line p-4">
          <h3 className="mb-3 text-lg font-bold">Add a direction</h3>
          <CueForm />
        </div>
      </section>

      <section aria-labelledby="stops-heading" className="space-y-4">
        <h2 id="stops-heading" className="text-2xl font-bold">Stops along the way</h2>
        <ul className="space-y-4">
          {stops.map((stop, index) => (
            <li key={stop.id}>
              <div role="group" aria-label={`Stop: ${stop.name}`} className="space-y-3 rounded-lg border border-line bg-surface p-4">
                <PoiForm stop={stop} />
                <RowControls id={stop.id} ids={stopIds} index={index} label={stop.name} reorder={reorderPois} remove={deletePoi} />
              </div>
            </li>
          ))}
        </ul>
        <div role="group" aria-label="Add a stop" className="rounded-lg border border-dashed border-line p-4">
          <h3 className="mb-3 text-lg font-bold">Add a stop</h3>
          <PoiForm />
        </div>
      </section>
    </div>
  );
}
