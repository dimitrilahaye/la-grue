CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"venue_name" text,
	"city" text,
	"address" text,
	"lat" double precision,
	"lon" double precision,
	"category" text NOT NULL,
	"raw_category" text,
	"tags" text[] DEFAULT '{}'::text[],
	"detail_url" text,
	"image_url" text,
	"is_free" boolean,
	"price_info" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_source_external_id_unique" UNIQUE("source","external_id")
);
--> statement-breakpoint
CREATE INDEX "events_start_at_idx" ON "events" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "events_category_idx" ON "events" USING btree ("category");--> statement-breakpoint
CREATE INDEX "events_city_lower_idx" ON "events" USING btree (lower("city"));