## Purpose

API REST de recherche et navigation par jour dans les événements agrégés. Le paramètre `date` est le pivot de navigation ; tous les filtres s'appliquent dans le contexte du jour sélectionné.

---

## Requirements

### Requirement: Endpoint de recherche d'événements
Le système SHALL exposer `GET /api/events` acceptant les query parameters suivants : `date` (format `YYYY-MM-DD`, défaut : date du jour côté serveur en Europe/Paris, **paramètre pivot de navigation**), `category` (valeur de l'enum catégorie, optionnel), `city` (string, optionnel), `limit` (integer, défaut 20, max 100), `offset` (integer, défaut 0). La réponse SHALL être JSON avec la structure `{ data: Event[], total: number, limit: number, offset: number, date: string }`.

#### Scenario: Appel sans paramètre (vue par défaut)
- **WHEN** `GET /api/events` est appelé sans paramètres
- **THEN** les événements de la journée en cours (Europe/Paris) sont retournés, triés par `start_at` ASC, avec `limit=20` et `offset=0`

#### Scenario: Navigation vers un autre jour
- **WHEN** `GET /api/events?date=2026-07-14` est appelé
- **THEN** seuls les événements dont `start_at` est compris dans la journée du 14 juillet 2026 (00:00:00 → 23:59:59 Europe/Paris) sont retournés

#### Scenario: Load more dans un jour
- **WHEN** `GET /api/events?date=2026-07-14&offset=20` est appelé
- **THEN** les 20 événements suivants de cette journée sont retournés (offset appliqué après les filtres)

#### Scenario: Filtrage par catégorie dans un jour
- **WHEN** `GET /api/events?date=2026-07-14&category=concerts-musique` est appelé
- **THEN** seuls les événements de cette journée dont la catégorie normalisée est `concerts-musique` sont retournés

#### Scenario: Filtrage par ville dans un jour
- **WHEN** `GET /api/events?date=2026-07-14&city=Nantes` est appelé
- **THEN** seuls les événements de cette journée dont le champ `city` contient la valeur (insensible à la casse) sont retournés

#### Scenario: Combinaison de filtres
- **WHEN** plusieurs paramètres sont passés simultanément
- **THEN** seuls les événements satisfaisant TOUS les filtres sont retournés (AND logique)

#### Scenario: Paramètre invalide
- **WHEN** un paramètre de type incorrect est fourni (ex: `limit=abc`, `date=not-a-date`)
- **THEN** la réponse est HTTP 400 avec un message d'erreur explicite

#### Scenario: Catégorie supprimée
- **WHEN** `GET /api/events?category=autres` est appelé
- **THEN** HTTP 400 est retourné avec un message listant les catégories valides

#### Scenario: Aucun résultat
- **WHEN** aucun événement ne correspond aux filtres
- **THEN** la réponse est HTTP 200 avec `{ data: [], total: 0, limit, offset, date }`

---

### Requirement: Endpoint de détail d'un événement
Le système SHALL exposer `GET /api/events/:id` retournant le détail complet d'un événement par son UUID. La réponse inclut tous les champs, y compris `detail_url` pour le lien vers la source et `raw_category` pour le debug.

#### Scenario: Événement trouvé
- **WHEN** `GET /api/events/:id` est appelé avec un UUID valide existant
- **THEN** HTTP 200 avec l'objet complet de l'événement

#### Scenario: Événement non trouvé
- **WHEN** `GET /api/events/:id` est appelé avec un UUID inexistant
- **THEN** HTTP 404 avec `{ error: "Event not found" }`

---

### Requirement: Navigation par jour
Le paramètre `date` est le pivot de navigation. En son absence, le serveur SHALL utiliser la date du jour en timezone Europe/Paris. L'API ne renvoie que les événements de la journée demandée — elle ne gère pas de fenêtre multi-jours. La navigation entre les jours (← hier / demain →) est entièrement gérée côté frontend.

#### Scenario: Défaut sur aujourd'hui
- **WHEN** `GET /api/events` est appelé sans paramètre `date`
- **THEN** la date utilisée est celle du jour en cours en Europe/Paris (00:00:00 → 23:59:59)

#### Scenario: Navigation vers un jour passé
- **WHEN** `GET /api/events?date=2026-07-13` est appelé alors qu'on est le 14
- **THEN** les événements du 13 juillet sont retournés normalement (pas de restriction sur les jours passés)

---

### Requirement: Endpoint de dates disponibles avec filtres
`GET /api/dates` SHALL retourner la liste des dates (format `YYYY-MM-DD`) pour lesquelles il existe au moins un événement. Les query parameters optionnels `category` et `city` filtrent les dates retournées. Sans paramètres, toutes les dates avec événements sont retournées.

#### Scenario: Dates filtrées par ville
- **WHEN** `GET /api/dates?city=Bouaye` est appelé
- **THEN** seules les dates avec au moins un événement à Bouaye sont retournées

#### Scenario: Dates filtrées par catégorie
- **WHEN** `GET /api/dates?category=concerts-musique` est appelé
- **THEN** seules les dates avec au moins un concert sont retournées

---

### Requirement: Endpoint de statistiques à venir
Le système SHALL exposer `GET /api/stats` retournant `{ total: number, daysCount: number }` représentant le nombre total d'événements à venir (>= aujourd'hui Europe/Paris) et le nombre de jours distincts couverts. Les query parameters optionnels `category` et `city` filtrent les résultats.

