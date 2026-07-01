---
name: author-e2e-test
description: Author a Maestro E2E test from an Azure DevOps work item. Given a work item ID, fetches the linked test case's Gherkin, generates the .feature + step-definitions + Maestro flows for both iOS and Android, and runs them on device until green (bounded). Use when the user says "author the test for <work item>", "automate case <id>", "/author-e2e-test <id>", or points at an Azure work item that links a test case.
---

# Authoring an E2E test from an Azure work item

Input: an **Azure DevOps work item ID** (e.g. `12345`). The work item links a **Test
Case** whose `Microsoft.VSTS.TCM.Steps` field contains the **Gherkin** scenario. Example
reference: https://dev.azure.com/your-org/your-project/_workitems/edit/12345

Harness prose is English; **everything you generate (scenario names, steps, branch slugs)
stays in Spanish** to match the suite and the app's UI.

## Phase 0 — Plan (test-planner agent → OpenSpec)

Launch the **`test-planner`** agent with the work item ID. It fetches the work item +
linked test case, surveys existing flows/step-defs and the app source, and writes the
automation spec to `.openspec/specs/<work-item-id>.md`. **Show the user the plan and get a
quick confirmation** before building.

That spec is the **source of truth** for the rest of this skill: which scenario(s) to
automate, what to reuse, the per-platform split, and any up-front drop/MSW recommendation.
If `test-planner` already fetched the Gherkin into the spec, you can skip re-fetching in
Phase 1 and read it from the spec instead.

## Phase 1 — Fetch the Gherkin (Azure DevOps MCP)

1. Use the `azure-devops` MCP to read the work item by ID.
2. Follow its links to the related **Test Case** work item.
3. Read the Test Case's `Microsoft.VSTS.TCM.Steps` (and description) and extract the full
   `Feature:` / `Scenario:` Gherkin. If only a `Scenario:` is present, infer a sensible
   `Feature:` block from the work item title.
4. If the PAT/MCP is unavailable, fall back to the REST pattern used in
   `maestro/scripts/publish-results.js` (`fetchSuiteTestCases`) via a Node one-off, or ask
   the user to paste the Gherkin. Do not stall silently.

Echo the extracted Gherkin back to the user before generating, so they can confirm it.

## Phase 2 — Map to the suite structure

For the scenario:

1. Decide the **feature area** (e.g. `login`, `permissions`, `idioma`). Reuse an existing
   `.feature` file if the area exists; otherwise create `maestro/features/<Area>.feature`.
2. For **each step**, check `step-definitions/*.json` for an existing matching pattern.
   **Reuse it** — first-match-wins, so do not add near-duplicates. Only add a new entry
   (to the area's JSON, creating `step-definitions/<area>.json` if needed) for genuinely
   new steps. Preconditions/assertions handled inside another flow get `"flow": null`.
3. Parameterised steps use a regex `pattern` + `params` array (captured groups become
   `--env` vars). Put more specific patterns earlier.

## Phase 3 — Build the flows (both platforms)

For every **new** flow name a step maps to:

1. Launch the `selector-explorer` agent to get real selectors for the screen — **iOS and
   Android**. Give it the screen/interaction description and let it inspect the live
   device + `APP_SOURCE_DIR` + existing flows.
2. Create the flow following the suite shape:
   - `flows/<Name>.yml` — `appId: ${APP_ID}` header, `name:`, `---`, then either the steps
     directly or a `runFlow: ../shared/<Name>.yml` delegation.
   - When behaviour differs per platform, put shared logic in `shared/<Name>.yml` and
     branch with `runFlow: { when: { platform: iOS|Android }, file: ... }` into
     `ios/<Name>.yml` / `android/<Name>.yml` (mirror `AcceptPermissions`).
   - Prefer `id:` selectors; use exact Spanish copy for text selectors; `${APP_NAME}` for
     permission dialogs.
3. Reuse existing flows (e.g. `Login`, `AcceptPermissions`, `ChangeLanguage`) rather than
   duplicating their steps.

After writing, run `node maestro/scripts/validate.js` (the post-edit hook also runs it).
Fix any parse/resolution/missing-flow problems before touching a device.

## Phase 4 — Verify on device (bounded)

Run on **both** platforms (a booted iOS sim and Android emulator are required):

```bash
make feature FEATURE=maestro/features/<Area>.feature PLATFORM=all
# or per platform while iterating:
make flow-ios     FLOW=maestro/flows/<Name>.yml
make flow-android FLOW=maestro/flows/<Name>.yml
```

To debug between attempts, use the **`maestro` MCP** to drive the live app and inspect the
hierarchy interactively (find the right selector, confirm a tap works) before editing the
YAML. The bounded gate itself, though, always runs through the runner above — that's the
real Gherkin → step-def → flow → Azure path.

Iterate on failures (adjust selectors, add `extendedWaitUntil`, fix step mapping), but the
loop is **bounded**:

- **Max 3 device attempts per platform**, AND
- **stop on two consecutive identical failures** (no progress).

When the gate trips and it's still red, **stop and escalate** with options:

- **Drop automation** for this case (explain why it's impractical — e.g. native dialog,
  biometrics, non-deterministic data).
- **Switch to a dev build against MSW** — run with `environment=mock` /
  `MOCK_SERVER_URL` so data is deterministic (handlers live in
  `your-mobile-app/mock-service-worker/`). Recommend this when failures are data-driven.

## Phase 5 — Commit & open draft PR

When green on both platforms:

1. **Update the OpenSpec `Gate / Resultado`** section of `.openspec/specs/<id>.md`
   (Automatizado iOS+Android / Descartado + motivo / Requiere MSW).
2. **Invoke `/committing`** — it will branch (or reuse the current branch), stage the
   changed files (`.feature`, `step-definitions/`, `flows/`, `shared/`, `ios/`, `android/`,
   `.openspec/`), propose a conventional commit message referencing the work item ID, get a
   quick confirmation, commit, push, and open a **draft** Azure DevOps PR linked to the work
   item. Do not push or create the PR yourself — let `/committing` handle it.

If the bounded gate tripped and you dropped the case or switched to MSW, record that outcome
in the spec first, then still invoke `/committing` so the decision is captured in a PR for
review.
