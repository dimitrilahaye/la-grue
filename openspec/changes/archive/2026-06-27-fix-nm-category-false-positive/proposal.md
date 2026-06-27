## Why

Le normalizer NM utilise `String.prototype.includes()` pour faire correspondre des mots-clés aux catégories. Cette correspondance par sous-chaîne produit des faux positifs : le thème `"Citoyenneté - Concertation"` contient `"concert"` en préfixe → `mapNantesMetropoleCategory` retourne `concerts-musique` pour des événements civiques comme "Conseil municipal".

Problème secondaire : l'interface TypeScript de `NantesRecord` type `types_libelles` et `themes_libelles` comme `string`, mais l'API renvoie des `string[]`. La coercition implicite de tableau vers chaîne (via template literal) fonctionne par accident mais masque le vrai type — et empêche de normaliser correctement chaque libellé séparément.

## What Changes

- Le matching dans `mapNantesMetropoleCategory` passe de `includes(key)` à une correspondance mot entier : un mot-clé ne matche que s'il apparaît en tant que token isolé dans la chaîne normalisée
- L'interface `NantesRecord` est corrigée : `types_libelles` et `themes_libelles` deviennent `string | string[]`
- Le scraper normalise explicitement ces champs en `string` avant de les passer au normalizer (join array items avant la normalisation)

## Capabilities

### New Capabilities

_(aucune)_

### Modified Capabilities

- `event-ingestion` : normalisation des catégories NM par correspondance mot entier au lieu de sous-chaîne

## Impact

- `src/job/normalizer.ts` : `mapNantesMetropoleCategory` — remplacer `normalized.includes(normalizeString(key))` par un test sur tokens
- `src/job/scrapers/nantesMetropole.ts` : `NantesRecord` interface — `types_libelles?: string | string[]`, `themes_libelles?: string | string[]` ; + normalisation avant appel normalizer
