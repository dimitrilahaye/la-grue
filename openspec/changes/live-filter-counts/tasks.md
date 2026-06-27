## Tasks

### DB

- [ ] `src/db/queries/events.ts` — ajouter `{ city? }` à `getCategoryCounts()` et la clause `AND lower(city) = lower(${filters.city})` quand `city` est fourni

### API

- [ ] `src/api/routes/events.ts` — lire `req.query.city` dans la route `GET /api/categories/counts` et le passer à `getCategoryCounts({ city })`

### Frontend JS

- [ ] `frontend/app.js` — mettre à jour `fetchCategoryCounts({ city? })` pour construire le query param `?city=` si fourni
- [ ] `frontend/app.js` — mettre à jour `updateCategorySelect()` pour appeler `fetchCategoryCounts({ city: state.currentCity })`
- [ ] `frontend/app.js` — recâbler le listener `category-select change` : mettre à jour `state.currentCategory`, appeler `updateCitySelect(state.currentCategory)`, `loadEvents()`, `refreshDatePicker()`
- [ ] `frontend/app.js` — ajouter le listener `city-select change` : mettre à jour `state.currentCity`, appeler `updateCategorySelect()`, `loadEvents()`, `refreshDatePicker()`
- [ ] `frontend/app.js` — supprimer le listener `submit` sur `search-form`

### Frontend HTML

- [ ] `frontend/index.html` — supprimer le bouton "Chercher"
