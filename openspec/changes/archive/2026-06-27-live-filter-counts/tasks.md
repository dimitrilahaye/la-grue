## Tasks

### DB

- [x] `src/db/queries/events.ts` — ajouter `{ city? }` à `getCategoryCounts()` et la clause `AND lower(city) = lower(${filters.city})` quand `city` est fourni

### API

- [x] `src/api/routes/events.ts` — lire `req.query.city` dans la route `GET /api/categories/counts` et le passer à `getCategoryCounts({ city })`

### Frontend JS

- [x] `frontend/app.js` — mettre à jour `fetchCategoryCounts({ city? })` pour construire le query param `?city=` si fourni
- [x] `frontend/app.js` — mettre à jour `updateCategorySelect()` pour appeler `fetchCategoryCounts({ city: state.currentCity })`
- [x] `frontend/app.js` — recâbler le listener `category-select change` : mettre à jour `state.currentCategory`, appeler `updateCitySelect(state.currentCategory)`, `loadEvents()`, `refreshDatePicker()`
- [x] `frontend/app.js` — ajouter le listener `city-select change` : mettre à jour `state.currentCity`, appeler `updateCategorySelect()`, `loadEvents()`, `refreshDatePicker()`
- [x] `frontend/app.js` — supprimer le listener `submit` sur `search-form`

### Frontend HTML

- [x] `frontend/index.html` — supprimer le bouton "Chercher"
