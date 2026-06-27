import axios from 'axios';
import { z } from 'zod';
import { assertNotCloudflare, buildDateRange } from './helpers';

const API_URL =
  'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_agenda-evenements-nantes-metropole_v2/records';
const USER_AGENT = 'LaGrue-Bot/1.0 (https://github.com/dimitrilahaye/la-grue)';

const nmRecordSchema = z.object({
  id_manif: z.string(),
  nom: z.string(),
  date: z.string(),
  heure_debut: z.string().optional().nullable(),
  heure_fin: z.string().optional().nullable(),
  lieu: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  ville: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  // API returns arrays for these fields (scraper interface says string but API sends string[])
  themes_libelles: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  types_libelles: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  media_url: z.string().optional().nullable(),
  // API returns "true"/"false" strings, not booleans
  gratuit: z.union([z.boolean(), z.string()]).optional().nullable(),
  precisions_tarifs_evt: z.string().optional().nullable(),
  description_evt: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const nmResponseSchema = z.object({
  results: z.array(nmRecordSchema),
  total_count: z.number(),
});

describe('Nantes Métropole API contract', () => {
  let rawBody: string;

  beforeAll(async () => {
    const { dateStart, dateEnd } = buildDateRange();
    const params = new URLSearchParams({
      where: `date >= "${dateStart}" AND date <= "${dateEnd}"`,
      limit: '1',
      order_by: 'date ASC',
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

  it('response matches NM record schema', () => {
    const json: unknown = JSON.parse(rawBody);
    const result = nmResponseSchema.safeParse(json);
    if (!result.success) {
      throw new Error(`Schema validation failed:\n${result.error.message}`);
    }
    if (result.data.results.length === 0) {
      console.warn('[NM Contract] No events returned for the 14-day window — check API data availability');
    }
  });
});
