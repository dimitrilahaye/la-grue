import { scrapeNantesMetropole } from './scrapers/nantesMetropole';
import { scrapeWik } from './scrapers/wik';
import { scrapeGrabuge } from './scrapers/grabuge';
import { scrapePullRouge } from './scrapers/pullRouge';
import { scrapeBigCity } from './scrapers/bigCity';
import { upsertEvents, purgeExpiredEvents } from './deduplicator';

export interface JobSummary {
  source: string;
  fetched: number;
  inserted: number;
  updated: number;
  errors: number;
}

export async function runJob(): Promise<JobSummary[]> {
  console.log('[Job] Starting scraping run...');
  const startTime = Date.now();

  const purged = await purgeExpiredEvents();
  console.log(`[Job] Purged ${purged} expired events (start_at < today)`);

  const results = await Promise.allSettled([
    scrapeNantesMetropole().then((events) => ({ source: 'nantes_metropole', events })),
    scrapeWik().then((events) => ({ source: 'wik', events })),
    scrapeGrabuge().then((events) => ({ source: 'grabuge', events })),
    scrapePullRouge().then((events) => ({ source: 'pull_rouge', events })),
    scrapeBigCity().then((events) => ({ source: 'big_city', events })),
  ]);

  const summaries: JobSummary[] = [];

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[Job] Scraper failed:', result.reason);
      summaries.push({ source: 'unknown', fetched: 0, inserted: 0, updated: 0, errors: 1 });
      continue;
    }

    const { source, events } = result.value;
    console.log(`[Job] ${source}: fetched ${events.length} events`);

    const upsertResult = await upsertEvents(events);

    summaries.push({
      source,
      fetched: events.length,
      inserted: upsertResult.inserted,
      updated: upsertResult.updated,
      errors: upsertResult.errors,
    });
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Job] Completed in ${elapsed}s`);
  console.log('[Job] Summary:', JSON.stringify(summaries, null, 2));

  return summaries;
}
