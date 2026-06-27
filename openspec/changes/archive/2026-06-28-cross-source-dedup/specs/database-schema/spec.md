## MODIFIED Requirements

### Requirement: Table events
Le système SHALL maintenir une table `events` avec les colonnes suivantes : `id` (UUID, PK, défaut `gen_random_uuid()`), `canonical_id` (TEXT NOT NULL UNIQUE), `source` (TEXT NOT NULL), `external_id` (TEXT NOT NULL), `title` (TEXT NOT NULL), `description` (TEXT), `start_at` (TIMESTAMPTZ NOT NULL), `end_at` (TIMESTAMPTZ), `venue_name` (TEXT), `city` (TEXT), `address` (TEXT), `lat` (DOUBLE PRECISION), `lon` (DOUBLE PRECISION), `category` (TEXT NOT NULL), `raw_category` (TEXT), `tags` (TEXT[]), `detail_url` (TEXT), `image_url` (TEXT), `is_free` (BOOLEAN), `price_info` (TEXT), `created_at` (TIMESTAMPTZ NOT NULL DEFAULT now()), `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT now()). Une contrainte UNIQUE SHALL être définie sur `canonical_id`. La contrainte `(source, external_id)` a été supprimée : certaines sources (ex. NantesMetropole) réutilisent le même `external_id` pour plusieurs occurrences journalières d'un même événement, rendant cette contrainte incompatible avec le modèle `canonical_id`.

#### Scenario: Insertion d'un nouvel événement
- **WHEN** un événement avec un `canonical_id` inconnu est inséré
- **THEN** une nouvelle ligne est créée avec un UUID généré automatiquement

#### Scenario: Contrainte d'unicité canonical_id
- **WHEN** un INSERT est tenté avec un `canonical_id` déjà existant sans clause ON CONFLICT
- **THEN** une erreur de contrainte est levée par PostgreSQL
