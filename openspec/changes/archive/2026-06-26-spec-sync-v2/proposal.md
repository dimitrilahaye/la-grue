## Why

36 commits ont été mergés depuis la dernière sync des specs sans mise à jour de la documentation ni ajout de tests. Les nouvelles fonctionnalités (flatpickr, share, dropdowns intelligents, sources page) ne sont couvertes par aucun requirement ni aucun test.

## What Changes

- Remplacement du `<input type="date">` natif par **flatpickr**, dont les dates activées sont scopées aux filtres actifs (ville/catégorie) via `GET /api/dates?city=&category=`
- **Bouton de partage natif** (Web Share API) sur les event cards et le panneau de détail
- **Dropdowns intelligents** : chaque option catégorie/ville affiche son nombre d'événements à venir ; les options à 0 sont désactivées ; la sélection d'une catégorie met à jour les compteurs de villes en live (et vice versa)
- **Compteur de résultats** dans le formulaire : résultats du jour + total à venir sur N jours via `GET /api/stats`
- **Nouveaux endpoints API** : `GET /api/stats`, `GET /api/categories/counts`, `GET /api/cities/counts`
- **Page sources** `/sources.html` avec bouton ⓘ jaune dans le header
- **BREAKING** : suppression de la catégorie `autres` — le normaliseur retourne `null`, les événements sans catégorie reconnue sont ignorés au scraping
- Génération du `detailUrl` Nantes Métropole depuis le slug du titre (remplace l'URL `infonantes` cassée)
- Client DB en lazy init (Proxy) — `DATABASE_URL` n'est plus requis à l'import
- Rate limiting désactivé en `NODE_ENV !== 'production'`
- Séparation unit / integration tests dans Jest

## Capabilities

### New Capabilities

- `share-event` : partage natif via Web Share API depuis les cards et le panneau de détail
- `sources-page` : page `/sources.html` listant les sources actives et prévues, accessible depuis un bouton ⓘ dans le header

### Modified Capabilities

- `pwa-frontend` : flatpickr remplace le date picker natif ; dropdowns avec compteurs et états disabled ; compteur de résultats ; bouton partage
- `event-search` : nouveaux endpoints `/api/stats`, `/api/categories/counts`, `/api/cities/counts` ; `/api/dates` accepte désormais `category` et `city` ; catégorie `autres` supprimée de l'enum
- `event-ingestion` : normaliseur retourne `null` (plus de fallback `autres`) ; URL Nantes Métropole générée depuis le slug du titre
- `local-dev-setup` : client DB lazy init ; rate limit désactivé en dev ; séparation unit/integration tests

## Impact

- `src/db/client.ts` — Proxy lazy init
- `src/db/queries/events.ts` — nouvelles queries (`getUpcomingStats`, `getCategoryCounts`, `getCityCounts`, `findEventDates` avec filtres, `findCities` avec `initcap`)
- `src/api/routes/events.ts` — 3 nouvelles routes
- `src/job/normalizer.ts` — retour `null` au lieu de `'autres'`
- `src/job/scrapers/*.ts` — skip si catégorie null
- `src/types/event.ts` — `'autres'` retiré de `CATEGORIES`
- `frontend/app.js` — flatpickr, share, dropdowns dynamiques, compteur
- `frontend/index.html` — bouton ⓘ, lien `/sources.html`
- `frontend/sources.html` — nouvelle page
- `migrations/0001_remove_autres_category.sql` — suppression des rows `category = 'autres'`
- `jest.unit.config.js` — exclusion scrapers/deduplicator
