import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import { events } from '../db/schema';
import { type NormalizedEvent } from '../types/event';

export async function purgeExpiredEvents(): Promise<number> {
  const result = await db.execute(
    sql`DELETE FROM events WHERE (start_at AT TIME ZONE 'Europe/Paris')::date < CURRENT_DATE AT TIME ZONE 'Europe/Paris'`
  );
  return Array.isArray(result) ? result.length : 0;
}

export interface UpsertResult {
  inserted: number;
  updated: number;
  errors: number;
}

export async function upsertEvents(normalized: NormalizedEvent[]): Promise<UpsertResult> {
  if (normalized.length === 0) return { inserted: 0, updated: 0, errors: 0 };

  const now = new Date();
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // Deduplicate within the input: keep the last occurrence for each (source, external_id)
  const seen = new Map<string, NormalizedEvent>();
  for (const e of normalized) {
    seen.set(`${e.source}:${e.externalId}`, e);
  }
  const deduped = [...seen.values()];

  // Process in batches of 50 to avoid oversized queries
  const BATCH_SIZE = 50;
  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE);

    const rows = batch.map((e) => ({
      source: e.source,
      externalId: e.externalId,
      title: e.title,
      description: e.description,
      startAt: e.startAt,
      endAt: e.endAt,
      venueName: e.venueName,
      city: e.city,
      address: e.address,
      lat: e.lat,
      lon: e.lon,
      category: e.category,
      rawCategory: e.rawCategory,
      tags: e.tags,
      detailUrl: e.detailUrl,
      imageUrl: e.imageUrl,
      isFree: e.isFree,
      priceInfo: e.priceInfo,
      updatedAt: now,
    }));

    try {
      const result = await db
        .insert(events)
        .values(rows)
        .onConflictDoUpdate({
          target: [events.source, events.externalId],
          set: {
            title: sql`excluded.title`,
            description: sql`excluded.description`,
            startAt: sql`excluded.start_at`,
            endAt: sql`excluded.end_at`,
            venueName: sql`excluded.venue_name`,
            city: sql`excluded.city`,
            address: sql`excluded.address`,
            lat: sql`excluded.lat`,
            lon: sql`excluded.lon`,
            category: sql`excluded.category`,
            rawCategory: sql`excluded.raw_category`,
            tags: sql`excluded.tags`,
            detailUrl: sql`excluded.detail_url`,
            imageUrl: sql`excluded.image_url`,
            isFree: sql`excluded.is_free`,
            priceInfo: sql`excluded.price_info`,
            updatedAt: sql`excluded.updated_at`,
          },
        })
        .returning({ id: events.id, createdAt: events.createdAt, updatedAt: events.updatedAt });

      for (const row of result) {
        // If updatedAt was just set to `now`, it was an update; if createdAt ≈ updatedAt, it's new
        const diff = Math.abs(row.updatedAt.getTime() - row.createdAt.getTime());
        if (diff < 2000) {
          inserted++;
        } else {
          updated++;
        }
      }
    } catch (err) {
      console.error(`[Deduplicator] Batch error:`, err);
      errors += batch.length;
    }
  }

  return { inserted, updated, errors };
}
