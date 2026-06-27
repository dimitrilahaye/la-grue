import axios from 'axios';
import * as cheerio from 'cheerio';
import { type NormalizedEvent } from '../../types/event';
import { mapGrabugeCategory } from '../normalizer';

function stripHtml(html: string): string {
  return cheerio.load(html).text().replace(/\s+/g, ' ').trim();
}

const API_URL = 'https://www.grabugemag.com/wp-json/tribe/events/v1/events';
const USER_AGENT = 'LaGrue-Bot/1.0 (https://github.com/dimitrilahaye/la-grue)';

interface GrabugeVenue {
  venue?: string;
  city?: string;
  address?: string;
}

interface GrabugeImage {
  url?: string;
}

interface GrabugeCategory {
  name: string;
}

interface GrabugeEvent {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  all_day?: boolean;
  url: string;
  image?: GrabugeImage | false;
  venue?: GrabugeVenue;
  categories?: GrabugeCategory[];
  cost?: string;
}

interface GrabugeResponse {
  events: GrabugeEvent[];
  total_found?: number | null;
  next_rest_url?: string | null;
}

function buildDateRange(): { dateStart: string; dateEnd: string } {
  const now = new Date();
  const twoWeeksLater = new Date(now);
  twoWeeksLater.setDate(now.getDate() + 14);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { dateStart: fmt(now), dateEnd: fmt(twoWeeksLater) };
}

function parseGrabugeDate(dateStr: string): Date {
  return new Date(dateStr);
}

export async function scrapeGrabuge(): Promise<NormalizedEvent[]> {
  const { dateStart, dateEnd } = buildDateRange();
  console.log(`[Grabuge] Starting scrape (${dateStart} → ${dateEnd})`);
  const events: NormalizedEvent[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      start_date: dateStart,
      end_date: dateEnd,
      per_page: '100',
      page: String(page),
    });

    console.log(`[Grabuge] Fetching page ${page}...`);
    let res;
    try {
      res = await axios.get<GrabugeResponse>(`${API_URL}?${params}`, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 15000,
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        console.log(`[Grabuge] Page ${page} returned 404 — end of results`);
        break;
      }
      throw err;
    }

    const { events: batch, total_found } = res.data;
    if (!batch || batch.length === 0) break;

    for (const e of batch) {
      if (!e.id || !e.title || !e.start_date) continue;

      const startAt = parseGrabugeDate(e.start_date);
      const endAt = e.end_date ? parseGrabugeDate(e.end_date) : null;

      const categoryNames = (e.categories ?? []).map((c) => c.name);
      const category = mapGrabugeCategory(categoryNames);
      if (!category) continue;

      const imageUrl =
        e.image && typeof e.image === 'object' && e.image.url ? e.image.url : null;

      events.push({
        source: 'grabuge',
        externalId: String(e.id),
        title: e.title,
        description: e.description ? stripHtml(e.description) : null,
        startAt,
        endAt,
        venueName: e.venue?.venue ?? null,
        city: e.venue?.city ?? 'Nantes',
        address: e.venue?.address ?? null,
        lat: null,
        lon: null,
        category,
        rawCategory: categoryNames.join(', ') || null,
        tags: [],
        detailUrl: e.url,
        imageUrl,
        isFree: null,
        priceInfo: e.cost ?? null,
      });
    }

    if (total_found !== null && total_found !== undefined) {
      if (page * 100 >= total_found) break;
    }
    page++;
  }

  console.log(`[Grabuge] Total: ${events.length} events`);
  return events;
}
