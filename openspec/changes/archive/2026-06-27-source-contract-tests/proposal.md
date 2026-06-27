## Why

Le projet scrappe trois sources externes (deux APIs et un site HTML) dont le contrat peut changer sans préavis : renommage de champs, restructuration du DOM, changement de format de date, blocage IP. Aujourd'hui on ne le découvre qu'au runtime, lors d'un job nocturne qui produit silencieusement zéro événement. Ces tests de contrat vérifient, en local avant chaque `make quality`, que les sources sont toujours scrapables et que leurs données ont toujours le format attendu.

## What Changes

- Ajout de **Zod** comme dépendance pour valider les schémas de réponse des APIs
- Ajout de **tests de contrat** pour les trois sources actuelles (Nantes Métropole API, Pays de la Loire API, WIK Nantes HTML)
- Ajout de `jest.contract.config.js` pour isoler ces tests (réseau, lents) de la suite unitaire
- Ajout d'un script npm `test:contract` et intégration dans `make quality`
- Pattern Zod réutilisable pour toute future source API

## Capabilities

### New Capabilities

- `source-contract-tests` : tests de contrat live contre les sources de scraping — validation Zod des réponses API, vérification des sélecteurs CSS, détection de blocage Cloudflare/ban IP

### Modified Capabilities

- `local-dev-setup` : ajout de `test:contract` dans les scripts npm et dans `make quality`

## Impact

- Nouvelle dépendance : `zod`
- Nouveau fichier : `jest.contract.config.js`
- Nouveaux tests : `src/job/scrapers/__tests__/contract/*.contract.test.ts`
- Modification : `package.json` (script `test:contract`), `Makefile` (`make quality`)
- Ces tests ne tournent pas en CI — uniquement en local via `make quality`
