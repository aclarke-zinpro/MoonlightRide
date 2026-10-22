import { describe, expect, it } from "vitest";
import {
  daysUntil,
  formatRideDate,
  formatRideDateTime,
  formatRideTime,
  getRidePhase,
  zonedDateTimeToUtc,
  utcToZonedParts,
} from "@/lib/dates";

const TZ = "America/Chicago";
// 6:00 PM CDT on Saturday, October 24, 2026 = 23:00 UTC
const startsAt = new Date("2026-10-24T23:00:00Z");

describe("ride dates (foundation)", () => {
  it("is upcoming before the start", () => {
    expect(getRidePhase(startsAt, new Date("2026-10-24T22:59:59Z"))).toBe("upcoming");
  });

  it("is still upcoming during the first 6 hours of the ride", () => {
    expect(getRidePhase(startsAt, new Date("2026-10-25T04:59:59Z"))).toBe("upcoming");
  });

  it("is past from 6 hours after the start", () => {
    expect(getRidePhase(startsAt, new Date("2026-10-25T05:00:00Z"))).toBe("past");
  });

  it("counts calendar days in the ride's time zone", () => {
    // 11:30 PM CDT on Oct 22 is already Oct 23 in UTC, but two local days remain.
    expect(daysUntil(startsAt, new Date("2026-10-23T04:30:00Z"), TZ)).toBe(2);
    expect(daysUntil(startsAt, new Date("2026-10-24T12:00:00Z"), TZ)).toBe(0);
  });

  it("counts days correctly across the DST change on 2026-11-01", () => {
    const after = new Date("2026-11-07T00:00:00Z"); // 6:00 PM CST Nov 6
    expect(daysUntil(after, new Date("2026-10-31T17:00:00Z"), TZ)).toBe(6);
  });

  it("formats the date and time for display", () => {
    expect(formatRideDate(startsAt, TZ)).toBe("Saturday, October 24, 2026");
    expect(formatRideTime(startsAt, TZ)).toBe("6:00 PM CDT");
    expect(formatRideDateTime(startsAt, TZ)).toBe("Saturday, October 24, 2026 · 6:00 PM CDT");
  });

  it("converts a local date and time in the ride's zone to UTC and back", () => {
    const utc = zonedDateTimeToUtc("2026-10-24", "18:00", TZ);
    expect(utc.toISOString()).toBe("2026-10-24T23:00:00.000Z");
    expect(zonedDateTimeToUtc("2026-11-06", "18:00", TZ).toISOString()).toBe(
      "2026-11-07T00:00:00.000Z",
    );
    expect(utcToZonedParts(utc, TZ)).toEqual({ date: "2026-10-24", time: "18:00" });
  });
});
