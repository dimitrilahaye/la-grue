## 1. Dépendance

- [x] 1.1 Ajouter `temporal-polyfill` aux dépendances dans `package.json`

## 2. Scraper Nantes Métropole

- [x] 2.1 Remplacer `parseDateTime` dans `src/job/scrapers/nantesMetropole.ts` pour interpréter les heures en Europe/Paris via `Temporal.PlainDateTime.toZonedDateTime('Europe/Paris')`

## 3. Tests

- [x] 3.1 Mettre à jour le test unitaire de `parseDateTime` pour vérifier la conversion UTC+2 → UTC (scénario été) et UTC+1 → UTC (scénario hiver)
- [x] 3.2 Vérifier que le test contrat `nantesMetropole.contract.test.ts` passe toujours
