## Context

Deux régressions post-v2 :

1. **Grabuge HTML** : l'API tribe/events retourne les descriptions en HTML WordPress brut (`<p>`, `<br>`, `<strong>`…). Le frontend utilise `textContent` pour les afficher — le HTML apparaît littéralement. Le scraper stocke `e.description` tel quel sans transformation.

2. **NM detailUrl** : la chaîne de fix (`url_site` → slug → `lien_agenda`) a abouti à utiliser `r.lien_agenda` comme source primaire. En production, ce champ retourne `https://metropole.nantes.fr/infonantes/agenda/{id}` — un chemin qui n'est pas résolu par le site public (redirige vers la page générique de l'agenda). Le scraper dispose de `r.id_manif` et d'une constante `AGENDA_BASE = .../que-faire-a-nantes/agenda` — la combinaison `AGENDA_BASE/{id_manif}` n'a jamais été testée en production.

## Goals / Non-Goals

**Goals :**
- Descriptions Grabuge stockées en texte brut, sans aucun tag HTML
- URLs NM résolues vers les fiches événement individuelles (`/que-faire-a-nantes/agenda/{slug-du-titre}`)
- Correction transparente : les events déjà en BDD se corrigent via UPSERT au prochain run

**Non-Goals :**
- Conserver le formatage riche des descriptions Grabuge (gras, listes…)
- Modifier le rendu frontend des descriptions (pas de DOMPurify, pas de `innerHTML`)
- Toucher aux autres sources (WIK, Pull Rouge, Big City, NM descriptions)

## Decisions

### Strip HTML Grabuge au scraper (pas au frontend)

Cheerio est déjà une dépendance du projet. `cheerio.load(html).text()` extrait le texte brut proprement, gère les entités HTML et les espaces superflus. Alternative écartée : `innerHTML` + DOMPurify côté frontend — ajoute une dépendance JS client et ne résout pas les données déjà en BDD avant que le frontend soit mis à jour.

### detailUrl NM : `AGENDA_BASE + "/" + toNantesSlug(r.nom)`, sans `lien_agenda`

Les URLs publiques du site Nantes Métropole sont de la forme `https://metropole.nantes.fr/que-faire-a-nantes/agenda/les-parents-viennent-de-mars-les-enfants-du-mcdo-chez-papa` — le slug du titre fait partie du chemin. `lien_agenda` retourne un chemin `/infonantes/agenda/{id}` qui n'est pas résolu publiquement. `toNantesSlug` est déjà défini et testé dans le fichier ; `AGENDA_BASE` pointe vers le bon chemin de base. La construction `${AGENDA_BASE}/${toNantesSlug(r.nom)}` reproduit exactement le format des URLs observées en production.

## Risks / Trade-offs

- **Slug exact non garanti** : `toNantesSlug` normalise les accents et la ponctuation, mais le CMS NM peut générer des slugs légèrement différents (ex : gestion des apostrophes, des chiffres romains). Le format est confirmé en production pour les cas courants.
- **Perte de formatage Grabuge** : les descriptions avec listes ou titres en gras seront aplaties en texte linéaire. Acceptable pour l'usage actuel (aperçu dans un panneau latéral).
- **UPSERT différé** : les events déjà en BDD ne sont corrigés qu'au prochain run du job. Pas de migration immédiate.
