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
- **THEN** les sources actives (Nantes Métropole API, Pays de la Loire API, Wik Nantes) sont listées avec leur description et lien

#### Scenario: Sources prévues affichées
- **WHEN** l'utilisateur ouvre `/sources.html`
- **THEN** une section "Bientôt" liste Grabuge Mag, Pull Rouge et Big City Nantes avec descriptions issues de leurs propres sites

#### Scenario: Retour à l'accueil
- **WHEN** l'utilisateur clique "← Retour aux sorties"
- **THEN** il est redirigé vers la page principale `/`