#### Scenario: Stats globales
- **WHEN** `GET /api/stats` est appelé sans paramètres
- **THEN** `{ total: N, daysCount: M }` est retourné avec N = nombre d'événements à venir et M = jours distincts

#### Scenario: Stats filtrées
- **WHEN** `GET /api/stats?city=Nantes&category=festivals` est appelé
- **THEN** `total` et `daysCount` ne comptent que les festivals à Nantes à venir

---

### Requirement: Endpoint de comptage par catégorie
Le système SHALL exposer `GET /api/categories/counts` retournant un objet `{ [category]: number }` avec le nombre d'événements à venir par catégorie. Le query parameter optionnel `?city=` filtre les événements comptés par ville (symétrie avec `?category=` sur `/cities/counts`). Sans ce paramètre, les counts sont globaux toutes villes confondues.

#### Scenario: Comptage par catégorie sans filtre
- **WHEN** `GET /api/categories/counts` est appelé sans paramètre
- **THEN** un objet avec une clé par catégorie présente en base et son count toutes villes est retourné

#### Scenario: Comptage par catégorie filtré par ville
- **WHEN** `GET /api/categories/counts?city=Carquefou` est appelé
- **THEN** seuls les événements à Carquefou à venir sont comptés par catégorie

---

### Requirement: Endpoint de comptage par ville
Le système SHALL exposer `GET /api/cities/counts` retournant un objet `{ [city]: number }` avec le nombre d'événements à venir par ville (clé en `initcap(lower(city))`). Le query parameter optionnel `category` filtre les événements comptés.

#### Scenario: Comptage par ville sans filtre
- **WHEN** `GET /api/cities/counts` est appelé sans paramètre
- **THEN** le count total à venir par ville est retourné, sans doublons de casse ("Nantes" fusionne "NANTES" + "Nantes")

#### Scenario: Comptage par ville filtré par catégorie
- **WHEN** `GET /api/cities/counts?category=concerts-musique` est appelé
- **THEN** seuls les concerts à venir sont comptés par ville

---

### Requirement: Déduplication des villes par casse
`GET /api/cities` SHALL retourner les villes déduplicées par `lower(city)`, avec affichage en `initcap()`. "NANTES" et "Nantes" en base donnent une seule entrée "Nantes".

#### Scenario: Déduplication casse
- **WHEN** la base contient des variantes de casse pour une même ville
- **THEN** `GET /api/cities` retourne une seule entrée en initcap

---

### Requirement: Headers CORS
Le système SHALL retourner les headers CORS appropriés pour permettre les requêtes depuis le frontend PWA servi sur le même domaine. En développement local, les requêtes depuis `localhost` SHALL être autorisées.

#### Scenario: Requête depuis le frontend
- **WHEN** le frontend PWA appelle `/api/events`
- **THEN** la réponse inclut `Access-Control-Allow-Origin` correctement configuré
