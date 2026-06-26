## Why

Trouver une sortie à Nantes implique aujourd'hui de consulter une dizaine de sites différents sans vue unifiée. La Grue centralise concerts, expos, bars, festivals, ginguettes et événements Sexpo en un seul endroit, interrogeable par type, ville et créneau horaire.

## What Changes

- Création d'une PWA "La Grue" installable sur mobile et desktop
- Backend Node/TypeScript avec serveur Express qui sert la PWA et une API REST
- Job de scraping nocturne (3h du matin) qui crawle 3 sources et persiste les événements en base
- Base de données PostgreSQL (Supabase) avec migrations versionnées via Drizzle
- Fiche détail interne pour chaque événement avec iFrame opt-in et fallback UX
- Infrastructure locale Docker Compose (PostgreSQL + Adminer) + seed de données fictives
- Déploiement sur Render.com (Web Service + Cron Job)

## Capabilities

### New Capabilities

- `event-ingestion` : crawling et normalisation des événements depuis 3 sources (Nantes Métropole API, Pays de la Loire API, WIK Nantes HTML), avec déduplication UPSERT et rate limiting pour le scraping HTML
- `event-search` : API REST `/api/events` avec filtres par catégorie, ville et plage horaire, retournant les événements persistés en base
- `pwa-frontend` : PWA vanilla (HTML/CSS/JS sans framework), formulaire de recherche, liste de résultats, fiche détail avec iFrame opt-in, installable, style épuré UX-first
- `database-schema` : schéma Drizzle ISO avec la structure PostgreSQL, migrations versionnées, deux URL de connexion (directe pour migrations, pooler pour runtime)
- `local-dev-setup` : Docker Compose (PostgreSQL + Adminer), script de migration, script de seed avec données fictives couvrant toutes les catégories sur 2 semaines
- `cron-trigger` : endpoint interne protégé `POST /internal/run-scrape` déclenché par le Cron Job Render, avec secret partagé

### Modified Capabilities

## Impact

- Nouveau projet : aucune dépendance existante à modifier
- Dépendances runtime : `express`, `drizzle-orm`, `postgres`, `cheerio`, `axios`, `p-limit`
- Dépendances dev : `drizzle-kit`, `typescript`, `jest`, `ts-jest`, `@types/*`, `docker-compose`
- Render.com : 2 services (Web Service + Cron Job), variables d'environnement `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `CRON_SECRET`
- Supabase : projet PostgreSQL, 2 connection strings (direct port 5432 + pooler port 6543)
