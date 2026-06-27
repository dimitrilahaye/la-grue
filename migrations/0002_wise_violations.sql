ALTER TABLE "events" ADD COLUMN "canonical_id" text;--> statement-breakpoint
UPDATE "events" SET "canonical_id" = md5(lower(title) || '|' || to_char(start_at AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') || '|' || lower(coalesce(city, 'nantes'))) WHERE "canonical_id" IS NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "canonical_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_canonical_id_unique" UNIQUE("canonical_id");
