## 1. Fix Grabuge — strip HTML des descriptions

- [x] 1.1 Dans `src/job/scrapers/grabuge.ts`, ajouter une fonction `stripHtml(html: string): string` utilisant cheerio pour extraire le texte brut
- [x] 1.2 Appliquer `stripHtml` sur `e.description` avant de l'assigner à `description` dans `NormalizedEvent`
- [x] 1.3 Mettre à jour `src/job/scrapers/__tests__/grabuge.test.ts` : ajouter un test vérifiant que le HTML est strippé dans la description

## 2. Fix NM — detailUrl depuis id_manif

- [x] 2.1 Dans `src/job/scrapers/nantesMetropole.ts`, remplacer `r.lien_agenda ?? \`${AGENDA_BASE}/${toNantesSlug(r.nom)}\`` par `\`${AGENDA_BASE}/${toNantesSlug(r.nom)}\`` (suppression de `lien_agenda`)
- [x] 2.2 Mettre à jour `src/job/scrapers/__tests__/nantesMetropole.test.ts` : corriger l'assertion `detailUrl` pour vérifier le format `AGENDA_BASE/{slug-du-titre}`
