import axios from 'axios';
import { scrapeBigCity } from '../bigCity';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const LISTING_HTML = `<html><head></head><body>
<script>var cec_frontend={"ajax_url":"https://www.bigcitynantes.fr/wp-admin/admin-ajax.php","nonce":"b8959318aa"}</script>
</body></html>`;

const mockCecEvent = {
  id: 132079,
  title: 'Exposition Sorcières',
  start_date: '2026-06-28',
  end_date: '2026-06-28',
  start_time: '10:00',
  end_time: '18:00',
  all_day: false,
  price_type: 'payant',
  permalink: 'https://www.bigcitynantes.fr/que-faire-a-nantes/exposition-sorcieres/',
  thumbnail: 'https://www.bigcitynantes.fr/img.png',
  venue: {
    title: "Musée d'histoire de Nantes",
    addr: '4 Pl. Marc Elder',
    coordinates: { latitude: '47.215', longitude: '-1.549' },
  },
  categories: { labels: ['Expo'] },
};

describe('scrapeBigCity', () => {
  beforeEach(() => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: LISTING_HTML });
    mockedAxios.post = jest.fn().mockResolvedValueOnce({
      data: { success: true, data: { events: [mockCecEvent], has_more: false } },
    });
  });

  it('returns normalized events', async () => {
    const events = await scrapeBigCity();
    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('big_city');
    expect(events[0].title).toBe('Exposition Sorcières');
  });

  it('sets externalId from event id', async () => {
    const events = await scrapeBigCity();
    expect(events[0].externalId).toBe('132079');
  });

  it('maps Expo category to expositions-arts', async () => {
    const events = await scrapeBigCity();
    expect(events[0].category).toBe('expositions-arts');
  });

  it('sets isFree correctly from price_type', async () => {
    const events = await scrapeBigCity();
    expect(events[0].isFree).toBe(false);
  });

  it('sets lat/lon from venue coordinates', async () => {
    const events = await scrapeBigCity();
    expect(events[0].lat).toBeCloseTo(47.215);
    expect(events[0].lon).toBeCloseTo(-1.549);
  });

  it('extracts nonce from listing page', async () => {
    await scrapeBigCity();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('bigcitynantes.fr'),
      expect.any(Object),
    );
    const postCall = (mockedAxios.post as jest.Mock).mock.calls[0];
    expect(postCall[1]).toContain('nonce=b8959318aa');
  });

  it('throws when nonce cannot be extracted', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: '<html>no nonce here</html>' });
    await expect(scrapeBigCity()).rejects.toThrow('nonce');
  });

  it('throws when AJAX returns success: false', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({
      data: { success: false, data: { message: 'Nonce invalide' } },
    });
    await expect(scrapeBigCity()).rejects.toThrow('AJAX request failed');
  });

  it('paginates while has_more is true', async () => {
    mockedAxios.post = jest.fn()
      .mockResolvedValueOnce({
        data: { success: true, data: { events: [mockCecEvent], has_more: true } },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: { events: [{ ...mockCecEvent, id: 999, title: 'Event 2' }], has_more: false } },
      });
    const events = await scrapeBigCity();
    expect(events).toHaveLength(2);
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it('enriches description from meta tag on permalink page', async () => {
    const detailHtml = `<html><head><meta name="description" content="Une expo sur les sorcières." /></head></html>`;
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: LISTING_HTML })  // nonce extraction
      .mockResolvedValueOnce({ data: detailHtml });   // enrichment GET

    const events = await scrapeBigCity();
    expect(events[0].description).toBe('Une expo sur les sorcières.');
  });

  it('keeps description null when permalink is inaccessible', async () => {
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: LISTING_HTML })
      .mockRejectedValueOnce(new Error('timeout'));

    const events = await scrapeBigCity();
    expect(events[0].description).toBeNull();
    expect(events).toHaveLength(1);
  });

  it('skips events with unknown category', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          events: [{ ...mockCecEvent, categories: { labels: ['Shopping'] } }],
          has_more: false,
        },
      },
    });
    const events = await scrapeBigCity();
    expect(events).toHaveLength(0);
  });
});
