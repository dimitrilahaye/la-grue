## Why

La Grue agrège actuellement 3 sources (Nantes Métropole, Pays de la Loire, WIK). Trois nouvelles sources — Grabuge Mag, Pull Rouge et Big City Nantes — sont planifiées depuis la v2 du projet. L'investigation technique a confirmé que toutes les trois sont accessibles sans Playwright : Grabuge via une API WordPress tribe/events, Pull Rouge via parsing HTML Cheerio, et Big City via un endpoint AJAX (`cec_get_events`) qui requiert un nonce extrait de la page listing.

## What Changes

- **Nouveau scraper Grabuge Mag** : consomme l'API `wp-json/tribe/events/v1/events` de grabugemag.com avec filtre de date sur 14 jours
- **Nouveau scraper Pull Rouge** : scrape `https://pullrouge.fr/` en parsant les blocs FreeSans `big>big` séquentiellement (date, lien, venue)
- **Nouveau scraper Big City Nantes** : récupère le nonce depuis `https://www.bigcitynantes.fr/que-faire-a-nantes/`, puis pagine via l'endpoint AJAX `admin-ajax.php?action=cec_get_events`
- **Normalizer étendu** : ajout de `mapGrabugeCategory`, `mapPullRougeCategory`, `mapBigCityCategory`
- **Job orchestrateur** : enregistrement des 3 nouveaux scrapers dans `runJob()`
- **sources.html** : Grabuge et Big City passent en "actif", Pull Rouge reste en "Bientôt" (site statique bénévole, coverage partielle), ajout de Dice.fm et Shotgun.live en section "Bientôt v3"
- **README.md** : Grabuge et Big City passent dans le tableau "Sources actives", Pull Rouge reste en v2 prévu (site bénévole), section "Sources prévues (v3)" avec Dice.fm et Shotgun.live

## Capabilities

### New Capabilities

- `grabuge-ingestion` : ingestion des événements depuis l'API tribe/events de Grabuge Mag
- `pullrouge-ingestion` : scraping HTML de Pull Rouge via parsing séquentiel de blocs big>big
- `bigcity-ingestion` : scraping AJAX de Big City Nantes avec récupération de nonce

### Modified Capabilities

- `event-ingestion` : ajout de trois nouvelles sources dans les requirements du scraping
- `sources-page` : mise à jour de la page Sources (nouveaux actifs + v3 Bientôt)

## Impact

- `src/job/scrapers/grabuge.ts` — nouveau fichier
- `src/job/scrapers/pullRouge.ts` — nouveau fichier
- `src/job/scrapers/bigCity.ts` — nouveau fichier
- `src/job/normalizer.ts` — 3 nouvelles fonctions de mapping
- `src/job/index.ts` — enregistrement des 3 scrapers
- `src/job/scrapers/__tests__/grabuge.test.ts` — nouveau fichier
- `src/job/scrapers/__tests__/pullRouge.test.ts` — nouveau fichier
- `src/job/scrapers/__tests__/bigCity.test.ts` — nouveau fichier
- `src/job/__tests__/normalizer.test.ts` — nouveaux cas de tests
- `frontend/sources.html` — mise à jour de la page Sources
- `README.md` — mise à jour des tableaux de sources
- Aucune dépendance nouvelle (axios + cheerio déjà installés)
