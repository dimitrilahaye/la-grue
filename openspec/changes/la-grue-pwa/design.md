## Context

Projet greenfield. Aucune base de code existante. La Grue est une PWA Node/TypeScript hébergée sur Render.com, alimentée par un job de scraping nocturne, stockant les données dans Supabase PostgreSQL.

Les contraintes principales : pas de framework frontend, déploiement single-binary sur Render, deux types de sources (APIs JSON publiques + scraping HTML), détection iFrame impossible côté JS → fallback timeout.

## Goals / Non-Goals

**Goals:**
- Une seule application Node servant à la fois la PWA (HTML statique) et l'API REST
- Job de scraping découplé, déclenché par HTTP (Render Cron → endpoint interne protégé)
- Schéma de données TypeScript-first avec Drizzle, migrations versionnées git
- PWA installable (manifest + service worker minimal), style épuré, pas de lib frontend
- Fiche détail interne avec iFrame opt-in et fallback timeout
- Local dev clé-en-main : Docker Compose + migrations + seed

**Non-Goals:**
- Authentification utilisateur
- Big City Nantes (v2)
- Cache offline des résultats (service worker minimal, installabilité uniquement)
- Administration des événements (pas de back-office)
- Notifications push

## Decisions

### D1 — Un seul service Node, deux rôles

**Décision :** Express sert à la fois les fichiers statiques PWA (`GET /`) et l'API REST (`GET /api/events`). Un endpoint interne protégé (`POST /internal/run-scrape`) permet au Cron Job Render de déclencher le job.

**Alternatives considérées :**
- Séparer web service et job en deux packages → plus de complexité de déploiement, partage de code difficile
- node-cron intégré → fragile au restart (si redéploiement à 2h58, le job est perdu)

**Choix :** Option A (HTTP trigger) car le Cron Render est un déclencheur externe indépendant du cycle de vie du web service.

---

### D2 — Drizzle pour le schéma et les migrations

**Décision :** Drizzle ORM comme source de vérité unique. Le schéma TypeScript (`src/db/schema.ts`) génère les migrations SQL via `drizzle-kit generate`. Les types de rows sont inférés automatiquement (`InferSelectModel`).

**Alternatives considérées :**
- node-pg-migrate + types manuels → drift possible entre SQL et TypeScript
- Prisma → trop lourd, génération de client complexe, moins transparent sur Supabase
- Kysely → bon query builder mais migrations séparées à gérer manuellement

**Deux URLs de connexion Supabase :**
```
MIGRATION_DATABASE_URL  → port 5432  (direct, pour drizzle-kit migrate)
DATABASE_URL            → port 6543  (pooler PgBouncer, pour runtime)
```
PgBouncer ne supporte pas les DDL en mode transaction → migrations toujours sur la connexion directe.

---

### D3 — Scraping HTML avec Cheerio, passe unique sur le listing WIK

**Décision :** Cheerio pour WIK Nantes (HTML statique). Passe unique sur la page listing avec le paramètre `?date=DD/MM/YYYY` — toutes les données utiles (titre, date, lieu, image, catégorie) sont disponibles directement dans les cards du listing.

**Alternatives considérées :**
- Playwright/Puppeteer → nécessaire uniquement pour JS-rendered (Big City, v2). Overhead de 150MB+ non justifié en v1.
- Fetch parallèle sans rate limit → risque de ban IP, comportement non respectueux
- Deux passes (listing + pages détail) → abandonnée : les pages détail WIK ne contiennent pas les données structurées attendues, et l'URL sans `?date=` retourne une page vide.

**WIK — stratégie effective (passe unique) :**
1. Fetch `GET /agenda?date=DD/MM/YYYY` → parse les cards `.listing-articles--agenda .article`
2. Extraire depuis chaque card : titre (`h2.h2`), date (`.date`, format "DD mois YYYY, HHhMM"), lieu (`.area`), image (`img`), catégorie (segment du path URL)
3. Paginer avec `?page=N&date=...` jusqu'à page vide ou MAX_PAGES

---

### D4 — Déduplication par `(source, external_id)`

**Décision :** Contrainte UNIQUE `(source, external_id)` en base. Le job fait des `INSERT ... ON CONFLICT (source, external_id) DO UPDATE SET ...` (UPSERT). Les doublons cross-sources (même event sur WIK et Nantes Métropole) sont tolérés en v1 — deux fiches distinctes, badge "source".

**`external_id` par source :**
- Nantes Métropole → `id_manif`
- Pays de la Loire → `slug`
- WIK → hash SHA-256 de `(title + startAt.toISOString())`

---

### D5 — iFrame opt-in avec fallback timeout

