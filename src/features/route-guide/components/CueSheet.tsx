export type CueView = {
  id: string;
  text: string;
  mile: number | null;
  isImportant: boolean;
  isOptionalDetour: boolean;
};

function Badge({ tone, children }: { tone: "important" | "optional"; children: string }) {
  return (
    <span
      className={`mr-2 inline-block rounded px-2 py-0.5 text-xs font-bold tracking-wide uppercase ${
        tone === "important" ? "bg-accent text-night" : "border border-muted text-muted"
      }`}
    >
      {children}
    </span>
  );
}

/** Turn-by-turn directions. Rendered on the server so it works without the map or JavaScript. */
export function CueSheet({ cues }: { cues: CueView[] }) {
  return (
    <ol aria-label="Turn-by-turn directions" className="space-y-3">
      {cues.map((cue, index) => (
        <li
          key={cue.id}
          className={`flex gap-4 rounded-lg border p-4 ${
            cue.isImportant ? "border-accent bg-accent/10" : "border-line bg-surface"
          } ${cue.isOptionalDetour ? "ml-6 border-dashed" : ""}`}
        >
          <span aria-hidden="true" className="font-serif text-xl font-bold text-accent">
            {index + 1}
          </span>
          <div>
            {cue.isImportant ? <Badge tone="important">Important</Badge> : null}
            {cue.isOptionalDetour ? <Badge tone="optional">Optional</Badge> : null}
            {cue.mile !== null ? (
              <span className="mr-2 text-sm font-semibold text-muted">Mile {cue.mile}</span>
            ) : null}
            <p className="mt-1">{cue.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
