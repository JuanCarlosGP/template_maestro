#!/usr/bin/env bash
# Symlink docs/agent playbooks into local .agent/skills/ (gitignored).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SKILLS="${SKILLS_DIR:-$ROOT/.agent/skills}"
AGENT="$ROOT/docs/agent"

mkdir -p "$SKILLS"

for name in author-e2e-test debug-flow run-tests-e2e committing; do
  target="$SKILLS/$name"
  rm -rf "$target"
  ln -s "$AGENT/$name" "$target"
  echo "Linked $target -> $AGENT/$name"
done

echo "Done. Local skills at: $SKILLS"
