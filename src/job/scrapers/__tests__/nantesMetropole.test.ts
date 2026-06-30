import axios from 'axios';
import { scrapeNantesMetropole, toNantesSlug } from '../nantesMetropole';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockRecord = {
  id_manif: 'EVT-001',
  nom: 'Concert de jazz au Pannonica',
  description_evt: 'Un concert de jazz intime.',
  date: '2026-06-25',
  heure_debut: '20:00',
  heure_fin: '23:00',
  lieu: 'Pannonica',
  adresse: '9 Rue Émile-Pehant',
  ville: 'Nantes',
  latitude: 47.2184,
  longitude: -1.5536,
  types_libelles: 'Concert',
  themes_libelles: 'Musique',
  lien_agenda: 'https://pannonica.com/jazz',
  media_url: 'https://example.com/img.jpg',
  gratuit: false,
  precisions_tarifs_evt: '8€',
};

describe('scrapeNantesMetropole', () => {
  beforeEach(() => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: { results: [mockRecord], total_count: 1 },
    });
  });

  it('returns normalized events', async () => {
    const events = await scrapeNantesMetropole();
    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('nantes_metropole');
    expect(events[0].externalId).toBe('EVT-001');
    expect(events[0].title).toBe('Concert de jazz au Pannonica');
  });

  it('maps category correctly', async () => {
    const events = await scrapeNantesMetropole();
    expect(events[0].category).toBe('concerts-musique');
  });

  it('sets externalId from id_manif', async () => {
    const events = await scrapeNantesMetropole();
    expect(events[0].externalId).toBe('EVT-001');
  });

  it('builds detailUrl from title slug', async () => {
    const events = await scrapeNantesMetropole();
    expect(events[0].detailUrl).toBe(
      'https://metropole.nantes.fr/que-faire-a-nantes/agenda/concert-de-jazz-au-pannonica'
    );
  });

  it('handles array types_libelles and themes_libelles', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        results: [{ ...mockRecord, types_libelles: ['Concert - Musique'], themes_libelles: ['Culture - Loisirs'] }],
        total_count: 1,
      },
    });
    const events = await scrapeNantesMetropole();
    expect(events[0].category).toBe('concerts-musique');
  });

  it('skips events with unrecognised category (null)', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        results: [{ ...mockRecord, types_libelles: 'Inconnu', themes_libelles: '' }],
        total_count: 1,
      },
    });
    const events = await scrapeNantesMetropole();
    expect(events).toHaveLength(0);
  });

  it('skips records without id_manif', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: { results: [{ ...mockRecord, id_manif: '' }], total_count: 1 },
    });
    const events = await scrapeNantesMetropole();
    expect(events).toHaveLength(0);
  });

  it('interprets heure_debut as Europe/Paris — summer UTC+2 (20:00 Paris = 18:00 UTC)', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: { results: [{ ...mockRecord, date: '2026-07-01', heure_debut: '20:00', heure_fin: undefined }], total_count: 1 },
    });
    const events = await scrapeNantesMetropole();
    expect(events[0].startAt.toISOString()).toBe('2026-07-01T18:00:00.000Z');
  });

  it('interprets heure_debut as Europe/Paris — winter UTC+1 (20:00 Paris = 19:00 UTC)', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: { results: [{ ...mockRecord, date: '2026-01-15', heure_debut: '20:00', heure_fin: undefined }], total_count: 1 },
    });
    const events = await scrapeNantesMetropole();
    expect(events[0].startAt.toISOString()).toBe('2026-01-15T19:00:00.000Z');
  });
});

describe('toNantesSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(toNantesSlug('Festival CinéPride 2026')).toBe('festival-cinepride-2026');
  });

  it('removes apostrophes and handles accents', () => {
    expect(toNantesSlug("Stage d'été aviron 2026")).toBe('stage-dete-aviron-2026');
  });

  it('handles ponctuation and accents', () => {
    expect(toNantesSlug('Concert : Fauré and Saint-Saëns à la cathédrale de Nantes')).toBe(
      'concert-faure-and-saint-saens-a-la-cathedrale-de-nantes'
    );
  });
});
