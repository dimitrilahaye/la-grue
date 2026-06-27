## Context

Le normalizer NM fait `normalized.includes(normalizeString(key))` où `key` est un mot-clé court comme `"concert"`. Cette approche ne distingue pas un mot entier de son apparition comme préfixe ou suffixe dans un autre mot. `"concertation"` contient `"concert"` → faux positif.

Les données réelles de l'API NM montrent des thèmes comme `"Citoyenneté - Concertation"` qui ne sont pas musicaux. La chaîne normalisée de ces thèmes contient `"concertation"` → substring match sur `"concert"` → catégorie erronée.

Problème orthogonal : `types_libelles` et `themes_libelles` sont des `string[]` dans la réponse API, pas des `string`. La coercition implicite par template literal (`` `${array}` `` = `"a,b"`) produit des résultats avec virgules que `normalizeString` remplace par des espaces, donc ça fonctionne accidentellement. Mais c'est fragile et peu lisible.

## Goals / Non-Goals

**Goals:**
- Éliminer les faux positifs par sous-chaîne sur les mots-clés de catégorie
- Corriger les types TypeScript de `NantesRecord`
- Normaliser explicitement les arrays en string avant de les passer au normalizer

**Non-Goals:**
- Enrichir la table de mapping (ajouter de nouvelles catégories)
- Modifier le comportement de `mapPaysLoireCategory` ou `mapWikCategory`

## Decisions

### Word-token matching

Remplacer `normalized.includes(normKey)` par un test sur les tokens du string normalisé :

```typescript
function tokenize(s: string): string[] {
  return s.split(/\s+/).filter(Boolean);
}
// Dans mapNantesMetropoleCategory :
const tokens = tokenize(normalized);
if (tokens.includes(normalizeString(key))) return cat;
```

Rationale : après `normalizeString`, les séparateurs (tirets, virgules, espaces) deviennent des espaces. Splitter sur `\s+` donne des tokens propres. `"concertation"` est un token entier → ne match pas `"concert"`. `"Concert - Musique"` normalisé donne tokens `["concert", "musique"]` → match `"concert"` ✓.

### Array → string : normalisation explicite côté scraper

Dans `nantesMetropole.ts`, avant d'appeler `mapNantesMetropoleCategory` :
```typescript
const toStr = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? v.join(' ') : (v ?? '');
const typesStr = toStr(r.types_libelles);
const themesStr = toStr(r.themes_libelles);
```

Rationale : la normalisation reste dans le scraper qui connaît la forme des données source. Le normalizer reste une fonction `(string, string) → Category | null` simple et testable.

## Risks / Trade-offs

**Faux négatifs potentiels** → Si un libellé contient `"concerté"` ou `"concerto"`, le token est différent de `"concert"` → pas de match. C'est le comportement voulu : ces mots ne sont pas des concerts. Aucun libellé NM réel connu n'est affecté.

**`toNantesSlug` non modifiée** → La fonction de slugification reste pour le fallback URL (fix-nm-detail-url). Ce changement n'y touche pas.

## Open Questions

Aucune.
