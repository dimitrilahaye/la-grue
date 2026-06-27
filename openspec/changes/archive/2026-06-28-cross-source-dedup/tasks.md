## 1. Utilitaire canonical_id

- [x] 1.1 Ajouter `toCanonicalId(title: string, startAt: Date, city: string | null): string` dans `src/job/normalizer.ts` — normalisation NFD + strip diacritiques + lowercase + strip non-alphanum + collapse espaces + trim ; fingerprint = `sha256(normalizedTitle + '|' + YYYY-MM-DD(startAt, 'Europe/Paris') + '|' + (city ?? 'nantes').toLowerCase())`
- [x] 1.2 Ajouter `richnessScore(e: NormalizedEvent): number` dans `src/job/deduplicator.ts` — 1 point par champ présent parmi : `title`, `description`, `lat`+`lon` (les deux), `imageUrl`, `priceInfo` ; retourne 0-5
- [x] 1.3 Ajouter les tests unitaires de `toCanonicalId` : même résultat pour des titres avec/sans accents, casse différente, ponctuation variable ; résultats distincts pour des titres différents ou des dates différentes
- [x] 1.4 Ajouter les tests unitaires de `richnessScore` : score 0 pour un event vide, score 5 pour un event complet, score partiel selon les champs présents

## 2. Type NormalizedEvent

- [x] 2.1 Ajouter `canonicalId: string` sur l'interface `NormalizedEvent` dans `src/types/event.ts`
- [x] 2.2 Mettre à jour tous les scrapers pour calculer et passer `canonicalId` via `toCanonicalId(title, startAt, city)` lors de la construction de l'objet `NormalizedEvent` : `nantesMetropole.ts`, `paysLoire.ts`, `wik.ts`, `grabuge.ts`, `pullRouge.ts`, `bigCity.ts`

## 3. Schéma DB et migration

- [x] 3.1 Ajouter `canonicalId: text('canonical_id').notNull().unique()` dans `src/db/schema.ts`
- [x] 3.2 Générer la migration Drizzle : `npm run db:generate`
- [x] 3.3 Éditer le fichier SQL de migration généré pour insérer le backfill entre l'ajout de colonne nullable et la pose de la contrainte NOT NULL : `UPDATE events SET canonical_id = md5(lower(title) || '|' || to_char(start_at AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') || '|' || lower(coalesce(city, 'nantes'))) WHERE canonical_id IS NULL`

## 4. Déduplicateur

- [x] 4.1 Avant le UPSERT, ajouter une étape de dédup within-batch dans `upsertEvents` : grouper les événements par `canonicalId`, garder le candidat au score le plus élevé par groupe (en cas d'égalité : premier dans l'ordre du tableau)
- [x] 4.2 Modifier le conflict target du UPSERT : passer de `[events.source, events.externalId]` à `[events.canonicalId]`
- [x] 4.3 Modifier la clause DO UPDATE : champs structurels (`title`, `startAt`, `endAt`, `venueName`, `address`, `city`, `source`, `externalId`, `category`, `rawCategory`, `tags`, `detailUrl`, `isFree`, `updatedAt`) — toujours remplacés par `excluded.*` ; `description` — remplacée si `length(excluded.description) > length(coalesce(events.description, ''))` ; `lat`, `lon`, `imageUrl`, `priceInfo` — `COALESCE(excluded.x, events.x)`

## 5. Tests

- [x] 5.1 Mettre à jour `deduplicator.test.ts` : vérifier que deux événements avec le même `canonicalId` mais des `externalId` différents n'insèrent qu'une seule ligne (le gagnant par score)
- [x] 5.2 Ajouter un test : événement existant en base avec description courte — un run ultérieur avec description plus longue la remplace
- [x] 5.3 Ajouter un test : événement existant en base avec `imageUrl` non nulle — un run ultérieur avec `imageUrl` nulle conserve l'existante
- [x] 5.4 Mettre à jour les mocks des scrapers existants pour inclure `canonicalId` dans les fixtures `NormalizedEvent`
