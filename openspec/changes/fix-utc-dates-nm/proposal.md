## Why

Les heures des événements retournées par l'API Nantes Métropole sont en heure locale Europe/Paris. `parseDateTime` les construit sans suffixe de timezone, ce qui les fait interpréter comme UTC par Node.js (qui tourne en UTC sur Render). Résultat : les heures stockées en base sont décalées de +1h (hiver) ou +2h (été), et le front affiche les mauvaises horaires.

## What Changes

- Remplacement de `parseDateTime` dans le scraper Nantes Métropole pour interpréter les heures en Europe/Paris via `temporal-polyfill`
- Ajout de la dépendance `temporal-polyfill`

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `event-ingestion` : le requirement "Ingestion Nantes Métropole API" évolue — les `startAt`/`endAt` doivent être interprétés comme heure locale Europe/Paris, pas UTC.

## Impact

- `src/job/scrapers/nantesMetropole.ts` : fonction `parseDateTime`
- `package.json` : nouvelle dépendance `temporal-polyfill`
- Tests unitaires et contrat du scraper NM à mettre à jour
