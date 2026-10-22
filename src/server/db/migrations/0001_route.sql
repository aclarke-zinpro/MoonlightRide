CREATE TYPE "public"."poi_kind" AS ENUM('rest_stop', 'food_drink', 'scenic', 'landmark');--> statement-breakpoint
CREATE TABLE "cue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_edition_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL,
	"mile" numeric(4, 1),
	"is_important" boolean DEFAULT false NOT NULL,
	"is_optional_detour" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cue_edition_position_key" UNIQUE("ride_edition_id","position"),
	CONSTRAINT "cue_text_length" CHECK (char_length("cue"."text") between 1 and 500),
	CONSTRAINT "cue_mile_nonneg" CHECK ("cue"."mile" is null or "cue"."mile" >= 0)
);
--> statement-breakpoint
CREATE TABLE "point_of_interest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_edition_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"mile" numeric(4, 1) NOT NULL,
	"kind" "poi_kind" NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"photo_url" text,
	"photo_alt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "poi_edition_position_key" UNIQUE("ride_edition_id","position"),
	CONSTRAINT "poi_name_length" CHECK (char_length("point_of_interest"."name") between 1 and 120),
	CONSTRAINT "poi_description_length" CHECK (char_length("point_of_interest"."description") <= 1000),
	CONSTRAINT "poi_mile_nonneg" CHECK ("point_of_interest"."mile" >= 0),
	CONSTRAINT "poi_photo_alt_required" CHECK ("point_of_interest"."photo_url" is null or char_length("point_of_interest"."photo_alt") >= 1)
);
--> statement-breakpoint
ALTER TABLE "cue" ADD CONSTRAINT "cue_ride_edition_id_ride_edition_id_fk" FOREIGN KEY ("ride_edition_id") REFERENCES "public"."ride_edition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_of_interest" ADD CONSTRAINT "point_of_interest_ride_edition_id_ride_edition_id_fk" FOREIGN KEY ("ride_edition_id") REFERENCES "public"."ride_edition"("id") ON DELETE cascade ON UPDATE no action;