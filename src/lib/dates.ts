export type RidePhase = "upcoming" | "past";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** The ride counts as "happened" this long after its start. */
export const RIDE_DURATION_MS = 6 * HOUR;

export function getRidePhase(startsAt: Date, now: Date): RidePhase {
  return now.getTime() >= startsAt.getTime() + RIDE_DURATION_MS ? "past" : "upcoming";
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Whole calendar days from `now` to `startsAt`, counted in the ride's time zone. */
export function daysUntil(startsAt: Date, now: Date, timeZone: string): number {
  const a = zonedParts(now, timeZone);
  const b = zonedParts(startsAt, timeZone);
  const diff = Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day);
  return Math.round(diff / DAY);
}

// ICU uses narrow no-break spaces in times ("6:00 PM"); normalize for display and tests.
const normalizeSpaces = (s: string) => s.replace(/[  ]/g, " ");

export function formatRideDate(startsAt: Date, timeZone: string): string {
  return normalizeSpaces(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(startsAt),
  );
}

export function formatRideTime(startsAt: Date, timeZone: string): string {
  return normalizeSpaces(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(startsAt),
  );
}

export function formatRideDateTime(startsAt: Date, timeZone: string): string {
  return `${formatRideDate(startsAt, timeZone)} · ${formatRideTime(startsAt, timeZone)}`;
}

export function formatShortDate(date: Date, timeZone = "America/Chicago"): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function offsetAt(instant: number, timeZone: string): number {
  const p = zonedParts(new Date(instant), timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Converts a wall-clock date ("YYYY-MM-DD") and time ("HH:MM") in `timeZone` to a UTC Date. */
export function zonedDateTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0);
  let guess = wall - offsetAt(wall, timeZone);
  // A second pass settles instants near a DST change.
  guess = wall - offsetAt(guess, timeZone);
  return new Date(guess);
}

/** Splits an instant into wall-clock "YYYY-MM-DD" and "HH:MM" strings in `timeZone`. */
export function utcToZonedParts(instant: Date, timeZone: string): { date: string; time: string } {
  const p = zonedParts(instant, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}
