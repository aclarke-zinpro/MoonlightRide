import { Star } from "./Divider";

/**
 * Night-sky banner in the style of the info sheet: moon behind a burnt-orange serif title.
 * The title is live text so it is readable by assistive technology and changes each year.
 */
export function Banner({ title, as: Heading = "p" }: { title: string; as?: "h1" | "p" }) {
  return (
    <div className="night-sky relative overflow-hidden border-b border-line">
      <div
        className="moon pointer-events-none absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90 sm:h-36 sm:w-36"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-6 sm:py-10">
        <div className="flex w-full max-w-md items-center gap-3" aria-hidden="true">
          <span className="h-0.5 flex-1 bg-accent" />
          <Star className="h-5 w-5 text-accent sm:h-6 sm:w-6" />
          <span className="h-0.5 flex-1 bg-accent" />
        </div>
        <div className="mt-2 flex w-full items-center gap-3">
          <span className="hidden h-0.5 w-10 bg-accent sm:block" aria-hidden="true" />
          <Heading className="flex-1 text-center font-serif text-4xl font-black tracking-tight text-accent drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] sm:text-6xl">
            {title}
          </Heading>
          <span className="hidden h-0.5 w-10 bg-accent sm:block" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
