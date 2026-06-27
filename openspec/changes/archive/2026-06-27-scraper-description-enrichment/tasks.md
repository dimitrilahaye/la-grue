## 1. WIK — enrichissement description

- [x] 1.1 Ajouter `fetchMetaDescription(url: string): Promise<string | null>` dans `wik.ts` — GET de l'URL, regex `/<meta name="description" content="([^"]+)"/i`, retourne null en cas d'erreur
- [x] 1.2 Ajouter `enrichDescriptions(events: NormalizedEvent[]): Promise<void>` dans `wik.ts` — traite les events par batches de 5 via `Promise.allSettled`, met à jour `event.description` in-place
- [x] 1.3 Appeler `enrichDescriptions(allEvents)` à la fin de `scrapeWik()`, avant le `return`
- [x] 1.4 Mettre à jour `wik.test.ts` : mocker le GET de la page détail et vérifier que `description` est correctement extrait

## 2. BigCity — enrichissement description

- [x] 2.1 Ajouter `fetchMetaDescription(url: string): Promise<string | null>` dans `bigCity.ts` — même implémentation que WIK
- [x] 2.2 Ajouter `enrichDescriptions(events: NormalizedEvent[]): Promise<void>` dans `bigCity.ts` — même logique de batch
- [x] 2.3 Appeler `enrichDescriptions(events)` à la fin de `scrapeBigCity()`, avant le `return`
- [x] 2.4 Mettre à jour `bigCity.test.ts` : mocker le GET du permalink et vérifier que `description` est extrait
