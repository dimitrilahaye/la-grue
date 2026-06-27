import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import { events } from '../db/schema';
import { type NormalizedEvent } from '../types/event';
import { decodeText } from './normalizer';

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

export function richnessScore(e: NormalizedEvent): number {
  let score = 0;
  if (e.title) score++;
  if (e.description) score++;
  if (e.lat !== null && e.lon !== null) score++;
  if (e.imageUrl) score++;
  if (e.priceInfo) score++;
  return score;
}

export async function upsertEvents(normalized: NormalizedEvent[]): Promise<UpsertResult> {
  if (normalized.length === 0) return { inserted: 0, updated: 0, errors: 0 };

  const now = new Date();
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // Within-batch dedup by canonicalId: keep the candidate with the highest richness score
  const byCanonical = new Map<string, NormalizedEvent>();
  for (const e of normalized) {
    const existing = byCanonical.get(e.canonicalId);
    if (!existing || richnessScore(e) > richnessScore(existing)) {
      byCanonical.set(e.canonicalId, e);
    }
  }
  const deduped = [...byCanonical.values()];

  // Process in batches of 50 to avoid oversized queries
  const BATCH_SIZE = 50;
  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE);

    const rows = batch.map((e) => ({
      canonicalId: e.canonicalId,
      source: e.source,
      externalId: e.externalId,
      title: decodeText(e.title),
      description: decodeText(e.description),
      startAt: e.startAt,
      endAt: e.endAt,
      venueName: decodeText(e.venueName),
      city: decodeText(e.city),
      address: decodeText(e.address),
      lat: e.lat,
      lon: e.lon,
      category: e.category,
      rawCategory: e.rawCategory,
      tags: e.tags,
      detailUrl: e.detailUrl,
      imageUrl: e.imageUrl,
      isFree: e.isFree,
      priceInfo: decodeText(e.priceInfo),
      updatedAt: now,
    }));

    try {
      const result = await db
        .insert(events)
        .values(rows)
        .onConflictDoUpdate({
          target: [events.canonicalId],
          set: {
            source: sql`excluded.source`,
            externalId: sql`excluded.external_id`,
            title: sql`excluded.title`,
            description: sql`CASE WHEN length(excluded.description) > length(COALESCE(events.description, '')) THEN excluded.description ELSE events.description END`,
            startAt: sql`excluded.start_at`,
            endAt: sql`excluded.end_at`,
            venueName: sql`excluded.venue_name`,
            city: sql`excluded.city`,
            address: sql`excluded.address`,
            lat: sql`COALESCE(excluded.lat, events.lat)`,
            lon: sql`COALESCE(excluded.lon, events.lon)`,
            category: sql`excluded.category`,
            rawCategory: sql`excluded.raw_category`,
            tags: sql`excluded.tags`,
            detailUrl: sql`excluded.detail_url`,
            imageUrl: sql`COALESCE(excluded.image_url, events.image_url)`,
            isFree: sql`excluded.is_free`,
            priceInfo: sql`COALESCE(excluded.price_info, events.price_info)`,
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
