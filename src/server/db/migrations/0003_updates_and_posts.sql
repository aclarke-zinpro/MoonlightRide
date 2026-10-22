CREATE TYPE "public"."subscriber_status" AS ENUM('pending', 'active', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "subscriber" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"status" "subscriber_status" DEFAULT 'pending' NOT NULL,
	"confirm_token_hash" text,
	"confirm_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribe_token_hash" text NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"body" text NOT NULL,
	"cover_image_url" text,
	"cover_image_alt" text,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"notified_at" timestamp with time zone,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_title_length" CHECK (char_length("post"."title") between 3 and 150),
	CONSTRAINT "post_summary_length" CHECK (char_length("post"."summary") <= 300),
	CONSTRAINT "post_body_length" CHECK (char_length("post"."body") between 1 and 50000),
	CONSTRAINT "post_cover_alt_required" CHECK ("post"."cover_image_url" is null or char_length("post"."cover_image_alt") between 1 and 200)
);
--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_author_id_organizer_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."organizer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriber_email_key" ON "subscriber" USING btree ("email");--> statement-breakpoint
CREATE INDEX "subscriber_confirm_token_idx" ON "subscriber" USING btree ("confirm_token_hash");--> statement-breakpoint
CREATE INDEX "subscriber_unsubscribe_token_idx" ON "subscriber" USING btree ("unsubscribe_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "post_slug_key" ON "post" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "post_published_idx" ON "post" USING btree ("status","published_at");