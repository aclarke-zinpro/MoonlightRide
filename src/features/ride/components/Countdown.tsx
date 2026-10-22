"use client";

import { useEffect, useState } from "react";
import { daysUntil, getRidePhase } from "@/lib/dates";

export function countdownText(startsAt: Date, timeZone: string, now: Date): string {
  if (getRidePhase(startsAt, now) === "past") return "This year's ride has happened";
  const days = daysUntil(startsAt, now, timeZone);
  if (days <= 0) return "Tonight's the night!";
  return days === 1 ? "1 day to go" : `${days} days to go`;
}

/** Days to the ride. Rendered on the server, then kept current while the page stays open. */
export function Countdown(props: { startsAt: Date; timeZone: string; initialNow: Date }) {
  const { startsAt, timeZone, initialNow } = props;
  const [ticked, setTicked] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTicked(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // A fresher server render (e.g. after navigation) wins over an older client tick.
  const now = ticked && ticked > initialNow ? ticked : initialNow;

  return (
    <p
      data-testid="countdown"
      className="inline-block rounded-full border border-accent px-4 py-1 font-serif text-xl font-bold text-accent"
    >
      {countdownText(startsAt, timeZone, now)}
    </p>
  );
}
