## Purpose

PWA (Progressive Web App) sans framework frontend servant d'interface principale pour naviguer par jour dans les événements nantais. Navigation temporelle, filtres, fiche détail avec iFrame opt-in.

---

## Requirements

### Requirement: Navigation par jour
La PWA SHALL afficher en en-tête la date du jour sélectionné (ex: "Aujourd'hui · mercredi 25 juin") avec deux boutons fléchés ← et →. La flèche ← navigue vers le jour précédent, la flèche → vers le jour suivant. Le jour affiché par défaut est aujourd'hui. La navigation SHALL déclencher un appel à `GET /api/events?date=YYYY-MM-DD` et remplacer la liste courante.

#### Scenario: Chargement initial
- **WHEN** la PWA est ouverte
- **THEN** la liste des événements d'aujourd'hui est affichée, les deux flèches de navigation sont visibles

#### Scenario: Navigation vers demain
- **WHEN** l'utilisateur clique sur →
- **THEN** la date sélectionnée avance d'un jour et la liste se recharge avec les événements de ce jour

#### Scenario: Navigation vers hier
- **WHEN** l'utilisateur clique sur ←
- **THEN** la date sélectionnée recule d'un jour et la liste se recharge

---

### Requirement: Outils de navigation avancée
La day-nav SHALL exposer un bouton "Aujourd'hui" (retour direct à la date du jour, mis en évidence visuellement quand on est sur le jour courant) et un date picker **flatpickr** (installé via npm, servi depuis `/vendor/flatpickr/`, `disableMobile: true`) synchronisé bidirectionnellement avec les flèches ← →. À l'initialisation, le picker interroge `GET /api/dates?category=&city=` pour ne rendre actives (`enable`) que les dates ayant des événements ; les dates sans événements sont grisées. Les dates actives reçoivent la classe CSS `.has-events` via le callback `onDayCreate` (en consultant `state.availableDates`) et s'affichent en jaune gras. Le picker est rechargé (nouvelles dates `enable`) à chaque changement de filtre.

#### Scenario: Bouton Aujourd'hui
- **WHEN** l'utilisateur clique "Aujourd'hui" depuis un autre jour
- **THEN** la date courante repasse à aujourd'hui, la liste se recharge, le bouton prend la classe `is-today`

#### Scenario: Dates scopées aux filtres
- **WHEN** l'utilisateur sélectionne la ville "Bouaye" et soumet le formulaire
- **THEN** le calendrier flatpickr ne montre activées que les dates où des événements existent à Bouaye

#### Scenario: Classe has-events
- **WHEN** flatpickr affiche le calendrier
- **THEN** les jours présents dans `state.availableDates` ont la classe `.has-events` et s'affichent en jaune gras ; les autres sont grisés

---

### Requirement: Formulaire de recherche comme filtre du jour
La PWA SHALL afficher un formulaire de recherche permettant d'affiner l'affichage dans la vue du jour sélectionné. Le formulaire contient : sélecteur de catégorie (toutes les catégories + option "Toutes (N)"), dropdown ville peuplé depuis `GET /api/cities`. Chaque option SHALL afficher son count entre parenthèses `Label (N)` et être désactivée (`disabled`) si N=0. Les counts de catégorie viennent de `GET /api/categories/counts` (total toutes villes, rechargé au chargement uniquement). La sélection d'une catégorie SHALL mettre à jour en live les compteurs du dropdown ville via `GET /api/cities/counts?category=`. La soumission SHALL déclencher un appel `GET /api/events?date=<jour courant>&category=...&city=...`.

#### Scenario: Compteurs catégories
- **WHEN** la page charge
- **THEN** chaque option du dropdown catégorie affiche `Label (N)` avec N = total événements à venir toutes villes ; les catégories à 0 sont disabled

#### Scenario: Compteurs villes filtrées par catégorie
- **WHEN** l'utilisateur sélectionne "Concerts / musique"
- **THEN** le dropdown ville met à jour ses compteurs pour n'afficher que les counts pour cette catégorie ; les villes à 0 sont disabled

#### Scenario: Filtrage par catégorie dans le jour affiché
- **WHEN** l'utilisateur sélectionne "Concerts / musique" et valide
- **THEN** la liste du jour courant affiche uniquement les concerts de ce jour

#### Scenario: Réinitialisation des filtres
- **WHEN** l'utilisateur clique sur "Réinitialiser"
- **THEN** les filtres catégorie et ville sont effacés et la liste du jour courant est rechargée sans filtre

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

### Requirement: Load more
La PWA SHALL afficher un bouton "Voir plus" en bas de la liste lorsque `total > offset + limit`. Un clic SHALL appeler `GET /api/events` avec `offset` incrémenté, et les nouveaux résultats SHALL être ajoutés à la fin de la liste existante (pas de remplacement). Le bouton SHALL disparaître quand tous les résultats sont chargés.

#### Scenario: Bouton visible si résultats supplémentaires
- **WHEN** la réponse API indique `total > data.length`
- **THEN** le bouton "Voir plus" est affiché sous la liste

#### Scenario: Chargement de la page suivante
- **WHEN** l'utilisateur clique sur "Voir plus"
- **THEN** les événements supplémentaires sont ajoutés à la liste courante et l'offset est mis à jour

#### Scenario: Tous les résultats chargés
- **WHEN** `total === offset + data.length`
- **THEN** le bouton "Voir plus" est masqué

---

### Requirement: Liste des événements
La PWA SHALL afficher les événements sous forme de cartes dans une liste scrollable. Chaque carte SHALL afficher : titre, date et heure de début, lieu (ville + nom du lieu), badge de catégorie (masqué pour la catégorie `autres`), indicateur "gratuit" si applicable, image (si disponible).

