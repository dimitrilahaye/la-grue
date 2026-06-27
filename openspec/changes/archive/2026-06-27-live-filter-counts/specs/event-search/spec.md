## MODIFIED Requirements

### Requirement: Endpoint de comptage par catégorie
Le système SHALL exposer `GET /api/categories/counts` retournant un objet `{ [category]: number }` avec le nombre d'événements à venir par catégorie. Le query parameter optionnel `?city=` filtre les événements comptés par ville (symétrie avec `?category=` sur `/cities/counts`). Sans ce paramètre, les counts sont globaux toutes villes confondues.

#### Scenario: Comptage par catégorie sans filtre
- **WHEN** `GET /api/categories/counts` est appelé sans paramètre
- **THEN** un objet avec une clé par catégorie présente en base et son count toutes villes est retourné

#### Scenario: Comptage par catégorie filtré par ville
- **WHEN** `GET /api/categories/counts?city=Carquefou` est appelé
- **THEN** seuls les événements à Carquefou à venir sont comptés par catégorie
