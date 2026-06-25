# La Grue

Les sorties à Nantes et sa région — concerts, expos, bars, festivals, ginguettes, Sexpo — en un seul endroit.

## Prérequis

- Node.js 20+
- Docker + Docker Compose
- npm

## Démarrage local

### 1. Variables d'environnement

```bash
cp .env.example .env
```

Édite `.env` si nécessaire (les valeurs par défaut fonctionnent avec Docker Compose).

### 2. Démarrer la base de données

```bash
docker compose -f docker/docker-compose.yml up -d --force-recreate
```

- PostgreSQL accessible sur `localhost:5433`
- Adminer accessible sur [http://localhost:8082](http://localhost:8082)
  - Système : PostgreSQL
  - Serveur : `postgres`
  - Utilisateur / Mot de passe / Base : `lagrue`

### 3. Appliquer les migrations

```bash
npm run db:migrate
```

### 4. Insérer les données de test

```bash
npm run db:seed
```

### 5. Démarrer le serveur

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur en mode watch (tsx) |
| `npm run build` | Compilation TypeScript vers `dist/` |
| `npm start` | Démarrage du build compilé |
| `npm run db:migrate` | Applique les migrations Drizzle |
| `npm run db:generate` | Génère une migration depuis le schéma |
| `npm run db:seed` | Insère des données fictives (TRUNCATE + INSERT) |
| `npm test` | Lance les tests Jest |
| `npm run test:watch` | Tests en mode watch |
| `npm run job:run` | Déclenche le job de scraping en local |

## Structure du projet

```
src/
├── api/          Express server + routes REST + endpoint interne
├── db/           Schéma Drizzle, client, queries
├── job/          Scrapers (Nantes Métropole, Pays de Loire, WIK) + orchestrateur
└── types/        Types partagés (NormalizedEvent, Category)

frontend/         PWA statique (HTML/CSS/JS vanilla)
assets/           Logo SVG + icônes PNG
migrations/       SQL généré par drizzle-kit
scripts/          seed.ts, generate-icons.ts
docker/           docker-compose.yml
```

## Déploiement sur Render.com

### Web Service

1. Créer un **Web Service** depuis le dépôt GitHub
2. **Build Command** : `npm install && npm run build`
3. **Start Command** : `node dist/index.js`
4. **Pre-Deploy Command** : `npm run db:migrate`
5. Variables d'environnement :

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connection pooler Supabase (port 6543) |
| `MIGRATION_DATABASE_URL` | Connexion directe Supabase (port 5432) |
| `CRON_SECRET` | Secret partagé avec le Cron Job |
| `PORT` | Optionnel (Render définit `PORT` automatiquement) |

### Cron Job

1. Créer un **Cron Job** sur Render
2. **Schedule** : `0 3 * * *` (3h00 UTC)
3. **Command** : `curl -X POST https://<ton-app>.onrender.com/internal/run-scrape -H "X-Cron-Secret: <CRON_SECRET>"`

> Render permet aussi de configurer l'URL et les headers directement depuis l'interface du Cron Job.

## Configuration Supabase

Supabase fournit deux types de connexion :

| Type | Port | Usage |
|---|---|---|
| **Connexion directe** | 5432 | Migrations (`MIGRATION_DATABASE_URL`) |
| **Connection pooler** | 6543 | Runtime applicatif (`DATABASE_URL`) |

Dans le dashboard Supabase → Settings → Database :
- **Transaction pooler** → copier l'URL pour `DATABASE_URL`
- **Direct connection** → copier l'URL pour `MIGRATION_DATABASE_URL`

> Important : les migrations DDL (`CREATE TABLE`, `ALTER TABLE`) ne fonctionnent pas avec le pooler PgBouncer. Toujours utiliser la connexion directe pour `db:migrate`.

## Déclenchement manuel du job

```bash
curl -X POST https://<ton-app>.onrender.com/internal/run-scrape \
  -H "X-Cron-Secret: <CRON_SECRET>"
```

Retourne `202 Accepted` si le job démarre, `409` si un job est déjà en cours.

## Sources de données

Le job tourne chaque nuit à 3h et persiste les événements de la semaine en cours et de la semaine suivante.

### Sources actives

| Source | Type | Couverture |
|---|---|---|
| [Nantes Métropole API](https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_agenda-evenements-nantes-metropole_v2/records) | API JSON (OpenDataSoft) | Nantes + métropole |
| [Pays de la Loire API](https://data.paysdelaloire.fr/api/explore/v2.1/catalog/datasets/agenda-culture-de-la-region-des-pays-de-la-loire/records) | API JSON (OpenAgenda) | Loire-Atlantique — dataset actuellement peu alimenté pour 2026 |
| [WIK Nantes](https://www.wik-nantes.fr/agenda) | Scraping HTML (Cheerio) | Nantes |

### Sources prévues (v2)

| Source | Type | Notes |
|---|---|---|
| [Grabuge Mag](https://www.grabugemag.com) | API WordPress REST (`/wp-json/tribe/events/v1/events`) | Filtrable par date et catégorie, ~430 événements, JSON structuré avec lieu + coordonnées |
| [Pull Rouge](https://pullrouge.fr) | Scraping HTML statique | Page unique, pas de robots.txt, dates et lieux en texte brut à parser par regex |
| [Big City Nantes](https://www.bigcitynantes.fr/que-faire-a-nantes/) | Scraping HTML | Site rendu côté client (JS) — nécessite Playwright ou Puppeteer, non justifié en v1 |
