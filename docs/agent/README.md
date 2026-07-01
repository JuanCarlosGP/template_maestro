# Agent playbooks (optional)

Neutral markdown playbooks for **AI-assisted E2E authoring**. Not required to run tests — the official contract is **npm** (`npm run check`, `npm run feature`, …).

## Contents

| Path | Purpose |
|------|---------|
| [`author-e2e-test/`](author-e2e-test/SKILL.md) | Automate a test case from a TMS ticket + Gherkin |
| [`debug-flow/`](debug-flow/SKILL.md) | Fix a failing feature or flow |
| [`run-tests-e2e/`](run-tests-e2e/SKILL.md) | Validate, smoke-test, run on device |
| [`committing/`](committing/SKILL.md) | Branch, commit, draft PR |
| [`agents/test-planner.md`](agents/test-planner.md) | Plan before building (writes `.openspec/specs/<id>.md`) |
| [`agents/selector-explorer.md`](agents/selector-explorer.md) | Discover selectors on live device + app source |

Related:

- [`.openspec/`](../../.openspec/README.md) — automation specs (planning artifacts)
- [`.mcp.json`](../../.mcp.json) — MCP servers (Maestro, optional Azure DevOps)
- [`AGENTS.md`](../../AGENTS.md) — project rules for any coding agent

## Use with your IDE

These files are plain markdown — **no vendor folder in this repo**. Options:

1. **Read directly** — point your agent at `docs/agent/<playbook>/SKILL.md` and [`AGENTS.md`](../../AGENTS.md).
2. **Local symlinks** — run [`contrib/ide/skills/install-skills.ps1`](../../contrib/ide/skills/install-skills.ps1) or `.sh` (creates `.agent/skills/`; gitignored).
3. **Other layouts** — set `SKILLS_DIR` or symlink `.agent/skills/` to your IDE's expected path.

Optional hooks: [`contrib/ide/hooks/`](../../contrib/ide/hooks/README.md).

Extra playbooks can live in your **personal** IDE skills folder, not in this repo.
