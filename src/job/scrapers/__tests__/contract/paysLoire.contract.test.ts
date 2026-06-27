import axios from 'axios';
import { z } from 'zod';
import { assertNotCloudflare, buildDateRange } from './helpers';

const API_URL =
  'https://data.paysdelaloire.fr/api/explore/v2.1/catalog/datasets/agenda-culture-de-la-region-des-pays-de-la-loire/records';
const USER_AGENT = 'LaGrue-Bot/1.0 (https://github.com/dimitrilahaye/la-grue)';

const pdlTimingSchema = z.object({
  begin: z.string(),
  end: z.string(),
});

const pdlRecordSchema = z.object({
  slug: z.string(),
  title_fr: z.string(),
  description_fr: z.string().optional().nullable(),
  firstdate_begin: z.string().optional().nullable(),
  lastdate_begin: z.string().optional().nullable(),
  firstdate_end: z.string().optional().nullable(),
  timings: z.array(pdlTimingSchema).optional().nullable(),
  location_name: z.string().optional().nullable(),
  location_address: z.string().optional().nullable(),
  location_city: z.string().optional().nullable(),
  location_postalcode: z.string().optional().nullable(),
  location_coordinates: z
    .object({ lat: z.number(), lon: z.number() })
    .optional()
    .nullable(),
  canonicalurl: z.string().optional().nullable(),
  keywords_fr: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  location_department: z.string().optional().nullable(),
});

const pdlResponseSchema = z.object({
  results: z.array(pdlRecordSchema),
  total_count: z.number(),
});

describe('Pays de la Loire API contract', () => {
  let rawBody: string;

  beforeAll(async () => {
    const { dateStart, dateEnd } = buildDateRange();
    const params = new URLSearchParams({
      where: `firstdate_begin >= "${dateStart}" AND firstdate_begin <= "${dateEnd}" AND location_department = "Loire-Atlantique"`,
      limit: '1',
      order_by: 'firstdate_begin ASC',
    });
    const res = await axios.get<string>(`${API_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
      responseType: 'text',
      timeout: 10000,
    });
    rawBody = res.data;
  });

  it('is not blocked by Cloudflare or IP ban', () => {
    assertNotCloudflare(rawBody, API_URL);
  });

  it('response matches PDL record schema', () => {
    const json: unknown = JSON.parse(rawBody);
    const result = pdlResponseSchema.safeParse(json);
    if (!result.success) {
      throw new Error(`Schema validation failed:\n${result.error.message}`);
    }
    if (result.data.results.length === 0) {
      console.warn('[PDL Contract] No events returned for the 14-day window — the Loire-Atlantique dataset may be stale');
    }
  });
});
