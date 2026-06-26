## Purpose

Partage natif d'un événement via la Web Share API du navigateur, depuis les event cards et le panneau de détail.

---

## Requirements

### Requirement: Bouton de partage natif sur les event cards
La PWA SHALL afficher un bouton de partage sur chaque event card si `navigator.share` est disponible dans le navigateur. Le bouton SHALL déclencher `navigator.share({ title, text, url })` avec le titre de l'événement, la date/heure et le lieu, et le `detailUrl` de l'événement (ou l'URL courante si absent). Un `AbortError` (utilisateur annule le partage) SHALL être ignoré silencieusement ; toute autre erreur SHALL être loggée en console.

#### Scenario: Partage depuis une card
- **WHEN** l'utilisateur clique le bouton de partage sur une event card
- **THEN** la modale de partage native du système s'ouvre avec le titre, la date/lieu et l'URL de l'événement

#### Scenario: AbortError ignoré
- **WHEN** l'utilisateur ferme la modale de partage sans choisir une destination
- **THEN** aucun message d'erreur n'est affiché et l'interface reste dans son état normal

#### Scenario: Web Share API indisponible
- **WHEN** `navigator.share` n'est pas défini (desktop sans support)
- **THEN** le bouton de partage n'est pas rendu dans le DOM

---

### Requirement: Bouton de partage dans le panneau de détail
Le panneau de détail SHALL afficher un bouton "Partager" dans la section `detail-actions` si `navigator.share` est disponible. Le comportement est identique au bouton sur les cards.

#### Scenario: Partage depuis le panneau de détail
- **WHEN** l'utilisateur clique "Partager" dans le panneau de détail
- **THEN** la modale de partage native s'ouvre avec les mêmes données que pour les cards
