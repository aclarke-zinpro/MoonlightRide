import { describe, expect, it } from "vitest";
import { updateRideEditionSchema } from "@/features/ride/schema";
import { validRideForm } from "../helpers/forms";


describe("US1 ride edition schema", () => {
  it("accepts the info sheet values and converts the start to UTC", () => {
    const result = updateRideEditionSchema.parse(validRideForm);
    expect(result.startsAt.toISOString()).toBe("2026-10-24T23:00:00.000Z");
    expect(result.distanceMiles).toBe(15.8);
    expect(result.pctGravel).toBe(77);
  });

  it("requires gravel, trail, and paved to add up to 100", () => {
    const result = updateRideEditionSchema.safeParse({ ...validRideForm, pctPaved: "20" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain(
      "Gravel, trail, and paved must add up to 100%.",
    );
  });

  it("requires a positive distance", () => {
    const result = updateRideEditionSchema.safeParse({ ...validRideForm, distanceMiles: "0" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["distanceMiles"]);
  });

  it("enforces Markdown length limits from the data model", () => {
    expect(
      updateRideEditionSchema.safeParse({ ...validRideForm, intro: "x".repeat(5001) }).success,
    ).toBe(false);
    expect(
      updateRideEditionSchema.safeParse({ ...validRideForm, parkingNotes: "x".repeat(2001) }).success,
    ).toBe(false);
    expect(
      updateRideEditionSchema.safeParse({ ...validRideForm, organizerIntro: "x".repeat(2001) })
        .success,
    ).toBe(false);
  });

  it("only accepts a numeric route id and a ridewithgps.com event link", () => {
    expect(
      updateRideEditionSchema.safeParse({ ...validRideForm, rwgpsRouteId: "abc" }).success,
    ).toBe(false);
    expect(
      updateRideEditionSchema.safeParse({ ...validRideForm, rwgpsEventUrl: "https://evil.example" })
        .success,
    ).toBe(false);
  });

  it("requires a title and a valid date and time", () => {
    expect(updateRideEditionSchema.safeParse({ ...validRideForm, title: "" }).success).toBe(false);
    expect(updateRideEditionSchema.safeParse({ ...validRideForm, date: "10/24/2026" }).success).toBe(
      false,
    );
    expect(updateRideEditionSchema.safeParse({ ...validRideForm, time: "6pm" }).success).toBe(false);
  });
});
