import axios from 'axios';
import { type NormalizedEvent } from '../../types/event';
import { mapNantesMetropoleCategory, toCanonicalId } from '../normalizer';

const API_URL =
  'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_agenda-evenements-nantes-metropole_v2/records';

const USER_AGENT = 'LaGrue-Bot/1.0 (https://github.com/dimitrilahaye/la-grue)';

interface NantesRecord {
  id_manif: string;
  nom: string;
  description_evt?: string;
  description?: string;
  date: string;
  heure_debut?: string;
  heure_fin?: string;
  lieu?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  latitude?: number;
  longitude?: number;
  themes_libelles?: string | string[];
  types_libelles?: string | string[];
  lien_agenda?: string;
  url_site?: string;
  media_url?: string;
  gratuit?: boolean;
  precisions_tarifs_evt?: string;
}

const AGENDA_BASE = 'https://metropole.nantes.fr/que-faire-a-nantes/agenda';

function toStr(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v.join(' ') : (v ?? '');
}

export function toNantesSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

function buildDateRange(): { dateStart: string; dateEnd: string } {
  const now = new Date();
  const twoWeeksLater = new Date(now);
  twoWeeksLater.setDate(now.getDate() + 14);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { dateStart: fmt(now), dateEnd: fmt(twoWeeksLater) };
}

function parseDateTime(dateStr: string, timeStr?: string): Date {
  const base = `${dateStr}T${timeStr ?? '00:00'}:00`;
  return new Date(base);
}

export async function scrapeNantesMetropole(): Promise<NormalizedEvent[]> {
  const { dateStart, dateEnd } = buildDateRange();
  const events: NormalizedEvent[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const params = new URLSearchParams({
      where: `date >= "${dateStart}" AND date <= "${dateEnd}"`,
      limit: String(limit),
      offset: String(offset),
      order_by: 'date ASC',
    });

    const res = await axios.get<{ results: NantesRecord[]; total_count: number }>(
      `${API_URL}?${params}`,
      { headers: { 'User-Agent': USER_AGENT }, timeout: 15000 }
    );

    const { results, total_count } = res.data;

    for (const r of results) {
      if (!r.id_manif || !r.nom || !r.date) continue;

      const startAt = parseDateTime(r.date, r.heure_debut);
      const endAt = r.heure_fin ? parseDateTime(r.date, r.heure_fin) : null;

      const typesStr = toStr(r.types_libelles);
      const themesStr = toStr(r.themes_libelles);
      const rawCategory = [typesStr, themesStr].filter(Boolean).join(' ');
      const category = mapNantesMetropoleCategory(typesStr, themesStr);
      if (!category) continue;

      events.push({
        source: 'nantes_metropole',
        externalId: r.id_manif,
        canonicalId: toCanonicalId(r.nom, startAt, r.ville ?? 'Nantes'),
        title: r.nom,
        description: r.description_evt ?? r.description ?? null,
        startAt,
        endAt,
        venueName: r.lieu ?? null,
        city: r.ville ?? 'Nantes',
        address: r.adresse ?? null,
        lat: r.latitude ?? null,
        lon: r.longitude ?? null,
        category,
        rawCategory: rawCategory || null,
        tags: [],
        detailUrl: `${AGENDA_BASE}/${toNantesSlug(r.nom)}`,
        imageUrl: r.media_url ?? null,
        isFree: r.gratuit ?? null,
        priceInfo: r.precisions_tarifs_evt ?? null,
      });
    }

    offset += limit;
    if (offset >= total_count) break;
  }

  return events;
}
