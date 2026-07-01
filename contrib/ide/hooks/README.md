# IDE hooks (optional)

Quality hooks live in [`maestro/scripts/hooks/`](../../maestro/scripts/hooks/). They are **not** run by `npm run check` — wire them in your IDE if it supports post-edit / pre-write commands.

| Script | When to run | Purpose |
|--------|-------------|---------|
| `block-secrets.js` | Before saving tracked files | Block credentials outside `.env` |
| `validate-edit.js` | After editing `.feature`, step-defs, flows | Run static validate |
| `env-readiness.js` | Session start | Print device/env summary |

Example (replace `$REPO` with your project root):

```bash
node "$REPO/maestro/scripts/hooks/block-secrets.js"
node "$REPO/maestro/scripts/hooks/validate-edit.js"
node "$REPO/maestro/scripts/hooks/env-readiness.js"
```

Each IDE uses a different config file and variable names for the repo root — consult your tool's docs. The hook scripts themselves are **IDE-agnostic**.

See also: [`docs/agent/`](../../docs/agent/README.md), [`AGENTS.md`](../../AGENTS.md).
