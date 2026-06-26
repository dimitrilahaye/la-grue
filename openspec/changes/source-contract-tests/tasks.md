## 1. Dépendances et configuration

- [ ] 1.1 Installer `zod` comme dépendance (`npm install zod`)
- [ ] 1.2 Créer `jest.contract.config.js` avec `testTimeout: 15000` et pattern `*.contract.test.ts`
- [ ] 1.3 Ajouter le script `test:contract` dans `package.json`
- [ ] 1.4 Ajouter `npm run test:contract` dans `make quality` (après `test:unit`, avant `build`)
- [ ] 1.5 Mettre à jour le README : ajouter `test:contract` dans la table des scripts npm

## 2. Tests de contrat — Nantes Métropole API

- [ ] 2.1 Créer `src/job/scrapers/__tests__/contract/nantesMetropole.contract.test.ts`
- [ ] 2.2 Implémenter le schéma Zod pour un enregistrement NM (champs utilisés dans le scraper : `nom_complet`, `dates_ouverture`, `tags`, `description`, `lien_agenda_web`, `image`, `types_libelles`, `themes_libelles`, `latitude`, `longitude`)
- [ ] 2.3 Implémenter la détection Cloudflare (marqueurs dans le corps de la réponse brute)
- [ ] 2.4 Implémenter l'assertion principale : fetch live, validation Zod, `console.warn` si tableau vide

## 3. Tests de contrat — Pays de la Loire API

- [ ] 3.1 Créer `src/job/scrapers/__tests__/contract/paysLoire.contract.test.ts`
- [ ] 3.2 Implémenter le schéma Zod pour un enregistrement PDL (champs : `keywords_fr`, `longdescription_fr`, `daterange_start_fr`, `firstdate_begin`, `location.city`, `location.latitude`, `location.longitude`, `image`, `canonicalurl`)
- [ ] 3.3 Réutiliser la détection Cloudflare
- [ ] 3.4 Implémenter l'assertion principale : fetch live, validation Zod, `console.warn` si tableau vide

## 4. Tests de contrat — WIK Nantes HTML

- [ ] 4.1 Créer `src/job/scrapers/__tests__/contract/wik.contract.test.ts`
- [ ] 4.2 Implémenter le fetch live de la page listing WIK
- [ ] 4.3 Implémenter la détection Cloudflare sur la réponse HTML brute
- [ ] 4.4 Implémenter l'assertion des sélecteurs CSS de la page listing (`.tribe-events-calendar-list__event`, ou sélecteurs équivalents utilisés dans le scraper)
- [ ] 4.5 Implémenter le skip conditionnel si la page listing est vide (`test.skip` + log)
- [ ] 4.6 Implémenter les assertions niveau-article sur le premier article trouvé (titre, lien, date, catégorie)
