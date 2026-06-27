## Context

Le formulaire de recherche comporte deux selects : catégorie et ville. Jusqu'ici, les filtres ne prenaient effet qu'au `submit` du formulaire. Par ailleurs, `GET /api/categories/counts` ne supportait aucun filtre — ce qui rendait structurellement impossible d'afficher des compteurs de catégorie cohérents avec la ville sélectionnée. Le bug concret : choisir "Carquefou (2)" puis soumettre affichait "Toutes (195)" au lieu de "Toutes (2)".

Deux problèmes distincts, que ce design adresse ensemble :
1. Le manque de symétrie API : `/cities/counts` accepte `?category=`, `/categories/counts` n'accepte pas `?city=`
2. Le câblage frontend : les changements de sélect n'avaient aucun effet immédiat, tout transitait par le `submit`

## Goals / Non-Goals

**Goals:**
- Rendre les deux selects symétriques : chaque changement met à jour l'autre select et recharge la liste à la volée
- Ajouter `?city=` à `GET /api/categories/counts` (symétrie avec `?category=` sur `/cities/counts`)
- Supprimer le bouton "Chercher" et le listener `submit`
- Les compteurs affichés restent toujours cohérents avec le filtre actif dans l'autre select

**Non-Goals:**
- Debounce ou rate-limiting des appels (les requêtes sont des lectures DB légères)
- Modification du schéma de base de données (pas de colonnes nouvelles)
- Mise à jour du datepicker à la volée au-delà de l'appel `refreshDatePicker()` déjà en place

## Decisions

### 1. Filtre appliqué à toutes les couches (DB → route → frontend)

Option retenue : ajouter la clause WHERE dans `getCategoryCounts()`, l'exposer via le query param `?city=`, et l'utiliser depuis le frontend.

Alternative écartée : filtrer côté frontend uniquement (côté client, sur le résultat brut). Rejetée car cela conserverait les counts incorrects dans l'état partagé côté serveur, et exposerait une API incohérente.

### 2. Lecture de `state.currentCity` dans `updateCategorySelect`

`updateCategorySelect()` lit directement `state.currentCity` pour appeler `fetchCategoryCounts({ city: state.currentCity })`. Pas de paramètre supplémentaire — l'état est la source de vérité.

Symétrique avec `updateCitySelect(category)` qui lit déjà son paramètre explicitement. Cette légère asymétrie est acceptable : la ville est déjà dans le state au moment où `updateCategorySelect` est appelé.

### 3. Suppression du submit plutôt que cohabitation

Le listener `submit` et le bouton "Chercher" sont supprimés. Une approche hybride (garder le submit mais aussi mettre à jour au `change`) aurait provoqué des doubles chargements et une logique de déduplication inutile.

## Risks / Trade-offs

**Appels API multipliés** → à chaque changement de sélect, 2-3 appels partent simultanément (counts + events + refreshDatePicker). Les endpoints de comptage sont des GROUP BY simples sur une table indexée — la charge reste négligeable.

**Course condition sur `loadEvents()`** → Si l'utilisateur change rapidement les deux selects, `loadEvents()` peut être appelé plusieurs fois avant que le premier se termine. Le guard `if (state.loading) return` dans `loadEvents` absorbe les appels redondants ; le dernier état affiché sera cohérent car le state est mis à jour de façon synchrone avant l'appel.

## Migration Plan

1. Déployer le backend (DB function + route) : rétrocompatible — le param `?city=` est optionnel
2. Déployer le frontend : le bouton "Chercher" disparaît, les selects deviennent actifs immédiatement

Pas de rollback spécifique nécessaire : la suppression du bouton est purement UI, et l'ajout du param `?city=` est non-breaking.

## Open Questions

Aucune.
