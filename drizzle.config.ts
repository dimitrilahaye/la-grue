import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const migrationUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!migrationUrl) {
  throw new Error('MIGRATION_DATABASE_URL (or DATABASE_URL) is required for migrations.');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl,
    ssl: { rejectUnauthorized: false },
  },
  verbose: true,
  strict: true,
});
