import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import { createHash } from 'crypto';
import { type NormalizedEvent } from '../../types/event';
import { mapWikCategory } from '../normalizer';

const BASE_URL = 'https://www.wik-nantes.fr';
const AGENDA_URL = `${BASE_URL}/agenda`;
const USER_AGENT = 'LaGrue-Bot/1.0 (https://github.com/dimitrilahaye/la-grue)';
const RATE_LIMIT_DELAY_MS = 1500;

interface WikListItem {
  title: string;
  categoryPath: string;
  detailUrl: string;
}

interface WikDetailEvent {
  venueName: string | null;
  startAt: Date | null;
  endAt: Date | null;
  description: string | null;
  imageUrl: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function externalIdFromWik(title: string, startAt: Date | null): string {
  const key = `${title}${startAt?.toISOString() ?? ''}`;
  return createHash('sha256').update(key).digest('hex');
}

function extractDateFromText(text: string): Date | null {
  // Patterns: "25/06/2026", "25 juin 2026", "2026-06-25"
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`);

  const frMatch = text.match(/(\d{1,2})\s+([a-zéûùàâôêîèäöü]+)\s+(\d{4})/i);
  if (frMatch) {
    const months: Record<string, string> = {
      janvier: '01', février: '02', mars: '03', avril: '04',
      mai: '05', juin: '06', juillet: '07', août: '08',
      septembre: '09', octobre: '10', novembre: '11', décembre: '12',
    };
    const month = months[frMatch[2].toLowerCase()];
    if (month) return new Date(`${frMatch[3]}-${month}-${frMatch[1].padStart(2, '0')}T00:00:00`);
  }

  const slashMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) return new Date(`${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}T00:00:00`);

  return null;
}

function extractTimeFromText(text: string): { hour: number; minute: number } | null {
  const match = text.match(/(\d{1,2})[h:](\d{2})/);
  if (match) return { hour: parseInt(match[1]), minute: parseInt(match[2]) };
  const matchH = text.match(/(\d{1,2})h/);
  if (matchH) return { hour: parseInt(matchH[1]), minute: 0 };
  return null;
}

async function fetchListingPage(): Promise<WikListItem[]> {
  const res = await axios.get<string>(AGENDA_URL, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 15000,
  });

  const $ = cheerio.load(res.data);
  const items: WikListItem[] = [];

  // WIK Nantes uses cards with links — adapt selectors as needed based on actual markup
  $('a[href*="/nantes/"]').each((_i, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    const pathParts = href.replace(/^\/nantes\/\d+\//, '').split('/');
    const categoryPath = pathParts[0] ?? 'loisir';

    const title =
      $(el).find('h3').text().trim() ||
      $(el).find('h2').text().trim() ||
      $(el).attr('title') ||
      $(el).text().trim();

    if (!title || items.some((i) => i.detailUrl === fullUrl)) return;

    items.push({ title, categoryPath, detailUrl: fullUrl });
  });

  return items;
}

async function fetchDetailPage(item: WikListItem): Promise<WikDetailEvent> {
  try {
    const res = await axios.get<string>(item.detailUrl, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000,
    });

    const $ = cheerio.load(res.data);

    const fullText = $('body').text();
    const dateFromPage = extractDateFromText(fullText);
    const timeInfo = extractTimeFromText(fullText);

    let startAt: Date | null = null;
    if (dateFromPage) {
      startAt = new Date(dateFromPage);
      if (timeInfo) {
        startAt.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
      }
    }

    const venueName =
      $('[class*="lieu"], [class*="venue"], [class*="place"]').first().text().trim() || null;

    const description =
      $('[class*="description"], [class*="content"] p').first().text().trim() || null;

    const imageUrl =
      $('img[class*="principale"], article img, .event-image img').first().attr('src') ?? null;
    const resolvedImage = imageUrl && !imageUrl.startsWith('http') ? `${BASE_URL}${imageUrl}` : imageUrl;

    return { venueName, startAt, endAt: null, description, imageUrl: resolvedImage };
  } catch (err) {
    console.warn(`[WIK] Failed to fetch detail page: ${item.detailUrl}`, (err as Error).message);
    return { venueName: null, startAt: null, endAt: null, description: null, imageUrl: null };
  }
}

export async function scrapeWik(): Promise<NormalizedEvent[]> {
  const listItems = await fetchListingPage();
  console.log(`[WIK] Found ${listItems.length} events in listing`);

  const limit = pLimit(1);
  const events: NormalizedEvent[] = [];

  for (const item of listItems) {
    await limit(async () => {
      await sleep(RATE_LIMIT_DELAY_MS);
      const detail = await fetchDetailPage(item);

      if (!detail.startAt) {
        console.warn(`[WIK] Skipping event with no date: ${item.title}`);
        return;
      }

      const category = mapWikCategory(item.categoryPath);
      const externalId = externalIdFromWik(item.title, detail.startAt);

      events.push({
        source: 'wik',
        externalId,
        title: item.title,
        description: detail.description,
        startAt: detail.startAt,
        endAt: detail.endAt,
        venueName: detail.venueName,
        city: 'Nantes',
        address: null,
        lat: null,
        lon: null,
        category,
        rawCategory: item.categoryPath,
        tags: [],
        detailUrl: item.detailUrl,
        imageUrl: detail.imageUrl,
        isFree: null,
        priceInfo: null,
      });
    });
  }

  return events;
}
