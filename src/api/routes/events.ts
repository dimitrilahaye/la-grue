import { Router, Request, Response } from 'express';
import { findEvents, findEventById } from '../../db/queries/events';

const router = Router();

router.get('/events', async (req: Request, res: Response) => {
  const { date, category, city, limit: limitStr, offset: offsetStr } = req.query;

  if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
    return;
  }

  const limit = limitStr !== undefined ? parseInt(String(limitStr), 10) : undefined;
  const offset = offsetStr !== undefined ? parseInt(String(offsetStr), 10) : undefined;

  if (limit !== undefined && (isNaN(limit) || limit < 1)) {
    res.status(400).json({ error: 'Invalid limit. Must be a positive integer.' });
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
      city: typeof city === 'string' ? city : undefined,
      limit,
      offset,
    });
    res.json(result);
  } catch (err) {
    console.error('[GET /api/events] Error:', err);
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
