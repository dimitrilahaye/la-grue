import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let instance: DrizzleDb | null = null;

function getInstance(): DrizzleDb {
  if (!instance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required. Copy .env.example to .env and fill in the values.');
    }
    instance = drizzle(postgres(databaseUrl), { schema });
  }
  return instance;
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    return getInstance()[prop as keyof DrizzleDb];
  },
});
