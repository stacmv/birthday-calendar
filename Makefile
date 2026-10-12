.DEFAULT_GOAL := help
.PHONY: help install serve test coverage test-e2e e2e-install lint build build-check icons landing-screenshots deploy-setup deploy deploy-prod

WSL_DIR := /mnt/d/dev/anniversary-calendar

help: ## Show this help (default)
	@printf '\nUsage:  make <target>\n\nTargets:\n'
	@grep -E '^[a-zA-Z0-9_-]+:.*?##' $(MAKEFILE_LIST) | awk -F':.*?##' '{printf "  %-22s %s\n", $$1, $$2}'
	@printf '\n'

install: ## Install dev dependencies on the Windows host (npm ci: vitest, eslint, sharp)
	npm ci --no-audit --no-fund

serve: ## Serve public/ at http://localhost:8080 (php built-in server)
	php -S localhost:8080 -t public

test: ## Run unit tests (vitest, no browser)
	npx vitest run

coverage: ## Run unit tests with coverage report
	npx vitest run --coverage

lint: ## Lint JS (eslint)
	npx eslint .

e2e-install: ## Install Playwright for e2e INSIDE WSL (never on the Windows host)
	wsl -d Ubuntu -e bash -lc 'cd $(WSL_DIR)/e2e && npm ci --no-bin-links --no-audit --no-fund'

test-e2e: ## Run Playwright e2e tests INSIDE WSL (headless Chromium; installs deps first if missing)
	wsl -d Ubuntu -e bash -lc 'cd $(WSL_DIR)/e2e && { [ -d node_modules/@playwright/test ] || npm ci --no-bin-links --no-audit --no-fund; } && node node_modules/@playwright/test/cli.js test'

build: ## Stamp public/app/sw.js with the shell list and a content-hash VERSION (idempotent)
	node scripts/build.mjs

build-check: ## Fail if sw.js is stale (run before committing)
	node scripts/build.mjs --check

icons: ## Regenerate PNG icons from public/app/icons/icon.svg (sharp, no browser)
	node scripts/icons.mjs

landing-screenshots: ## Recapture landing screenshots INSIDE WSL if public/app changed (FORCE=1 to override)
	wsl -d Ubuntu -e bash -lc 'cd $(WSL_DIR) && FORCE=$(FORCE) node scripts/screenshots.mjs'

deploy-setup: ## Copy ../ga/deployment.phar to tools/ and create deployment*.ini from the examples
	@mkdir -p tools
	@if [ -f ../ga/deployment.phar ]; then \
		cp ../ga/deployment.phar tools/deployment.phar && echo "  copied: ../ga/deployment.phar -> tools/deployment.phar"; \
	else \
		echo "ERROR: ../ga/deployment.phar not found. Aborting."; exit 2; \
	fi
	@for f in deployment.ini deployment.prod.ini; do \
		if [ ! -f $$f ]; then cp $$f.example $$f && echo "  created: $$f (edit the FTP credentials!)"; \
		else echo "  exists:  $$f (not touched)"; fi; \
	done

deploy: build ## Deploy public/ with deployment.ini (test server); TEST=1 for a dry run
	@test -f tools/deployment.phar || { echo "ERROR: run 'make deploy-setup' first"; exit 2; }
	@test -f deployment.ini || { echo "ERROR: deployment.ini missing (see deployment.ini.example)"; exit 2; }
	php tools/deployment.phar deployment.ini $(if $(TEST),--test)

deploy-prod: build ## Build, then deploy public/ to production with deployment.prod.ini; TEST=1 for a dry run
	@test -f tools/deployment.phar || { echo "ERROR: run 'make deploy-setup' first"; exit 2; }
	@test -f deployment.prod.ini || { echo "ERROR: deployment.prod.ini missing (see deployment.prod.ini.example)"; exit 2; }
	php tools/deployment.phar deployment.prod.ini $(if $(TEST),--test)
