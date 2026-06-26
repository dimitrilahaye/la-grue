## Context

Trois sources de scraping actives : deux APIs JSON (OpenDataSoft / OpenAgenda) et un site HTML rendu côté serveur (WIK Nantes). Aucun mécanisme ne vérifie automatiquement que ces sources sont encore scrapables : changement de schéma, sélecteurs CSS renommés, blocage Cloudflare ou ban IP. La rupture n'est détectée qu'en production, après un job nocturne qui produit silencieusement zéro événement.

Le projet utilise déjà Cheerio pour le scraping WIK. Il n'y a pas de dépendance de validation de schéma.

## Goals / Non-Goals

**Goals:**
- Détecter les ruptures de contrat API (champs renommés, types changés, nesting modifié)
- Détecter le drift des sélecteurs CSS sur les sources HTML
- Détecter les blocages bot (Cloudflare challenge, ban IP) avant que le job ne tourne en production
- Fournir un pattern réutilisable pour les futures sources API

**Non-Goals:**
- Ces tests ne tournent pas en CI (réseau non garanti, latence variable)
- Ils ne testent pas la logique métier des scrapers (c'est le rôle des tests unitaires existants)
- Ils n'écrivent pas en base de données et ne déclenchent pas le job complet
- Ils ne couvrent pas les sources "à venir" (Grabuge, Pull Rouge, Big City Nantes)

## Decisions

**Zod pour la validation des APIs** — plutôt que des validateurs manuels ou JSON Schema. Zod embarque ses propres types TypeScript, les schémas sont composables, et la bibliothèque est déjà connue dans l'écosystème TypeScript. L'alternative native (`typeof x === 'string'`) est verbeuse et n'infère pas les types. L'alternative JSON Schema nécessiterait un runtime séparé (`ajv`).

**Cheerio pour les tests DOM** — le scraper WIK utilise déjà Cheerio ; le même outil teste le même contrat. Playwright ou Puppeteer seraient inappropriés ici : WIK est rendu côté serveur, pas besoin de JS. La valeur de ce test est de vérifier que les sélecteurs CSS existent encore, pas que la page s'affiche dans un browser.

**`jest.contract.config.js` isolé** — configuration séparée avec `testTimeout: 15000` et pattern `*.contract.test.ts`. Ces tests sont lents (réseau) et flaky par nature (indisponibilité temporaire, rate limit). Les inclure dans la suite unitaire polluerait la CI et ralentirait `npm test`. Ils s'exécutent via `npm run test:contract` dans `make quality` en local uniquement.

**`z.array().min(0)` + `console.warn`** — plutôt que `.min(1)`. Les APIs peuvent légitimement retourner zéro résultat pour une fenêtre de 14 jours (vacances, maintenance). Forcer `.min(1)` provoquerait des faux-négatifs. Le `console.warn` signale le cas sans faire échouer le test.

**Détection Cloudflare avant les assertions** — inspecter le corps HTTP brut pour `"Just a moment"`, `"cf-browser-verification"`, `"Enable JavaScript and cookies to continue"` avant de tenter de parser le JSON ou le DOM. Cela produit un message d'erreur clair plutôt qu'un échec de parsing cryptique.

**Skip conditionnel sur WIK** — si la page listing ne contient aucun article, les tests niveau-article sont marqués `test.skip` avec un message. C'est un cas à la marge (WIK hors-saison) et non une rupture de contrat.

## Risks / Trade-offs

Flakiness réseau → Les tests peuvent échouer pour des raisons non liées au contrat (timeout, DNS, maintenance). Mitigation : `testTimeout: 15000` généreux ; ces tests sont locaux, pas en CI ; le développeur relaie le diagnostic.

Sources temporairement indisponibles → Un ban IP ou une maintenance peut faire échouer le test sans rupture permanente. Mitigation : la détection Cloudflare fournit un message explicite ; pour les autres cas, le stack trace HTTP est visible.

Couplage au réseau en local → `make quality` devient dépendant du réseau. Mitigation : c'est intentionnel et documenté ; la CI reste propre.
