import axios from 'axios';
import { type NormalizedEvent } from '../../types/event';
import { mapBigCityCategory } from '../normalizer';

const LISTING_URL = 'https://www.bigcitynantes.fr/que-faire-a-nantes/';
const AJAX_URL = 'https://www.bigcitynantes.fr/wp-admin/admin-ajax.php';
const USER_AGENT = 'LaGrue-Bot/1.0 (https://github.com/dimitrilahaye/la-grue)';

interface CecVenue {
  title?: string;
  addr?: string;
  coordinates?: { latitude?: string; longitude?: string };
}

interface CecCategories {
  labels?: string[];
}

interface CecEvent {
  id: number;
  title: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  price_type?: string;
  permalink?: string;
  thumbnail?: string;
  venue?: CecVenue;
  categories?: CecCategories;
}

interface CecResponse {
  success: boolean;
  data?: {
    events?: CecEvent[];
    has_more?: boolean;
  };
}

function buildDateRange(): { dateStart: string; dateEnd: string } {
  const now = new Date();
  const twoWeeksLater = new Date(now);
  twoWeeksLater.setDate(now.getDate() + 14);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { dateStart: fmt(now), dateEnd: fmt(twoWeeksLater) };
}

async function extractNonce(): Promise<string> {
  const res = await axios.get<string>(LISTING_URL, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 20000,
  });
  const match = res.data.match(/"nonce"\s*:\s*"([a-f0-9]+)"/);
  if (!match) throw new Error('[BigCity] Could not extract nonce from listing page');
  return match[1];
}

function parseDateTime(date: string, time?: string): Date {
  if (!time || time === '00:00' || time === '') {
    return new Date(`${date}T00:00:00`);
  }
  return new Date(`${date}T${time}:00`);
}

export async function scrapeBigCity(): Promise<NormalizedEvent[]> {
  const nonce = await extractNonce();
  const { dateStart, dateEnd } = buildDateRange();
  const events: NormalizedEvent[] = [];
  let page = 1;

  while (true) {
    const body = new URLSearchParams({
      action: 'cec_get_events',
      nonce,
      start_date: dateStart,
      end_date: dateEnd,
      page: String(page),
    });

    const res = await axios.post<CecResponse>(AJAX_URL, body.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000,
    });

    if (!res.data.success) {
      throw new Error('[BigCity] AJAX request failed (invalid nonce or server error)');
    }

    const batch = res.data.data?.events ?? [];
    if (batch.length === 0) break;

    for (const e of batch) {
      if (!e.id || !e.title || !e.start_date) continue;

      const startAt = parseDateTime(e.start_date, e.start_time);
      const endAt = e.end_date ? parseDateTime(e.end_date, e.end_time) : null;

      const labels = e.categories?.labels ?? [];
      const category = mapBigCityCategory(labels);
      if (!category) continue;

      const lat = e.venue?.coordinates?.latitude ? parseFloat(e.venue.coordinates.latitude) : null;
      const lon = e.venue?.coordinates?.longitude ? parseFloat(e.venue.coordinates.longitude) : null;

      events.push({
        source: 'big_city',
        externalId: String(e.id),
        title: e.title,
        description: null,
        startAt,
        endAt,
        venueName: e.venue?.title ?? null,
        city: 'Nantes',
        address: e.venue?.addr ?? null,
        lat: isNaN(lat as number) ? null : lat,
        lon: isNaN(lon as number) ? null : lon,
        category,
        rawCategory: labels.join(', ') || null,
        tags: [],
        detailUrl: e.permalink ?? null,
        imageUrl: e.thumbnail ?? null,
        isFree: e.price_type === 'gratuit',
        priceInfo: null,
      });
    }

    if (!res.data.data?.has_more) break;
    page++;
  }

  console.log(`[BigCity] Total: ${events.length} events`);
  return events;
}
