import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import eventsRouter from './routes/events';
import staticRouter, { frontendDir } from './routes/static';
import internalRouter from './routes/internal';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Static files from frontend/
  app.use(express.static(frontendDir));
  app.use(express.static(path.resolve(__dirname, '../..', 'assets')));

  // API routes
  app.use('/api', eventsRouter);

  // Internal cron trigger
  app.use('/internal', internalRouter);

  // SPA fallback — serve index.html for all non-API routes
  app.use('/', staticRouter);

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Unhandled error]', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
