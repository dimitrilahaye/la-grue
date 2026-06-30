## Context

L'API Nantes Métropole retourne `date` (ex. `"2026-07-01"`) et `heure_debut` / `heure_fin` (ex. `"20:00"`) en heure locale Europe/Paris. La fonction `parseDateTime` assemble ces deux champs en `"2026-07-01T20:00:00"` et passe la chaîne à `new Date()`. Node.js interprète une chaîne sans suffixe timezone en UTC. Le serveur Render tournant en UTC, les dates sont stockées avec un décalage de +1h (hiver) ou +2h (été) par rapport à l'heure réelle.

## Goals / Non-Goals

**Goals:**
- Interpréter les heures NM comme Europe/Paris avant conversion en UTC
- Gérer correctement les transitions DST (heure d'été / heure d'hiver)

**Non-Goals:**
- Corriger les autres scrapers (WIK, Pays de la Loire, etc. — à vérifier séparément)
- Rétro-corriger les données déjà en base

## Decisions

**`temporal-polyfill` pour la conversion timezone**

`temporal-polyfill` expose l'API `Temporal` (TC39 stage 3) en polyfill. La conversion est explicite et sans ambiguïté :

```ts
import { Temporal } from 'temporal-polyfill';

function parseDateTime(dateStr: string, timeStr?: string): Date {
  const plain = Temporal.PlainDateTime.from(`${dateStr}T${timeStr ?? '00:00'}:00`);
  const zdt = plain.toZonedDateTime('Europe/Paris');
  return new Date(zdt.epochMilliseconds);
}
```

Alternatives écartées :
- `date-fns-tz` (`fromZonedTime`) : correct mais API moins explicite sur l'intent timezone
- Calcul manuel via `Intl.DateTimeFormat` : fragile autour des transitions DST à minuit
- Variable d'environnement `TZ=Europe/Paris` sur le serveur : change le comportement global du process, effet de bord imprévisible sur d'autres traitements

## Risks / Trade-offs

- [Données existantes en base] Les événements déjà inscrits avec les mauvaises heures ne seront pas corrigés automatiquement → le prochain run scraper écrasera les champs structurels (dont `start_at`) via l'UPSERT sur `canonical_id`
- [temporal-polyfill vs natif] Node.js 24 a `Temporal` derrière `--harmony-temporal` ; le polyfill est préféré pour éviter une dépendance à un flag expérimental
