## Purpose

Agrégation nocturne des événements nantais depuis plusieurs sources hétérogènes (APIs JSON publiques et scraping HTML), normalisation vers un schéma unifié, et déduplication par UPSERT.

---

## Requirements

### Requirement: Ingestion Nantes Métropole API
Le système SHALL interroger l'API OpenDataSoft Nantes Métropole (`https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_agenda-evenements-nantes-metropole_v2/records`) pour récupérer les événements de la semaine en cours et de la semaine suivante. Les champs `id_manif`, `nom`, `date`, `heure_debut`, `heure_fin`, `lieu`, `adresse`, `ville`, `themes_libelles`, `types_libelles`, `media_url`, `gratuit` et `precisions_tarifs_evt` SHALL être mappés vers le schéma unifié Event. Le `detailUrl` SHALL être construit par slugification du titre : `${AGENDA_BASE}/${toNantesSlug(r.nom)}` où `AGENDA_BASE = https://metropole.nantes.fr/que-faire-a-nantes/agenda`. Le champ `lien_agenda` n'est pas utilisé.

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

### Requirement: Purge des événements expirés
Le système SHALL supprimer en début de chaque run les événements dont `start_at` (converti en heure Europe/Paris) est strictement antérieur à la date du jour (Europe/Paris). Cela garantit que la base ne conserve que des événements présents ou futurs. La purge SHALL être exécutée avant le lancement des scrapers et son résultat SHALL être loggé.

#### Scenario: Purge en début de run
- **WHEN** le job démarre
- **THEN** tous les événements dont `(start_at AT TIME ZONE 'Europe/Paris')::date < CURRENT_DATE AT TIME ZONE 'Europe/Paris'` sont supprimés avant le lancement des scrapers

#### Scenario: Log du nombre d'événements purgés
- **WHEN** la purge s'exécute
- **THEN** le nombre de lignes supprimées est loggé : `[Job] Purged N expired events (start_at < today)`

#### Scenario: Aucun événement à purger
- **WHEN** aucune ligne ne correspond au critère de purge
- **THEN** la purge s'exécute sans erreur et logue 0

---

### Requirement: Ingestion Grabuge Mag

Le système SHALL intégrer la source Grabuge Mag dans le job de scraping nightly. Le scraper Grabuge SHALL être exécuté en parallèle avec les autres sources via `Promise.allSettled`. La `source` associée est `'grabuge'`.

#### Scenario: Source Grabuge dans le job

- **WHEN** le job démarre
- **THEN** `scrapeGrabuge()` est appelé en parallèle avec les autres scrapers

---

### Requirement: Ingestion Pull Rouge

Le système SHALL intégrer la source Pull Rouge dans le job de scraping nightly. Le scraper Pull Rouge SHALL être exécuté en parallèle avec les autres sources via `Promise.allSettled`. La `source` associée est `'pull_rouge'`.

#### Scenario: Source Pull Rouge dans le job

- **WHEN** le job démarre
- **THEN** `scrapePullRouge()` est appelé en parallèle avec les autres scrapers

---

### Requirement: Ingestion Big City Nantes

Le système SHALL intégrer la source Big City Nantes dans le job de scraping nightly. Le scraper Big City SHALL être exécuté en parallèle avec les autres sources via `Promise.allSettled`. La `source` associée est `'big_city'`.

#### Scenario: Source Big City dans le job

- **WHEN** le job démarre
- **THEN** `scrapeBigCity()` est appelé en parallèle avec les autres scrapers

---

### Requirement: Logging du résultat du job
Le système SHALL logger à la fin de chaque run : nombre d'événements traités par source, nombre d'insertions, nombre de mises à jour, nombre d'erreurs.

#### Scenario: Run complet sans erreur
- **WHEN** le job termine sans erreur
- **THEN** un résumé structuré est loggé : `{ source, fetched, inserted, updated, errors }` pour chaque source

#### Scenario: Run avec erreurs partielles
- **WHEN** certaines sources échouent mais d'autres réussissent
- **THEN** le résumé indique les erreurs par source et le job retourne un statut de succès partiel (HTTP 207 sur l'endpoint interne)
