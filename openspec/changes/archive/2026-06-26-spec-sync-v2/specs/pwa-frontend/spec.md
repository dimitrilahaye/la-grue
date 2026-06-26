## MODIFIED Requirements

### Requirement: Outils de navigation avancée
Le date picker SHALL utiliser **flatpickr** (bibliothèque installée via npm, servie depuis `/vendor/flatpickr/`) à la place du `<input type="date">` natif. `disableMobile: true` SHALL forcer flatpickr sur mobile. Les dates activées (`enable`) SHALL être rechargées depuis `GET /api/dates?category=&city=` à chaque changement de filtre (submit/reset du formulaire). Les jours ayant des événements SHALL recevoir la classe CSS `.has-events` via le callback `onDayCreate` (en vérifiant `state.availableDates`), et s'affichent en jaune gras.

#### Scenario: Dates scopées aux filtres
- **WHEN** l'utilisateur sélectionne la ville "Bouaye" et soumet le formulaire
- **THEN** le calendrier flatpickr ne montre activées que les dates où des événements existent à Bouaye

#### Scenario: Classe has-events
- **WHEN** flatpickr affiche le calendrier
- **THEN** les jours présents dans `state.availableDates` ont la classe `.has-events` et s'affichent en jaune gras ; les autres sont grisés

---

### Requirement: Formulaire de recherche comme filtre du jour
Le formulaire SHALL afficher entre parenthèses le nombre d'événements à venir pour chaque option de catégorie et de ville. Les options à 0 événement SHALL être désactivées (`disabled`). L'option "Toutes" / "Toutes les villes" SHALL afficher le total agrégé. La sélection d'une catégorie SHALL mettre à jour en live les compteurs du dropdown ville (filtré par cette catégorie) via `GET /api/cities/counts?category=`. Les catégories affichent leur total toutes villes (via `GET /api/categories/counts`), indépendamment de la ville sélectionnée.

#### Scenario: Compteurs catégories
- **WHEN** la page charge
- **THEN** chaque option du dropdown catégorie affiche `Label (N)` avec N = total événements à venir toutes villes ; les catégories à 0 sont disabled

#### Scenario: Compteurs villes filtrées par catégorie
- **WHEN** l'utilisateur sélectionne "Concerts / musique"
- **THEN** le dropdown ville met à jour ses compteurs pour n'afficher que les counts pour cette catégorie ; les villes à 0 sont disabled

#### Scenario: Compteur villes case-insensitive
- **WHEN** le dropdown ville est peuplé
- **THEN** "NANTES" et "Nantes" apparaissent comme une seule entrée "Nantes (N)" grâce à `initcap(lower(city))`

---

### Requirement: Compteur de résultats dans le formulaire
La PWA SHALL afficher un compteur de résultats (`<p id="results-count">`) à l'intérieur du formulaire de recherche, sous les boutons. Il affiche : nombre de résultats pour le jour sélectionné, suivi du total à venir sur les N prochains jours (via `GET /api/stats?category=&city=`). Le format est `"X résultat(s) [aujourd'hui / le <date>] · Y sur les Z prochains jours"`. Si total = 0, affiche `"Aucun résultat [aujourd'hui / le <date>]"`.

#### Scenario: Compteur avec résultats
- **WHEN** la liste charge avec 5 événements aujourd'hui et 42 sur les 14 prochains jours
- **THEN** le compteur affiche "5 résultats aujourd'hui · 42 sur les 14 prochains jours"

#### Scenario: Compteur sans résultat
- **WHEN** aucun événement ne correspond aux filtres pour la date sélectionnée
- **THEN** le compteur affiche "Aucun résultat aujourd'hui" (ou "le <date>")

---

### Requirement: Bouton "Voir la source" toujours visible
Le bouton "Voir la source" SHALL toujours être rendu dans le panneau de détail. S'il y a un `detailUrl`, c'est un lien `<a>` actif vers cette URL exacte. S'il n'y a pas de `detailUrl`, c'est un `<span>` avec `aria-disabled="true"` et `pointer-events: none`.

#### Scenario: Source disponible
- **WHEN** l'événement a un `detailUrl`
- **THEN** "Voir la source ↗" est un lien cliquable ouvrant l'URL de la page source exacte dans un nouvel onglet

#### Scenario: Source indisponible
- **WHEN** l'événement n'a pas de `detailUrl`
- **THEN** "Voir la source ↗" est affiché grisé et non cliquable
