## MODIFIED Requirements

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
