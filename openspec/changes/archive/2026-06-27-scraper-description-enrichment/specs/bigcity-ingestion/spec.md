## MODIFIED Requirements

### Requirement: Ingestion Big City via AJAX

Le système SHALL envoyer des requêtes POST à `https://www.bigcitynantes.fr/wp-admin/admin-ajax.php` avec `action=cec_get_events`, le nonce extrait, `start_date`, `end_date` et `page=1..N`. La pagination SHALL continuer tant que `data.has_more === true`. Après la collecte, le système SHALL enrichir chaque événement en récupérant sa page `permalink` et en extrayant la balise `<meta name="description">`. Les requêtes d'enrichissement SHALL être exécutées par batches de 5 avec `Promise.allSettled`. Si un permalink est inaccessible, `description` reste `null` et l'événement est conservé.

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
