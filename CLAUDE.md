# Izertis Maestro Template — Claude Code rules

E2E test **framework template** by **Izertis**, driven by **Maestro** and **Gherkin**. Uses fictional demo scenarios to illustrate the structure — replace them with real tests for your app.

Harness prose is in English; **generated test output (Gherkin scenarios, branch slugs) stays in Spanish** to match team conventions.

## Architecture

```
Azure Test Plans ──► gherkin-runner.js ──► step-definitions/ ──► flows/*.yml ──► device
        ▲                                                                            │
        └──────────────────── publish-results.js ◄───────────────────────────────────┘
```

- **Features** (`maestro/features/*.feature`) — scenarios in Gherkin (Spanish).
- **Step definitions** (`maestro/step-definitions/*.json`) — map each Gherkin step to a
  Maestro flow name (or `null` when the step is a precondition/assertion handled inside
  another flow). `index.js` auto-discovers and merges every `*.json` in that directory.
- **Flows** (`maestro/flows/*.yml`) — the Maestro flow the runner invokes by name.
  `flows/X.yml` typically delegates to `shared/X.yml`, which branches per platform into
  `ios/` and `android/` flows via `runFlow: when: { platform: iOS | Android }`.
- **Runner** (`maestro/scripts/gherkin-runner.js`) — parses features, resolves steps,
  runs the flows on device, and (unless `--no-publish`) publishes results to Azure.

## Demo scenarios (template)

| Feature | Pattern |
| ------- | ------- |
| `DemoOnboarding.feature` | Platform split via `flows/` → `android/` / `ios/` |
| `DemoLogin.feature` | Shared flow with params (`USERNAME`, `PASSWORD`) |
| `DemoAndroidMenu.feature` | Android-only flow |
| `DemoIosTabs.feature` | iOS-only flow |

## Conventions

- **One JSON per feature area** in `step-definitions/` (e.g. `demo-login.json`).
  Add a new file for a new area — do not bloat existing ones.
- **First match wins.** The runner takes the first matching step across the merged list,
  loaded alphabetically by file then array order. Put the more specific pattern first.
- **Parameterised steps** use a regex `pattern` plus a `params` array; the captured groups
  are passed to the flow as `--env` vars (e.g. `USERNAME`, `PASSWORD`).
- **Flow file shape:** `appId: ${APP_ID}` header, a `name:`, then `---`, then steps.
- **Platform-specific flows** live in `ios/` and `android/`; shared logic in `shared/`.
  The entry flow in `flows/` branches by platform. Cover **both iOS and Android**.
- **Never hardcode credentials** in tracked files. `USERNAME`/`PASSWORD`/`AZURE_DEVOPS_PAT`
  live only in `.env` (gitignored).

## Environment

- Config lives in `.env` (copy from `.env.example`). Key vars: `AZURE_DEVOPS_PAT`,
  `AZURE_DEVOPS_ORG`, `AZURE_DEVOPS_PROJECT`, `PLAN_ID`, `SUITE_ID`, `ANDROID_APP_ID`,
  `IOS_APP_ID`, `ANDROID_APP_NAME`, `IOS_APP_NAME`, `PLATFORM`, `USERNAME`, `PASSWORD`.
- **`APP_SOURCE_DIR`** — the local app checkout for selector discovery. Override in `.env`.

## Running tests

```bash
make feature FEATURE=maestro/features/DemoLogin.feature PLATFORM=ios
make flow-ios     FLOW=maestro/flows/DemoLogin.yml      # direct flow, no runner
make flow-android FLOW=maestro/flows/DemoLogin.yml
make validate                                        # static check, no device needed
make doctor                                          # preflight: deps, Maestro, devices, PAT
make gherkin-report                                  # Gherkin dictionary UI
```

`make setup` bootstraps a fresh machine (env + Node deps + Maestro CLI + preflight).

`NO_PUBLISH=1` (the default in the Makefile) keeps results from hitting Azure.

## Guardrails

- Always run `node maestro/scripts/validate.js` after editing features/step-defs/flows.
- Always run `make gherkin-extract` after changing Gherkin or step definitions.
