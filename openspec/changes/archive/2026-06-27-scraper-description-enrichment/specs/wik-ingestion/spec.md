## MODIFIED Requirements

### Requirement: Scraping WIK Nantes — passe unique sur le listing

Le système SHALL scraper `https://www.wik-nantes.fr/agenda?date=DD/MM/YYYY` (date du jour encodée en URL) en une seule passe sur la page listing pour collecter titre, date, lieu, image et catégorie. Après la collecte, le système SHALL enrichir chaque événement en récupérant sa page détail (`detailUrl`) et en extrayant la balise `<meta name="description">`. Les requêtes d'enrichissement SHALL être exécutées par batches de 5 avec `Promise.allSettled`. Si une page détail est inaccessible, `description` reste `null` et l'événement est conservé.

#### Scenario: Extraction depuis la page listing

- **WHEN** le job charge la page listing WIK avec le paramètre `?date=DD/MM/YYYY`
- **THEN** titre, date/heure, lieu, image et catégorie sont extraits depuis chaque card

#### Scenario: Enrichissement description

- **WHEN** un événement a été collecté depuis le listing
- **THEN** sa page détail est récupérée et la valeur de `<meta name="description" content="...">` est stockée dans `description`

#### Scenario: Page détail inaccessible

- **WHEN** la page détail d'un événement retourne une erreur HTTP ou un timeout
- **THEN** `description` reste `null` et l'événement est conservé dans les résultats

#### Scenario: Pagination

- **WHEN** la page listing contient des résultats
- **THEN** le job enchaîne les pages suivantes jusqu'à obtenir une page vide ou atteindre MAX_PAGES
