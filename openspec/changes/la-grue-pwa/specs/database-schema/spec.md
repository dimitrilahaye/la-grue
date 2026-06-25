## ADDED Requirements

### Requirement: Table events
Le système SHALL maintenir une table `events` avec les colonnes suivantes : `id` (UUID, PK, défaut `gen_random_uuid()`), `source` (TEXT NOT NULL), `external_id` (TEXT NOT NULL), `title` (TEXT NOT NULL), `description` (TEXT), `start_at` (TIMESTAMPTZ NOT NULL), `end_at` (TIMESTAMPTZ), `venue_name` (TEXT), `city` (TEXT), `address` (TEXT), `lat` (DOUBLE PRECISION), `lon` (DOUBLE PRECISION), `category` (TEXT NOT NULL), `raw_category` (TEXT), `tags` (TEXT[]), `detail_url` (TEXT), `image_url` (TEXT), `is_free` (BOOLEAN), `price_info` (TEXT), `created_at` (TIMESTAMPTZ NOT NULL DEFAULT now()), `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT now()). Une contrainte UNIQUE SHALL être définie sur `(source, external_id)`.

#### Scenario: Insertion d'un nouvel événement
- **WHEN** un événement avec une paire `(source, external_id)` inconnue est inséré
- **THEN** une nouvelle ligne est créée avec un UUID généré automatiquement

#### Scenario: Contrainte d'unicité
- **WHEN** un INSERT est tenté avec une paire `(source, external_id)` déjà existante sans clause ON CONFLICT
- **THEN** une erreur de contrainte est levée par PostgreSQL

---

### Requirement: Index de performance
Le système SHALL créer les index suivants sur la table `events` : index sur `start_at` (requêtes par fenêtre temporelle), index sur `category` (filtre par catégorie), index sur `city` (filtre par ville, insensible à la casse via `lower(city)`).

#### Scenario: Requête filtrée par date
- **WHEN** une requête SELECT inclut un filtre `start_at BETWEEN ? AND ?`
- **THEN** PostgreSQL utilise l'index sur `start_at` (vérifiable via EXPLAIN ANALYZE)

#### Scenario: Requête filtrée par catégorie
- **WHEN** une requête SELECT inclut `WHERE category = ?`
- **THEN** PostgreSQL utilise l'index sur `category`

---

### Requirement: Schéma Drizzle comme source de vérité
Le système SHALL définir le schéma de la table `events` dans `src/db/schema.ts` via Drizzle ORM. Les types TypeScript des rows (`InferSelectModel<typeof eventsTable>`, `InferInsertModel<typeof eventsTable>`) SHALL être inférés automatiquement depuis ce schéma. Aucune définition de type manuelle dupliquant la structure de la table n'est autorisée.

#### Scenario: Génération de migration
- **WHEN** `drizzle-kit generate` est exécuté après modification de `schema.ts`
- **THEN** un nouveau fichier SQL est créé dans `migrations/` reflétant exactement les changements

#### Scenario: Application de migration
- **WHEN** `drizzle-kit migrate` est exécuté avec `MIGRATION_DATABASE_URL`
- **THEN** les migrations en attente sont appliquées à la base de données cible

---

### Requirement: Deux URL de connexion distinctes
Le système SHALL utiliser deux variables d'environnement de connexion : `MIGRATION_DATABASE_URL` (connexion directe PostgreSQL port 5432, pour Drizzle Kit) et `DATABASE_URL` (connection pooler PgBouncer port 6543, pour le runtime applicatif). L'application SHALL refuser de démarrer si `DATABASE_URL` est absent.

#### Scenario: Démarrage sans DATABASE_URL
- **WHEN** le processus démarre sans la variable `DATABASE_URL`
- **THEN** le processus s'arrête immédiatement avec un message d'erreur explicite

#### Scenario: Migration avec MIGRATION_DATABASE_URL
- **WHEN** `npm run db:migrate` est exécuté
- **THEN** Drizzle Kit utilise `MIGRATION_DATABASE_URL` et non `DATABASE_URL`

---

### Requirement: Gestion du updated_at automatique
Le système SHALL mettre à jour automatiquement le champ `updated_at` à chaque modification d'une ligne. Cette mise à jour SHALL être gérée côté applicatif dans la requête UPSERT (passage explicite de `new Date()`) et non via trigger PostgreSQL, pour rester compatible avec le connection pooler.

#### Scenario: UPSERT d'un événement existant
- **WHEN** un UPSERT est effectué sur une ligne existante
- **THEN** `updated_at` est mis à jour avec le timestamp courant
