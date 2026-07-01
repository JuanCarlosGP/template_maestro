---
name: run-tests-e2e
description: Run, validate, or smoke-test the Izertis Maestro Template Maestro suite. Use when asked to run, start, validate, check, smoke-test, or take a screenshot of the E2E suite. Covers the headless smoke path (no device) and device runs for iOS and Android.
---

This project is the **Izertis Maestro Template** — a Maestro E2E test suite (CLI tool, not a GUI). The "app to run" is
the runner pipeline: `validate` → `doctor` → `make feature|flow-ios|flow-android|suite`.

The agent path is `.claude/skills/run-tests-e2e/smoke.sh` — runs the two headless checks
that require no device and no app binary.

## Prerequisites

Node ≥ 18, Maestro CLI 2.x on PATH (installed via `make install-maestro`).

```
make install        # npm install (once)
```

## Agent path — headless smoke (no device needed)

```bash
bash .claude/skills/run-tests-e2e/smoke.sh
```

Exit 0 = feature files, step-definitions, and flows are all structurally consistent AND
the machine meets hard requirements (Node, Maestro, adb/xcrun). The `APP_SOURCE_DIR not
found` warning is expected when `your-mobile-app` is not checked out locally — it's a soft
warning, not a failure.

## Device runs — human / CI path

Requires a booted iOS simulator or Android emulator with the app installed, and `.env`
filled in (copy from `.env.example`, add `USERNAME`, `PASSWORD`, `AZURE_DEVOPS_PAT`).

```bash
# Static check only (no device)
make validate

# Preflight (checks toolchain + devices)
make doctor

# Single feature on iOS
make feature FEATURE=maestro/features/DemoLogin.feature PLATFORM=ios

# Single feature on Android
make feature FEATURE=maestro/features/DemoLogin.feature PLATFORM=android

# Run a Maestro flow directly (bypasses the Gherkin runner)
make flow-ios     FLOW=maestro/flows/DemoLogin.yml
make flow-android FLOW=maestro/flows/DemoLogin.yml

# Full suite from Azure Test Plans
make suite PLATFORM=all
```

`NO_PUBLISH=1` is the Makefile default — results are not sent to Azure unless you unset it.

## Gotchas

- **`make feature` needs `PLAN_ID` and `SUITE_ID`** from `.env`. Without them `make`
  expands them to empty strings and the runner errors with a missing plan-id complaint.
- **The Azure DevOps MCP uses browser auth, not the PAT in `.env`**. `AZURE_DEVOPS_PAT`
  in `.env` is only for `publish-results.js`. Don't confuse the two.
- **`APP_SOURCE_DIR` warning is harmless** unless you're authoring a new test and need
  to discover `testID` selectors from the app source. Set it in `.env` to point
  at a local checkout (`../your-mobile-app` or another worktree).
- **`make validate` exits 0 even with no `.env`** — it's a pure static parse. `make
  doctor` is the one that checks env and devices.
