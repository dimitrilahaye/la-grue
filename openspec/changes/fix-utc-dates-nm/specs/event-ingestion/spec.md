## MODIFIED Requirements

### Requirement: Ingestion Nantes Métropole API
Le système SHALL interroger l'API OpenDataSoft Nantes Métropole (`https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_agenda-evenements-nantes-metropole_v2/records`) pour récupérer les événements de la semaine en cours et de la semaine suivante. Les champs `id_manif`, `nom`, `date`, `heure_debut`, `heure_fin`, `lieu`, `adresse`, `ville`, `themes_libelles`, `types_libelles`, `media_url`, `gratuit` et `precisions_tarifs_evt` SHALL être mappés vers le schéma unifié Event. Le `detailUrl` SHALL être construit par slugification du titre : `${AGENDA_BASE}/${toNantesSlug(r.nom)}` où `AGENDA_BASE = https://metropole.nantes.fr/que-faire-a-nantes/agenda`. Le champ `lien_agenda` n'est pas utilisé. Les champs `heure_debut` et `heure_fin` sont fournis en heure locale Europe/Paris par l'API — le système SHALL les interpréter comme tels via `Temporal.PlainDateTime.toZonedDateTime('Europe/Paris')` avant conversion en UTC, afin de stocker les timestamps corrects en base.

#### Scenario: Récupération réussie
- **WHEN** le job appelle l'API Nantes Métropole avec un filtre de date sur les 14 prochains jours
- **THEN** les événements retournés sont normalisés et persistés en base via UPSERT

#### Scenario: detailUrl depuis le slug du titre
- **WHEN** un record NM est normalisé
- **THEN** le `detailUrl` est `https://metropole.nantes.fr/que-faire-a-nantes/agenda/{slug-du-titre}`

#### Scenario: API indisponible
- **WHEN** l'API retourne une erreur HTTP (5xx) ou un timeout
- **THEN** le job logue l'erreur, ne persiste rien pour cette source, et continue avec les autres sources

#### Scenario: Aucun événement retourné
- **WHEN** l'API retourne un tableau vide
- **THEN** le job logue un avertissement avec le nombre 0 et continue normalement

#### Scenario: Heure Europe/Paris correctement convertie en UTC
- **WHEN** l'API retourne un événement avec `date = "2026-07-01"` et `heure_debut = "20:00"` (heure Paris, UTC+2 en été)
- **THEN** le `startAt` stocké correspond à `2026-07-01T18:00:00Z` (20h Paris = 18h UTC)
