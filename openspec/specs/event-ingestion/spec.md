## Purpose

Agrégation nocturne des événements nantais depuis plusieurs sources hétérogènes (APIs JSON publiques et scraping HTML), normalisation vers un schéma unifié, et déduplication par UPSERT.

---

## Requirements

### Requirement: Ingestion Nantes Métropole API
Le système SHALL interroger l'API OpenDataSoft Nantes Métropole (`https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_agenda-evenements-nantes-metropole_v2/records`) pour récupérer les événements de la semaine en cours et de la semaine suivante. Les champs `id_manif`, `nom`, `date`, `heure_debut`, `heure_fin`, `lieu`, `adresse`, `ville`, `themes_libelles`, `types_libelles`, `media_url`, `gratuit` et `precisions_tarifs_evt` SHALL être mappés vers le schéma unifié Event. Le `detailUrl` SHALL être généré depuis le champ `nom` via une fonction de slug (`toNantesSlug`) : lowercase → NFD → suppression diacritiques → suppression non-alphanumériques (hors espace et tiret) → trim → remplacement espaces/tirets par tiret unique, préfixé par `https://metropole.nantes.fr/que-faire-a-nantes/agenda/`. Le champ `lien_agenda` (URL `infonantes` dépréciée) n'est plus utilisé pour le `detailUrl`.

#### Scenario: Récupération réussie
- **WHEN** le job appelle l'API Nantes Métropole avec un filtre de date sur les 14 prochains jours
- **THEN** les événements retournés sont normalisés et persistés en base via UPSERT

#### Scenario: API indisponible
- **WHEN** l'API retourne une erreur HTTP (5xx) ou un timeout
- **THEN** le job logue l'erreur, ne persiste rien pour cette source, et continue avec les autres sources

#### Scenario: Aucun événement retourné
- **WHEN** l'API retourne un tableau vide
- **THEN** le job logue un avertissement avec le nombre 0 et continue normalement

---

### Requirement: Ingestion Pays de la Loire API
Le système SHALL interroger l'API OpenAgenda Pays de la Loire (`https://data.paysdelaloire.fr/api/explore/v2.1/catalog/datasets/agenda-culture-de-la-region-des-pays-de-la-loire/records`) en filtrant sur les événements dont `location_department` correspond à la Loire-Atlantique (44) et dont la date est dans les 14 prochains jours. Les champs `slug`, `title_fr`, `description_fr`, `firstdate_begin`, `lastdate_begin`, `timings`, `location_name`, `location_city`, `location_postalcode`, `location_coordinates`, `canonicalurl`, `keywords_fr` SHALL être mappés vers le schéma unifié.

#### Scenario: Récupération réussie
- **WHEN** le job appelle l'API Pays de la Loire avec les filtres département et date
- **THEN** les événements sont normalisés (catégorie déduite des `keywords_fr`) et persistés via UPSERT

#### Scenario: API indisponible
- **WHEN** l'API retourne une erreur HTTP ou un timeout
- **THEN** le job logue l'erreur et continue avec les autres sources sans interruption

---

### Requirement: Scraping WIK Nantes — passe unique sur le listing
Le système SHALL scraper `https://www.wik-nantes.fr/agenda?date=DD/MM/YYYY` (date du jour encodée en URL) en une seule passe sur la page listing. Toutes les données utiles (titre, date, lieu, image, catégorie déduite du path URL) sont extraites directement depuis les cards de la liste sans passer par les pages détail.

> **Note d'implémentation** : l'approche deux passes (listing + pages détail) prévue initialement a été abandonnée car les pages détail WIK ne contenaient pas les données structurées attendues (date, lieu). L'URL sans paramètre `?date=` retourne une page vide. La passe unique sur le listing avec le paramètre de date est plus fiable.

#### Scenario: Extraction depuis la page listing
- **WHEN** le job charge la page listing WIK avec le paramètre `?date=DD/MM/YYYY`
- **THEN** titre, date/heure (format "DD mois YYYY, HHhMM"), lieu, image et catégorie (déduite du path URL `/nantes/N/<category>/slug`) sont extraits depuis chaque card

#### Scenario: Date de fin optionnelle
- **WHEN** une card contient "Jusqu'au DD mois YYYY"
- **THEN** la date de fin est extraite et stockée dans `end_at`

#### Scenario: Pagination
- **WHEN** la page listing contient des résultats
- **THEN** le job enchaîne les pages suivantes (`?page=N&date=...`) jusqu'à obtenir une page vide ou atteindre MAX_PAGES

#### Scenario: Page inaccessible
- **WHEN** une page WIK retourne une erreur HTTP
- **THEN** une ligne de log est émise et la pagination s'arrête proprement

---

### Requirement: Normalisation vers le schéma unifié
Le système SHALL transformer les données de chaque source vers un objet `NormalizedEvent` commun avant persistence. La catégorie normalisée SHALL être l'une des valeurs : `bars-soirees`, `concerts-musique`, `expositions-arts`, `spectacles-theatre`, `festivals`, `ginguettes-guinguettes`, `sexpo`. Les fonctions de mapping (`mapNantesMetropoleCategory`, `mapPaysLoireCategory`, `mapWikCategory`) SHALL retourner `Category | null` — jamais `'autres'`. Les scrapers SHALL ignorer tout événement dont le mapping retourne `null` : aucun événement sans catégorie reconnue n'est persisté.

#### Scenario: Catégorie mappée
- **WHEN** la catégorie brute source correspond à une règle de mapping connue
- **THEN** la catégorie normalisée correcte est assignée à l'événement

#### Scenario: Catégorie inconnue
- **WHEN** la catégorie brute ne correspond à aucune règle de mapping
- **THEN** le mapping retourne `null` et l'événement est ignoré (non inséré en base)

---

### Requirement: Déduplication UPSERT
Le système SHALL persister les événements via `INSERT ... ON CONFLICT (source, external_id) DO UPDATE SET ...` pour mettre à jour les événements existants sans créer de doublons. L'`external_id` SHALL être : `id_manif` pour Nantes Métropole, `slug` pour Pays de la Loire, `sha256(title + startAt.toISOString())` pour WIK.

#### Scenario: Nouvel événement
- **WHEN** un événement avec un `(source, external_id)` inconnu est inséré
- **THEN** une nouvelle ligne est créée en base

#### Scenario: Événement existant mis à jour
- **WHEN** un événement avec un `(source, external_id)` déjà connu est inséré
- **THEN** les champs `title`, `description`, `start_at`, `end_at`, `venue_name`, `city`, `address`, `category`, `raw_category`, `detail_url`, `image_url`, `is_free`, `price_info`, `updated_at` sont mis à jour

---

### Requirement: Logging du résultat du job
Le système SHALL logger à la fin de chaque run : nombre d'événements traités par source, nombre d'insertions, nombre de mises à jour, nombre d'erreurs.

#### Scenario: Run complet sans erreur
- **WHEN** le job termine sans erreur
- **THEN** un résumé structuré est loggé : `{ source, fetched, inserted, updated, errors }` pour chaque source

#### Scenario: Run avec erreurs partielles
- **WHEN** certaines sources échouent mais d'autres réussissent
- **THEN** le résumé indique les erreurs par source et le job retourne un statut de succès partiel (HTTP 207 sur l'endpoint interne)
