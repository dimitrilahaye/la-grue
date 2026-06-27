## MODIFIED Requirements

### Requirement: Affichage des sources actives

La page Sources SHALL afficher les 5 sources actives : Nantes Métropole, Pays de la Loire, WIK Nantes, Grabuge Mag et Big City Nantes.

#### Scenario: Sources actives visibles

- **WHEN** l'utilisateur consulte la page Sources
- **THEN** Grabuge Mag et Big City Nantes apparaissent dans la liste des sources actives (sans badge "Bientôt")

## ADDED Requirements

### Requirement: Section sources v3

La page Sources SHALL afficher une section "Bientôt — v3" listant Dice.fm et Shotgun.live comme sources prévues pour une version ultérieure nécessitant un rendu headless.

#### Scenario: Sources v3 visibles

- **WHEN** l'utilisateur consulte la page Sources
- **THEN** Dice.fm et Shotgun.live apparaissent dans la section "Bientôt — v3"
