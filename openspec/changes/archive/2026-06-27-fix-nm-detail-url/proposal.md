## Why

Le scraper NM génère le `detailUrl` en slugifiant le titre de l'événement : `conseil-municipal-à-la-montagne` → `conseil-municipal-a-la-montagne`. Mais l'URL réelle sur metropole.nantes.fr inclut un identifiant numérique que le CMS génère de son côté, indépendamment du titre : `conseil-municipal-9480276`. Le slug seul ne suffit pas.

L'API NM fournit déjà un champ `lien_agenda` qui contient l'URL directe et fiable vers l'événement (`https://metropole.nantes.fr/infonantes/agenda/{id_manif}`). Ce champ était présent dans l'interface TypeScript mais ignoré — la spec `event-ingestion` le qualifiait même de "déprécié", ce qui était une erreur de décision. Les données réelles confirment que `lien_agenda` est toujours renseigné et pointe vers la bonne page.

## What Changes

- `detailUrl` utilise `r.lien_agenda` en priorité, avec le slug en fallback défensif si le champ est absent
- La spec `event-ingestion` est corrigée : `lien_agenda` n'est plus qualifié de déprécié

## Capabilities

### New Capabilities

_(aucune)_

### Modified Capabilities

- `event-ingestion` : le `detailUrl` NM est désormais lu depuis `lien_agenda` au lieu d'être dérivé par slugification

## Impact

- `src/job/scrapers/nantesMetropole.ts` : ligne `detailUrl` — utiliser `r.lien_agenda ?? ${AGENDA_BASE}/${toNantesSlug(r.nom)}`
