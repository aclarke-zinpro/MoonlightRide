CREATE TYPE "public"."email_kind" AS ENUM('registration_confirmation', 'registration_cancelled', 'subscription_confirm', 'post_notification');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "email_kind" NOT NULL,
	"to_email" text,
	"related_id" uuid,
	"status" "email_status" NOT NULL,
	"provider_message_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"ip_hash" text NOT NULL,
	"succeeded" boolean NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket" text NOT NULL,
	"ip_hash" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ride_edition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"time_zone" text DEFAULT 'America/Chicago' NOT NULL,
	"start_location_name" text NOT NULL,
	"start_location_address" text NOT NULL,
	"start_lat" numeric(9, 6) NOT NULL,
	"start_lng" numeric(9, 6) NOT NULL,
	"parking_notes" text DEFAULT '' NOT NULL,
	"intro" text DEFAULT '' NOT NULL,
	"why_this_date" text DEFAULT '' NOT NULL,
	"ride_prep" text DEFAULT '' NOT NULL,
	"route_description" text DEFAULT '' NOT NULL,
	"organizer_intro" text DEFAULT '' NOT NULL,
	"distance_miles" numeric(5, 1) NOT NULL,
	"pct_gravel" integer NOT NULL,
	"pct_trail" integer NOT NULL,
	"pct_paved" integer NOT NULL,
	"elevation_gain_ft" integer NOT NULL,
	"rwgps_route_id" text NOT NULL,
	"rwgps_event_url" text NOT NULL,
	"static_map_image_url" text NOT NULL,
	"registration_open" boolean DEFAULT false NOT NULL,
	"capacity" integer,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ride_edition_year_range" CHECK ("ride_edition"."year" between 2000 and 2100),
	CONSTRAINT "ride_edition_surface_sum" CHECK ("ride_edition"."pct_gravel" + "ride_edition"."pct_trail" + "ride_edition"."pct_paved" = 100
        and "ride_edition"."pct_gravel" between 0 and 100
        and "ride_edition"."pct_trail" between 0 and 100
        and "ride_edition"."pct_paved" between 0 and 100),
	CONSTRAINT "ride_edition_capacity_positive" CHECK ("ride_edition"."capacity" is null or "ride_edition"."capacity" >= 1),
	CONSTRAINT "ride_edition_distance_positive" CHECK ("ride_edition"."distance_miles" > 0),
	CONSTRAINT "ride_edition_elevation_nonneg" CHECK ("ride_edition"."elevation_gain_ft" >= 0)
);
--> statement-breakpoint
CREATE INDEX "email_log_related_idx" ON "email_log" USING btree ("related_id");--> statement-breakpoint
CREATE INDEX "login_attempt_attempted_at_idx" ON "login_attempt" USING btree ("attempted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organizer_email_key" ON "organizer" USING btree ("email");--> statement-breakpoint
CREATE INDEX "rate_limit_event_lookup_idx" ON "rate_limit_event" USING btree ("bucket","ip_hash","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ride_edition_year_key" ON "ride_edition" USING btree ("year");--> statement-breakpoint
CREATE UNIQUE INDEX "ride_edition_one_current" ON "ride_edition" USING btree ("is_current") WHERE "ride_edition"."is_current" = true;