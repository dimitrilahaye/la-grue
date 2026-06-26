import { db } from '../../client';
import {
  findEventDates,
  getCategoryCounts,
  getCityCounts,
  getUpcomingStats,
  findCities,
} from '../events';

jest.mock('../../client', () => ({
  db: { execute: jest.fn() },
}));

describe('findEventDates', () => {
  it('maps result rows to date strings', async () => {
    (db.execute as jest.Mock).mockResolvedValue([
      { event_date: '2026-06-25' },
      { event_date: '2026-06-28' },
    ]);
    const result = await findEventDates();
    expect(result).toEqual(['2026-06-25', '2026-06-28']);
  });

  it('calls db.execute with city filter', async () => {
    (db.execute as jest.Mock).mockResolvedValue([{ event_date: '2026-06-25' }]);
    const result = await findEventDates({ city: 'Bouaye' });
    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual(['2026-06-25']);
  });

  it('calls db.execute with category filter', async () => {
    (db.execute as jest.Mock).mockResolvedValue([{ event_date: '2026-06-25' }]);
    const result = await findEventDates({ category: 'concerts-musique' });
    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual(['2026-06-25']);
  });

  it('returns empty array when no matching dates', async () => {
    (db.execute as jest.Mock).mockResolvedValue([]);
    const result = await findEventDates({ city: 'VilleInconnue' });
    expect(result).toEqual([]);
  });
});

describe('getCategoryCounts', () => {
  it('returns a Record mapping category to count', async () => {
    (db.execute as jest.Mock).mockResolvedValue([
      { category: 'concerts-musique', total: '12' },
      { category: 'festivals', total: '5' },
    ]);
    const result = await getCategoryCounts();
    expect(result).toEqual({ 'concerts-musique': 12, 'festivals': 5 });
  });

  it('returns empty object when no upcoming events', async () => {
    (db.execute as jest.Mock).mockResolvedValue([]);
    const result = await getCategoryCounts();
    expect(result).toEqual({});
  });
});

describe('getCityCounts', () => {
  it('returns a Record mapping city to count (initcap keys)', async () => {
    (db.execute as jest.Mock).mockResolvedValue([
      { city: 'Nantes', total: '100' },
      { city: 'Bouaye', total: '2' },
    ]);
    const result = await getCityCounts();
    expect(result).toEqual({ 'Nantes': 100, 'Bouaye': 2 });
  });

  it('calls db.execute with category filter', async () => {
    (db.execute as jest.Mock).mockResolvedValue([{ city: 'Nantes', total: '8' }]);
    const result = await getCityCounts({ category: 'concerts-musique' });
    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ 'Nantes': 8 });
  });

  it('returns empty object when no upcoming events for the filter', async () => {
    (db.execute as jest.Mock).mockResolvedValue([]);
    const result = await getCityCounts({ category: 'sexpo' });
    expect(result).toEqual({});
  });
});

describe('getUpcomingStats', () => {
  it('returns total and daysCount without filters', async () => {
    (db.execute as jest.Mock).mockResolvedValue([{ total: '42', days_count: '7' }]);
    const result = await getUpcomingStats();
    expect(result).toEqual({ total: 42, daysCount: 7 });
  });

  it('returns total and daysCount with city and category filters', async () => {
    (db.execute as jest.Mock).mockResolvedValue([{ total: '5', days_count: '3' }]);
    const result = await getUpcomingStats({ city: 'Nantes', category: 'festivals' });
    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ total: 5, daysCount: 3 });
  });

  it('returns zeros when no upcoming events match', async () => {
    (db.execute as jest.Mock).mockResolvedValue([{ total: '0', days_count: '0' }]);
    const result = await getUpcomingStats({ city: 'VilleInconnue' });
    expect(result).toEqual({ total: 0, daysCount: 0 });
  });
});

describe('findCities', () => {
  it('maps result rows to string array', async () => {
    (db.execute as jest.Mock).mockResolvedValue([
      { city: 'Bouaye' },
      { city: 'Nantes' },
      { city: 'Saint-Nazaire' },
    ]);
    const result = await findCities();
    expect(result).toEqual(['Bouaye', 'Nantes', 'Saint-Nazaire']);
  });

  it('returns a single entry for deduplicated cities (DB handles initcap)', async () => {
    (db.execute as jest.Mock).mockResolvedValue([{ city: 'Nantes' }]);
    const result = await findCities();
    expect(result).toEqual(['Nantes']);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when no cities', async () => {
    (db.execute as jest.Mock).mockResolvedValue([]);
    const result = await findCities();
    expect(result).toEqual([]);
  });
});
