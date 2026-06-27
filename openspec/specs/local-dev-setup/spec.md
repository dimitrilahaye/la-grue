## Purpose

Environnement de développement local clé-en-main : base de données PostgreSQL via Docker Compose, scripts de migration et de seed, variables d'environnement documentées.

---

## Requirements

### Requirement: Docker Compose pour le développement local
Le projet SHALL fournir un fichier `docker/docker-compose.yml` démarrant deux services : `postgres` (image officielle PostgreSQL 16, port host **5433** → container 5432, pour éviter les conflits avec une instance PostgreSQL locale) et `adminer` (port host **8082**, pour inspecter la base graphiquement). Un volume nommé SHALL persister les données PostgreSQL entre les redémarrages.

> **Note** : les ports host ont été ajustés par rapport au design initial (5432→5433, 8080→8082) pour éviter les conflits avec des services locaux existants.

#### Scenario: Démarrage de l'environnement local
- **WHEN** `docker compose -f docker/docker-compose.yml up -d --force-recreate` est exécuté
- **THEN** PostgreSQL est accessible sur `localhost:5433` et Adminer sur `localhost:8082`

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

### Requirement: Client DB en initialisation lazy
Le client Drizzle (`src/db/client.ts`) SHALL être exporté comme un Proxy qui n'initialise la connexion réelle qu'au premier accès d'une propriété. `DATABASE_URL` SHALL être validé et la connexion créée uniquement lors de ce premier accès, pas à l'import du module. Cela permet aux tests unitaires d'importer des modules dépendant de `db` sans fournir `DATABASE_URL`.

#### Scenario: Import sans DATABASE_URL
- **WHEN** un test unitaire importe un module qui importe `db` depuis `src/db/client.ts`
- **THEN** aucune erreur n'est levée à l'import

#### Scenario: Accès sans DATABASE_URL
- **WHEN** une méthode de `db` est appelée sans `DATABASE_URL` défini
- **THEN** une erreur explicite "DATABASE_URL is required" est levée

---

### Requirement: Rate limiting désactivé en développement local
Le rate limiting Express (`express-rate-limit`) SHALL être désactivé quand `NODE_ENV !== 'production'` via l'option `skip: () => isDev`. La configuration `max: 0` ne SHALL pas être utilisée (dans express-rate-limit v7, `max: 0` bloque toutes les requêtes).

#### Scenario: Dev local sans rate limit
- **WHEN** le serveur tourne avec `NODE_ENV=development`
- **THEN** les requêtes ne sont jamais bloquées par le rate limiter, quel que soit leur nombre

---

### Requirement: Séparation tests unitaires et tests d'intégration
Le projet SHALL maintenir trois configurations Jest distinctes : `jest.config.js` (tous les tests), `jest.unit.config.js` (tests unitaires uniquement, excluant les scrapers et le déduplicateur), et `jest.contract.config.js` (tests de contrat live, avec `testTimeout: 15000` et pattern `*.contract.test.ts`). La CI SHALL uniquement exécuter `npm run test:unit`. Les tests qui accèdent à une base de données réelle ou font des appels HTTP sont des tests d'intégration ou de contrat et ne doivent pas figurer dans `jest.unit.config.js`.

#### Scenario: Tests unitaires en CI
- **WHEN** `npm run test:unit` est exécuté sans `DATABASE_URL`
- **THEN** tous les tests passent sans erreur liée à la base de données

#### Scenario: Tests d'intégration exclus de la CI
- **WHEN** `npm run test:unit` est exécuté
- **THEN** les fichiers sous `src/job/scrapers/` et `src/job/__tests__/deduplicator/` sont ignorés

#### Scenario: Tests de contrat exclus de la CI
- **WHEN** `npm run test:unit` est exécuté
- **THEN** aucun fichier `*.contract.test.ts` n'est exécuté

---

### Requirement: Scripts npm standardisés
Le projet SHALL exposer les scripts npm suivants dans `package.json` : `dev` (démarrage en mode watch avec ts-node ou tsx), `build` (compilation TypeScript), `start` (démarrage du build compilé), `db:migrate` (application des migrations), `db:seed` (insertion des données fictives), `test` (Jest), `test:watch` (Jest en mode watch), `test:unit` (Jest unitaire uniquement), `test:contract` (Jest tests de contrat live), `lint` (ESLint).

#### Scenario: Développement local
- **WHEN** `npm run dev` est exécuté
- **THEN** le serveur démarre en mode watch et redémarre automatiquement à chaque modification de fichier TypeScript

#### Scenario: Build de production
- **WHEN** `npm run build && npm start` est exécuté
- **THEN** le code TypeScript est compilé dans `dist/` et le serveur démarre depuis les fichiers compilés

#### Scenario: Tests de contrat en local
- **WHEN** `npm run test:contract` est exécuté
- **THEN** Jest exécute uniquement les fichiers `*.contract.test.ts` avec un timeout de 15 secondes par test
