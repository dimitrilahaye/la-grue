## 1. Initialisation du projet

- [x] 1.1 Créer `package.json` avec les dépendances runtime (`express`, `drizzle-orm`, `postgres`, `cheerio`, `axios`, `p-limit`) et dev (`typescript`, `ts-node` ou `tsx`, `jest`, `ts-jest`, `@types/express`, `@types/node`, `drizzle-kit`, `eslint`)
- [x] 1.2 Créer `tsconfig.json` (target ES2022, module CommonJS, strict mode, paths)
- [x] 1.3 Créer `jest.config.ts` avec preset `ts-jest`
- [x] 1.4 Créer `.env.example` avec `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `CRON_SECRET`, `PORT`
- [x] 1.5 Créer `.gitignore` (node_modules, dist, .env, *.js.map)
- [ ] 1.6 Initialiser le dépôt git et pousser sur GitHub

## 2. Docker Compose et base de données locale

- [ ] 2.1 Créer `docker/docker-compose.yml` avec services `postgres` (image postgres:16, port 5432, volume nommé) et `adminer` (port 8080)
- [ ] 2.2 Créer `src/db/schema.ts` avec la définition Drizzle de la table `events` (toutes les colonnes, contrainte UNIQUE sur `source + external_id`, indexes sur `start_at`, `category`, `lower(city)`)
- [ ] 2.3 Créer `src/db/client.ts` avec l'instance Drizzle + pool postgres.js, validation de `DATABASE_URL` au démarrage
- [ ] 2.4 Configurer `drizzle.config.ts` avec deux profils (migration vs runtime) et le chemin `migrations/`
- [ ] 2.5 Exécuter `drizzle-kit generate` pour créer la première migration SQL
- [ ] 2.6 Ajouter le script `db:migrate` dans `package.json` (utilise `MIGRATION_DATABASE_URL`)
- [ ] 2.7 Vérifier que `npm run db:migrate` applique correctement la migration sur la base Docker locale

## 3. Seed de données fictives

- [ ] 3.1 Créer `scripts/seed.ts` qui TRUNCATE la table `events` puis insère des événements fictifs pour les 7 catégories
- [ ] 3.2 S'assurer que le seed couvre : toutes les catégories, 2 semaines de dates, ≥5 events aujourd'hui, events gratuits et payants, events avec et sans `detail_url`, events avec et sans `image_url`
- [ ] 3.3 Ajouter le script `db:seed` dans `package.json`
- [ ] 3.4 Vérifier que `npm run db:seed` est idempotent (exécution multiple → même résultat)

## 4. Backend — API REST

- [ ] 4.1 Créer `src/db/queries/events.ts` avec `findEvents(filters)` (WHERE dynamique sur catégorie, ville, date, fenêtre 14j par défaut) et `findEventById(id)`
- [ ] 4.2 Créer `src/api/routes/events.ts` avec `GET /api/events` (validation query params, pagination limit/offset) et `GET /api/events/:id`
- [ ] 4.3 Créer `src/api/routes/static.ts` servant les fichiers du dossier `frontend/` et le `manifest.json`
- [ ] 4.4 Créer `src/api/server.ts` assemblant Express, les routes, CORS et la gestion d'erreurs globale
- [ ] 4.5 Écrire les tests Jest pour `findEvents` (filtres catégorie, ville, date, pagination) avec une base de test ou fixtures
- [ ] 4.6 Écrire les tests Jest pour les routes API (HTTP 200/400/404)

## 5. Job de scraping — Sources API

- [ ] 5.1 Créer `src/types/event.ts` avec le type `NormalizedEvent` et l'enum `Category`
- [ ] 5.2 Créer `src/job/normalizer.ts` avec la table de mapping `rawCategory → Category` pour les trois sources
- [ ] 5.3 Créer `src/job/scrapers/nantesMetropole.ts` : appel API avec filtre date (semaine en cours + suivante), mapping des champs vers `NormalizedEvent`, `external_id` = `id_manif`
- [ ] 5.4 Créer `src/job/scrapers/paysLoire.ts` : appel API avec filtre département 44 et date, mapping des champs, `external_id` = `slug`, catégorie déduite des `keywords_fr`
- [ ] 5.5 Écrire les tests Jest pour les deux scrapers API (mocks axios, vérification du mapping)

## 6. Job de scraping — WIK Nantes

- [ ] 6.1 Créer `src/job/scrapers/wik.ts` — passe 1 : fetch + cheerio parsing de `/agenda` pour extraire `{title, categoryFromUrl, detailUrl}` pour chaque event
- [ ] 6.2 Implémenter la passe 2 dans le même scraper : fetch séquentiel de chaque page détail avec `p-limit(1)` et délai de 1500ms, extraction cheerio de `{venue, startAt, endAt, description, imageUrl}`
- [ ] 6.3 Implémenter `external_id` WIK = SHA-256 de `title + startAt.toISOString()`
- [ ] 6.4 Écrire les tests Jest pour le scraper WIK (HTML fixtures, vérification du rate limiting)

## 7. Job de scraping — Orchestrateur et déduplication

- [ ] 7.1 Créer `src/job/deduplicator.ts` avec `upsertEvents(events: NormalizedEvent[])` utilisant `INSERT ... ON CONFLICT (source, external_id) DO UPDATE SET ...`
- [ ] 7.2 Créer `src/job/index.ts` qui orchestre les 3 scrapers en parallèle (`Promise.allSettled`), normalise, déduplique, logue le résumé par source
- [ ] 7.3 Écrire les tests Jest pour `upsertEvents` (insertion, mise à jour, pas de doublon)

## 8. Endpoint interne cron trigger

- [ ] 8.1 Créer `src/api/routes/internal.ts` avec `POST /internal/run-scrape` : vérification header `X-Cron-Secret`, protection anti-double-exécution (flag en mémoire), déclenchement asynchrone du job, retour HTTP 202/401/409
- [ ] 8.2 Écrire les tests Jest pour l'endpoint interne (401 sans secret, 409 si job en cours, 202 nominal)

## 9. PWA frontend — Structure et formulaire

- [ ] 9.1 Créer `frontend/index.html` avec la structure sémantique : header (logo + titre), section formulaire de recherche (catégorie, ville, date, bouton), section liste des événements, panneau détail (initialement caché)
- [ ] 9.2 Créer `frontend/style.css` avec CSS custom properties (couleurs jaune #F5C518, gris #4A4A4A, fond), layout responsive (mobile-first), touch targets ≥44px, support `prefers-color-scheme: dark`
- [ ] 9.3 Créer `frontend/app.js` — module principal : initialisation, binding des événements formulaire, appel `/api/events`, rendu de la liste des cartes

## 10. PWA frontend — Liste et fiche détail

- [ ] 10.1 Implémenter le rendu des cartes événement (titre, date formatée en français, lieu, badge catégorie coloré, indicateur gratuit, image ou placeholder)
- [ ] 10.2 Implémenter le panneau de fiche détail (ouverture au clic sur carte, fermeture bouton ou Échap, affichage de tous les champs)
- [ ] 10.3 Implémenter l'iFrame opt-in : bouton "Aperçu", chargement avec overlay, timeout 4s → fallback avec lien "Ouvrir dans un nouvel onglet ↗", bouton fermeture iFrame
- [ ] 10.4 Gérer les états vide (aucun résultat) et erreur (API indisponible) dans le frontend

## 11. PWA — Manifest et service worker

- [ ] 11.1 Créer `frontend/manifest.json` (`name: "La Grue"`, `short_name: "La Grue"`, `theme_color: "#F5C518"`, `display: "standalone"`, `start_url: "/"`, icônes 192 et 512)
- [ ] 11.2 Créer `frontend/sw.js` service worker minimal (registration uniquement, aucune stratégie de cache en v1)
- [ ] 11.3 Générer les assets visuels : `assets/logo.svg` (silhouette grue Titan, jaune #F5C518 + gris #4A4A4A), exporter `assets/icon-192.png` et `assets/icon-512.png`

## 12. Finitions et déploiement

- [ ] 12.1 Créer `README.md` avec : prérequis, démarrage local (Docker + migrations + seed), configuration Render (Web Service + Cron Job, variables d'env), configuration Supabase (deux connection strings)
- [ ] 12.2 Configurer Render Pre-Deploy Command (`npm run db:migrate`) dans `render.yaml` ou dans la UI Render
- [ ] 12.3 Vérifier que `npm run build && npm start` démarre correctement le serveur compilé
- [ ] 12.4 Déployer sur Render, configurer les variables d'env Supabase, vérifier le premier déploiement
- [ ] 12.5 Configurer le Cron Job Render (`0 3 * * *`, `POST /internal/run-scrape`, header `X-Cron-Secret`)
- [ ] 12.6 Déclencher manuellement le job une première fois via l'endpoint interne et vérifier les logs
