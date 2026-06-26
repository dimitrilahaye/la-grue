## MODIFIED Requirements

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
Le projet SHALL maintenir deux configurations Jest distinctes : `jest.config.js` (tous les tests) et `jest.unit.config.js` (tests unitaires uniquement, excluant les scrapers et le déduplicateur). La CI SHALL uniquement exécuter `npm run test:unit`. Les tests qui accèdent à une base de données réelle ou font des appels HTTP sont des tests d'intégration et ne doivent pas figurer dans `jest.unit.config.js`.

#### Scenario: Tests unitaires en CI
- **WHEN** `npm run test:unit` est exécuté sans `DATABASE_URL`
- **THEN** tous les tests passent sans erreur liée à la base de données

#### Scenario: Tests d'intégration exclus de la CI
- **WHEN** `npm run test:unit` est exécuté
- **THEN** les fichiers sous `src/job/scrapers/` et `src/job/__tests__/deduplicator/` sont ignorés
