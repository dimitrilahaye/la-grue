import axios from 'axios';
import { scrapeGrabuge } from '../grabuge';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockEvent = {
  id: 10019244,
  title: 'Festival Fumetti 2026',
  description: '<p>Un festival de BD.</p>',
  start_date: '2026-06-27 00:00:00',
  end_date: '2026-06-27 23:59:59',
  all_day: true,
  url: 'https://www.grabugemag.com/evenement/festival-fumetti-2026/2026-06-27/',
  image: false,
  venue: {
    venue: '6 cour Jules Durand, 44000 Nantes, France',
    city: 'Nantes',
    address: '6 cour Jules Durand',
  },
  categories: [{ name: 'Concert' }],
  cost: '',
};

describe('scrapeGrabuge', () => {
  beforeEach(() => {
    mockedAxios.get = jest.fn().mockResolvedValueOnce({
      data: { events: [mockEvent], total_found: 1 },
    }).mockResolvedValueOnce({
      data: { events: [], total_found: 1 },
    });
  });

  it('returns normalized events', async () => {
    const events = await scrapeGrabuge();
    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('grabuge');
    expect(events[0].title).toBe('Festival Fumetti 2026');
  });

  it('sets externalId from event id', async () => {
    const events = await scrapeGrabuge();
    expect(events[0].externalId).toBe('10019244');
  });

  it('maps Concert category correctly', async () => {
    const events = await scrapeGrabuge();
    expect(events[0].category).toBe('concerts-musique');
  });

  it('sets isFree to null', async () => {
    const events = await scrapeGrabuge();
    expect(events[0].isFree).toBeNull();
  });

  it('handles image: false gracefully', async () => {
    const events = await scrapeGrabuge();
    expect(events[0].imageUrl).toBeNull();
  });

  it('skips events with unknown category', async () => {
    mockedAxios.get = jest.fn().mockResolvedValueOnce({
      data: {
        events: [{ ...mockEvent, categories: [{ name: 'Atelier' }] }],
        total_found: 1,
      },
    }).mockResolvedValueOnce({ data: { events: [], total_found: 1 } });
    const events = await scrapeGrabuge();
    expect(events).toHaveLength(0);
  });

  it('stops pagination when page is empty (total_found fallback)', async () => {
    mockedAxios.get = jest.fn().mockResolvedValueOnce({
      data: { events: [mockEvent], total_found: null },
    }).mockResolvedValueOnce({
      data: { events: [], total_found: null },
    });
    const events = await scrapeGrabuge();
    expect(events).toHaveLength(1);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });
});
