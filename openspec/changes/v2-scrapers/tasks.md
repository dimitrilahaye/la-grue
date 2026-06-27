# Tasks: v2-scrapers

## Normalizer

- [x] **T1** Ajouter `mapGrabugeCategory(categories: string[]): Category | null` dans `normalizer.ts` (token-based, même pattern que les autres)
- [x] **T2** Ajouter `mapPullRougeCategory(rawText: string): Category | null` dans `normalizer.ts` — couvre concerts et vernissages → `concerts-musique` / `expositions-arts`
- [x] **T3** Ajouter `mapBigCityCategory(labels: string[]): Category | null` dans `normalizer.ts` — mappe les labels CEC (Concert, Expo, Nightlife, Spectacle, Festival…)
- [x] **T4** Ajouter les tests pour les 3 nouvelles fonctions dans `src/job/__tests__/normalizer.test.ts`

## Scraper Grabuge Mag

- [x] **T5** Créer `src/job/scrapers/grabuge.ts` — scraper API tribe/events avec pagination, mapping vers `NormalizedEvent`, source `'grabuge'`
- [x] **T6** Créer `src/job/scrapers/__tests__/grabuge.test.ts` — mock axios, tester normalisation, pagination fallback, gestion erreur

## Scraper Pull Rouge

- [x] **T7** Créer `src/job/scrapers/pullRouge.ts` — scraper HTML Cheerio, parsing séquentiel des blocs FreeSans big>big, filtre date 14j, source `'pull_rouge'`
- [x] **T8** Créer `src/job/scrapers/__tests__/pullRouge.test.ts` — mock axios, HTML fixture, tester extraction date/titre/venue/catégorie

## Scraper Big City Nantes

- [x] **T9** Créer `src/job/scrapers/bigCity.ts` — extraction nonce depuis listing page, pagination AJAX `cec_get_events`, mapping `NormalizedEvent`, source `'big_city'`
- [x] **T10** Créer `src/job/scrapers/__tests__/bigCity.test.ts` — mock axios, tester extraction nonce, pagination, mapping catégorie

## Job orchestrateur

- [x] **T11** Enregistrer `scrapeGrabuge`, `scrapePullRouge`, `scrapeBigCity` dans `src/job/index.ts` (dans `Promise.allSettled`)

## Frontend et documentation

- [x] **T12** Mettre à jour `frontend/sources.html` : Grabuge et Big City dans la section active, Pull Rouge reste en "Bientôt", nouvelle section "Bientôt — v3" avec Dice.fm et Shotgun.live
- [x] **T13** Mettre à jour `README.md` : Grabuge et Big City dans le tableau "Sources actives", Pull Rouge reste en "v2 prévu", section "Sources prévues (v3)" avec Dice.fm et Shotgun.live
