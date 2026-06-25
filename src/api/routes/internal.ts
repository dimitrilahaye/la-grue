import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { runJob } from '../../job';

const router = Router();

let jobRunning = false;

function timingSafeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

router.post('/run-scrape', async (req: Request, res: Response) => {
  const secret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error('[Internal] CRON_SECRET is not set — endpoint is disabled');
    res.status(503).json({ error: 'Service not configured' });
    return;
  }

  const secretStr = Array.isArray(secret) ? secret[0] : secret;
  if (!secretStr || !timingSafeCompare(secretStr, expectedSecret)) {
    console.warn('[Internal] Unauthorized attempt to trigger job');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (jobRunning) {
    res.status(409).json({ error: 'Job already running' });
    return;
  }

  res.status(202).json({ message: 'Job started' });

  jobRunning = true;
  runJob()
    .then((summaries) => {
      console.log('[Internal] Job completed:', summaries);
    })
    .catch((err) => {
      console.error('[Internal] Job error:', err);
    })
    .finally(() => {
      jobRunning = false;
    });
});

export { jobRunning };
export default router;
