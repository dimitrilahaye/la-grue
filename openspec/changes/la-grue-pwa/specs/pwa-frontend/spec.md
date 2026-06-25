## ADDED Requirements

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

### Requirement: Formulaire de recherche comme filtre du jour
La PWA SHALL afficher un formulaire de recherche permettant d'affiner l'affichage dans la vue du jour sélectionné. Le formulaire contient : sélecteur de catégorie (toutes les catégories La Grue + option "Toutes"), champ texte ville (avec placeholder "Nantes"). La soumission SHALL déclencher un appel `GET /api/events?date=<jour courant>&category=...&city=...`.

#### Scenario: Filtrage par catégorie dans le jour affiché
- **WHEN** l'utilisateur sélectionne "Concerts / musique" et valide
- **THEN** la liste du jour courant affiche uniquement les concerts de ce jour

#### Scenario: Réinitialisation des filtres
- **WHEN** l'utilisateur clique sur "Réinitialiser"
- **THEN** les filtres catégorie et ville sont effacés et la liste du jour courant est rechargée sans filtre

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
La PWA SHALL afficher les événements sous forme de cartes dans une liste scrollable. Chaque carte SHALL afficher : titre, date et heure de début, lieu (ville + nom du lieu), badge de catégorie, indicateur "gratuit" si applicable, image (si disponible). Les catégories SHALL être affichées avec leurs labels publics : "Bars / soirées", "Concerts / musique", "Expositions / arts", "Spectacles / théâtre", "Festivals", "Ginguettes / guinguettes", "Sexpo".

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
- **THEN** le lien "Voir la source ↗" est affiché si `detail_url` est non null

---

### Requirement: iFrame opt-in avec fallback
La fiche détail SHALL proposer un bouton "Aperçu de la page source" qui charge l'URL `detail_url` dans un iFrame. Si l'iFrame ne déclenche pas l'événement `load` dans les 4 secondes, ou si l'accès à `contentDocument` lève une exception, un message de fallback SHALL s'afficher avec un lien "Ouvrir dans un nouvel onglet ↗".

#### Scenario: iFrame chargé avec succès
- **WHEN** l'utilisateur clique "Aperçu" et l'iFrame se charge dans les 4s
- **THEN** le contenu de la page source est visible dans l'iFrame, l'overlay de chargement disparaît

#### Scenario: iFrame bloqué par X-Frame-Options
- **WHEN** le site source bloque l'intégration iFrame et `onload` ne se déclenche pas dans les 4s
- **THEN** le message "Ce site ne peut pas être affiché ici. [Ouvrir dans un nouvel onglet ↗]" s'affiche

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
