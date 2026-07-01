# Link playbooks locally (optional)

Symlinks [`docs/agent/`](../../docs/agent/) playbooks into **`.agent/skills/`** at the repo root (gitignored). One-time setup after clone.

## Unix / macOS / WSL

```bash
bash contrib/ide/skills/install-skills.sh
```

## Windows (PowerShell)

```powershell
.\contrib\ide\skills\install-skills.ps1
```

Custom target directory:

```bash
SKILLS_DIR=.my-ide/skills bash contrib/ide/skills/install-skills.sh
```

```powershell
$env:SKILLS_DIR = ".my-ide/skills"; .\contrib\ide\skills\install-skills.ps1
```

If your IDE expects a different skills path, point it at `.agent/skills/` or symlink that folder to your tool's layout.

Project rules: [`AGENTS.md`](../../AGENTS.md). Hooks: [`contrib/ide/hooks/`](../hooks/README.md).
