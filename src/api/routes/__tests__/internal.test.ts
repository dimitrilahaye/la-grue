import request from 'supertest';
import { createApp } from '../../server';

jest.mock('../../../job', () => ({
  runJob: jest.fn().mockResolvedValue([]),
}));

const CRON_SECRET = 'test-secret-ci';
process.env.CRON_SECRET = CRON_SECRET;

const app = createApp();

describe('POST /internal/run-scrape', () => {
  it('returns 401 without secret', async () => {
    const res = await request(app).post('/internal/run-scrape');
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong secret', async () => {
    const res = await request(app)
      .post('/internal/run-scrape')
      .set('X-Cron-Secret', 'wrong-secret');
    expect(res.status).toBe(401);
  });

  it('returns 202 with correct secret', async () => {
    const res = await request(app)
      .post('/internal/run-scrape')
      .set('X-Cron-Secret', CRON_SECRET);
    expect(res.status).toBe(202);
  });
});
