## Why

Plusieurs sources peuvent publier le même événement réel : WIK et Grabuge couvrent les mêmes sorties nantaises, et Grabuge publie parfois deux articles distincts pour un seul événement (annonce courte + programme complet). Le pipeline actuel déduplique uniquement par `(source, externalId)`, ce qui laisse passer ces doublons en base et les expose aux utilisateurs.

## What Changes

- Ajout d'un champ `canonical_id` (TEXT, UNIQUE) sur la table `events`, calculé à partir du titre normalisé, de la date de début et de la ville
- Ajout d'une fonction `toCanonicalId(title, startAt, city)` utilitaire, appelée lors de la normalisation de chaque événement
- Modification du déduplicateur : la résolution de conflit passe de `(source, externalId)` à `canonical_id`, avec une stratégie DO UPDATE conditionnelle fondée sur un score de richesse
- Le score de richesse est calculé à partir de cinq champs : `title` (non vide), `description` (longueur), coordonnées `lat`/`lon`, `imageUrl`, `priceInfo`
- Migration Drizzle pour ajouter la colonne et son index unique, avec backfill des lignes existantes

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `event-ingestion` : la déduplication devient cross-source via `canonical_id` ; le comportement lors d'un conflit change (DO UPDATE conditionnel selon score de richesse)
- `database-schema` : ajout du champ `canonical_id` sur la table `events`

## Impact

- `src/job/deduplicator.ts` — changement du conflict target et de la logique de résolution
- `src/db/schema.ts` — nouveau champ `canonicalId`
- `src/types/event.ts` — ajout de `canonicalId` sur `NormalizedEvent`
- `src/job/normalizer.ts` (ou nouveau fichier utilitaire) — fonction `toCanonicalId`
- Nouvelle migration Drizzle
- Tests unitaires du déduplicateur et du calcul du `canonical_id`