**Décision :** La fiche détail affiche toujours la fiche interne enrichie (titre, lieu, date, description, image, prix). Un bouton "Aperçu" charge l'iFrame à la demande. Si `onload` ne se déclenche pas dans les 4s, ou si l'accès à `contentDocument` échoue, l'overlay de fallback s'affiche avec un lien "Ouvrir dans un nouvel onglet ↗".

**Pourquoi opt-in et non chargé d'office :**
- Évite le chargement de ressources tiers inutiles si l'iFrame est bloquée
- Améliore les performances perçues de la liste

---

### D6 — PWA : installabilité sans offline

**Décision :** Service worker minimal enregistré pour activer le prompt d'installation (Add to Home Screen). Aucune stratégie de cache en v1. Le `manifest.json` définit nom, icônes, couleurs, orientation.

**Assets visuels :** SVG inline généré dans le projet, référence aux grues Titan (silhouette industrielle, jaune #F5C518 + gris #4A4A4A). Exporté en PNG 192×192 et 512×512 pour le manifest.

---

### D7 — Structure de répertoires

```
src/
├── api/
│   ├── server.ts            Express + routes
│   └── routes/
│       ├── events.ts        GET /api/events
│       ├── static.ts        GET / → PWA
│       └── internal.ts      POST /internal/run-scrape
├── job/
│   ├── index.ts             orchestrateur du job
│   ├── scrapers/
│   │   ├── nantesMetropole.ts
│   │   ├── paysLoire.ts
│   │   └── wik.ts
│   ├── normalizer.ts        → Event unifié
│   └── deduplicator.ts      → UPSERT batch
├── db/
│   ├── client.ts            instance Drizzle + pg pool
│   ├── schema.ts            source de vérité du schéma
│   └── queries/
│       └── events.ts        findEvents(), upsertEvents()
└── types/
    └── event.ts             types métier partagés

frontend/
├── index.html
├── style.css
├── app.js
├── sw.js                    service worker minimal
└── manifest.json

migrations/                  SQL généré par drizzle-kit
assets/
├── logo.svg
├── icon-192.png
└── icon-512.png

docker/
└── docker-compose.yml       PostgreSQL + Adminer

scripts/
└── seed.ts                  données fictives
```

## Risks / Trade-offs

**WIK structure HTML fragile** → si WIK change son markup, le scraper casse silencieusement. Mitigation : logger le nombre d'events récupérés, alerter (log Render) si < seuil.

**iFrame bloquée sur la quasi-totalité des sites** → la fiche interne est suffisamment riche pour que l'UX reste bonne sans iFrame. Le fallback "ouvrir dans un nouvel onglet" reste toujours visible.

**Render Web Service dormant** → Render peut mettre en veille les services gratuits. Si le web service est endormi quand le Cron Job ping `/internal/run-scrape`, le job échoue. Mitigation : Render garde les web services éveillés sur les plans payants ; documenter clairement.

**Supabase connexion directe vs pooler** → utiliser la mauvaise URL pour les migrations cause des erreurs DDL silencieuses. Mitigation : variable d'env explicitement nommée `MIGRATION_DATABASE_URL`, documentée dans le README.

**Rate limiting WIK** → trop lent = job de plusieurs minutes. 1 requête/2s sur ~50 events = ~100s. Acceptable pour un job nocturne.

## Migration Plan

1. Créer le projet Supabase, récupérer les deux URLs de connexion
2. Configurer les variables d'env Render (DATABASE_URL, MIGRATION_DATABASE_URL, CRON_SECRET)
3. Render Pre-Deploy Command : `npm run db:migrate`
4. Premier déploiement → migrations appliquées automatiquement
5. Render Cron Job configuré sur `0 3 * * *` → `POST https://<app>.onrender.com/internal/run-scrape` avec header `X-Cron-Secret`
6. Rollback : Drizzle ne génère pas de rollback automatique. En cas de problème : migration corrective forward.

## Open Questions

~~Faut-il paginer l'API `/api/events` ?~~ **Résolu.** Navigation par jour via flèches ← →, `date` (YYYY-MM-DD) est le paramètre pivot (défaut : aujourd'hui). "Load more" assure la pagination au sein du jour (`limit` + `offset`). Le formulaire de recherche affine l'affichage dans la vue du jour sélectionné.

~~Rate limits APIs OpenDataSoft ?~~ **Résolu.** Les deux APIs (Nantes Métropole + Pays de la Loire) tournent sur OpenDataSoft : plafond public de 10 000 req/jour par IP. Le job nocturne en consomme ~10. Précaution : envoyer un `User-Agent` identifiable (ex: `LaGrue-Bot/1.0`) dans toutes les requêtes sortantes.