#### Scenario: Affichage d'une carte
- **WHEN** un événement est retourné par l'API
- **THEN** la carte affiche titre, date formatée en français (ex: "Lundi 14 juillet · 20h30"), lieu, badge catégorie coloré

#### Scenario: Événement sans image
- **WHEN** le champ `image_url` est null
- **THEN** un placeholder visuel cohérent avec le design est affiché

#### Scenario: Liste vide
- **WHEN** aucun événement ne correspond aux filtres
- **THEN** un message "Aucun événement trouvé pour ces critères." est affiché

#### Scenario: Erreur de chargement
- **WHEN** l'API retourne une erreur
- **THEN** un message "Impossible de charger les événements. Réessaie dans un moment." est affiché sans bloquer l'interface

---

### Requirement: Fiche détail d'un événement
La PWA SHALL afficher une fiche détail en panneau latéral ou modal lors du clic sur une carte. La fiche SHALL contenir : titre complet, date et horaires formatés, lieu complet (nom + adresse), description complète, image, prix/tarifs, badge catégorie, lien "Voir la source ↗" (ouvrant dans un nouvel onglet), bouton "Fermer".

#### Scenario: Ouverture de la fiche
- **WHEN** l'utilisateur clique sur une carte d'événement
- **THEN** la fiche détail s'ouvre avec les informations complètes de l'événement

#### Scenario: Fermeture de la fiche
- **WHEN** l'utilisateur clique sur le bouton "Fermer" ou appuie sur Échap
- **THEN** la fiche se referme et la liste reste visible

#### Scenario: Lien source toujours visible
- **WHEN** la fiche détail est ouverte
- **THEN** le bouton "Voir la source ↗" est toujours rendu : lien `<a>` actif si `detail_url` est non null, `<span aria-disabled="true">` grisé et non cliquable sinon

---

### Requirement: iFrame opt-in avec fallback
La fiche détail SHALL proposer un bouton "Aperçu de la page source" qui charge l'URL `detail_url` dans un iFrame. Le fallback SHALL s'afficher dans deux cas : (1) `onload` ne se déclenche pas dans les 4 secondes, ou (2) `onload` se déclenche mais `contentDocument.body` est vide (page bloquée par CSP `frame-ancestors` — le navigateur charge une page blanche same-origin). Si l'accès à `contentDocument` lève une `SecurityError` (cross-origin), la page s'est chargée avec succès. Le fallback affiche un lien "Ouvrir dans un nouvel onglet ↗".

#### Scenario: iFrame chargé avec succès
- **WHEN** l'utilisateur clique "Aperçu" et l'iFrame se charge dans les 4s avec du contenu cross-origin
- **THEN** l'accès à `contentDocument` lève une `SecurityError`, l'overlay disparaît, le contenu est visible

#### Scenario: iFrame bloqué par CSP frame-ancestors
- **WHEN** le site source bloque l'intégration via `Content-Security-Policy: frame-ancestors`, `onload` se déclenche mais la page est vide
- **THEN** `contentDocument.body.innerHTML` est vide, le fallback s'affiche immédiatement sans attendre le timeout

#### Scenario: iFrame bloqué — onload ne se déclenche pas
- **WHEN** le site source bloque l'intégration via `X-Frame-Options` et `onload` ne se déclenche pas
- **THEN** après 4 secondes, le fallback s'affiche avec le lien "Ouvrir dans un nouvel onglet ↗"

#### Scenario: Fermeture de l'iFrame
- **WHEN** l'utilisateur clique sur le bouton "Fermer l'aperçu"
- **THEN** l'iFrame est déchargé et la fiche détail interne reste visible

---

### Requirement: Style épuré UX-first
La PWA SHALL adopter un design minimaliste centré sur la lisibilité : fond clair ou sombre selon la préférence système (`prefers-color-scheme`), typographie sans-serif lisible, palette restreinte (jaune #F5C518 pour les accents, gris #4A4A4A pour le texte principal, fond blanc/quasi-blanc). Aucune animation superflue. Touch targets d'au moins 44×44px sur mobile. Pas de framework CSS, CSS custom properties pour le thème.

#### Scenario: Adaptation au thème système
- **WHEN** l'utilisateur a activé le mode sombre sur son appareil
- **THEN** la PWA bascule automatiquement sur le thème sombre via `prefers-color-scheme: dark`

#### Scenario: Accessibilité des cibles tactiles
- **WHEN** la PWA est utilisée sur mobile
- **THEN** tous les boutons et liens ont une surface cliquable d'au moins 44×44px

---

### Requirement: PWA installable
La PWA SHALL inclure un `manifest.json` et un service worker enregistré pour satisfaire les critères d'installabilité du navigateur. Le manifest SHALL définir : `name: "La Grue"`, `short_name: "La Grue"`, `theme_color: "#F5C518"`, `background_color: "#FFFFFF"`, `display: "standalone"`, `start_url: "/"`, icônes 192×192 et 512×512.

#### Scenario: Prompt d'installation affiché
- **WHEN** l'utilisateur visite la PWA depuis Chrome/Edge mobile pour la première fois
- **THEN** le navigateur affiche le prompt "Ajouter à l'écran d'accueil"

#### Scenario: Lancement depuis l'écran d'accueil
- **WHEN** l'application est lancée depuis l'icône sur l'écran d'accueil
- **THEN** elle s'ouvre en mode standalone sans barre de navigation du navigateur
