import { Router, Request, Response } from 'express';
import { findEvents, findEventById, findCities, findEventDates, getUpcomingStats, getCategoryCounts } from '../../db/queries/events';
import { CATEGORIES } from '../../types/event';

const router = Router();

const MAX_LIMIT = 100;
const MAX_CITY_LENGTH = 100;

router.get('/events', async (req: Request, res: Response) => {
  const { date, category, city, limit: limitStr, offset: offsetStr } = req.query;

  if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
    return;
  }

  if (category !== undefined) {
    if (typeof category !== 'string' || !(CATEGORIES as readonly string[]).includes(category)) {
      res.status(400).json({ error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}.` });
      return;
    }
  }

  if (city !== undefined) {
    if (typeof city !== 'string' || city.trim().length === 0 || city.length > MAX_CITY_LENGTH) {
      res.status(400).json({ error: `Invalid city. Must be a non-empty string of at most ${MAX_CITY_LENGTH} characters.` });
      return;
    }
  }

  const limit = limitStr !== undefined ? parseInt(String(limitStr), 10) : undefined;
  const offset = offsetStr !== undefined ? parseInt(String(offsetStr), 10) : undefined;

  if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > MAX_LIMIT)) {
    res.status(400).json({ error: `Invalid limit. Must be between 1 and ${MAX_LIMIT}.` });
    return;
  }
  if (offset !== undefined && (isNaN(offset) || offset < 0)) {
    res.status(400).json({ error: 'Invalid offset. Must be a non-negative integer.' });
    return;
  }

  try {
    const result = await findEvents({
      date: typeof date === 'string' ? date : undefined,
      category: typeof category === 'string' ? category : undefined,
      city: typeof city === 'string' ? city.trim() : undefined,
      limit,
      offset,
    });
    res.json(result);
  } catch (err) {
    console.error('[GET /api/events] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { category, city } = req.query;
    const stats = await getUpcomingStats({
      category: typeof category === 'string' ? category : undefined,
      city: typeof city === 'string' ? city : undefined,
    });
    res.json(stats);
  } catch (err) {
    console.error('[GET /api/stats] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/categories/counts', async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    const counts = await getCategoryCounts({
      city: typeof city === 'string' ? city : undefined,
    });
    res.json(counts);
  } catch (err) {
    console.error('[GET /api/categories/counts] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dates', async (req: Request, res: Response) => {
  try {
    const { category, city } = req.query;
    const dates = await findEventDates({
      category: typeof category === 'string' ? category : undefined,
      city: typeof city === 'string' ? city : undefined,
    });
    res.json({ data: dates });
  } catch (err) {
    console.error('[GET /api/dates] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cities', async (_req: Request, res: Response) => {
  try {
    const cities = await findCities();
    res.json({ data: cities });
  } catch (err) {
    console.error('[GET /api/cities] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/events/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    res.status(400).json({ error: 'Invalid event ID format.' });
    return;
  }

  try {
    const event = await findEventById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (err) {
    console.error('[GET /api/events/:id] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
