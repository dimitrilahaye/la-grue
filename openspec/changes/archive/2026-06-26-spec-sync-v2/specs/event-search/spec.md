## MODIFIED Requirements

### Requirement: Endpoint de dates disponibles avec filtres
`GET /api/dates` SHALL accepter les query parameters optionnels `category` et `city`. Quand ces paramètres sont fournis, seules les dates où il existe au moins un événement correspondant aux filtres sont retournées. Sans paramètres, le comportement actuel (toutes les dates avec événements) est conservé.

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
Le système SHALL exposer `GET /api/categories/counts` retournant un objet `{ [category]: number }` avec le nombre d'événements à venir par catégorie, toutes villes confondues. Aucun filtre n'est accepté — les counts sont globaux.

#### Scenario: Comptage par catégorie
- **WHEN** `GET /api/categories/counts` est appelé
- **THEN** un objet avec une clé par catégorie présente en base et son count est retourné

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

### Requirement: Suppression de la catégorie "autres"
**BREAKING** La valeur `'autres'` SHALL être supprimée de l'enum `CATEGORIES`. `GET /api/events?category=autres` SHALL retourner HTTP 400. Les événements en base avec `category = 'autres'` SHALL être supprimés via migration.

#### Scenario: Requête avec catégorie autres
- **WHEN** `GET /api/events?category=autres` est appelé
- **THEN** HTTP 400 est retourné avec un message listant les catégories valides

---

### Requirement: Déduplication des villes par casse
`GET /api/cities` SHALL retourner les villes déduplicées par `lower(city)`, avec affichage en `initcap()`. "NANTES" et "Nantes" en base donnent une seule entrée "Nantes".

#### Scenario: Déduplication casse
- **WHEN** la base contient "NANTES" (1 event) et "Nantes" (376 events)
- **THEN** `GET /api/cities` retourne une seule entrée "Nantes"
