import { z } from "zod";

// Unchecked checkboxes are simply absent from FormData.
const checkbox = z
  .string()
  .nullish()
  .transform((v) => v === "on" || v === "true");

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null));

const mileNumber = z
  .number({ error: "Enter the mile as a number, like 8.2." })
  .min(0, { error: "Mile can't be negative." })
  .max(999.9, { error: "Enter the mile as a number, like 8.2." });

/** Blank or absent becomes null. */
const optionalMile = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
  .pipe(mileNumber.nullable());

export const cueSchema = z.object({
  id: z.uuid().optional(),
  text: z
    .string()
    .trim()
    .min(1, { error: "Enter the direction text." })
    .max(500, { error: "Directions can be at most 500 characters." }),
  mile: optionalMile,
  isImportant: checkbox,
  isOptionalDetour: checkbox,
});

export const POI_KINDS = ["rest_stop", "food_drink", "scenic", "landmark"] as const;

export const POI_KIND_LABELS: Record<(typeof POI_KINDS)[number], string> = {
  rest_stop: "Rest stop",
  food_drink: "Food & drink",
  scenic: "Scenic",
  landmark: "Landmark",
};

export const poiSchema = z
  .object({
    id: z.uuid().optional(),
    name: z
      .string()
      .trim()
      .min(1, { error: "Enter the stop's name." })
      .max(120, { error: "Names can be at most 120 characters." }),
    mile: z
      .string({ error: "Enter the mile where this stop is." })
      .trim()
      .min(1, { error: "Enter the mile where this stop is." })
      .transform(Number)
      .pipe(mileNumber),
    kind: z.enum(POI_KINDS, { error: "Choose the kind of stop." }),
    description: z
      .string()
      .trim()
      .max(1000, { error: "Descriptions can be at most 1,000 characters." })
      .optional()
      .transform((v) => v ?? ""),
    isOptional: checkbox,
    photoUrl: optionalText,
    photoAlt: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.photoUrl && !value.photoAlt) {
      ctx.addIssue({
        code: "custom",
        path: ["photoAlt"],
        message: "Describe the photo for people who can't see it.",
      });
    }
  });

export type CueInput = z.output<typeof cueSchema>;
export type PoiInput = z.output<typeof poiSchema>;
