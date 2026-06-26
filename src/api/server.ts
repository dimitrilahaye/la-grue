import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import eventsRouter from './routes/events';
import staticRouter, { frontendDir } from './routes/static';
import internalRouter from './routes/internal';

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000';

const isDev = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict limiter for the internal endpoint — Render Cron calls it once per night
const internalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skip: () => isDev,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests.' },
});

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          // iFrame opt-in feature requires loading arbitrary external URLs
          frameSrc: ['*'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      // Must be false for cross-origin iframes to load resources
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: allowedOrigin,
      methods: ['GET', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
    })
  );

  // Cap request body size — this app has no large payloads
  app.use(express.json({ limit: '16kb' }));

  // Static files from frontend/
  app.use(express.static(frontendDir));
  app.use(express.static(path.resolve(__dirname, '../..', 'assets')));

  // Vendor assets from node_modules
  const flatpickrDist = path.resolve(__dirname, '../..', 'node_modules/flatpickr/dist');
  app.use('/vendor/flatpickr', express.static(flatpickrDist));

  // API routes
  app.use('/api', apiLimiter, eventsRouter);

  // Internal cron trigger
  app.use('/internal', internalLimiter, internalRouter);

  // SPA fallback — serve index.html for all non-API routes
  app.use('/', staticRouter);

  // Global error handler — never leak stack traces to the client
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Unhandled error]', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
