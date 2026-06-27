import { type Category, CATEGORIES } from '../types/event';

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

export function isValidCategory(cat: string): cat is Category {
  return (CATEGORIES as readonly string[]).includes(cat);
}
