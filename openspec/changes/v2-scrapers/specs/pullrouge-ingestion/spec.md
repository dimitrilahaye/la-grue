## Purpose

Scraping HTML de `https://pullrouge.fr/` — agenda art indie de Nantes et Loire-Atlantique. Les événements sont encodés dans une page HTML statique via des blocs `<span style="font-family: FreeSans;"><big><big>…</big></big></span>` séquentiels.

---

## Requirements

### Requirement: Scraping Pull Rouge

Le système SHALL charger `https://pullrouge.fr/` en une requête GET et parser les blocs FreeSans `big>big` dans l'ordre du document. Chaque événement consiste en un triplet de blocs consécutifs : (1) un bloc rouge contenant le jour de la semaine, la date et l'heure, (2) un bloc contenant un `<a href>` avec le titre et l'URL de l'événement, (3) optionnellement un bloc rouge commençant par `@` contenant le lieu. Les événements hors des 14 prochains jours SHALL être ignorés.

#### Scenario: Extraction d'un événement complet

- **WHEN** un triplet date / lien / venue est identifié dans les blocs
- **THEN** titre, URL, date, heure et lieu sont extraits et normalisés

#### Scenario: Événement sans venue

- **WHEN** le bloc suivant un lien ne commence pas par `@`
- **THEN** le scraper utilise `venueName = null` et avance sans ignorer l'événement

#### Scenario: Site indisponible

- **WHEN** `https://pullrouge.fr/` retourne une erreur HTTP ou un timeout
- **THEN** le job logue l'erreur et continue avec les autres sources

---

### Requirement: Normalisation Pull Rouge

Le `externalId` SHALL être le SHA-256 de `title + startAt.toISOString()` (identifiant stable reconstruit). La `source` SHALL être `'pull_rouge'`. La `city` SHALL être extraite du venue si possible (présence d'un indicateur géographique après `-` dans la chaîne venue), sinon `'Nantes'`. La catégorie SHALL être déterminée par `mapPullRougeCategory` : Pull Rouge couvre concerts et vernissages — les autres types retournent `null` et l'événement est ignoré.

#### Scenario: Parse de la date

- **WHEN** le texte du bloc date contient `samedi 27 juin 2026   20h00`
- **THEN** `startAt` est parsé en `2026-06-27T20:00:00` (heure locale Europe/Paris)

#### Scenario: Date sans heure

- **WHEN** le bloc date ne contient pas d'heure
- **THEN** `startAt` est fixé à 00h00 de la date
