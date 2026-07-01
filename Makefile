-include .env
export

# Maestro instala el CLI en ~/.maestro/bin y solo añade esa ruta al PATH de
# shells nuevas (.zshrc/.bashrc), no al del proceso make en curso. Lo
# prependemos aquí para que en una máquina limpia `make setup` (install-maestro
# + doctor) y los targets de run encuentren el binario en la misma sesión.
export PATH := $(HOME)/.maestro/bin:$(PATH)

FEATURE     ?= maestro/features/DemoLogin.feature
CASE_ID     ?=
FLOW        ?= maestro/flows/DemoLogin.yml
NO_PUBLISH  ?= 1
AVD         ?= Small_Phone
SIMULATOR   ?= iPhone 14
PORT        ?= 8080
# Pinned Maestro CLI version — same in local and CI. Bump here to upgrade.
MAESTRO_VERSION ?= 2.6.0

include make/run-tests.mk

.DEFAULT_GOAL := install

.PHONY: help
help: ## Show available targets
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: setup
setup: env install install-maestro doctor ## Full bootstrap for a fresh machine (env + deps + Maestro + preflight)
	@echo ""
	@echo "Setup complete. If 'doctor' flagged AZURE_DEVOPS_PAT, export it in your shell."
	@echo "Note: the Makefile exports .env vars to make targets, but the Azure DevOps MCP"
	@echo "server is launched separately by Claude Code and does not inherit them."

.PHONY: install
install: env ## Install Node dependencies, incl. the Azure DevOps MCP server (creates .env if missing)
	npm install

.PHONY: install-maestro
install-maestro: ## Install the pinned Maestro CLI ($(MAESTRO_VERSION)) unless it is already the active one
	@if [ "$$(maestro --version 2>/dev/null | tail -1)" = "$(MAESTRO_VERSION)" ]; then \
	  echo "Maestro $(MAESTRO_VERSION) already installed"; \
	else \
	  echo "Installing Maestro CLI $(MAESTRO_VERSION)..."; \
	  curl -Ls "https://get.maestro.mobile.dev" | MAESTRO_VERSION=$(MAESTRO_VERSION) bash; \
	fi

.PHONY: doctor
doctor: ## Check that every prerequisite (deps, Maestro, devices, PAT, app source) is in place
	@node maestro/scripts/doctor.js

.PHONY: validate
validate: ## Static check of Gherkin -> step-definitions -> flows (no device needed)
	@node maestro/scripts/validate.js

.PHONY: env
env: ## Create .env from template if missing
	@test -f .env || cp .env.example .env
	@echo ".env created — fill in AZURE_DEVOPS_PAT and credentials"

.PHONY: emulator-start
emulator-start: ## Start Android emulator (AVD=Small_Phone)
	emulator -avd $(AVD) &

.PHONY: simulator-start
simulator-start: ## Boot iOS simulator (SIMULATOR="iPhone 14")
	xcrun simctl boot "$(SIMULATOR)"

.PHONY: emulator-stop
emulator-stop: ## Stop running Android emulator
	adb emu kill

.PHONY: copy-builds
copy-builds: ## Copy .apk and .app from ANDROID_SRC / IOS_SRC into local build/ folders
	@test -n "$(ANDROID_SRC)" || (echo "ANDROID_SRC is not set — add it to .env or pass on the command line"; exit 1)
	@test -n "$(IOS_SRC)"     || (echo "IOS_SRC is not set — add it to .env or pass on the command line"; exit 1)
	@mkdir -p $(dir $(ANDROID_BUILD)) $(dir $(IOS_BUILD))
	cp "$(ANDROID_SRC)" "$(ANDROID_BUILD)"
	rm -rf "$(IOS_BUILD)"
	cp -r "$(IOS_SRC)" "$(IOS_BUILD)"
	@echo "Builds copied."

.PHONY: install-android
install-android: ## Install APK on connected Android device (ANDROID_BUILD=)
	adb install $(ANDROID_BUILD)

.PHONY: install-ios
install-ios: ## Install app on booted iOS simulator (IOS_BUILD=)
	xcrun simctl install booted $(IOS_BUILD)

.PHONY: gherkin-extract
gherkin-extract: ## Extract Gherkin dictionary from features and step-definitions
	node maestro/scripts/gherkin-dictionary/extract.js

.PHONY: gherkin-report
gherkin-report: gherkin-extract ## Extract and serve gherkin dictionary UI (PORT=8080)
	./node_modules/.bin/http-server ./maestro/scripts/gherkin-dictionary/reports -c-1 -a localhost -p $(PORT) -o index.html
