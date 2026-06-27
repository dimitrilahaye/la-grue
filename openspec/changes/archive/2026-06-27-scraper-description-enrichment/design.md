## Context

Deux scrapers retournent `description: null` par construction :

- **WIK** : passe unique sur le listing — la description n'est pas présente dans les cards
- **BigCity** : endpoint AJAX `cec_get_events` — inspecté en live, la réponse ne contient aucun champ description/excerpt. C'est un endpoint "listing" WordPress conçu pour alimenter une grille de cards.

Dans les deux cas, la `<meta name="description">` de la page détail contient une description propre, sans HTML à stripper. Vérifiée en live sur les deux sites.

## Goals / Non-Goals

**Goals :**
- `description` non null pour les événements WIK et BigCity après enrichissement
- Contenu propre (entités HTML décodées, aucun tag)
- Concurrence limitée pour éviter le rate limiting (batch de 5)
- Échec silencieux par événement : si une page détail est inaccessible, `description` reste null et l'événement est conservé

**Non-Goals :**
- Description complète (la meta description peut être tronquée — acceptable)
- Partager un module commun entre les deux scrapers (duplication intentionnelle, deux fichiers indépendants)
- Enrichissement différentiel (skip si déjà en BDD) — complexité non justifiée à ce stade

## Decisions

### `<meta name="description">` plutôt que sélecteur CSS profond

Pour WIK, `div.ctn-desc` et la meta description ont le même contenu, mais la meta est plus propre (pas d'entités HTML, pas de balises imbriquées). Pour BigCity, la description est uniquement dans la meta (pas de `div.ctn-desc` équivalent trouvé). Un pattern unique pour les deux sources.

Extraction : regex simple `/<meta name="description" content="([^"]+)"/` sur le HTML brut. Pas besoin de charger cheerio pour ça — mais comme les deux scrapers utilisent déjà axios, on reste cohérent.

### Batches de 5, séquentiels entre batches

```
events = [e1, e2, ..., eN]

chunk(events, 5).forEach(batch => {
  await Promise.allSettled(batch.map(e => fetchMetaDescription(e.detailUrl)))
})
```

`Promise.allSettled` garantit qu'un timeout sur une page détail ne tue pas le batch entier. Chaque event garde `description: null` en cas d'échec.

### Duplication plutôt qu'abstraction partagée

`fetchMetaDescription` est une fonction de 5 lignes. L'extraire dans un module `utils/` pour deux appelants crée une dépendance inter-scrapers sans valeur réelle. Si un troisième scraper en a besoin, on refactorisera.

## Risks / Trade-offs

- **Rate limiting** : les deux sites n'ont pas de rate limit documenté. Batch de 5 est conservateur.
- **Descriptions tronquées** : la meta description de BigCity se termine par `...` pour certains events. Acceptable pour un aperçu dans le panneau détail.
- **Temps de job** : +3-5s estimé (batch de 5 × ~350ms par requête, ~8 batches pour 40 events).
- **UPSERT** : les events déjà en BDD sans description seront enrichis au prochain run via UPSERT sur le champ `description`.
