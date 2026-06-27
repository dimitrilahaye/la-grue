## MODIFIED Requirements

### Requirement: Normalisation vers le schéma unifié
Le système SHALL transformer les données de chaque source vers un objet `NormalizedEvent` commun avant persistence. La catégorie normalisée SHALL être l'une des valeurs : `bars-soirees`, `concerts-musique`, `expositions-arts`, `spectacles-theatre`, `festivals`, `ginguettes-guinguettes`, `sexpo`. Les fonctions de mapping (`mapNantesMetropoleCategory`, `mapPaysLoireCategory`, `mapWikCategory`) SHALL retourner `Category | null` — jamais `'autres'`. Les scrapers SHALL ignorer tout événement dont le mapping retourne `null` : aucun événement sans catégorie reconnue n'est persisté. La correspondance entre libellés bruts et catégories SHALL se faire par **correspondance de token entier** (word-token matching) : un mot-clé ne matche que s'il apparaît comme token isolé dans le string normalisé, afin d'éviter les faux positifs par sous-chaîne (ex: `"concertation"` ne doit pas matcher le mot-clé `"concert"`). Les champs `types_libelles` et `themes_libelles` de l'API NM étant de type `string | string[]`, le scraper SHALL normaliser ces valeurs en `string` (join des éléments du tableau) avant de les passer au normalizer.

#### Scenario: Catégorie mappée
- **WHEN** la catégorie brute source correspond à une règle de mapping connue
- **THEN** la catégorie normalisée correcte est assignée à l'événement

#### Scenario: Catégorie inconnue
- **WHEN** la catégorie brute ne correspond à aucune règle de mapping
- **THEN** le mapping retourne `null` et l'événement est ignoré (non inséré en base)

#### Scenario: Faux positif sous-chaîne évité
- **WHEN** le libellé d'un événement contient `"Concertation"` (processus de concertation citoyenne)
- **THEN** le mapping retourne `null` et l'événement est ignoré, car `"concertation"` n'est pas le token `"concert"`
