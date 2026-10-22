import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizer, rideEdition } from "./core";

export const waiverVersion = pgTable(
  "waiver_version",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rideEditionId: uuid("ride_edition_id")
      .notNull()
      .references(() => rideEdition.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    body: text("body").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: uuid("approved_by").references(() => organizer.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("waiver_edition_version_key").on(t.rideEditionId, t.version),
    check("waiver_body_length", sql`char_length(${t.body}) between 50 and 20000`),
  ],
);

export const registrationStatus = pgEnum("registration_status", ["active", "cancelled"]);

export const registration = pgTable(
  "registration",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rideEditionId: uuid("ride_edition_id")
      .notNull()
      .references(() => rideEdition.id, { onDelete: "cascade" }),
    // Personal fields are nullable so the retention job can anonymize old rows.
    fullName: text("full_name"),
    email: text("email"),
    phone: text("phone"),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    partySize: integer("party_size").notNull(),
    waiverVersionId: uuid("waiver_version_id")
      .notNull()
      .references(() => waiverVersion.id),
    waiverAcceptedAt: timestamp("waiver_accepted_at", { withTimezone: true }).notNull(),
    status: registrationStatus("status").notNull().default("active"),
    cancelTokenHash: text("cancel_token_hash"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("registration_active_email_key")
      .on(t.rideEditionId, t.email)
      .where(sql`${t.status} = 'active'`),
    index("registration_cancel_token_idx").on(t.cancelTokenHash),
    check("registration_party_size_range", sql`${t.partySize} between 1 and 10`),
    check(
      "registration_personal_fields",
      sql`${t.anonymizedAt} is not null or (${t.fullName} is not null and ${t.email} is not null
        and ${t.emergencyContactName} is not null and ${t.emergencyContactPhone} is not null)`,
    ),
  ],
);

export type WaiverVersion = typeof waiverVersion.$inferSelect;
export type Registration = typeof registration.$inferSelect;
