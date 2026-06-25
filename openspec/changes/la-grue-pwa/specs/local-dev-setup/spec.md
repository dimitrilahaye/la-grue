## ADDED Requirements

### Requirement: Docker Compose pour le développement local
Le projet SHALL fournir un fichier `docker/docker-compose.yml` démarrant deux services : `postgres` (image officielle PostgreSQL 16, port 5432, variables `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` configurables via `.env`) et `adminer` (port 8080, pour inspecter la base graphiquement). Un volume nommé SHALL persister les données PostgreSQL entre les redémarrages.

#### Scenario: Démarrage de l'environnement local
- **WHEN** `docker compose -f docker/docker-compose.yml up -d` est exécuté
- **THEN** PostgreSQL et Adminer sont accessibles respectivement sur `localhost:5432` et `localhost:8080`

#### Scenario: Persistance des données
- **WHEN** Docker Compose est redémarré
- **THEN** les données insérées lors de la session précédente sont toujours présentes

---

### Requirement: Script de migration locale
Le projet SHALL fournir un script `npm run db:migrate` qui applique les migrations Drizzle en attente contre la base de données configurée dans `MIGRATION_DATABASE_URL`. En local, cette variable pointe vers l'instance Docker Compose.

#### Scenario: Première exécution
- **WHEN** `npm run db:migrate` est exécuté sur une base vierge
- **THEN** toutes les migrations sont appliquées dans l'ordre et la table `events` est créée

#### Scenario: Migrations déjà appliquées
- **WHEN** `npm run db:migrate` est exécuté sur une base déjà à jour
- **THEN** aucune migration n'est rejouée, le script se termine sans erreur

---

### Requirement: Script de seed avec données fictives
Le projet SHALL fournir un script `npm run db:seed` qui insère des événements fictifs couvrant toutes les catégories La Grue. Le seed SHALL insérer : au minimum 3 événements pour chaque catégorie, des événements pour chaque jour de la semaine en cours et de la semaine suivante, au moins 5 événements dont `start_at` est dans la journée courante (pour tester l'affichage immédiat), des événements avec `is_free: true` et `is_free: false`, des événements avec et sans `detail_url`, des événements avec et sans `image_url`.

#### Scenario: Seed complet
- **WHEN** `npm run db:seed` est exécuté sur une base vide
- **THEN** au moins 30 événements fictifs sont insérés, couvrant toutes les catégories et les deux semaines

#### Scenario: Idempotence du seed
- **WHEN** `npm run db:seed` est exécuté plusieurs fois
- **THEN** le script TRUNCATE la table avant d'insérer, garantissant un état déterministe

#### Scenario: Événements du jour présents
- **WHEN** le seed est exécuté
- **THEN** au moins 5 événements ont un `start_at` dans la journée en cours (entre 00:00 et 23:59)

---

### Requirement: Variables d'environnement locales
Le projet SHALL fournir un fichier `.env.example` documentant toutes les variables d'environnement requises : `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `CRON_SECRET`, `PORT` (défaut 3000). Un fichier `.env` (ignoré par git) SHALL être utilisé pour les valeurs locales réelles.

#### Scenario: Démarrage sans .env
- **WHEN** le projet est cloné et `npm run dev` est exécuté sans `.env`
- **THEN** l'application affiche un message d'erreur lisible listant les variables manquantes

#### Scenario: .env.example à jour
- **WHEN** une nouvelle variable d'environnement est ajoutée au code
- **THEN** elle est documentée dans `.env.example` avec une valeur exemple

---

### Requirement: Scripts npm standardisés
Le projet SHALL exposer les scripts npm suivants dans `package.json` : `dev` (démarrage en mode watch avec ts-node ou tsx), `build` (compilation TypeScript), `start` (démarrage du build compilé), `db:migrate` (application des migrations), `db:seed` (insertion des données fictives), `test` (Jest), `test:watch` (Jest en mode watch), `lint` (ESLint).

#### Scenario: Développement local
- **WHEN** `npm run dev` est exécuté
- **THEN** le serveur démarre en mode watch et redémarre automatiquement à chaque modification de fichier TypeScript

#### Scenario: Build de production
- **WHEN** `npm run build && npm start` est exécuté
- **THEN** le code TypeScript est compilé dans `dist/` et le serveur démarre depuis les fichiers compilés
