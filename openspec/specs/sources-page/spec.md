## Purpose

Page dédiée `/sources.html` listant les sources de données actives et à venir, accessible depuis un bouton ⓘ dans le header de la PWA.

---

## Requirements

### Requirement: Bouton d'information dans le header
Le header de la PWA SHALL afficher un bouton ⓘ (jaune, `color: var(--color-accent)`) ancré à droite via `margin-left: auto`. Ce bouton SHALL être un lien `<a href="/sources.html">` avec `aria-label="Sources de données"`.

#### Scenario: Navigation vers la page sources
- **WHEN** l'utilisateur clique sur le bouton ⓘ
- **THEN** il est redirigé vers `/sources.html`

---

### Requirement: Page des sources de données
Le système SHALL exposer `/sources.html` listant les sources actives et les sources prévues. Chaque source SHALL afficher : nom, description tirée du site source, lien externe vers la source, et un badge de type (API publique / Site web / etc.). Les sources prévues SHALL être visuellement distinctes (opacité réduite, badge en pointillés). La page SHALL comporter un CTA "← Retour aux sorties" pointant vers `/`.

#### Scenario: Sources actives affichées
- **WHEN** l'utilisateur ouvre `/sources.html`
- **THEN** les 5 sources actives (Nantes Métropole API, WIK Nantes, Grabuge Mag, Big City Nantes, Pull Rouge) sont listées avec leur description et lien

#### Scenario: Retour à l'accueil
- **WHEN** l'utilisateur clique "← Retour aux sorties"
- **THEN** il est redirigé vers la page principale `/`

---

### Requirement: Section sources v3

La page Sources SHALL afficher une section "Bientôt — v3" listant Dice.fm et Shotgun.live comme sources prévues pour une version ultérieure nécessitant un rendu headless.

#### Scenario: Sources v3 visibles

- **WHEN** l'utilisateur consulte la page Sources
- **THEN** Dice.fm et Shotgun.live apparaissent dans la section "Bientôt — v3"
