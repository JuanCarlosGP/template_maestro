# Test execution targets (suite, feature shortcuts, direct Maestro flows).
# Included from the root Makefile — variables FEATURE, CASE_ID, FLOW, NO_PUBLISH,
# PLAN_ID, SUITE_ID, PLATFORM, etc. must be defined before include.
#
# flow-android/ios run with cwd=maestro/ (same as gherkin-runner) so Maestro CLI
# artifacts land in maestro/.maestro/, not a second .maestro/ at repo root.
FLOW_FILE = $(patsubst maestro/%,%,$(FLOW))

.PHONY: suite
suite: ## Run full suite from Azure Test Plans (set NO_PUBLISH= to enable publishing)
	node maestro/scripts/gherkin-runner.js \
	  --from-suite \
	  --plan-id $(PLAN_ID) \
	  --suite-id $(SUITE_ID) \
	  --platform $(PLATFORM) \
	  --android-app-id $(ANDROID_APP_ID) \
	  --ios-app-id $(IOS_APP_ID) \
	  --username $(USERNAME) \
	  --password $(PASSWORD) \
	  $(if $(NO_PUBLISH),--no-publish)

.PHONY: feature
feature: ## Run a single feature (FEATURE=, CASE_ID=, PLATFORM=, NO_PUBLISH=)
	node maestro/scripts/gherkin-runner.js \
	  --feature $(FEATURE) \
	  --plan-id $(PLAN_ID) \
	  --suite-id $(SUITE_ID) \
	  $(if $(CASE_ID),--case-id $(CASE_ID)) \
	  --platform $(PLATFORM) \
	  --android-app-id $(ANDROID_APP_ID) \
	  --ios-app-id $(IOS_APP_ID) \
	  --username $(USERNAME) \
	  --password $(PASSWORD) \
	  $(if $(NO_PUBLISH),--no-publish)

.PHONY: demo-login
demo-login: ## Run DemoLogin feature shortcut (PLATFORM=, NO_PUBLISH=; default PLATFORM from .env)
	node maestro/scripts/gherkin-runner.js \
	  --feature maestro/features/DemoLogin.feature \
	  --platform $(PLATFORM) \
	  --android-app-id $(ANDROID_APP_ID) \
	  --ios-app-id $(IOS_APP_ID) \
	  --username $(USERNAME) \
	  --password $(PASSWORD) \
	  $(if $(NO_PUBLISH),--no-publish)

.PHONY: flow-android
flow-android: ## Run a Maestro flow directly on Android (FLOW=)
	cd maestro && maestro test --config config.yaml -p android \
	  $(if $(ANDROID_SERIAL),--device $(ANDROID_SERIAL),) \
	  --env APP_ID=$(ANDROID_APP_ID) \
	  --env APP_NAME="$(ANDROID_APP_NAME)" \
	  $(FLOW_FILE)

.PHONY: flow-ios
flow-ios: ## Run a Maestro flow directly on iOS (FLOW=)
	cd maestro && maestro test --config config.yaml -p ios \
	  --env APP_ID=$(IOS_APP_ID) \
	  --env APP_NAME="$(IOS_APP_NAME)" \
	  $(FLOW_FILE)
