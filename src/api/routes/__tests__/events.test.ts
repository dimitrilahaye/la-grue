import request from 'supertest';
import { createApp } from '../../server';
import * as eventsQueries from '../../../db/queries/events';

jest.mock('../../../db/queries/events');

const app = createApp();

const mockResult = {
  data: [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      source: 'nantes_metropole',
      externalId: 'EVT-001',
      title: 'Test Event',
      description: null,
      startAt: new Date('2026-06-25T20:00:00Z'),
      endAt: null,
      venueName: 'Test Venue',
      city: 'Nantes',
      address: null,
      lat: null,
      lon: null,
      category: 'concerts-musique',
      rawCategory: null,
      tags: [],
      detailUrl: null,
      imageUrl: null,
      isFree: false,
      priceInfo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
  date: '2026-06-25',
};

describe('GET /api/events', () => {
  beforeEach(() => {
    (eventsQueries.findEvents as jest.Mock).mockResolvedValue(mockResult);
  });

  it('returns 200 with events', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('accepts valid category filter', async () => {
    const res = await request(app).get('/api/events?category=concerts-musique');
    expect(res.status).toBe(200);
    expect(eventsQueries.findEvents).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'concerts-musique' })
    );
  });

  it('returns 400 for invalid date format', async () => {
    const res = await request(app).get('/api/events?date=not-a-date');
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid limit', async () => {
    const res = await request(app).get('/api/events?limit=abc');
    expect(res.status).toBe(400);
  });

  it('returns 400 for category=autres', async () => {
    const res = await request(app).get('/api/events?category=autres');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/dates', () => {
  beforeEach(() => {
    (eventsQueries.findEventDates as jest.Mock).mockResolvedValue(['2026-06-25', '2026-06-28']);
  });

  it('returns 200 with available dates', async () => {
    const res = await request(app).get('/api/dates');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(['2026-06-25', '2026-06-28']);
  });

  it('passes city filter to findEventDates', async () => {
    const res = await request(app).get('/api/dates?city=Bouaye');
    expect(res.status).toBe(200);
    expect(eventsQueries.findEventDates).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Bouaye' })
    );
  });

  it('passes category filter to findEventDates', async () => {
    const res = await request(app).get('/api/dates?category=concerts-musique');
    expect(res.status).toBe(200);
    expect(eventsQueries.findEventDates).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'concerts-musique' })
    );
  });
});

describe('GET /api/stats', () => {
  beforeEach(() => {
    (eventsQueries.getUpcomingStats as jest.Mock).mockResolvedValue({ total: 42, daysCount: 7 });
  });

  it('returns total and daysCount without filters', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 42, daysCount: 7 });
  });

  it('passes category and city filters to getUpcomingStats', async () => {
    const res = await request(app).get('/api/stats?category=festivals&city=Nantes');
    expect(res.status).toBe(200);
    expect(eventsQueries.getUpcomingStats).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'festivals', city: 'Nantes' })
    );
  });
});

describe('GET /api/categories/counts', () => {
  it('returns counts by category', async () => {
    (eventsQueries.getCategoryCounts as jest.Mock).mockResolvedValue({
      'concerts-musique': 12,
      'festivals': 5,
    });
    const res = await request(app).get('/api/categories/counts');
    expect(res.status).toBe(200);
    expect(res.body['concerts-musique']).toBe(12);
    expect(res.body['festivals']).toBe(5);
  });
});

describe('GET /api/cities/counts', () => {
  beforeEach(() => {
    (eventsQueries.getCityCounts as jest.Mock).mockResolvedValue({
      'Nantes': 100,
      'Bouaye': 2,
    });
  });

  it('returns counts by city', async () => {
    const res = await request(app).get('/api/cities/counts');
    expect(res.status).toBe(200);
    expect(res.body['Nantes']).toBe(100);
    expect(res.body['Bouaye']).toBe(2);
  });

  it('passes category filter to getCityCounts', async () => {
    const res = await request(app).get('/api/cities/counts?category=concerts-musique');
    expect(res.status).toBe(200);
    expect(eventsQueries.getCityCounts).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'concerts-musique' })
    );
  });
});

describe('GET /api/events/:id', () => {
  const validId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  it('returns 200 for existing event', async () => {
    (eventsQueries.findEventById as jest.Mock).mockResolvedValue(mockResult.data[0]);
    const res = await request(app).get(`/api/events/${validId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(validId);
  });

  it('returns 404 for unknown event', async () => {
    (eventsQueries.findEventById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get(`/api/events/${validId}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid UUID format', async () => {
    const res = await request(app).get('/api/events/not-a-uuid');
    expect(res.status).toBe(400);
  });
});
