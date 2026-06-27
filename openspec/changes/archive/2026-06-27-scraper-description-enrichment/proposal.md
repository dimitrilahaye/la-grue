## Why

WIK Nantes et Big City Nantes ne remontent aucune description d'événement : WIK ne les expose pas sur sa page listing, et l'endpoint AJAX `cec_get_events` de Big City ne les inclut pas dans sa réponse. Les descriptions sont pourtant disponibles sur les pages détail des deux sites, dans la balise `<meta name="description">`. Les afficher améliore significativement l'expérience utilisateur dans le panneau détail de la PWA.

## What Changes

- Ajout d'une phase d'enrichissement post-listing dans `scrapeWik()` : pour chaque événement collecté, GET de la page détail et extraction de `<meta name="description">`
- Ajout de la même phase d'enrichissement dans `scrapeBigCity()` : pour chaque événement retourné par `cec_get_events`, GET du `permalink` et extraction de `<meta name="description">`
- Les requêtes d'enrichissement sont exécutées en batches de 5 (concurrence limitée) pour éviter le rate limiting

## Capabilities

### New Capabilities

_(aucune)_

### Modified Capabilities

- `wik-ingestion` : le scraping passe d'une passe unique (listing) à deux passes (listing + enrichissement description)
- `bigcity-ingestion` : ajout d'une phase d'enrichissement description sur les pages permalink

## Impact

- `src/job/scrapers/wik.ts` : ajout de `fetchMetaDescription()` + boucle d'enrichissement dans `scrapeWik()`
- `src/job/scrapers/bigCity.ts` : ajout de la même logique dans `scrapeBigCity()`
- `src/job/scrapers/__tests__/wik.test.ts` : mise à jour des mocks pour couvrir la deuxième passe
- `src/job/scrapers/__tests__/bigCity.test.ts` : idem
- Temps de job légèrement augmenté (~3-5s) par les requêtes d'enrichissement batchées
