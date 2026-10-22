import { describe, expect, it } from "vitest";
import { cueSchema, poiSchema } from "@/features/route-guide/schema";

describe("US2 cue schema", () => {
  it("accepts a cue with optional mile and flags", () => {
    const cue = cueSchema.parse({ text: "Turn left on Alta Ave.", mile: "2.5", isImportant: "on" });
    expect(cue).toMatchObject({ text: "Turn left on Alta Ave.", mile: 2.5, isImportant: true, isOptionalDetour: false });
    expect(cueSchema.parse({ text: "Continue straight.", mile: "" }).mile).toBeNull();
  });

  it("requires text of 1-500 characters", () => {
    expect(cueSchema.safeParse({ text: "" }).success).toBe(false);
    expect(cueSchema.safeParse({ text: "x".repeat(501) }).success).toBe(false);
    expect(cueSchema.safeParse({ text: "x".repeat(500) }).success).toBe(true);
  });

  it("rejects a negative mile", () => {
    expect(cueSchema.safeParse({ text: "Go", mile: "-1" }).success).toBe(false);
  });
});

describe("US2 point-of-interest schema", () => {
  const valid = { name: "R Bar", mile: "8.7", kind: "food_drink", description: "Bar in Randolph." };

  it("accepts a valid stop", () => {
    expect(poiSchema.parse({ ...valid, isOptional: "on" })).toMatchObject({
      name: "R Bar",
      mile: 8.7,
      kind: "food_drink",
      isOptional: true,
      photoUrl: null,
      photoAlt: null,
    });
  });

  it("requires a name of 1-120 characters and a mile", () => {
    expect(poiSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    expect(poiSchema.safeParse({ ...valid, name: "x".repeat(121) }).success).toBe(false);
    expect(poiSchema.safeParse({ ...valid, mile: "" }).success).toBe(false);
  });

  it("only allows the kinds rest_stop | food_drink | scenic | landmark", () => {
    for (const kind of ["rest_stop", "food_drink", "scenic", "landmark"]) {
      expect(poiSchema.safeParse({ ...valid, kind }).success).toBe(true);
    }
    expect(poiSchema.safeParse({ ...valid, kind: "bar" }).success).toBe(false);
  });

  it("limits the description to 1,000 characters", () => {
    expect(poiSchema.safeParse({ ...valid, description: "x".repeat(1001) }).success).toBe(false);
  });

  it("requires alt text when a photo is set", () => {
    const result = poiSchema.safeParse({ ...valid, photoUrl: "/images/bar.jpg" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["photoAlt"]);
    expect(poiSchema.safeParse({ ...valid, photoUrl: "/images/bar.jpg", photoAlt: "The R Bar" }).success).toBe(true);
  });
});
