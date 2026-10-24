.DEFAULT_GOAL := help
.PHONY: help install serve test coverage test-e2e e2e-install lint build build-check icons landing-screenshots promo-videos devtools release-check release prod-tree deploy-check deploy-prod

WSL_DIR := /mnt/d/dev/anniversary-calendar
DEPLOY_INI := ../anniversary-calendar.deployment.prod.ini

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

promo-videos: ## Build landing promo videos (music + 720p + posters) from HyperFrames masters INSIDE WSL (FORCE=1 to rebuild)
	wsl -d Ubuntu -e bash -lc 'cd $(WSL_DIR) && FORCE=$(FORCE) bash scripts/promo-videos.sh'

# Releases are cut by the shared engine in the sibling devtools checkout (release.config.json here).
DEVTOOLS ?= ../devtools
RELEASE := $(DEVTOOLS)/release

devtools:
	@test -f $(RELEASE)/release.mjs || { echo "ERROR: devtools not found at $(DEVTOOLS) (clone git@git.glgx.ru:stacmv.net/devtools.git next to this project)"; exit 2; }

release-check: devtools ## Dry-run release: next version and changelog from commits since the last tag
	node $(RELEASE)/release.mjs

release: devtools ## Cut a release from develop: VERSION, CHANGELOG, tag vX.Y.Z, master moved to it, pushed (V=1.0.0 to set by hand)
	node $(RELEASE)/release.mjs --apply $(if $(V),--version=$(V))

# Production gets a release, not the working copy: the latest tag on master is checked out into a separate
# worktree inside the project (.claude/worktrees/prod, git-ignored), and that is what $(DEPLOY_INI) uploads (local = anniversary-calendar/.claude/worktrees/prod/public).
PROD_TREE := .claude/worktrees/prod

prod-tree: devtools ## Check out the latest release into .claude/worktrees/prod
	node $(RELEASE)/prod-tree.mjs $(PROD_TREE)
	node $(PROD_TREE)/scripts/build.mjs --check

deploy-check: prod-tree ## Dry run of deploying the latest release: list what would be uploaded or deleted
	@test -f deployment.phar || { echo "ERROR: deployment.phar (dg/ftp-deployment) missing in the project root"; exit 2; }
	@test -f $(DEPLOY_INI) || { echo "ERROR: $(DEPLOY_INI) missing (template: deployment.prod.ini.example)"; exit 2; }
	php deployment.phar $(DEPLOY_INI) --test

deploy-prod: prod-tree ## Deploy the latest release (public/ of .claude/worktrees/prod) to production over FTP
	@test -f deployment.phar || { echo "ERROR: deployment.phar (dg/ftp-deployment) missing in the project root"; exit 2; }
	@test -f $(DEPLOY_INI) || { echo "ERROR: $(DEPLOY_INI) missing (template: deployment.prod.ini.example)"; exit 2; }
	php deployment.phar $(DEPLOY_INI)
