## Why

Les compteurs des selects catégorie et ville ne se mettent à jour qu'au submit du formulaire, et `GET /api/categories/counts` n'accepte aucun filtre — ce qui fait que sélectionner "Carquefou (2)" puis cliquer "Chercher" laisse "Toutes (195)" affiché au lieu de "Toutes (2)". Les filtres manquent de cohérence entre eux et nécessitent une action explicite de l'utilisateur pour prendre effet.

## What Changes

- Suppression du bouton "Chercher" et de son listener `submit` — les selects déclenchent tout à la volée via leur event `change`
- `GET /api/categories/counts` accepte désormais un filtre `?city=` (symétrie avec `?category=` sur `/cities/counts`)
- `getCategoryCounts()` côté DB accepte `{ city? }` comme `getCityCounts` accepte `{ category? }`
- `category-select change` → mise à jour immédiate de l'état, rechargement des événements, rafraîchissement du datepicker
- `city-select change` → mise à jour immédiate de l'état, mise à jour des compteurs catégorie filtrés par la nouvelle ville, rechargement des événements, rafraîchissement du datepicker
- Le bouton "Réinitialiser" reste et remet les deux selects à zéro, comme aujourd'hui

## Capabilities

### New Capabilities

_(aucune)_

### Modified Capabilities

- `pwa-frontend` : les selects catégorie et ville déclenchent les mises à jour à la volée (`change`) au lieu du `submit` ; suppression du bouton "Chercher"
- `event-search` : `GET /api/categories/counts` accepte un filtre optionnel `?city=`

## Impact

- `src/db/queries/events.ts` : `getCategoryCounts({ city? })`
- `src/api/routes/events.ts` : route `GET /api/categories/counts` lit `req.query.city`
- `frontend/app.js` : `fetchCategoryCounts({ city? })`, `updateCategorySelect({ city? })`, listeners `change` recâblés, listener `submit` supprimé
- `frontend/index.html` : suppression du bouton "Chercher"
