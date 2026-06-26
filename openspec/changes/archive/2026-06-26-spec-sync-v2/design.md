## Context

Cette sync couvre 36 commits post-archive. Toutes les décisions d'implémentation sont déjà en production — ce document les capture a posteriori pour aligner specs et réalité.

## Goals / Non-Goals

**Goals:**
- Documenter les décisions techniques prises lors de l'implémentation
- Identifier les tests manquants à écrire

**Non-Goals:**
- Remettre en cause les choix d'implémentation existants
- Introduire de nouvelles fonctionnalités

## Decisions

### Flatpickr via npm, servi depuis node_modules

CDN rejeté par la CSP (`style-src 'self'`). Choix : `npm install flatpickr` + route Express `app.use('/vendor/flatpickr', express.static(...node_modules/flatpickr/dist))`. Alternative vendoring rejetée (fichiers hors contrôle de version de dépendances). Locale FR chargée via `/vendor/flatpickr/l10n/fr.js`.

### Dates flatpickr scopées aux filtres via `GET /api/dates?category=&city=`

`enable: [dates]` de flatpickr désactive les dates absentes. Pour que le calendrier reflète les filtres actifs, `fetchEventDates` est rappelé à chaque changement de filtre (submit/reset) et flatpickr est mis à jour via `fpInstance.set('enable', dates)`. Les jours avec événements reçoivent la classe `.has-events` via `onDayCreate` (pas via `:not(.disabled)` qui était trop large).

### Compteurs dropdowns : asymétrie catégorie/ville intentionnelle

Les catégories affichent le total toutes villes (valeur stable, référence absolue). Les villes affichent le total pour la catégorie sélectionnée (valeur contextuelle). La sélection d'une catégorie déclenche un refresh live des compteurs villes. L'inverse (ville → catégories) ne se fait pas : les totaux catégories sont fixes.

### Client DB lazy via Proxy

`let instance: DrizzleDb | null = null` initialisé seulement au premier accès d'une propriété. Permet d'importer `db` dans les tests unitaires sans `DATABASE_URL`. Alternative `jest.mock` rejetée car trop fragile et découplée de la réalité.

### Rate limiting : `skip: () => isDev` (express-rate-limit v7)

`max: 0` dans express-rate-limit v7 bloque toutes les requêtes (comportement inversé). `skip: () => process.env.NODE_ENV !== 'production'` est l'API correcte.

### Catégorie `autres` supprimée : null au lieu de fallback

Le normaliseur retourne `Category | null`. Les scrapers font `if (!category) continue`. Une migration SQL supprime les rows existants. Pas de colonne nullable — `category` reste `NOT NULL` en base, les événements non catégorisables sont simplement ignorés.

### URL Nantes Métropole générée depuis le slug du titre

`lien_agenda` renvoie `https://metropole.nantes.fr/infonantes/agenda/<id>` (URL dépréciée, redirige vers l'agenda générique). Le bon format est `https://metropole.nantes.fr/que-faire-a-nantes/agenda/<slug>`. Slug généré par : lowercase → NFD → suppression diacritiques → suppression non-alphanum → trim → remplacement espaces/tirets par `-`. Validé sur 5 patterns réels.

### Web Share API : AbortError silencieux

`navigator.share()` rejette avec `AbortError` si l'utilisateur ferme la modale de partage sans choisir. Ce cas est capturé et ignoré silencieusement ; toute autre erreur est loggée en console.

### Sources page : HTML statique servi par Express static

`/sources.html` est un fichier dans `frontend/` servi par le middleware `express.static`. Pas de route dédiée. Le SPA fallback (`app.use('/', staticRouter)`) s'applique uniquement aux routes non trouvées.

## Risks / Trade-offs

- **Slug Nantes Métropole** : si deux événements ont le même titre, metropole.nantes.fr peut ajouter un suffixe (`-0`, `-1`) qui ne sera pas dans le slug généré → URL 404. Acceptable : meilleur qu'une redirection vers l'agenda générique.
- **Flatpickr `onDayCreate`** : appelé à chaque redraw du calendrier. `state.availableDates` doit être à jour avant `fpInstance.set('enable', ...)` pour que les classes `.has-events` soient correctes.
- **Compteurs dropdowns** : 3 appels API au chargement initial (`/api/categories/counts`, `/api/cities/counts`, `/api/dates`). Acceptable — tous sont légers (GROUP BY) et en parallèle.
