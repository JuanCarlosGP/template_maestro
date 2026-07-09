# Agent playbooks (optional)

Neutral markdown playbooks for **AI-assisted E2E authoring**. Not required to run tests — the official contract is **npm** (`npm run check`, `npm run feature`, …).

## Contents

| Path | Purpose |
|------|---------|
| [`author-e2e-test/`](author-e2e-test/SKILL.md) | Automate a test case from a TMS ticket + Gherkin |
| [`debug-flow/`](debug-flow/SKILL.md) | Fix a failing feature or flow |
| [`run-tests-e2e/`](run-tests-e2e/SKILL.md) | Validate, smoke-test, run on device |
| [`committing/`](committing/SKILL.md) | Branch, commit, draft PR |
| [`agents/test-planner.md`](agents/test-planner.md) | Plan before building (writes `e2e-specs/specs/<id>.md`) |
| [`agents/selector-explorer.md`](agents/selector-explorer.md) | Discover selectors on live device + app source |

Related:

- [`e2e-specs/`](../../e2e-specs/README.md) — automation planning specs (not [OpenSpec](https://openspec.dev/))
- [`.mcp.json`](../../.mcp.json) — **`maestro` only** by default — see [MCP setup](#mcp-mcpjson) below
- [`mcp-examples.md`](mcp-examples.md) — workflow guide + copy-paste JSON (Azure DevOps, GitHub, GitLab)
- [`AGENTS.md`](../../AGENTS.md) — project rules for any coding agent

## MCP (`.mcp.json`)

Optional. **Not used by `npm run check` or CI** — only for AI-assisted authoring (ticket fetch + live device when needed).

The template ships **only `maestro`** so the IDE opens without TMS auth errors. Add a TMS block when you need ticket/Gherkin fetch — see [`mcp-examples.md`](mcp-examples.md).

| Server | Purpose | Required? |
|--------|---------|-----------|
| **`maestro`** | Inspect screen, run flows, screenshots (`selector-explorer`, debug in `author-e2e-test`) | Only for live-device authoring |
| **`azure-devops`** | Read Azure DevOps work items / test cases and extract Gherkin | Only if tickets live in Azure DevOps |
| **`github`** | Read GitHub Issues / PRs (Gherkin in issue body) | Only if tickets live on GitHub — see [`mcp-examples.md`](mcp-examples.md) |
| **`gitlab`** | Read GitLab issues / MRs | Only if tickets live on GitLab — see [`mcp-examples.md`](mcp-examples.md) |

**Use one TMS block at a time.** After fork, keep `maestro` and paste **one** TMS block from [`mcp-examples.md`](mcp-examples.md), or skip TMS and paste Gherkin manually.

### Personalize after fork

1. **`maestro`** — Default path is Unix/macOS/WSL: `${HOME}/.maestro/bin/maestro`. On **Windows native**, point `command` at your Maestro binary, e.g. `${USERPROFILE}\\.maestro\\bin\\maestro.bat` (install manually; see [Maestro docs](https://docs.maestro.dev/getting-started/installing-maestro)).
2. **TMS (pick one)** — Workflow + JSON snippets: [`mcp-examples.md`](mcp-examples.md).
3. **No TMS MCP** — `test-planner` and `author-e2e-test` accept pasted Gherkin; `gh` / `glab` CLI also work.
4. **Auth** — Azure MCP uses **interactive browser login** (not `AZURE_DEVOPS_PAT` in `.env`). GitHub uses a PAT. GitLab uses OAuth. `.env` secrets are for the test runner (`publish-results.js`, credentials), not IDE MCP.

## Use with your IDE

These files are plain markdown — **no vendor-specific wiring in this repo**. Point your agent at `docs/agent/<playbook>/SKILL.md` and [`AGENTS.md`](../../AGENTS.md). Optionally symlink playbooks into your IDE's skills folder (local setup, not tracked in git).

Optional quality hooks: [`maestro/scripts/hooks/`](../../maestro/scripts/hooks/README.md) — wire in your IDE if it supports post-edit commands.

Extra playbooks can live in your **personal** IDE skills folder, not in this repo.
