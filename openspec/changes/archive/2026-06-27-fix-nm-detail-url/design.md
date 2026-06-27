## Context

L'API NM retourne `lien_agenda = "https://metropole.nantes.fr/infonantes/agenda/{id_manif}"`. L'`id_manif` dans ce champ est le même que l'`id_manif` du record. Le `lien_agenda` est toujours renseigné dans les données observées. Le path `/infonantes/agenda/` est différent du path `/que-faire-a-nantes/agenda/` utilisé actuellement, mais tous deux pointent vers la même fiche événement.

La spec `event-ingestion` documentait délibérément le slug comme approche choisie et qualifiait `lien_agenda` de "déprécié". Cette décision était incorrecte — elle s'appuyait sur l'hypothèse que le slug seul suffit à reconstituer l'URL, ce qui est faux pour les événements dont le CMS génère un ID numérique dans l'URL.

## Goals / Non-Goals

**Goals:**
- `detailUrl` pointe toujours vers la bonne page de l'événement
- Suppression de la dépendance à `toNantesSlug` pour le cas NM (la fonction peut être conservée mais n'est plus le chemin principal)

**Non-Goals:**
- Reconstituer l'URL canonique `/que-faire-a-nantes/agenda/{slug}-{id}` — le CMS génère son propre slug, différent de `toNantesSlug`
- Modifier la logique de slugification pour d'autres usages potentiels

## Decisions

### Utiliser `r.lien_agenda` directement avec fallback slug

`detailUrl: r.lien_agenda ?? \`${AGENDA_BASE}/${toNantesSlug(r.nom)}\``

Rationale : `lien_agenda` est fourni par la source elle-même, donc garanti correct. Le fallback slug reste pour la robustesse défensive (cas hypothétique où le champ serait absent).

Alternative écartée : reconstruire `${AGENDA_BASE}/${toNantesSlug(nom)}-${id_manif}` — le slug CMS peut différer du slug qu'on génère (le CMS peut tronquer, utiliser un slug plus court, etc.).

## Risks / Trade-offs

**URL format différent** → `lien_agenda` utilise `/infonantes/agenda/` au lieu de `/que-faire-a-nantes/agenda/`. Les deux formats sont valides et redirigent vers la même fiche. Pas de risque fonctionnel.

## Open Questions

Aucune.
