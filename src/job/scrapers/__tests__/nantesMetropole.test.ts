import axios from 'axios';
import { scrapeNantesMetropole } from '../nantesMetropole';

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

  it('sets detailUrl from lien_agenda', async () => {
    const events = await scrapeNantesMetropole();
    expect(events[0].detailUrl).toBe('https://pannonica.com/jazz');
  });

  it('skips records without id_manif', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: { results: [{ ...mockRecord, id_manif: '' }], total_count: 1 },
    });
    const events = await scrapeNantesMetropole();
    expect(events).toHaveLength(0);
  });
});
