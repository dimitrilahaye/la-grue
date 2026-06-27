## Purpose

Scraping de Big City Nantes (`https://www.bigcitynantes.fr/que-faire-a-nantes/`) via l'endpoint AJAX `cec_get_events`. Le nonce requis par cet endpoint est extrait de la page listing à chaque run.

---

## Requirements

### Requirement: Récupération du nonce Big City

Le système SHALL charger `https://www.bigcitynantes.fr/que-faire-a-nantes/` et extraire le nonce depuis la variable inline `cec_frontend = {..., "nonce": "..."}`. Si le nonce est absent ou la page inaccessible, le scraper SHALL lever une erreur et le job continue avec les autres sources.

#### Scenario: Nonce extrait avec succès

- **WHEN** la page listing est chargée
- **THEN** la valeur `cec_frontend.nonce` est extraite du HTML inline

#### Scenario: Page listing inaccessible

- **WHEN** la page listing retourne une erreur HTTP ou un timeout
- **THEN** le scraper lève une erreur, le job la logue et continue

---

### Requirement: Ingestion Big City via AJAX

Le système SHALL envoyer des requêtes POST à `https://www.bigcitynantes.fr/wp-admin/admin-ajax.php` avec `action=cec_get_events`, le nonce extrait, `start_date` et `end_date` (14 jours à partir d'aujourd'hui), et `page=1..N`. La pagination SHALL continuer tant que `data.has_more === true`. Les champs `id`, `title`, `start_date`, `end_date`, `start_time`, `end_time`, `all_day`, `price_type`, `permalink`, `thumbnail`, `venue.title`, `venue.addr`, `venue.coordinates`, et `categories.labels` SHALL être mappés vers le schéma unifié. Après la collecte, le système SHALL enrichir chaque événement en récupérant sa page `permalink` et en extrayant la balise `<meta name="description">`. Les requêtes d'enrichissement SHALL être exécutées par batches de 5 avec `Promise.allSettled`. Si un permalink est inaccessible, `description` reste `null` et l'événement est conservé.

#### Scenario: Pagination avec has_more

- **WHEN** la réponse AJAX contient `has_more: true`
- **THEN** le scraper incrémente `page` et fait une nouvelle requête

#### Scenario: Enrichissement description

- **WHEN** un événement a été collecté via AJAX
- **THEN** son `permalink` est récupéré et la valeur de `<meta name="description" content="...">` est stockée dans `description`

#### Scenario: Permalink inaccessible

- **WHEN** le permalink d'un événement retourne une erreur HTTP ou un timeout
- **THEN** `description` reste `null` et l'événement est conservé dans les résultats

#### Scenario: Nonce invalide

- **WHEN** le nonce fourni est expiré ou invalide
- **THEN** l'API retourne `success: false` — le scraper lève une erreur et le job continue

---

### Requirement: Normalisation Big City

Le `externalId` SHALL être `String(event.id)`. La `source` SHALL être `'big_city'`. Le champ `isFree` SHALL être `price_type === 'gratuit'`. La catégorie SHALL être déterminée par `mapBigCityCategory(categories.labels)`. Les événements sans catégorie reconnue SHALL être ignorés.

#### Scenario: externalId stable

- **WHEN** le même événement apparaît lors de runs successifs
- **THEN** son `externalId` est identique et l'UPSERT met à jour sans dupliquer
