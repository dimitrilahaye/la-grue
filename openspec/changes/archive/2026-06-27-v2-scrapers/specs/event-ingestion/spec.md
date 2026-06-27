## ADDED Requirements

### Requirement: Ingestion Grabuge Mag

Le système SHALL intégrer la source Grabuge Mag dans le job de scraping nightly. Le scraper Grabuge SHALL être exécuté en parallèle avec les autres sources via `Promise.allSettled`. La `source` associée est `'grabuge'`.

#### Scenario: Source Grabuge dans le job

- **WHEN** le job démarre
- **THEN** `scrapeGrabuge()` est appelé en parallèle avec les autres scrapers

### Requirement: Ingestion Pull Rouge

Le système SHALL intégrer la source Pull Rouge dans le job de scraping nightly. Le scraper Pull Rouge SHALL être exécuté en parallèle avec les autres sources via `Promise.allSettled`. La `source` associée est `'pull_rouge'`.

#### Scenario: Source Pull Rouge dans le job

- **WHEN** le job démarre
- **THEN** `scrapePullRouge()` est appelé en parallèle avec les autres scrapers

### Requirement: Ingestion Big City Nantes

Le système SHALL intégrer la source Big City Nantes dans le job de scraping nightly. Le scraper Big City SHALL être exécuté en parallèle avec les autres sources via `Promise.allSettled`. La `source` associée est `'big_city'`.

#### Scenario: Source Big City dans le job

- **WHEN** le job démarre
- **THEN** `scrapeBigCity()` est appelé en parallèle avec les autres scrapers
