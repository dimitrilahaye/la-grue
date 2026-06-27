## MODIFIED Requirements

### Requirement: Formulaire de recherche comme filtre du jour
La PWA SHALL afficher un formulaire de recherche permettant d'affiner l'affichage dans la vue du jour sélectionné. Le formulaire contient : sélecteur de catégorie (toutes les catégories + option "Toutes (N)"), dropdown ville peuplé depuis `GET /api/cities`. Chaque option SHALL afficher son count entre parenthèses `Label (N)` et être désactivée (`disabled`) si N=0. Les counts de catégorie viennent de `GET /api/categories/counts?city=<ville courante>` — filtrés par la ville sélectionnée dans le state. La sélection d'une catégorie SHALL immédiatement mettre à jour l'état, les compteurs du dropdown ville via `GET /api/cities/counts?category=`, recharger la liste et rafraîchir le datepicker. La sélection d'une ville SHALL immédiatement mettre à jour l'état, les compteurs du dropdown catégorie via `GET /api/categories/counts?city=`, recharger la liste et rafraîchir le datepicker. Il n'y a pas de bouton "Chercher" — les selects déclenchent les mises à jour à la volée via leur event `change`.

#### Scenario: Compteurs catégories filtrés par ville
- **WHEN** l'utilisateur sélectionne "Carquefou" dans le dropdown ville
- **THEN** le dropdown catégorie met à jour ses compteurs pour ne refléter que les événements à Carquefou ; l'option "Toutes" affiche le total filtré pour cette ville

#### Scenario: Compteurs villes filtrées par catégorie
- **WHEN** l'utilisateur sélectionne "Concerts / musique"
- **THEN** le dropdown ville met à jour ses compteurs pour n'afficher que les counts pour cette catégorie ; les villes à 0 sont disabled

#### Scenario: Filtrage à la volée sans soumission
- **WHEN** l'utilisateur sélectionne une catégorie ou une ville
- **THEN** la liste des événements se recharge immédiatement sans action supplémentaire de l'utilisateur

#### Scenario: Réinitialisation des filtres
- **WHEN** l'utilisateur clique sur "Réinitialiser"
- **THEN** les filtres catégorie et ville sont effacés et la liste du jour courant est rechargée sans filtre
