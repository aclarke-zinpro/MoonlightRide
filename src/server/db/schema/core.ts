import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Emails are normalized to lower case before they are stored, so plain text columns with
// unique indexes behave case-insensitively.

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const timestamps = { createdAt, updatedAt, id };

export const rideEdition = pgTable(
  "ride_edition",
  {
    id: id(),
    year: integer("year").notNull(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    timeZone: text("time_zone").notNull().default("America/Chicago"),
    startLocationName: text("start_location_name").notNull(),
    startLocationAddress: text("start_location_address").notNull(),
    startLat: numeric("start_lat", { precision: 9, scale: 6, mode: "number" }).notNull(),
    startLng: numeric("start_lng", { precision: 9, scale: 6, mode: "number" }).notNull(),
    parkingNotes: text("parking_notes").notNull().default(""),
    intro: text("intro").notNull().default(""),
    whyThisDate: text("why_this_date").notNull().default(""),
    ridePrep: text("ride_prep").notNull().default(""),
    routeDescription: text("route_description").notNull().default(""),
    organizerIntro: text("organizer_intro").notNull().default(""),
    distanceMiles: numeric("distance_miles", { precision: 5, scale: 1, mode: "number" }).notNull(),
    pctGravel: integer("pct_gravel").notNull(),
    pctTrail: integer("pct_trail").notNull(),
    pctPaved: integer("pct_paved").notNull(),
    elevationGainFt: integer("elevation_gain_ft").notNull(),
    rwgpsRouteId: text("rwgps_route_id").notNull(),
    rwgpsEventUrl: text("rwgps_event_url").notNull(),
    staticMapImageUrl: text("static_map_image_url").notNull(),
    registrationOpen: boolean("registration_open").notNull().default(false),
    capacity: integer("capacity"),
    isCurrent: boolean("is_current").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("ride_edition_year_key").on(t.year),
    uniqueIndex("ride_edition_one_current").on(t.isCurrent).where(sql`${t.isCurrent} = true`),
    check("ride_edition_year_range", sql`${t.year} between 2000 and 2100`),
    check(
      "ride_edition_surface_sum",
      sql`${t.pctGravel} + ${t.pctTrail} + ${t.pctPaved} = 100
        and ${t.pctGravel} between 0 and 100
        and ${t.pctTrail} between 0 and 100
        and ${t.pctPaved} between 0 and 100`,
    ),
    check("ride_edition_capacity_positive", sql`${t.capacity} is null or ${t.capacity} >= 1`),
    check("ride_edition_distance_positive", sql`${t.distanceMiles} > 0`),
    check("ride_edition_elevation_nonneg", sql`${t.elevationGainFt} >= 0`),
  ],
);

export const organizer = pgTable(
  "organizer",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("organizer_email_key").on(t.email)],
);

export const loginAttempt = pgTable(
  "login_attempt",
  {
    id: id(),
    email: text("email").notNull(),
    ipHash: text("ip_hash").notNull(),
    succeeded: boolean("succeeded").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempt_attempted_at_idx").on(t.attemptedAt)],
);

export const rateLimitEvent = pgTable(
  "rate_limit_event",
  {
    id: id(),
    bucket: text("bucket").notNull(),
    ipHash: text("ip_hash").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rate_limit_event_lookup_idx").on(t.bucket, t.ipHash, t.occurredAt)],
);

export const emailKind = pgEnum("email_kind", [
  "registration_confirmation",
  "registration_cancelled",
  "subscription_confirm",
  "post_notification",
]);
export const emailStatus = pgEnum("email_status", ["sent", "failed"]);

export const emailLog = pgTable(
  "email_log",
  {
    id: id(),
    kind: emailKind("kind").notNull(),
    toEmail: text("to_email"),
    relatedId: uuid("related_id"),
    status: emailStatus("status").notNull(),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [index("email_log_related_idx").on(t.relatedId)],
);

export type RideEdition = typeof rideEdition.$inferSelect;
export type Organizer = typeof organizer.$inferSelect;
export type EmailKind = (typeof emailKind.enumValues)[number];
