import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  doublePrecision,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    canonicalId: text('canonical_id').notNull().unique(),
    source: text('source').notNull(),
    externalId: text('external_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }),
    venueName: text('venue_name'),
    city: text('city'),
    address: text('address'),
    lat: doublePrecision('lat'),
    lon: doublePrecision('lon'),
    category: text('category').notNull(),
    rawCategory: text('raw_category'),
    tags: text('tags').array().default(sql`'{}'::text[]`),
    detailUrl: text('detail_url'),
    imageUrl: text('image_url'),
    isFree: boolean('is_free'),
    priceInfo: text('price_info'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('events_start_at_idx').on(table.startAt),
    index('events_category_idx').on(table.category),
    index('events_city_lower_idx').on(sql`lower(${table.city})`),
  ]
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
