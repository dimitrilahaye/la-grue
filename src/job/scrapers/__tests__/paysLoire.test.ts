import axios from 'axios';
import { scrapePaysLoire } from '../paysLoire';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockRecord = {
  slug: 'opera-madame-butterfly-2026',
  title_fr: 'Opéra Madame Butterfly',
  description_fr: 'Projection sur grand écran.',
  firstdate_begin: '2026-06-25T20:00:00+02:00',
  firstdate_end: '2026-06-25T23:00:00+02:00',
  timings: [
    { begin: '2026-06-25T20:00:00+02:00', end: '2026-06-25T23:00:00+02:00' },
  ],
  location_name: 'Ciné Presqu\'île',
  location_address: '1 Place de la Presqu\'île',
  location_city: 'Nantes',
  location_postalcode: '44000',
  location_department: '44',
  location_coordinates: { lat: 47.2, lon: -1.55 },
  canonicalurl: 'https://openagenda.com/opera-butterfly',
  keywords_fr: 'opéra;classique',
};

describe('scrapePaysLoire', () => {
  beforeEach(() => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: { results: [mockRecord], total_count: 1 },
    });
  });

  it('returns normalized events', async () => {
    const events = await scrapePaysLoire();
    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('pays_de_loire');
    expect(events[0].externalId).toBe('opera-madame-butterfly-2026');
  });

  it('uses slug as externalId', async () => {
    const events = await scrapePaysLoire();
    expect(events[0].externalId).toBe('opera-madame-butterfly-2026');
  });

  it('maps opera keyword to spectacles-theatre', async () => {
    const events = await scrapePaysLoire();
    expect(events[0].category).toBe('spectacles-theatre');
  });

  it('sets canonicalurl as detailUrl', async () => {
    const events = await scrapePaysLoire();
    expect(events[0].detailUrl).toBe('https://openagenda.com/opera-butterfly');
  });

  it('splits keywords_fr into tags array', async () => {
    const events = await scrapePaysLoire();
    expect(events[0].tags).toContain('opéra');
  });

  it('skips records without slug', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: { results: [{ ...mockRecord, slug: '' }], total_count: 1 },
    });
    const events = await scrapePaysLoire();
    expect(events).toHaveLength(0);
  });
});
