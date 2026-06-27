import { createHash } from 'crypto';
import he from 'he';
import { type Category, CATEGORIES } from '../types/event';

export function decodeText(s: string): string;
export function decodeText(s: string | null | undefined): string | null;
export function decodeText(s: string | null | undefined): string | null {
  if (s == null) return null;
  return he.decode(s);
}

const NANTES_METROPOLE_MAP: Record<string, Category> = {
  // Specific keys first (avoid partial matches like "expo" matching "sexpo")
  'sexpo': 'sexpo',
  'sexualite': 'sexpo',
  'sexualité': 'sexpo',
  'concert': 'concerts-musique',
  'musique': 'concerts-musique',
  'exposition': 'expositions-arts',
  'expo': 'expositions-arts',
  'spectacle': 'spectacles-theatre',
  'theatre': 'spectacles-theatre',
  'théâtre': 'spectacles-theatre',
  'festival': 'festivals',
  'guinguette': 'ginguettes-guinguettes',
  'ginguette': 'ginguettes-guinguettes',
  'bar': 'bars-soirees',
  'soiree': 'bars-soirees',
  'soirée': 'bars-soirees',
};

const PAYS_LOIRE_KEYWORDS_MAP: Record<string, Category> = {
  ...NANTES_METROPOLE_MAP,
  'opera': 'spectacles-theatre',
  'opéra': 'spectacles-theatre',
  'danse': 'spectacles-theatre',
  'jazz': 'concerts-musique',
  'rock': 'concerts-musique',
  'electro': 'concerts-musique',
  'folk': 'ginguettes-guinguettes',
  'bal': 'ginguettes-guinguettes',
};

const GRABUGE_CATEGORY_MAP: Record<string, Category> = {
  'sexpo': 'sexpo',
  'concert': 'concerts-musique',
  'musique': 'concerts-musique',
  'jazz': 'concerts-musique',
  'rock': 'concerts-musique',
  'electro': 'concerts-musique',
  'exposition': 'expositions-arts',
  'expo': 'expositions-arts',
  'spectacle': 'spectacles-theatre',
  'theatre': 'spectacles-theatre',
  'théâtre': 'spectacles-theatre',
  'humour': 'spectacles-theatre',
  'danse': 'spectacles-theatre',
  'festival': 'festivals',
  'guinguette': 'ginguettes-guinguettes',
  'bal': 'ginguettes-guinguettes',
  'bar': 'bars-soirees',
  'soiree': 'bars-soirees',
};

const PULL_ROUGE_MAP: Record<string, Category> = {
  'concert': 'concerts-musique',
  'musique': 'concerts-musique',
  'vernissage': 'expositions-arts',
  'exposition': 'expositions-arts',
  'expo': 'expositions-arts',
};

const BIG_CITY_LABEL_MAP: Record<string, Category> = {
  'sexpo': 'sexpo',
  'concert': 'concerts-musique',
  'musique': 'concerts-musique',
  'exposition': 'expositions-arts',
  'expo': 'expositions-arts',
  'expos': 'expositions-arts',
  'musees': 'expositions-arts',
  'spectacle': 'spectacles-theatre',
  'theatre': 'spectacles-theatre',
  'stand up': 'spectacles-theatre',
  'festival': 'festivals',
  'guinguette': 'ginguettes-guinguettes',
  'nightlife': 'bars-soirees',
  'bar': 'bars-soirees',
  'soiree': 'bars-soirees',
};

const WIK_URL_PATH_MAP: Record<string, Category> = {
  'sexpo': 'sexpo',
  'scene': 'concerts-musique',
  'musique': 'concerts-musique',
  'expo': 'expositions-arts',
  'exposition': 'expositions-arts',
  'spectacle': 'spectacles-theatre',
  'theatre': 'spectacles-theatre',
  'festival': 'festivals',
  'guinguette': 'ginguettes-guinguettes',
  'bar': 'bars-soirees',
  'soiree': 'bars-soirees',
};

function normalizeString(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

export function mapNantesMetropoleCategory(rawTypes: string, rawThemes: string): Category | null {
  const combined = `${rawTypes} ${rawThemes}`.toLowerCase();
  const tokens = normalizeString(combined).split(/\s+/).filter(Boolean);

  for (const [key, cat] of Object.entries(NANTES_METROPOLE_MAP)) {
    if (tokens.includes(normalizeString(key))) return cat;
  }
  return null;
}

export function mapPaysLoireCategory(keywords: string): Category | null {
  if (!keywords) return null;
  const parts = keywords.split(';').map((k) => normalizeString(k.trim()));

  for (const part of parts) {
    for (const [key, cat] of Object.entries(PAYS_LOIRE_KEYWORDS_MAP)) {
      if (part.includes(normalizeString(key))) return cat;
    }
  }
  return null;
}

export function mapWikCategory(urlPath: string): Category | null {
  const normalized = normalizeString(urlPath);
  for (const [key, cat] of Object.entries(WIK_URL_PATH_MAP)) {
    if (normalized.includes(normalizeString(key))) return cat;
  }
  return null;
}

export function mapGrabugeCategory(categories: string[]): Category | null {
  for (const cat of categories) {
    const tokens = normalizeString(cat).split(/\s+/).filter(Boolean);
    for (const [key, mapped] of Object.entries(GRABUGE_CATEGORY_MAP)) {
      if (tokens.includes(normalizeString(key))) return mapped;
    }
  }
  return null;
}

export function mapPullRougeCategory(rawText: string): Category | null {
  const tokens = normalizeString(rawText).split(/\s+/).filter(Boolean);
  for (const [key, cat] of Object.entries(PULL_ROUGE_MAP)) {
    const keyTokens = normalizeString(key).split(/\s+/);
    if (keyTokens.every((t) => tokens.includes(t))) return cat;
  }
  return null;
}

export function mapBigCityCategory(labels: string[]): Category | null {
  for (const label of labels) {
    const tokens = normalizeString(label).split(/\s+/).filter(Boolean);
    for (const [key, cat] of Object.entries(BIG_CITY_LABEL_MAP)) {
      const keyTokens = normalizeString(key).split(/\s+/);
      if (keyTokens.every((t) => tokens.includes(t))) return cat;
    }
  }
  return null;
}

export function isValidCategory(cat: string): cat is Category {
  return (CATEGORIES as readonly string[]).includes(cat);
}

export function toCanonicalId(title: string, startAt: Date, city: string | null): string {
  const normalizedTitle = normalizeString(title).replace(/\s+/g, ' ').trim();
  const datePart = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(startAt);
  const cityPart = (city ?? 'nantes').toLowerCase();
  return createHash('sha256').update(`${normalizedTitle}|${datePart}|${cityPart}`).digest('hex');
}
