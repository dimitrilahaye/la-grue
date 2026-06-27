## MODIFIED Requirements

### Requirement: Ingestion Nantes Métropole API
Le système SHALL interroger l'API OpenDataSoft Nantes Métropole (`https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_agenda-evenements-nantes-metropole_v2/records`) pour récupérer les événements de la semaine en cours et de la semaine suivante. Les champs `id_manif`, `nom`, `date`, `heure_debut`, `heure_fin`, `lieu`, `adresse`, `ville`, `themes_libelles`, `types_libelles`, `media_url`, `gratuit` et `precisions_tarifs_evt` SHALL être mappés vers le schéma unifié Event. Le `detailUrl` SHALL être lu depuis le champ `lien_agenda` de l'API, qui contient l'URL directe et fiable vers la fiche événement (`https://metropole.nantes.fr/infonantes/agenda/{id_manif}`). En l'absence de ce champ, un slug généré depuis `nom` SHALL être utilisé en fallback.

#### Scenario: Récupération réussie
- **WHEN** le job appelle l'API Nantes Métropole avec un filtre de date sur les 14 prochains jours
- **THEN** les événements retournés sont normalisés et persistés en base via UPSERT

#### Scenario: detailUrl depuis lien_agenda
- **WHEN** un record NM contient un champ `lien_agenda` non null
- **THEN** le `detailUrl` de l'événement normalisé est la valeur de `lien_agenda`

#### Scenario: detailUrl fallback slug
- **WHEN** un record NM a un `lien_agenda` absent ou null
- **THEN** le `detailUrl` est construit par slugification du `nom` préfixé par l'URL de base NM

#### Scenario: API indisponible
- **WHEN** l'API retourne une erreur HTTP (5xx) ou un timeout
- **THEN** le job logue l'erreur, ne persiste rien pour cette source, et continue avec les autres sources

#### Scenario: Aucun événement retourné
- **WHEN** l'API retourne un tableau vide
- **THEN** le job logue un avertissement avec le nombre 0 et continue normalement
