## MODIFIED Requirements

### Requirement: Déduplication UPSERT
Le système SHALL persister les événements via `INSERT ... ON CONFLICT (canonical_id) DO UPDATE SET ...`. Avant tout UPSERT, les événements collectés sur l'ensemble des sources SHALL être groupés par `canonical_id` en mémoire ; pour chaque groupe, seul le candidat avec le score de richesse le plus élevé est retenu. Le score de richesse est calculé sur cinq champs : `title` (présence), `description` (présence), coordonnées `lat`/`lon` (présence des deux), `imageUrl` (présence), `priceInfo` (présence) — chaque critère vaut 1 point (score 0-5). La résolution de conflit SQL SHALL appliquer une stratégie champ par champ : `description` est remplacée uniquement si la nouvelle est plus longue ; `lat`, `lon`, `imageUrl` et `priceInfo` sont complétés par COALESCE (valeur existante conservée si non nulle) ; les champs structurels (`title`, `startAt`, `endAt`, `venueName`, `address`, `category`, etc.) sont toujours mis à jour avec la valeur fraîche. La contrainte `(source, external_id)` a été supprimée : certaines sources réutilisent le même `external_id` pour plusieurs occurrences journalières d'un même événement, ce qui la rendait incompatible avec le modèle `canonical_id`.

#### Scenario: Nouvel événement
- **WHEN** un événement avec un `canonical_id` inconnu est inséré
- **THEN** une nouvelle ligne est créée en base

#### Scenario: Doublon cross-source dans le même run
- **WHEN** deux scrapers différents remontent le même événement réel dans le même run (même `canonical_id`)
- **THEN** seul le candidat avec le score de richesse le plus élevé est persisté ; l'autre est ignoré

#### Scenario: Doublon intra-source dans le même run
- **WHEN** un scraper remonte deux articles distincts pour le même événement réel (même `canonical_id`, `external_id` différents)
- **THEN** seul le candidat avec le score de richesse le plus élevé est persisté

#### Scenario: Événement existant mis à jour (cross-run)
- **WHEN** un événement avec un `canonical_id` déjà connu est inséré lors d'un run ultérieur
- **THEN** les champs structurels sont mis à jour avec les données fraîches ; `description` est remplacée uniquement si la nouvelle version est plus longue ; `lat`, `lon`, `imageUrl` et `priceInfo` existants sont conservés si la nouvelle valeur est nulle

#### Scenario: Enrichissement description cross-run
- **WHEN** un événement sans description est en base et un run ultérieur remonte le même événement avec une description
- **THEN** la description est mise à jour avec la valeur non nulle
