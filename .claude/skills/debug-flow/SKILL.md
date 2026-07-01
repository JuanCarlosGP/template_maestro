---
name: debug-flow
description: Diagnose and fix a failing Maestro flow or feature, re-run until green (bounded), then commit. Use when a flow/feature fails on device and the user says "fix the failing test", "debug <flow>", "/debug-flow <feature-or-flow>", or pastes a Maestro failure. Not for authoring a new test from scratch (use /author-e2e-test).
---

# Debugging a failing Maestro flow

Input: a feature path, a flow name, or a pasted failure. Goal: find the root cause, fix
it, confirm green on device, and commit via `/committing`.

## Phase 1 — Reproduce

1. Run the failing target and capture the full Maestro output:
   ```bash
   make feature FEATURE=maestro/features/<Area>.feature PLATFORM=<plat>
   # or, faster, the single flow:
   make flow-ios     FLOW=maestro/flows/<Name>.yml
   make flow-android FLOW=maestro/flows/<Name>.yml
   ```
2. Note the **exact failing step** and the **screenshot** the runner reports
   (`findLatestScreenshot` prints the path; also under `~/.maestro/tests/`). Read it.

## Phase 2 — Diagnose

Identify the root cause, commonly one of:

- **Selector drift** — copy/`testID` changed. Confirm against the live screen and
  `APP_SOURCE_DIR`; launch the `selector-explorer` agent for the affected screen.
- **Timing** — element not yet visible. Needs `extendedWaitUntil` / a longer `timeout` /
  `waitForAnimationToEnd`.
- **Step mapping** — a Gherkin step resolves to the wrong/missing flow, or first-match
  ordering picked a more general pattern. Check `step-definitions/*.json`.
- **Platform divergence** — works on one platform, not the other; the shared/ios/android
  split is wrong.
- **Data** — depends on non-deterministic backend data (candidate for the MSW mock env).

Use the **`maestro` MCP** to poke the live screen — drive to the failing step, read the
hierarchy, screenshot — to confirm the cause (e.g. a selector that no longer matches)
before editing. For selector drift, the `selector-explorer` agent does this for you.

State the root cause before changing anything.

## Phase 3 — Fix + re-run (bounded)

Apply the fix, then re-run on the affected platform(s). After edits, `validate.js` runs via
the post-edit hook — keep it green. The device loop is **bounded**:

- **Max 3 attempts per platform**, AND **stop on two consecutive identical failures**.

If the gate trips while still red, **stop and escalate**: propose dropping the case's
automation, or switching to a dev build against **MSW** (`environment=mock`,
`MOCK_SERVER_URL`) when the failure is data-driven. Don't loop indefinitely.

## Phase 4 — Commit

Once green on the affected platform(s), invoke the **`/committing`** skill to branch,
commit, push, and open a **draft** Azure DevOps PR. Summarise the root cause and the fix
in the commit/PR description.
