import { and, eq, gte, lt, ilike, count, isNotNull, asc, sql } from 'drizzle-orm';
import { db } from '../client';
import { events, type Event } from '../schema';

export interface EventFilters {
  date?: string;
  category?: string;
  city?: string;
  limit?: number;
  offset?: number;
}

function getDayBounds(dateStr?: string): { start: Date; end: Date } {
  const dateString = dateStr ?? new Date().toLocaleDateString('sv', { timeZone: 'Europe/Paris' });
  const [year, month, day] = dateString.split('-').map(Number);

  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  // Adjust for Europe/Paris offset (UTC+1 or UTC+2)
  // We query in UTC but the dates were stored with timezone info
  // Using Paris midnight: offset is either -60 or -120 minutes from UTC
  const parisOffset = new Date(start).toLocaleString('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' });
  const offsetMatch = parisOffset.match(/GMT([+-]\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1]) : 1;

  const startParis = new Date(start.getTime() - offsetHours * 60 * 60 * 1000);
  const endParis = new Date(end.getTime() - offsetHours * 60 * 60 * 1000);

  return { start: startParis, end: endParis };
}

export async function findEvents(filters: EventFilters): Promise<{
  data: Event[];
  total: number;
  limit: number;
  offset: number;
  date: string;
}> {
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = filters.offset ?? 0;
  const dateStr = filters.date;
  const { start, end } = getDayBounds(dateStr);
  const displayDate = dateStr ?? new Date().toLocaleDateString('sv', { timeZone: 'Europe/Paris' });

  const conditions = [gte(events.startAt, start), lt(events.startAt, end)];

  if (filters.category) {
    conditions.push(eq(events.category, filters.category));
  }

  if (filters.city) {
    conditions.push(ilike(events.city, `%${filters.city}%`));
  }

  const where = and(...conditions);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(events)
      .where(where)
      .orderBy(events.startAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(events)
      .where(where),
  ]);

  return { data: rows, total: Number(total), limit, offset, date: displayDate };
}

export async function findEventById(id: string): Promise<Event | null> {
  const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findCities(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ city: events.city })
    .from(events)
    .where(isNotNull(events.city))
    .orderBy(asc(events.city));
  return rows.map((r) => r.city as string);
}

export async function findEventDates(): Promise<string[]> {
  const result = await db.execute(
    sql`SELECT DISTINCT (start_at AT TIME ZONE 'Europe/Paris')::date::text AS event_date
        FROM events
        ORDER BY event_date ASC`
  );
  return result.map((row) => (row as { event_date: string }).event_date);
}
