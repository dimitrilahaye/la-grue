## Why

Deux bugs post-v2 affectent la qualité des données affichées : les descriptions Grabuge contiennent du HTML brut visible par l'utilisateur, et les `detail_url` Nantes Métropole pointent vers un chemin `/infonantes/agenda/{id}` que le site public ne reconnaît pas.

## What Changes

- Strip du HTML dans les descriptions Grabuge au moment du scraping, avant persistence en BDD
- Correction de la construction du `detailUrl` NM : utiliser `id_manif` avec le bon chemin (`/que-faire-a-nantes/agenda/{id_manif}`) plutôt que de dépendre du champ `lien_agenda` qui retourne un chemin cassé

## Capabilities

### New Capabilities

_(aucune)_

### Modified Capabilities

- `grabuge-ingestion` : la normalisation des descriptions change — le HTML est strippé avant persistence
- `event-ingestion` : la construction du `detailUrl` NM change — `id_manif` avec base correcte, `lien_agenda` supprimé comme source primaire

## Impact

- `src/job/scrapers/grabuge.ts` : ajout d'un strip HTML sur `e.description`
- `src/job/scrapers/nantesMetropole.ts` : `detailUrl` reconstruit depuis `id_manif` + `AGENDA_BASE`, suppression de la dépendance à `lien_agenda`
- `src/job/scrapers/__tests__/nantesMetropole.test.ts` : mise à jour des assertions `detailUrl`
- Les événements NM et Grabuge déjà en BDD seront corrigés au prochain run via UPSERT sur `description` et `detail_url`
