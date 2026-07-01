# IDE adapters (optional)

The template ships **neutral playbooks** in [`docs/agent/`](../../docs/agent/README.md). This folder contains **optional local wiring** — not required for npm or CI.

| Folder | Purpose |
|--------|---------|
| [`skills/`](skills/README.md) | Symlink playbooks → local `.agent/skills/` (gitignored) |
| [`hooks/`](hooks/README.md) | Wire [`maestro/scripts/hooks/`](../../maestro/scripts/hooks/) in your IDE |

Project rules: [`AGENTS.md`](../../AGENTS.md).

Local `.agent/` is **gitignored** if you run the install script.
