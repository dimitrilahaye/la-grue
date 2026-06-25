import 'dotenv/config';
import { db } from '../src/db/client';
import { events } from '../src/db/schema';
import { CATEGORIES, type Category } from '../src/types/event';

function daysFromNow(days: number, hour = 20, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function endTime(start: Date, durationHours = 2): Date {
  return new Date(start.getTime() + durationHours * 60 * 60 * 1000);
}

const venues = [
  { name: 'Le Lieu Unique', city: 'Nantes', address: 'Quai Ferdinand-Favre, 44000 Nantes' },
  { name: 'La Cigale', city: 'Nantes', address: 'Place du Général Mellinet, 44000 Nantes' },
  { name: 'Le Ferrailleur', city: 'Nantes', address: '21 Quai de la Fosse, 44000 Nantes' },
  { name: 'Château des Ducs', city: 'Nantes', address: '4 Place Marc Elder, 44000 Nantes' },
  { name: 'Pannonica', city: 'Nantes', address: '9 Rue Émile-Pehant, 44000 Nantes' },
  { name: 'Guinguette de l\'Île', city: 'Rezé', address: 'Île de Nantes, 44400 Rezé' },
  { name: 'Stereolux', city: 'Nantes', address: '4 Boulevard Léon Bureau, 44200 Nantes' },
];

interface SeedEvent {
  source: 'wik' | 'nantes_metropole' | 'pays_de_loire';
  externalId: string;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date | null;
  venueName: string;
  city: string;
  address: string;
  lat: number;
  lon: number;
  category: Category;
  rawCategory: string;
  tags: string[];
  detailUrl: string | null;
  imageUrl: string | null;
  isFree: boolean;
  priceInfo: string | null;
}

const seedData: SeedEvent[] = [
  // --- Aujourd'hui (≥5 events) ---
  {
    source: 'nantes_metropole', externalId: 'seed-001',
    title: 'Apéro Jazz au Pannonica', description: 'Une soirée jazz intimiste avec le trio de Léa Martin.',
    startAt: daysFromNow(0, 19, 0), endAt: daysFromNow(0, 22, 0),
    venueName: 'Pannonica', city: 'Nantes', address: '9 Rue Émile-Pehant, 44000 Nantes',
    lat: 47.2184, lon: -1.5536, category: 'concerts-musique', rawCategory: 'Concert Jazz',
    tags: ['jazz', 'apéro'], detailUrl: 'https://www.pannonica.com/event/aperojazz', imageUrl: 'https://placehold.co/400x200/F5C518/4A4A4A?text=Jazz',
    isFree: false, priceInfo: '8€ / 5€ réduit',
  },
  {
    source: 'nantes_metropole', externalId: 'seed-002',
    title: 'Expo "Sorcières" — Château des Ducs', description: 'L\'exposition mythique sur la figure de la sorcière à travers les siècles.',
    startAt: daysFromNow(0, 10, 0), endAt: daysFromNow(0, 18, 0),
    venueName: 'Château des Ducs', city: 'Nantes', address: '4 Place Marc Elder, 44000 Nantes',
    lat: 47.2160, lon: -1.5481, category: 'expositions-arts', rawCategory: 'Exposition',
    tags: ['expo', 'histoire', 'feminisme'], detailUrl: 'https://www.chateaunantes.fr/sorcieres', imageUrl: 'https://placehold.co/400x200/4A4A4A/F5C518?text=Sorci%C3%A8res',
    isFree: false, priceInfo: 'Plein 8€ / Réduit 5€ / Gratuit -18ans',
  },
  {
    source: 'wik', externalId: 'seed-003',
    title: 'Happy Hour au Bar La Maison', description: 'Happy hour de 17h à 20h avec cocktails à moitié prix.',
    startAt: daysFromNow(0, 17, 0), endAt: daysFromNow(0, 20, 0),
    venueName: 'Bar La Maison', city: 'Nantes', address: '5 Rue Beauregard, 44000 Nantes',
    lat: 47.2173, lon: -1.5530, category: 'bars-soirees', rawCategory: 'Bar',
    tags: ['bar', 'happy-hour', 'cocktails'], detailUrl: null, imageUrl: null,
    isFree: true, priceInfo: 'Entrée libre',
  },
  {
    source: 'pays_de_loire', externalId: 'seed-004',
    title: 'Guinguette de l\'Île — Session d\'été', description: 'Dansez au bord de la Loire avec l\'orchestre de variétés françaises.',
    startAt: daysFromNow(0, 18, 30), endAt: daysFromNow(0, 23, 0),
    venueName: 'Guinguette de l\'Île', city: 'Rezé', address: 'Île de Nantes, 44400 Rezé',
    lat: 47.2059, lon: -1.5487, category: 'ginguettes-guinguettes', rawCategory: 'Guinguette',
    tags: ['guinguette', 'danse', 'loire'], detailUrl: 'https://guinguette-ile.fr', imageUrl: 'https://placehold.co/400x200/F5C518/4A4A4A?text=Guinguette',
    isFree: false, priceInfo: '5€',
  },
  {
    source: 'nantes_metropole', externalId: 'seed-005',
    title: 'Théâtre : "Les Femmes Savantes"', description: 'Molière mis en scène par la Compagnie du Lac.',
    startAt: daysFromNow(0, 20, 30), endAt: daysFromNow(0, 22, 30),
    venueName: 'Théâtre Graslin', city: 'Nantes', address: 'Place Graslin, 44000 Nantes',
    lat: 47.2136, lon: -1.5609, category: 'spectacles-theatre', rawCategory: 'Théâtre',
    tags: ['theatre', 'moliere', 'classique'], detailUrl: 'https://theatrenantes.com/femmes-savantes', imageUrl: 'https://placehold.co/400x200/4A4A4A/F5C518?text=Th%C3%A9%C3%A2tre',
    isFree: false, priceInfo: '18€ / 12€ réduit',
  },
  {
    source: 'wik', externalId: 'seed-006',
    title: 'Soirée Sexpo — Le Nouveau Rendez-vous', description: 'Conférences, ateliers et échanges autour de la sexualité positive et inclusive.',
    startAt: daysFromNow(0, 19, 0), endAt: daysFromNow(0, 23, 30),
    venueName: 'Le Lieu Unique', city: 'Nantes', address: 'Quai Ferdinand-Favre, 44000 Nantes',
    lat: 47.2191, lon: -1.5469, category: 'sexpo', rawCategory: 'Soirée Sexpo',
    tags: ['sexpo', 'inclusion', 'bien-etre'], detailUrl: 'https://www.lelieuunique.com/sexpo', imageUrl: 'https://placehold.co/400x200/F5C518/4A4A4A?text=Sexpo',
    isFree: false, priceInfo: '10€',
  },

  // --- Demain ---
  {
    source: 'nantes_metropole', externalId: 'seed-010',
    title: 'Festival des 3 Continents — Projection', description: 'Projection de films d\'Afrique, d\'Amérique Latine et d\'Asie.',
    startAt: daysFromNow(1, 20, 0), endAt: daysFromNow(1, 23, 0),
    venueName: 'Cinéma Katorza', city: 'Nantes', address: '3 Rue Corneille, 44000 Nantes',
    lat: 47.2165, lon: -1.5549, category: 'festivals', rawCategory: 'Festival Cinéma',
    tags: ['festival', 'cinema', '3continents'], detailUrl: 'https://3continents.com', imageUrl: 'https://placehold.co/400x200/4A4A4A/F5C518?text=Festival',
    isFree: false, priceInfo: '7€',
  },
  {
    source: 'pays_de_loire', externalId: 'seed-011',
    title: 'Concert Électro — Stereolux', description: 'Nuit électronique avec 3 DJs internationaux.',
    startAt: daysFromNow(1, 22, 0), endAt: daysFromNow(2, 4, 0),
    venueName: 'Stereolux', city: 'Nantes', address: '4 Boulevard Léon Bureau, 44200 Nantes',
    lat: 47.2063, lon: -1.5738, category: 'concerts-musique', rawCategory: 'Concert Electro',
    tags: ['electro', 'clubbing', 'nuit'], detailUrl: 'https://stereolux.org/electro-nuit', imageUrl: 'https://placehold.co/400x200/F5C518/4A4A4A?text=Electro',
    isFree: false, priceInfo: '15€ prévente / 18€ porte',
  },

  // --- Dans 2 jours ---
  {
    source: 'nantes_metropole', externalId: 'seed-020',
    title: 'Marché des Artisans — Île de Nantes', description: 'Plus de 40 artisans locaux présentent leurs créations.',
    startAt: daysFromNow(2, 10, 0), endAt: daysFromNow(2, 19, 0),
    venueName: 'Île de Nantes', city: 'Nantes', address: 'Hangar à Bananes, 44200 Nantes',
    lat: 47.2059, lon: -1.5640, category: 'expositions-arts', rawCategory: 'Marché artisanal',
    tags: ['marche', 'artisanat', 'local'], detailUrl: null, imageUrl: 'https://placehold.co/400x200/4A4A4A/F5C518?text=March%C3%A9',
    isFree: true, priceInfo: 'Entrée gratuite',
  },
  {
    source: 'wik', externalId: 'seed-021',
    title: 'Comedy Club — Espace 44', description: 'Stand-up avec 5 humoristes de la nouvelle scène nantaise.',
    startAt: daysFromNow(2, 21, 0), endAt: daysFromNow(2, 23, 0),
    venueName: 'Espace 44', city: 'Nantes', address: '44 Rue Fouré, 44000 Nantes',
    lat: 47.2210, lon: -1.5451, category: 'spectacles-theatre', rawCategory: 'Spectacle Humour',
    tags: ['standup', 'humour', 'comedie'], detailUrl: 'https://espace44.com/comedy', imageUrl: 'https://placehold.co/400x200/F5C518/4A4A4A?text=Comedy',
    isFree: false, priceInfo: '12€',
  },

  // --- Dans 3 jours ---
  {
    source: 'pays_de_loire', externalId: 'seed-030',
    title: 'Bal Folk au Lieu Unique', description: 'Danses traditionnelles du monde entier avec initiation pour les débutants.',
    startAt: daysFromNow(3, 15, 0), endAt: daysFromNow(3, 23, 0),
    venueName: 'Le Lieu Unique', city: 'Nantes', address: 'Quai Ferdinand-Favre, 44000 Nantes',
    lat: 47.2191, lon: -1.5469, category: 'ginguettes-guinguettes', rawCategory: 'Bal Folk',
    tags: ['bal', 'folk', 'danse', 'initiation'], detailUrl: 'https://lelieuunique.com/bal-folk', imageUrl: 'https://placehold.co/400x200/4A4A4A/F5C518?text=Bal+Folk',
    isFree: false, priceInfo: '8€ / 5€',
  },

  // --- Dans 4 jours ---
  {
    source: 'nantes_metropole', externalId: 'seed-040',
    title: 'Soirée Mousse — La Cigale', description: 'Nuit blanche avec DJ sets et piste de danse.',
    startAt: daysFromNow(4, 23, 0), endAt: daysFromNow(5, 5, 0),
    venueName: 'La Cigale', city: 'Nantes', address: 'Place du Général Mellinet, 44000 Nantes',
    lat: 47.2151, lon: -1.5651, category: 'bars-soirees', rawCategory: 'Soirée Club',
    tags: ['club', 'dj', 'nuit'], detailUrl: 'https://lacigale.fr/soiree-mousse', imageUrl: null,
    isFree: false, priceInfo: '12€',
  },

  // --- Dans 5 jours ---
  {
    source: 'wik', externalId: 'seed-050',
    title: 'Vernissage — Galerie des Arts', description: 'Vernissage de l\'exposition collective "Lignes de fuite".',
    startAt: daysFromNow(5, 18, 0), endAt: daysFromNow(5, 21, 0),
    venueName: 'Galerie des Arts', city: 'Nantes', address: '12 Rue de la Paix, 44000 Nantes',
    lat: 47.2140, lon: -1.5567, category: 'expositions-arts', rawCategory: 'Vernissage',
    tags: ['vernissage', 'art-contemporain', 'galerie'], detailUrl: null, imageUrl: 'https://placehold.co/400x200/F5C518/4A4A4A?text=Vernissage',
    isFree: true, priceInfo: 'Entrée libre',
  },

  // --- Semaine suivante (jours 7-13) ---
  {
    source: 'nantes_metropole', externalId: 'seed-070',
    title: 'Concert Rock — Le Ferrailleur', description: 'Soirée rock avec 3 groupes locaux et 1 tête d\'affiche parisienne.',
    startAt: daysFromNow(7, 20, 0), endAt: daysFromNow(7, 23, 30),
    venueName: 'Le Ferrailleur', city: 'Nantes', address: '21 Quai de la Fosse, 44000 Nantes',
    lat: 47.2132, lon: -1.5621, category: 'concerts-musique', rawCategory: 'Concert Rock',
    tags: ['rock', 'live', 'ferrailleur'], detailUrl: 'https://leferrailleur.fr/concert-rock', imageUrl: 'https://placehold.co/400x200/4A4A4A/F5C518?text=Rock',
    isFree: false, priceInfo: '10€',
  },
  {
    source: 'pays_de_loire', externalId: 'seed-071',
    title: 'Festival Sexualité Positive', description: 'Deux jours de conférences, performances et débats pour déconstruire les tabous.',
    startAt: daysFromNow(8, 14, 0), endAt: daysFromNow(8, 22, 0),
    venueName: 'Stereolux', city: 'Nantes', address: '4 Boulevard Léon Bureau, 44200 Nantes',
    lat: 47.2063, lon: -1.5738, category: 'sexpo', rawCategory: 'Festival Sexo',
    tags: ['sexualite', 'festival', 'inclusion'], detailUrl: 'https://sexopositif.nantes.fr', imageUrl: 'https://placehold.co/400x200/F5C518/4A4A4A?text=Sexpo+Festival',
    isFree: false, priceInfo: '15€/jour',
  },
  {
    source: 'nantes_metropole', externalId: 'seed-072',
    title: 'Fête Nationale — Concert Gratuit', description: 'Grande scène en plein air place du Bouffay pour le 14 juillet.',
    startAt: daysFromNow(9, 20, 0), endAt: daysFromNow(9, 23, 30),
    venueName: 'Place du Bouffay', city: 'Nantes', address: 'Place du Bouffay, 44000 Nantes',
    lat: 47.2155, lon: -1.5484, category: 'festivals', rawCategory: 'Fête Nationale',
    tags: ['14juillet', 'gratuit', 'plein-air'], detailUrl: null, imageUrl: 'https://placehold.co/400x200/4A4A4A/F5C518?text=14+Juillet',
    isFree: true, priceInfo: 'Gratuit',
  },
  {
    source: 'wik', externalId: 'seed-073',
    title: 'Guinguette Florentine — Dimanche Dansant', description: 'L\'incontournable rendez-vous du dimanche après-midi au bord de l\'Erdre.',
    startAt: daysFromNow(10, 15, 0), endAt: daysFromNow(10, 20, 0),
    venueName: 'Guinguette Florentine', city: 'Nantes', address: 'Bords de l\'Erdre, 44000 Nantes',
    lat: 47.2320, lon: -1.5420, category: 'ginguettes-guinguettes', rawCategory: 'Guinguette Plein Air',
    tags: ['guinguette', 'dimanche', 'erdre', 'danse'], detailUrl: 'https://guinguette-florentine.fr', imageUrl: 'https://placehold.co/400x200/F5C518/4A4A4A?text=Guinguette',
    isFree: false, priceInfo: '3€',
  },
  {
    source: 'pays_de_loire', externalId: 'seed-074',
    title: 'Opéra en plein air — Traviata', description: 'Projection géante de la Traviata de Verdi sur la facade du Château.',
    startAt: daysFromNow(11, 21, 0), endAt: daysFromNow(11, 23, 30),
    venueName: 'Château des Ducs', city: 'Nantes', address: '4 Place Marc Elder, 44000 Nantes',
    lat: 47.2160, lon: -1.5481, category: 'spectacles-theatre', rawCategory: 'Opéra plein air',
    tags: ['opera', 'traviata', 'gratuit', 'chateau'], detailUrl: 'https://chateaunantes.fr/opera-plein-air', imageUrl: 'https://placehold.co/400x200/4A4A4A/F5C518?text=Opera',
    isFree: true, priceInfo: 'Gratuit',
  },
  {
    source: 'nantes_metropole', externalId: 'seed-075',
    title: 'Nuit des Musées — Ouverture Exceptionnelle', description: 'Les musées nantais ouvrent jusqu\'à minuit avec animations et performances.',
    startAt: daysFromNow(12, 18, 0), endAt: daysFromNow(12, 23, 59),
    venueName: 'Musées de Nantes', city: 'Nantes', address: '10 Rue Georges Clemenceau, 44000 Nantes',
    lat: 47.2161, lon: -1.5527, category: 'expositions-arts', rawCategory: 'Nuit des Musées',
    tags: ['musees', 'nuit', 'gratuit', 'culture'], detailUrl: 'https://nuitdesmusees.nantes.fr', imageUrl: 'https://placehold.co/400x200/F5C518/4A4A4A?text=Nuit+Mus%C3%A9es',
    isFree: true, priceInfo: 'Gratuit',
  },
];

async function seed() {
  console.log('🌱 Seeding database...');

  await db.delete(events);
  console.log('  ✓ Table events truncated');

  const rows = seedData.map((e) => ({
    source: e.source,
    externalId: e.externalId,
    title: e.title,
    description: e.description,
    startAt: e.startAt,
    endAt: e.endAt,
    venueName: e.venueName,
    city: e.city,
    address: e.address,
    lat: e.lat,
    lon: e.lon,
    category: e.category,
    rawCategory: e.rawCategory,
    tags: e.tags,
    detailUrl: e.detailUrl,
    imageUrl: e.imageUrl,
    isFree: e.isFree,
    priceInfo: e.priceInfo,
  }));

  await db.insert(events).values(rows);
  console.log(`  ✓ Inserted ${rows.length} events`);

  const categories = [...new Set(rows.map((r) => r.category))];
  console.log(`  ✓ Categories covered: ${categories.join(', ')}`);

  const today = rows.filter((r) => {
    const d = new Date(r.startAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  console.log(`  ✓ Events today: ${today.length}`);

  console.log('✅ Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
