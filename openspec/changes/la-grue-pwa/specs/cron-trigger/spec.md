## ADDED Requirements

### Requirement: Endpoint interne protégé
Le système SHALL exposer `POST /internal/run-scrape` qui déclenche le job de scraping complet. Cet endpoint SHALL vérifier la présence d'un header `X-Cron-Secret` dont la valeur correspond à la variable d'environnement `CRON_SECRET`. Toute requête sans ce header ou avec une valeur incorrecte SHALL retourner HTTP 401.

#### Scenario: Requête autorisée
- **WHEN** `POST /internal/run-scrape` est appelé avec le header `X-Cron-Secret` correct
- **THEN** le job de scraping est déclenché de manière asynchrone et l'endpoint retourne immédiatement HTTP 202 Accepted

#### Scenario: Requête non autorisée — secret manquant
- **WHEN** `POST /internal/run-scrape` est appelé sans header `X-Cron-Secret`
- **THEN** HTTP 401 est retourné sans déclencher le job

#### Scenario: Requête non autorisée — secret incorrect
- **WHEN** `POST /internal/run-scrape` est appelé avec un secret incorrect
- **THEN** HTTP 401 est retourné sans déclencher le job et une ligne de log est émise (tentative non autorisée)

---

### Requirement: Exécution asynchrone du job
Le système SHALL déclencher le job en arrière-plan (sans bloquer la réponse HTTP). L'endpoint retourne HTTP 202 immédiatement après avoir lancé le job. Les erreurs éventuelles du job SHALL être loggées mais ne remontent pas comme erreur HTTP.

#### Scenario: Job long en cours d'exécution
- **WHEN** le job de scraping est déclenché et prend plusieurs minutes
- **THEN** l'endpoint a déjà retourné HTTP 202 et le serveur reste disponible pour les autres requêtes

#### Scenario: Erreur dans le job
- **WHEN** le job rencontre une erreur fatale non catchée
- **THEN** l'erreur est loggée avec stack trace, le serveur reste opérationnel

---

### Requirement: Protection contre les exécutions simultanées
Le système SHALL maintenir un flag en mémoire indiquant si un job est déjà en cours d'exécution. Si une nouvelle requête arrive alors qu'un job tourne, l'endpoint SHALL retourner HTTP 409 Conflict avec le message `{ error: "Job already running" }`.

#### Scenario: Double déclenchement
- **WHEN** `POST /internal/run-scrape` est appelé alors qu'un job est déjà en cours
- **THEN** HTTP 409 est retourné et le second job n'est pas déclenché

#### Scenario: Déclenchement après fin du job précédent
- **WHEN** le job précédent s'est terminé (succès ou erreur)
- **THEN** le flag est réinitialisé et un nouveau déclenchement est accepté

---

### Requirement: Configuration du Cron Job Render
Le Cron Job Render SHALL être configuré avec le schedule `0 3 * * *` (3h00 UTC, soit 4h00 ou 5h00 Paris selon DST) et SHALL envoyer une requête `POST` à `https://<app>.onrender.com/internal/run-scrape` avec le header `X-Cron-Secret`. Cette configuration SHALL être documentée dans le README avec les variables d'environnement Render à configurer.

#### Scenario: Déclenchement nocturne
- **WHEN** le schedule `0 3 * * *` est atteint
- **THEN** Render envoie automatiquement la requête POST et le job de scraping s'exécute

#### Scenario: Documentation opérationnelle
- **WHEN** un développeur configure Render pour la première fois
- **THEN** le README fournit les étapes exactes pour créer le Web Service et le Cron Job avec les variables d'environnement requises
