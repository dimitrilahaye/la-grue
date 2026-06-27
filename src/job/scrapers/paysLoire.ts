import axios from 'axios';
import { type NormalizedEvent } from '../../types/event';
import { mapPaysLoireCategory, toCanonicalId } from '../normalizer';

const API_URL =
  'https://data.paysdelaloire.fr/api/explore/v2.1/catalog/datasets/agenda-culture-de-la-region-des-pays-de-la-loire/records';

const USER_AGENT = 'LaGrue-Bot/1.0 (https://github.com/dimitrilahaye/la-grue)';

interface PaysLoireRecord {
  slug: string;
  title_fr: string;
  description_fr?: string;
  firstdate_begin?: string;
  lastdate_begin?: string;
  firstdate_end?: string;
  timings?: Array<{ begin: string; end: string }>;
  location_name?: string;
  location_address?: string;
  location_city?: string;
  location_postalcode?: string;
  location_coordinates?: { lat: number; lon: number };
  canonicalurl?: string;
  keywords_fr?: string;
  category?: string | null;
  location_department?: string;
}

function buildDateRange(): { dateStart: string; dateEnd: string } {
  const now = new Date();
  const twoWeeksLater = new Date(now);
  twoWeeksLater.setDate(now.getDate() + 14);
  return {
    dateStart: now.toISOString().split('T')[0],
    dateEnd: twoWeeksLater.toISOString().split('T')[0],
  };
}

export async function scrapePaysLoire(): Promise<NormalizedEvent[]> {
  const { dateStart, dateEnd } = buildDateRange();
  const events: NormalizedEvent[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const params = new URLSearchParams({
      where: `firstdate_begin >= "${dateStart}" AND firstdate_begin <= "${dateEnd}" AND location_department = "Loire-Atlantique"`,
      limit: String(limit),
      offset: String(offset),
      order_by: 'firstdate_begin ASC',
    });

    const res = await axios.get<{ results: PaysLoireRecord[]; total_count: number }>(
      `${API_URL}?${params}`,
      { headers: { 'User-Agent': USER_AGENT }, timeout: 15000 }
    );

    const { results, total_count } = res.data;

    for (const r of results) {
      if (!r.slug || !r.title_fr) continue;

      const firstTiming = r.timings?.[0];
      const startAt = firstTiming
        ? new Date(firstTiming.begin)
        : r.firstdate_begin
        ? new Date(r.firstdate_begin)
        : null;

      if (!startAt) continue;

      const endAt = firstTiming
        ? new Date(firstTiming.end)
        : r.firstdate_end
        ? new Date(r.firstdate_end)
        : null;

      const keywords = r.keywords_fr ?? '';
      const category = mapPaysLoireCategory(keywords);
      if (!category) continue;

      events.push({
        source: 'pays_de_loire',
        externalId: r.slug,
        canonicalId: toCanonicalId(r.title_fr, startAt, r.location_city ?? null),
        title: r.title_fr,
        description: r.description_fr ?? null,
        startAt,
        endAt,
        venueName: r.location_name ?? null,
        city: r.location_city ?? null,
        address: r.location_address ?? null,
        lat: r.location_coordinates?.lat ?? null,
        lon: r.location_coordinates?.lon ?? null,
        category,
        rawCategory: keywords || null,
        tags: keywords ? keywords.split(';').map((k) => k.trim()).filter(Boolean) : [],
        detailUrl: r.canonicalurl ?? null,
        imageUrl: null,
        isFree: null,
        priceInfo: null,
      });
    }

    offset += limit;
    if (offset >= total_count) break;
  }

  if (events.length === 0) {
    console.warn('[PaysLoire] 0 events found — the dataset may be stale for Loire-Atlantique (last known data: 2025).');
  }

  return events;
}
