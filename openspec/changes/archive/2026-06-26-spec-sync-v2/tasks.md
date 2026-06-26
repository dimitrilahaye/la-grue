# Tasks

## 1. Sync des specs principales

- [x] Syncer `openspec/specs/pwa-frontend/spec.md` avec les requirements flatpickr, dropdowns compteurs, compteur de résultats, bouton source toujours visible
- [x] Syncer `openspec/specs/event-search/spec.md` avec les nouveaux endpoints (`/api/stats`, `/api/categories/counts`, `/api/cities/counts`), `/api/dates` avec filtres, suppression `autres`, déduplication villes
- [x] Syncer `openspec/specs/event-ingestion/spec.md` avec catégorie null (pas de fallback), URL Nantes Métropole depuis slug
- [x] Syncer `openspec/specs/local-dev-setup/spec.md` avec lazy DB client, rate limit désactivé en dev, séparation unit/integration tests
- [x] Créer `openspec/specs/share-event/spec.md` (nouvelle capability)
- [x] Créer `openspec/specs/sources-page/spec.md` (nouvelle capability)

## 2. Tests manquants — routes API

- [x] `GET /api/dates` — test avec `?city=` filtre les dates par ville
- [x] `GET /api/dates` — test avec `?category=` filtre les dates par catégorie
- [x] `GET /api/stats` — retourne `{ total, daysCount }` sans filtre
- [x] `GET /api/stats` — retourne counts filtrés avec `?category=&city=`
- [x] `GET /api/categories/counts` — retourne un objet `{ [category]: number }`
- [x] `GET /api/cities/counts` — retourne un objet `{ [city]: number }` sans filtre
- [x] `GET /api/cities/counts` — retourne counts filtrés avec `?category=`
- [x] `GET /api/events?category=autres` — retourne HTTP 400

## 3. Tests manquants — queries DB (unitaires)

- [x] `findEventDates({ city })` — retourne uniquement les dates avec events dans cette ville
- [x] `findEventDates({ category })` — retourne uniquement les dates avec events de cette catégorie
- [x] `getCategoryCounts()` — retourne un objet avec counts par catégorie
- [x] `getCityCounts()` — retourne un objet avec counts par ville (clés en initcap)
- [x] `getCityCounts({ category })` — filtre par catégorie
- [x] `getUpcomingStats()` — retourne `{ total, daysCount }`
- [x] `getUpcomingStats({ city, category })` — filtre les deux dimensions
- [x] `findCities()` — déduplique les villes par casse (une seule entrée pour "NANTES"/"Nantes")

## 4. Tests manquants — normalizer / scrapers

- [x] `toNantesSlug` — cas avec apostrophe (`"Stage d'été aviron 2026"` → `"stage-dete-aviron-2026"`)
- [x] `toNantesSlug` — cas avec ponctuation et accents (le test existant dans le scraper est en bash uniquement, pas en Jest)
- [x] `mapNantesMetropoleCategory` — retourne `null` pour types/themes inconnus (pas `'autres'`)
- [x] `mapPaysLoireCategory` — retourne `null` pour keywords vides (pas `'autres'`)
- [x] `mapWikCategory` — retourne `null` pour path inconnu, ex `'loisir'` (pas `'autres'`)
- [x] Scraper Nantes Métropole — événement sans catégorie est ignoré (non pushé dans le tableau)
- [x] Scraper Pays de la Loire — événement sans catégorie est ignoré
- [x] Scraper WIK — `parseArticle` retourne `null` pour path non mappé

## 5. Tests manquants — client DB

- [x] Import de `db` sans `DATABASE_URL` ne lève pas d'erreur
- [x] Appel d'une méthode de `db` sans `DATABASE_URL` lève "DATABASE_URL is required"
