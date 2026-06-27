export const CATEGORIES = [
  'bars-soirees',
  'concerts-musique',
  'expositions-arts',
  'spectacles-theatre',
  'festivals',
  'ginguettes-guinguettes',
  'sexpo',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  'bars-soirees': 'Bars / soirées',
  'concerts-musique': 'Concerts / musique',
  'expositions-arts': 'Expositions / arts',
  'spectacles-theatre': 'Spectacles / théâtre',
  'festivals': 'Festivals',
  'ginguettes-guinguettes': 'Ginguettes / guinguettes',
  'sexpo': 'Sexpo',
};

export interface NormalizedEvent {
  source: 'nantes_metropole' | 'pays_de_loire' | 'wik' | 'grabuge' | 'pull_rouge' | 'big_city';
  externalId: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  venueName: string | null;
  city: string | null;
  address: string | null;
  lat: number | null;
  lon: number | null;
  category: Category;
  rawCategory: string | null;
  tags: string[];
  detailUrl: string | null;
  imageUrl: string | null;
  isFree: boolean | null;
  priceInfo: string | null;
}
