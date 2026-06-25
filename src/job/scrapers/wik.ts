import axios from 'axios';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { createHash } from 'crypto';
import { type NormalizedEvent } from '../../types/event';
import { mapWikCategory } from '../normalizer';

const BASE_URL = 'https://www.wik-nantes.fr';
const AGENDA_URL = `${BASE_URL}/agenda`;
const USER_AGENT = 'LaGrue-Bot/1.0 (https://github.com/dimitrilahaye/la-grue)';

// Fetch enough pages to cover current + next week
const MAX_PAGES = 4;

const MONTHS: Record<string, number> = {
  janvier: 0, février: 1, mars: 2, avril: 3,
  mai: 4, juin: 5, juillet: 6, août: 7,
  septembre: 8, octobre: 9, novembre: 10, décembre: 11,
};

function externalIdFromWik(title: string, startAt: Date): string {
  return createHash('sha256').update(`${title}${startAt.toISOString()}`).digest('hex');
}

// Parses "jeudi 25 juin 2026, 21h00" → Date, and "Jusqu'au samedi 4 juillet 2026" → endAt
function parseDateBlock(text: string): { startAt: Date | null; endAt: Date | null } {
  let startAt: Date | null = null;
  let endAt: Date | null = null;

  // "25 juin 2026, 21h00" or "25 juin 2026, 21h"
  const startMatch = text.match(/(\d{1,2})\s+([a-zéûùàâôêîèäöü]+)\s+(\d{4}),\s*(\d{1,2})h(\d{2})?/i);
  if (startMatch) {
    const month = MONTHS[startMatch[2].toLowerCase()];
    if (month !== undefined) {
      startAt = new Date(
        parseInt(startMatch[3]),
        month,
        parseInt(startMatch[1]),
        parseInt(startMatch[4]),
        parseInt(startMatch[5] ?? '0'),
        0,
      );
    }
  }

  // "Jusqu'au samedi 4 juillet 2026"
  const untilMatch = text.match(/[Jj]usqu'au\s+\w+\s+(\d{1,2})\s+([a-zéûùàâôêîèäöü]+)\s+(\d{4})/i);
  if (untilMatch) {
    const month = MONTHS[untilMatch[2].toLowerCase()];
    if (month !== undefined) {
      endAt = new Date(parseInt(untilMatch[3]), month, parseInt(untilMatch[1]), 23, 59, 0);
    }
  }

  return { startAt, endAt };
}

function parseArticle($: cheerio.CheerioAPI, el: AnyNode): NormalizedEvent | null {
  const card = $(el);

  const title = card.find('h2.h2').text().trim();
  if (!title) return null;

  // Detail URL from the image link (first <a> in the card)
  const href = card.find('a').first().attr('href') ?? '';
  if (!href || !href.startsWith('/nantes/')) return null;
  const detailUrl = `${BASE_URL}${href}`;

  // Category from URL path: /nantes/1/<category>/slug
  const categoryPath = href.split('/')[3] ?? 'loisirs';

  // Date: strip SVG title text + "Dates : " label
  const dateRaw = card.find('.date').text();
  const dateText = dateRaw.replace(/^[\s\S]*?Dates\s*:\s*/i, '').trim();
  const { startAt, endAt } = parseDateBlock(dateText);

  if (!startAt) return null;

  // Venue: strip SVG title text + "Lieu : " label
  const areaRaw = card.find('.area').text();
  const venueName = areaRaw.replace(/^[\s\S]*?Lieu\s*:\s*/i, '').trim() || null;

  // Image
  const imgSrc = card.find('img').first().attr('src') ?? null;
  const imageUrl = imgSrc
    ? imgSrc.startsWith('http') ? imgSrc : `${BASE_URL}${imgSrc}`
    : null;

  const category = mapWikCategory(categoryPath);

  return {
    source: 'wik',
    externalId: externalIdFromWik(title, startAt),
    title,
    description: null,
    startAt,
    endAt,
    venueName,
    city: 'Nantes',
    address: null,
    lat: null,
    lon: null,
    category,
    rawCategory: categoryPath,
    tags: [],
    detailUrl,
    imageUrl,
    isFree: null,
    priceInfo: null,
  };
}

async function fetchPage(page: number): Promise<NormalizedEvent[]> {
  const url = page === 0 ? AGENDA_URL : `${AGENDA_URL}?page=${page}`;
  const res = await axios.get<string>(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 15000,
  });

  const $ = cheerio.load(res.data);
  const events: NormalizedEvent[] = [];

  $('.listing-articles--agenda .article').each((_i, el) => {
    const event = parseArticle($, el);
    if (event) events.push(event);
  });

  return events;
}

export async function scrapeWik(): Promise<NormalizedEvent[]> {
  const allEvents: NormalizedEvent[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    try {
      const events = await fetchPage(page);
      if (events.length === 0) break;
      allEvents.push(...events);
      console.log(`[WIK] Page ${page}: ${events.length} events`);
    } catch (err) {
      console.warn(`[WIK] Failed to fetch page ${page}:`, (err as Error).message);
      break;
    }
  }

  console.log(`[WIK] Total: ${allEvents.length} events`);
  return allEvents;
}
