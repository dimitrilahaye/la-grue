import request from 'supertest';
import { createApp } from '../../server';
import * as eventsQueries from '../../../db/queries/events';

jest.mock('../../../db/queries/events');

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

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
