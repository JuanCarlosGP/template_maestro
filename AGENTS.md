# Izertis Maestro Template — agent rules

E2E test **framework template** by **Izertis**, driven by **Maestro** and **Gherkin**. Uses fictional demo scenarios to illustrate the structure — replace them with real tests for your app.

Harness prose is in English; **generated test output (Gherkin scenarios, branch slugs) stays in Spanish** to match team conventions.

Optional AI playbooks live in [`docs/agent/`](docs/agent/README.md). They are not required to run tests.

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

Tras hacer fork, sustituye los demos por tests reales — ver [README](README.md#tras-crear-tu-proyecto).

## Conventions

- **One JSON per feature area** in `step-definitions/` (e.g. `demo-login.json`).
  Add a new file for a new area — do not bloat existing ones.
- **Longest matching pattern wins.** Among all step definitions that match a Gherkin step,
  the runner picks the one with the longest `pattern`. Files load alphabetically, but array
  order within a JSON is not the tie-breaker. Prefer longer, more specific patterns; avoid
  near-duplicates (the Gherkin dictionary warns on ambiguity).
- **Parameterised steps** use a regex `pattern` plus a `params` array; the captured groups
  are passed to the flow as `--env` vars (e.g. `USERNAME`, `PASSWORD`).
- **Flow file shape:** `appId: ${APP_ID}` header, a `name:`, then `---`, then steps.
- **Platform-specific flows** live in `ios/` and `android/`; shared logic in `shared/`.
  The entry flow in `flows/` branches by platform. Cover **both iOS and Android**.
- **Never hardcode credentials** in tracked files. `USERNAME`/`PASSWORD`/`AZURE_DEVOPS_PAT`
  live only in `.env` (gitignored).

## Environment

- Config lives in `.env` (copy from `.env.example`). Key vars: `AZURE_DEVOPS_PAT`,
  `AZURE_DEVOPS_ORG`, `AZURE_DEVOPS_PROJECT`, `AZURE_TEST_PLAN_ID`, `AZURE_TEST_SUITE_ID`
  (`PLAN_ID` / `SUITE_ID` legacy aliases), `ANDROID_APP_ID`,
  `IOS_APP_ID`, `ANDROID_APP_NAME`, `IOS_APP_NAME`, `PLATFORM`, `USERNAME`, `PASSWORD`.
- **`APP_SOURCE_DIR`** — the local app checkout for selector discovery. Override in `.env`.

## Running tests

```bash
npm run setup                                              # bootstrap (env + deps + Maestro + doctor)
npm run check                                              # headless CI gate
npm run validate                                           # static check, no device needed
npm run doctor                                             # preflight: deps, Maestro, devices, PAT
npm run feature -- --feature maestro/features/DemoLogin.feature --platform ios --no-publish
npm run flow:ios -- --flow maestro/flows/DemoLogin.yml     # direct flow, no runner
npm run flow:android -- --flow maestro/flows/DemoLogin.yml
npm run gherkin-report                                     # Gherkin dictionary UI
```

`NO_PUBLISH`: pass `--no-publish` to the runner to keep results off Azure.

## Guardrails

- Always run `npm run validate` after editing features/step-defs/flows.
- Always run `npm run gherkin-extract` after changing Gherkin or step definitions.
