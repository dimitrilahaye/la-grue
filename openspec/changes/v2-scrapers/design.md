## Context

Les scrapers existants (NM, PDL, WIK) suivent un pattern commun : `async function scrape*(): Promise<NormalizedEvent[]>`. Les nouvelles sources sont toutes accessibles sans Playwright :
- Grabuge Mag : API WordPress `tribe/events/v1/events`, pagination `page` + `total_found`
- Pull Rouge : page HTML statique `https://pullrouge.fr/`, blocs séquentiels FreeSans `big>big`
- Big City Nantes : endpoint AJAX `admin-ajax.php?action=cec_get_events`, nonce extrait de la page listing

## Goals / Non-Goals

**Goals:**
- Implémenter les 3 scrapers dans `src/job/scrapers/`
- Étendre `normalizer.ts` avec les fonctions de mapping des nouvelles sources
- Enregistrer les scrapers dans `src/job/index.ts`
- Mettre à jour `frontend/sources.html` et `README.md`
- Couvrir les scrapers avec des tests unitaires (jest.mock axios/cheerio)

**Non-Goals:**
- Playwright ou rendu headless
- Modification du schéma de base de données
- Scrapers Dice.fm et Shotgun.live (planifiés en v3)

## Decisions

### Grabuge Mag

- Endpoint : `https://www.grabugemag.com/wp-json/tribe/events/v1/events`
- Paramètres : `start_date=YYYY-MM-DD`, `end_date=YYYY-MM-DD`, `per_page=100`, `page=1..N`
- Pagination : tant que `total_found > offset` (le champ `total_found` est dans la réponse racine)
- `externalId` : `String(event.id)` (identifiant WP numérique stable)
- `start_date` / `end_date` au format `"YYYY-MM-DD HH:MM:SS"` → parser avec `new Date()`
- `all_day === true` → `start_time = 00:00`, pas de `end_time`
- `venue.venue` = nom du lieu (souvent "adresse" brute, pas un nom propre) — utiliser comme `venueName`
- Pas de coordonnées dans l'API tribe → `lat/lon = null`
- `categories[].name` → mapper via `mapGrabugeCategory`

### Pull Rouge

- URL : `https://pullrouge.fr/`
- Parsing : extraire tous les `<span style="font-family: FreeSans;"><big><big>…</big></big></span>` dans l'ordre, puis traiter en triplets (date, titre+lien, venue)
- Un triplet est valide si : bloc[0] contient un jour de semaine + mois + année (regex), bloc[1] contient un `<a href>`, bloc[2] commence par `@`
- Si bloc[2] ne commence pas par `@` (ex : événement sans venue), on avance d'un pas
- Parse de la date : `"samedi 27 juin 2026   20h00"` → regex `/(lundi|mardi|…)\s+(\d{1,2})(?:\s*<sup>er</sup>)?\s+(janvier|…)\s+(\d{4})(?:[^0-9]*(\d{1,2})h(\d{2})?)?/`
- `externalId` : `sha256(title + startAt.toISOString())`
- `city` = "Nantes" par défaut (agenda Nantes/Loire-Atlantique) — laisser `null` pour les venues hors Nantes si on détecte un indicateur géographique dans le venue
- Pull Rouge couvre concerts et vernissages → `mapPullRougeCategory` filtre sur ces deux types

### Big City Nantes

- Étape 1 : GET `https://www.bigcitynantes.fr/que-faire-a-nantes/`, extraire le nonce depuis l'objet inline `cec_frontend = {..., "nonce": "..."}`
- Étape 2 : POST `https://www.bigcitynantes.fr/wp-admin/admin-ajax.php` avec `action=cec_get_events&nonce=<nonce>&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&page=N` jusqu'à `has_more: false`
- Réponse `data.events[]` : `id`, `title`, `start_date`, `end_date`, `start_time`, `end_time`, `all_day`, `price_type` ("gratuit"/"payant"), `permalink`, `thumbnail`, `venue.title`, `venue.addr`, `venue.coordinates.latitude/longitude`, `categories.labels[]`
- `externalId` : `String(event.id)`
- `isFree` : `price_type === 'gratuit'`
- `categories.labels[]` → `mapBigCityCategory`

### Normalizer

Trois nouvelles fonctions exportées :
- `mapGrabugeCategory(categories: string[]): Category | null`
- `mapPullRougeCategory(rawText: string): Category | null`
- `mapBigCityCategory(labels: string[]): Category | null`

Toutes utilisent la même logique token-based que `mapNantesMetropoleCategory`.

### sources.html

Structure actuelle : section "actif" (3 sources) + section "Bientôt" (3 sources planifiées v2).

Après mise à jour :
- Section "actif" : NM, PDL, WIK + **Grabuge Mag** + **Big City Nantes** (5 sources)
- Section "Bientôt v2" : **Pull Rouge** uniquement (site bénévole statique, couverture partielle)
- Section "Bientôt v3" : Dice.fm, Shotgun.live (nécessitent headless)

## Risks / Trade-offs

- **Big City nonce** : le nonce expire après quelques heures. Le scraper doit fetcher la page listing à chaque run pour en obtenir un frais. Pas de mise en cache entre runs.
- **Pull Rouge** : site bénévole sans garantie d'uptime (DNS parfois instable). L'erreur HTTP ne bloque pas le job. Les concerts/vernissages sont bien mappables ; le reste est ignoré.
- **Grabuge : total_found absent** : lors des tests, `total_found` était `null` dans la réponse racine. Fallback : si `total_found === null`, continuer tant que la page retourne des events (`events.length > 0`), arrêter sur page vide.
