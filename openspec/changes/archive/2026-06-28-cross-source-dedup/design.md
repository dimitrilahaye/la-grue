## Context

Le pipeline d'ingestion actuel déduplique uniquement par `(source, external_id)`. Plusieurs sources peuvent couvrir le même événement réel (WIK + Grabuge), et Grabuge publie parfois deux articles distincts pour un même événement (annonce courte + programme complet). Ces doublons atterrissent en base et sont exposés aux utilisateurs.

L'objectif est d'introduire un identifiant canonique cross-source : `canonical_id`, calculé déterministement à partir du titre normalisé, de la date de début et de la ville. La résolution de conflit s'appuie sur un score de richesse pour garantir que la version la plus complète d'un événement survive.

---

## Goals / Non-Goals

**Goals :**
- Empêcher deux événements représentant le même fait réel de coexister en base
- Conserver la version la plus riche (score de richesse sur 5 champs)

**Non-Goals :**
- Fuzzy matching par NLP ou similarité vectorielle
- Merge de champs entre plusieurs sources (on choisit un gagnant, on ne fusionne pas)
- Déduplication cross-villes (scope actuel : Nantes uniquement)

---

## Decisions

### 1. Calcul du canonical_id

```
canonical_id = sha256(
  normalize(title) + '|' + YYYY-MM-DD(startAt) + '|' + city.toLowerCase()
)
```

**Normalisation du titre :** lowercase → décomposition NFD (Unicode) + suppression des diacritiques → suppression des caractères non alphanumériques sauf espaces → collapse des espaces → trim.

**L'heure est exclue** du fingerprint : deux sources peuvent reporter des heures légèrement différentes pour le même événement (ex : l'une dit 08:00, l'autre 10:00). La date seule (YYYY-MM-DD en Europe/Paris) est suffisamment discriminante.

**La ville est incluse** pour isoler les résultats si le projet s'étend à d'autres villes.

Alternatives écartées : titre brut sans normalisation (trop fragile aux variations de casse / accents), fingerprint sans la ville (risque de faux merge si extension multi-villes).

### 2. Score de richesse

Le score détermine quel représentant d'un groupe de doublons est conservé.

```typescript
function richnessScore(e: NormalizedEvent): number {
  let score = 0;
  if (e.title) score++;
  if (e.description) score++;
  if (e.lat !== null && e.lon !== null) score++;
  if (e.imageUrl) score++;
  if (e.priceInfo) score++;
  return score; // 0 – 5
}
```

Les cinq critères ont le même poids. `description` vaut 1 point quelle que soit sa longueur (la présence est le signal le plus discriminant entre une annonce courte et un programme complet).

### 3. Déduplication en deux couches

**Couche TypeScript (within-batch) :** avant tout UPSERT, les événements collectés sur l'ensemble des sources sont groupés par `canonical_id`. Pour chaque groupe, seul le candidat avec le score le plus élevé est retenu. En cas d'égalité, le premier dans l'ordre de traitement gagne (stable, déterministe pour un run donné).

**Couche SQL (cross-run) :** le conflit `ON CONFLICT (canonical_id)` utilise une stratégie champ par champ :
- `description` : on garde la plus longue entre l'existante et la nouvelle (`CASE WHEN length(excluded.description) > length(COALESCE(events.description, '')) THEN excluded.description ELSE events.description END`)
- `lat`, `lon`, `imageUrl`, `priceInfo` : `COALESCE(excluded.x, events.x)` — on complète si vide, on ne remplace pas
- Champs structurels (`title`, `startAt`, `endAt`, `venueName`, `address`, `source`, `externalId`, `category`, etc.) : toujours remplacés par la nouvelle valeur (données fraîches)

Cette asymétrie est intentionnelle : les champs factuels (date, lieu) doivent rester à jour ; les champs enrichis (description, coordonnées, image) ne doivent pas être écrasés par une version plus pauvre.

### 4. Schéma — colonne canonical_id

Nouvelle colonne `canonical_id TEXT NOT NULL` avec index UNIQUE. La contrainte `(source, external_id)` a été supprimée : NantesMetropole (et potentiellement d'autres sources) réutilise le même `external_id` pour plusieurs occurrences journalières d'un même événement multi-jours. Maintenir cette contrainte provoquait des violations dès qu'un tel événement générait plusieurs `canonical_id` distincts (dates différentes).

Le conflict target du déduplicateur passe de `(source, external_id)` à `canonical_id`.

### 5. Migration

1. Ajout de la colonne `canonical_id TEXT` nullable
2. Backfill SQL : `UPDATE events SET canonical_id = md5(lower(title) || '|' || to_char(start_at AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') || '|' || lower(coalesce(city, 'nantes')))` — normalisation simplifiée suffisante pour les données existantes
3. `ALTER TABLE events ALTER COLUMN canonical_id SET NOT NULL`
4. `CREATE UNIQUE INDEX events_canonical_id_unique ON events (canonical_id)`

Le backfill SQL utilise `md5` (128 bits) plutôt que `sha256` pour rester dans les fonctions built-in de PostgreSQL. Côté applicatif, `sha256` via Node.js `crypto`. Les deux coexistent temporairement le temps que les anciennes lignes soient réingérées.

---

## Risks / Trade-offs

**Faux merges** : deux événements distincts avec un titre similaire le même jour. Risque faible en pratique (les événements nantais ont des titres suffisamment variés), à surveiller sur le monitoring post-déploiement.

**Backfill imparfait** : la normalisation SQL du backfill ne déte pas les accents (pas de `unaccent`). Des lignes existantes peuvent avoir des `canonical_id` qui divergent légèrement de ce que l'application calculera. Ces lignes seront naturellement remplacées lors du prochain run d'ingestion.

**Score à égalité** : quand deux candidats ont le même score, le premier traité gagne. L'ordre dépend de `Promise.allSettled` (non déterministe entre runs). Acceptable : les deux candidats sont d'égale richesse par définition.

---

## Open Questions

Aucune. Les décisions ci-dessus sont suffisantes pour l'implémentation.
