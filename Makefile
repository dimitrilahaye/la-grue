.PHONY: api job quality help

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

api: ## Lance Docker + démarre le serveur en mode watch
	docker compose -f docker/docker-compose.yml up -d --force-recreate
	npm run dev

job: ## Lance Docker + déclenche le job de scraping en local
	docker compose -f docker/docker-compose.yml up -d --force-recreate
	npm run job:run

quality: ## Lint + tests unitaires + build
	npm run lint
	npm run test:unit
	npm run build
