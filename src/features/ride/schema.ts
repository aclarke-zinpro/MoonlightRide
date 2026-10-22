import { z } from "zod";
import { zonedDateTimeToUtc } from "@/lib/dates";

const markdown = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} can be at most ${max.toLocaleString("en-US")} characters.` });

const percent = (label: string) =>
  z.coerce
    .number({ error: `Enter the ${label} percentage.` })
    .int({ error: `${label} must be a whole number.` })
    .min(0, { error: `${label} must be between 0 and 100.` })
    .max(100, { error: `${label} must be between 0 and 100.` });

/** Organizer ride-editor form (data-model.md, ride_edition). Date and time are local to timeZone. */
export const updateRideEditionSchema = z
  .object({
    title: z.string().trim().min(1, { error: "Enter a title." }).max(80, {
      error: "The title can be at most 80 characters.",
    }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Enter the date as YYYY-MM-DD." }),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Enter the start time as HH:MM." }),
    timeZone: z
      .string()
      .default("America/Chicago")
      .refine(
        (tz) => {
          try {
            new Intl.DateTimeFormat("en-US", { timeZone: tz });
            return true;
          } catch {
            return false;
          }
        },
        { error: "Enter a valid time zone, like America/Chicago." },
      ),
    startLocationName: z.string().trim().min(1, { error: "Enter the start location name." }).max(200),
    startLocationAddress: z
      .string()
      .trim()
      .min(1, { error: "Enter the start location address or directions." })
      .max(300, { error: "The address can be at most 300 characters." }),
    startLat: z.coerce.number().min(-90).max(90, { error: "Latitude must be between -90 and 90." }),
    startLng: z.coerce.number().min(-180).max(180, { error: "Longitude must be between -180 and 180." }),
    parkingNotes: markdown(2000, "Parking notes"),
    intro: markdown(5000, "The introduction"),
    whyThisDate: markdown(5000, '"Why this date"'),
    ridePrep: markdown(5000, "Ride prep"),
    routeDescription: markdown(5000, "The route description"),
    organizerIntro: markdown(2000, "The organizer introduction"),
    distanceMiles: z.coerce
      .number({ error: "Enter the distance in miles." })
      .gt(0, { error: "Distance must be more than 0 miles." })
      .max(999.9),
    pctGravel: percent("Gravel"),
    pctTrail: percent("Trail"),
    pctPaved: percent("Paved"),
    elevationGainFt: z.coerce
      .number()
      .int({ error: "Elevation gain must be a whole number of feet." })
      .min(0, { error: "Elevation gain can't be negative." }),
    rwgpsRouteId: z.string().trim().regex(/^\d+$/, { error: "The route id is the number in the RideWithGPS route link." }),
    rwgpsEventUrl: z
      .string()
      .trim()
      .regex(/^https:\/\/(www\.)?ridewithgps\.com\//, {
        error: "Enter a link that starts with https://ridewithgps.com/.",
      }),
    staticMapImageUrl: z
      .string()
      .trim()
      .regex(/^(\/|https:\/\/)/, { error: "Enter an image path like /images/route-map.jpg." }),
  })
  .superRefine((value, ctx) => {
    if (value.pctGravel + value.pctTrail + value.pctPaved !== 100) {
      ctx.addIssue({
        code: "custom",
        path: ["pctGravel"],
        message: "Gravel, trail, and paved must add up to 100%.",
      });
    }
  })
  .transform(({ date, time, ...rest }) => ({
    ...rest,
    startsAt: zonedDateTimeToUtc(date, time, rest.timeZone),
  }));

export type RideEditionInput = z.output<typeof updateRideEditionSchema>;
