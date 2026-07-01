---
name: committing
description: Branch, commit, push, and open a DRAFT Azure DevOps pull request for review. Use when the user wants to commit/ship work in this repo, says "/committing", "commit this", "open a PR", or when /author-e2e-test or /debug-flow reaches the commit step. This is the project-specific committing skill for the Izertis Maestro Template repo — prefer it over any global commit skill here.
---

# Committing (Azure DevOps, draft PR)

This repo is the **Izertis Maestro Template**, typically hosted on **Azure DevOps**
(`git@ssh.dev.azure.com:v3/your-org/your-project/izertis-maestro-template`).
Adjust org, project, and repository name to match your fork.
The flow ends in a **draft PR** the user reviews and publishes manually. Never publish the
PR yourself.

## Phase 1 — Stage & review

1. `git status` and `git diff` to see what changed. Confirm `node maestro/scripts/validate.js`
   passes if features/step-defs/flows were touched.
2. **Never stage secrets** — no real `USERNAME`/`PASSWORD`/`AZURE_DEVOPS_PAT` in tracked
   files (the pre-write hook guards this; double-check `.env` is not staged).
3. Identify the **work item ID** in play (from the user, the branch, or the originating
   `/author-e2e-test` / `/debug-flow` run).

## Phase 2 — Branch

Follow the repo convention `<type>/<workitemId>_<slug>` with a **Spanish snake_case slug**
derived from the work item title (e.g. `feat/12345_login_demo`,
`fix/12345_login_timeout`). Types: `feat` (new test), `fix` (flow fix), `chore`
(framework/tooling).

```bash
git switch -c <type>/<id>_<slug>    # if not already on a suitable branch; else reuse it
```

If already on a feature branch for this work, reuse it instead of creating a new one. Never
commit directly to `master`.

## Phase 3 — Commit

Propose a **conventional commit** message referencing the work item, get a quick
confirmation, then commit:

```
[<id>] <type>: <imperative summary in Spanish or English, matching repo tone>

<short why, if not obvious>
```

```bash
git add <paths>      # explicit paths, never `git add .` blindly
git commit -m "..."
git push -u origin <branch>
```

## Phase 4 — Open the DRAFT PR

Prefer the **`azure-devops` MCP** to create the pull request:

- repository `izertis-maestro-template`, source = your branch, target = `master`
- **`isDraft: true`**
- link the work item `#<id>`
- title mirrors the commit summary; description includes what changed, platforms verified
  (iOS/Android), and any unverified selectors or dropped cases.

If the MCP lacks a PR-creation tool, fall back to the **Azure DevOps REST API** with
`AZURE_DEVOPS_PAT` (same auth as `maestro/scripts/publish-results.js`):
`POST /{org}/{project}/_apis/git/repositories/izertis-maestro-template/pullrequests?api-version=7.1`
with body `{ "sourceRefName": "refs/heads/<branch>", "targetRefName": "refs/heads/master",
"title": "...", "description": "...", "isDraft": true,
"workItemRefs": [{ "id": "<id>" }] }`.

## Phase 5 — Hand back

Report the PR URL and that it is in **draft**. The user reviews and publishes it manually.
