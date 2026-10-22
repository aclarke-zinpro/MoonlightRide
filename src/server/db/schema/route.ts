import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { rideEdition } from "./core";

export const cue = pgTable(
  "cue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rideEditionId: uuid("ride_edition_id")
      .notNull()
      .references(() => rideEdition.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text").notNull(),
    mile: numeric("mile", { precision: 4, scale: 1, mode: "number" }),
    isImportant: boolean("is_important").notNull().default(false),
    isOptionalDetour: boolean("is_optional_detour").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("cue_edition_position_key").on(t.rideEditionId, t.position),
    check("cue_text_length", sql`char_length(${t.text}) between 1 and 500`),
    check("cue_mile_nonneg", sql`${t.mile} is null or ${t.mile} >= 0`),
  ],
);

export const poiKind = pgEnum("poi_kind", ["rest_stop", "food_drink", "scenic", "landmark"]);

export const pointOfInterest = pgTable(
  "point_of_interest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rideEditionId: uuid("ride_edition_id")
      .notNull()
      .references(() => rideEdition.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    mile: numeric("mile", { precision: 4, scale: 1, mode: "number" }).notNull(),
    kind: poiKind("kind").notNull(),
    description: text("description").notNull().default(""),
    isOptional: boolean("is_optional").notNull().default(false),
    photoUrl: text("photo_url"),
    photoAlt: text("photo_alt"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("poi_edition_position_key").on(t.rideEditionId, t.position),
    check("poi_name_length", sql`char_length(${t.name}) between 1 and 120`),
    check("poi_description_length", sql`char_length(${t.description}) <= 1000`),
    check("poi_mile_nonneg", sql`${t.mile} >= 0`),
    check("poi_photo_alt_required", sql`${t.photoUrl} is null or char_length(${t.photoAlt}) >= 1`),
  ],
);

export type Cue = typeof cue.$inferSelect;
export type PointOfInterest = typeof pointOfInterest.$inferSelect;
export type PoiKind = (typeof poiKind.enumValues)[number];
