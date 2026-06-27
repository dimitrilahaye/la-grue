## Purpose

Ingestion des événements depuis l'API WordPress tribe/events de Grabuge Mag (`https://www.grabugemag.com`), avec filtre de date sur les 14 prochains jours et mapping vers le schéma unifié.

---

## Requirements

### Requirement: Ingestion Grabuge Mag API

Le système SHALL interroger `https://www.grabugemag.com/wp-json/tribe/events/v1/events` avec les paramètres `start_date`, `end_date` (14 jours à partir d'aujourd'hui), `per_page=100`, et `page=N`. La pagination SHALL continuer tant que la page retourne des événements (fallback si `total_found` est absent). Les champs `id`, `title`, `start_date`, `end_date`, `all_day`, `url`, `description`, `image.url`, `venue.venue`, `categories`, et `cost` SHALL être mappés vers le schéma unifié.

#### Scenario: Récupération réussie

- **WHEN** le job appelle l'API Grabuge avec les filtres de date
- **THEN** les événements retournés sont normalisés et persistés via UPSERT

#### Scenario: Pagination

- **WHEN** la page retourne `per_page` événements
- **THEN** le scraper passe à la page suivante jusqu'à obtenir une page vide

#### Scenario: total_found absent

- **WHEN** `total_found` est `null` dans la réponse racine
- **THEN** la pagination s'arrête quand la page retourne 0 événements

#### Scenario: API indisponible

- **WHEN** l'API retourne une erreur HTTP ou un timeout
- **THEN** le job logue l'erreur et continue avec les autres sources

---

### Requirement: Normalisation Grabuge

Le `externalId` SHALL être `String(event.id)`. La `source` SHALL être `'grabuge'`. La catégorie SHALL être déterminée par `mapGrabugeCategory(categories[].name)` — retourne `null` si aucun mapping. Les événements sans catégorie reconnue SHALL être ignorés. Le champ `isFree` SHALL être `null` (non fourni par l'API tribe/events).

#### Scenario: externalId stable

- **WHEN** le même événement est renvoyé lors de runs successifs
- **THEN** son `externalId` est identique et l'UPSERT met à jour sans dupliquer
