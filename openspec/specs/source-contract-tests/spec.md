## Purpose

Tests de contrat live vérifiant que les sources de scraping (APIs et sites HTML) sont toujours accessibles et que leurs données ont toujours le format attendu. Détecte les ruptures de contrat avant qu'elles n'impactent le job nocturne.

---

## Requirements

### Requirement: Validation de contrat pour les sources API
Le système SHALL fournir des tests de contrat qui effectuent une requête HTTP live vers chaque source API et valident le schéma de réponse avec Zod. Pour chaque source, la requête SHALL utiliser `limit=1` et une fenêtre de 14 jours. La validation SHALL utiliser `z.array().min(0)` — si le tableau retourné est vide, un `console.warn` SHALL être émis sans faire échouer le test. Les tests SHALL détecter les challenges Cloudflare et les bans IP en inspectant le corps de la réponse brute avant tout parsing.

#### Scenario: Réponse API conforme au schéma
- **WHEN** le test de contrat s'exécute contre une source API live
- **THEN** la réponse HTTP est 200, le corps correspond au schéma Zod, et aucun marqueur Cloudflare n'est détecté

#### Scenario: Résultats API vides
- **WHEN** l'API retourne un tableau de résultats vide
- **THEN** le test passe et un `console.warn` indique qu'aucun événement n'a été retourné pour la fenêtre de dates

#### Scenario: Challenge Cloudflare détecté sur une API
- **WHEN** le corps de la réponse contient "Just a moment", "cf-browser-verification" ou "Enable JavaScript and cookies to continue"
- **THEN** le test échoue avec un message identifiant la source et le type de blocage

---

### Requirement: Validation de contrat pour les sources HTML
Le système SHALL fournir des tests de contrat qui récupèrent la page HTML live de chaque source scrapée par HTML et vérifient que les sélecteurs CSS attendus existent dans le DOM via Cheerio. Les tests SHALL détecter les challenges Cloudflare en inspectant le corps brut de la réponse. Si la page listing ne contient aucun élément article, les tests niveau-article SHALL être ignorés via `test.skip` et un message SHALL être émis dans les logs.

#### Scenario: Sélecteurs CSS présents dans le DOM
- **WHEN** le test de contrat récupère la page listing HTML d'une source
- **THEN** les sélecteurs CSS attendus sont interrogeables via Cheerio et retournent au moins un élément

#### Scenario: Page listing vide
- **WHEN** la page listing ne contient aucun article
- **THEN** les tests niveau-article sont ignorés (`test.skip`) et un message est émis pour signaler le cas à la marge

#### Scenario: Blocage IP ou challenge Cloudflare sur une source HTML
- **WHEN** le corps de la réponse contient des marqueurs Cloudflare
- **THEN** le test échoue avec un message identifiant le type de blocage et l'URL de la source

---

### Requirement: Isolation des tests de contrat
Le système SHALL fournir un fichier `jest.contract.config.js` avec `testTimeout: 15000` et un pattern de matching `*.contract.test.ts`. Ces tests SHALL être exclus de la CI. Ils SHALL être exécutés dans `make quality` en local via le script `npm run test:contract`.

#### Scenario: Tests de contrat absents de la CI
- **WHEN** le pipeline CI exécute `npm run test:unit`
- **THEN** aucun fichier `*.contract.test.ts` n'est exécuté

#### Scenario: Tests de contrat dans make quality
- **WHEN** `make quality` est exécuté en local
- **THEN** `npm run test:contract` est exécuté après les tests unitaires, avant le build
