import axios from 'axios';
import * as cheerio from 'cheerio';
import { assertNotCloudflare } from './helpers';

const BASE_URL = 'https://www.wik-nantes.fr';
const AGENDA_URL = `${BASE_URL}/agenda`;
const USER_AGENT = 'LaGrue-Bot/1.0 (https://github.com/dimitrilahaye/la-grue)';

function todayFr(): string {
  const d = new Date();
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('/');
}

describe('WIK Nantes HTML contract', () => {
  let $: cheerio.CheerioAPI;
  let articleCount: number;
  let rawBody: string;

  beforeAll(async () => {
    // Must pass ?date= like the scraper does — without it WIK returns a search UI, not the listing
    const url = `${AGENDA_URL}?date=${encodeURIComponent(todayFr())}`;
    const res = await axios.get<string>(url, {
      headers: { 'User-Agent': USER_AGENT },
      responseType: 'text',
      timeout: 10000,
    });
    rawBody = res.data;
    $ = cheerio.load(rawBody);
    const containerExists = $('.listing-articles--agenda').length > 0;
    articleCount = containerExists
      ? $('.listing-articles--agenda .article').length
      : 0;
    if (!containerExists) {
      console.error(
        '[WIK Contract] Listing container (.listing-articles--agenda) not found — DOM structure may have changed or request was blocked',
      );
    } else if (articleCount === 0) {
      console.log(
        '[WIK Contract] No articles on listing page — article-level assertions will be skipped (edge case: hors-saison)',
      );
    }
  });

  it('is not blocked by Cloudflare or IP ban', () => {
    assertNotCloudflare(rawBody, AGENDA_URL);
  });

  it('listing container exists in DOM (.listing-articles--agenda)', () => {
    expect($('.listing-articles--agenda').length).toBeGreaterThan(0);
  });

  it('first article has a title (h2.h2)', () => {
    if (articleCount === 0) return;
    const first = $('.listing-articles--agenda .article').first();
    expect(first.find('h2.h2').text().trim()).toBeTruthy();
  });

  it('first article has a valid link (/nantes/ path)', () => {
    if (articleCount === 0) return;
    const first = $('.listing-articles--agenda .article').first();
    const href = first.find('a').first().attr('href') ?? '';
    expect(href).toMatch(/^\/nantes\//);
  });

  it('first article has a date element', () => {
    if (articleCount === 0) return;
    const first = $('.listing-articles--agenda .article').first();
    expect(first.find('.date').length).toBeGreaterThan(0);
  });

  it('first article has an area element', () => {
    if (articleCount === 0) return;
    const first = $('.listing-articles--agenda .article').first();
    expect(first.find('.area').length).toBeGreaterThan(0);
  });
});
