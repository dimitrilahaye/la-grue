import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { type NormalizedEvent } from '../../types/event';
import { mapPullRougeCategory, toCanonicalId } from '../normalizer';

const URL = 'https://pullrouge.fr/';
const USER_AGENT = 'LaGrue-Bot/1.0 (https://github.com/dimitrilahaye/la-grue)';

const MONTHS: Record<string, number> = {
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3,
  mai: 4, juin: 5, juillet: 6, août: 7, aout: 7,
  septembre: 8, octobre: 9, novembre: 10, décembre: 11, decembre: 11,
};

const WEEKDAYS = 'lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche';
const MONTH_NAMES = Object.keys(MONTHS).join('|');
const DATE_RE = new RegExp(
  `(?:${WEEKDAYS})\\s+(\\d{1,2})(?:\\s*<sup>[^<]*</sup>)?\\s+(${MONTH_NAMES})\\s+(\\d{4})(?:[^0-9]*?(\\d{1,2})h(\\d{2})?)?`,
  'i',
);

function parseBlockDate(raw: string): Date | null {
  const m = raw.match(DATE_RE);
  if (!m) return null;
  const day = parseInt(m[1]);
  const month = MONTHS[m[2].toLowerCase()];
  const year = parseInt(m[3]);
  const hour = m[4] ? parseInt(m[4]) : 0;
  const minute = m[5] ? parseInt(m[5]) : 0;
  if (month === undefined) return null;
  return new Date(year, month, day, hour, minute, 0);
}

function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function externalId(title: string, startAt: Date): string {
  return createHash('sha256').update(`${title}${startAt.toISOString()}`).digest('hex');
}

function cityFromVenue(venue: string): string {
  const match = venue.match(/-\s*([A-ZÉÈÊÀÂÙÛÔÎÏŒÆÇ][A-ZÉÈÊÀÂÙÛÔÎÏŒÆÇa-zéèêàâùûôîïœæç\s-]+)$/);
  if (match) return match[1].trim();
  return 'Nantes';
}

export async function scrapePullRouge(): Promise<NormalizedEvent[]> {
  console.log('[PullRouge] Fetching listing page...');
  const res = await axios.get<string>(URL, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 20000,
  });
  console.log(`[PullRouge] Page loaded (${res.data.length} bytes), parsing blocks...`);

  const $ = cheerio.load(res.data);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 14);

  // Collect all FreeSans big>big blocks in document order
  interface Block {
    isRed: boolean;
    hasLink: boolean;
    rawHtml: string;
    linkHref?: string;
    linkText?: string;
  }

  const blocks: Block[] = [];
  $('span').each((_i, el) => {
    const style = $(el).attr('style') ?? '';
    if (!style.includes('FreeSans')) return;
    const big = $(el).children('big').first();
    if (!big.length) return;
    const big2 = big.children('big').first();
    if (!big2.length) return;

    const innerHtml = big2.html() ?? '';
    const isRed = /color:\s*red/i.test(innerHtml) || /color:\s*red/i.test($(el).html() ?? '');
    const anchor = big2.find('a').first();
    const hasLink = anchor.length > 0;

    blocks.push({
      isRed,
      hasLink,
      rawHtml: innerHtml,
      linkHref: hasLink ? anchor.attr('href') : undefined,
      linkText: hasLink ? cleanText(anchor.html() ?? '') : undefined,
    });
  });

  const events: NormalizedEvent[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    // Date block: red, no link, contains a weekday+date pattern
    if (b.isRed && !b.hasLink && DATE_RE.test(b.rawHtml)) {
      const startAt = parseBlockDate(b.rawHtml);
      if (!startAt) { i++; continue; }
      if (startAt < today || startAt > cutoff) { i++; continue; }

      // Next block must be a link block (title)
      const nextB = blocks[i + 1];
      if (!nextB?.hasLink || !nextB.linkHref || !nextB.linkText) { i++; continue; }

      const title = nextB.linkText;
      const detailUrl = nextB.linkHref;

      // Block after that may be the venue (red, starts with @)
      let venue = '';
      let skipExtra = 0;
      const venueB = blocks[i + 2];
      if (venueB?.isRed && /^\s*@/.test(cleanText(venueB.rawHtml))) {
        venue = cleanText(venueB.rawHtml).replace(/^\s*@\s*/, '').trim();
        skipExtra = 1;
      }

      const rawCat = /vernissage/i.test(title) ? 'vernissage' : 'concert';
      const category = mapPullRougeCategory(rawCat);
      if (!category) { i += 2 + skipExtra; continue; }

      events.push({
        source: 'pull_rouge',
        externalId: externalId(title, startAt),
        canonicalId: toCanonicalId(title, startAt, venue ? cityFromVenue(venue) : 'Nantes'),
        title,
        description: null,
        startAt,
        endAt: null,
        venueName: venue || null,
        city: venue ? cityFromVenue(venue) : 'Nantes',
        address: null,
        lat: null,
        lon: null,
        category,
        rawCategory: rawCat,
        tags: [],
        detailUrl,
        imageUrl: null,
        isFree: null,
        priceInfo: null,
      });

      i += 2 + skipExtra;
      continue;
    }
    i++;
  }

  console.log(`[PullRouge] Total: ${events.length} events`);
  return events;
}
