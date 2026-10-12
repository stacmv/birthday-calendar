.DEFAULT_GOAL := help
.PHONY: help install serve test coverage test-e2e e2e-install lint build icons landing-screenshots deploy-setup deploy deploy-prod

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
