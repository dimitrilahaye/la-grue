## MODIFIED Requirements

### Requirement: Normalisation des catégories sans fallback
Les fonctions de mapping de catégorie (`mapNantesMetropoleCategory`, `mapPaysLoireCategory`, `mapWikCategory`) SHALL retourner `Category | null` au lieu de `'autres'` quand aucune catégorie ne correspond. Les scrapers SHALL ignorer (`continue` / `return null`) les événements dont la catégorie est `null`. Aucun événement sans catégorie reconnue n'est persisté.

#### Scenario: Événement sans catégorie reconnue — Nantes Métropole
- **WHEN** un événement Nantes Métropole a des `types_libelles` et `themes_libelles` ne correspondant à aucun mapping
- **THEN** l'événement est ignoré et non inséré en base

#### Scenario: Événement sans catégorie reconnue — Pays de la Loire
- **WHEN** un événement Pays de la Loire a des `keywords_fr` vides ou sans keyword mappé
- **THEN** l'événement est ignoré et non inséré en base

#### Scenario: Événement sans catégorie reconnue — WIK
- **WHEN** un événement WIK a un `categoryPath` ne correspondant à aucun mapping
- **THEN** `parseArticle` retourne `null` et l'événement est exclu du résultat du scraper

---

### Requirement: URL de détail Nantes Métropole générée depuis le titre
Le scraper Nantes Métropole SHALL générer le `detailUrl` en construisant le slug depuis le champ `nom` de l'événement : `https://metropole.nantes.fr/que-faire-a-nantes/agenda/<slug>`. Le slug est obtenu par : lowercase → NFD decompose → suppression des diacritiques → suppression des caractères non alphanumérique (hors espace et tiret) → trim → remplacement des séquences d'espaces/tirets par un tiret unique. Le champ `lien_agenda` (URL `infonantes` dépréciée) et `url_site` ne sont plus utilisés pour le `detailUrl`.

#### Scenario: Génération de slug standard
- **WHEN** l'événement a le titre "Festival CinéPride 2026"
- **THEN** `detailUrl` est `https://metropole.nantes.fr/que-faire-a-nantes/agenda/festival-cinepride-2026`

#### Scenario: Génération de slug avec apostrophe
- **WHEN** l'événement a le titre "Stage d'été aviron 2026"
- **THEN** `detailUrl` est `https://metropole.nantes.fr/que-faire-a-nantes/agenda/stage-dete-aviron-2026`

#### Scenario: Génération de slug avec ponctuation
- **WHEN** l'événement a le titre "Concert : Fauré and Saint-Saëns à la cathédrale de Nantes"
- **THEN** `detailUrl` est `https://metropole.nantes.fr/que-faire-a-nantes/agenda/concert-faure-and-saint-saens-a-la-cathedrale-de-nantes`
