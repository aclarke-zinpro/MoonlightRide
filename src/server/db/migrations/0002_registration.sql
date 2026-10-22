CREATE TYPE "public"."registration_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TABLE "registration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_edition_id" uuid NOT NULL,
	"full_name" text,
	"email" text,
	"phone" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"party_size" integer NOT NULL,
	"waiver_version_id" uuid NOT NULL,
	"waiver_accepted_at" timestamp with time zone NOT NULL,
	"status" "registration_status" DEFAULT 'active' NOT NULL,
	"cancel_token_hash" text,
	"cancelled_at" timestamp with time zone,
	"anonymized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registration_party_size_range" CHECK ("registration"."party_size" between 1 and 10),
	CONSTRAINT "registration_personal_fields" CHECK ("registration"."anonymized_at" is not null or ("registration"."full_name" is not null and "registration"."email" is not null
        and "registration"."emergency_contact_name" is not null and "registration"."emergency_contact_phone" is not null))
);
--> statement-breakpoint
CREATE TABLE "waiver_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_edition_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"body" text NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waiver_edition_version_key" UNIQUE("ride_edition_id","version"),
	CONSTRAINT "waiver_body_length" CHECK (char_length("waiver_version"."body") between 50 and 20000)
);
--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_ride_edition_id_ride_edition_id_fk" FOREIGN KEY ("ride_edition_id") REFERENCES "public"."ride_edition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_waiver_version_id_waiver_version_id_fk" FOREIGN KEY ("waiver_version_id") REFERENCES "public"."waiver_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiver_version" ADD CONSTRAINT "waiver_version_ride_edition_id_ride_edition_id_fk" FOREIGN KEY ("ride_edition_id") REFERENCES "public"."ride_edition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiver_version" ADD CONSTRAINT "waiver_version_approved_by_organizer_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."organizer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "registration_active_email_key" ON "registration" USING btree ("ride_edition_id","email") WHERE "registration"."status" = 'active';--> statement-breakpoint
CREATE INDEX "registration_cancel_token_idx" ON "registration" USING btree ("cancel_token_hash");