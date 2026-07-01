# Symlink docs/agent playbooks into local .agent/skills/ (gitignored).
$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$Skills = if ($env:SKILLS_DIR) {
  Join-Path $Root $env:SKILLS_DIR
} else {
  Join-Path $Root ".agent\skills"
}
$Agent = Join-Path $Root "docs\agent"

New-Item -ItemType Directory -Force -Path $Skills | Out-Null

foreach ($name in @("author-e2e-test", "debug-flow", "run-tests-e2e", "committing")) {
  $target = Join-Path $Skills $name
  if (Test-Path $target) { Remove-Item $target -Recurse -Force }
  $source = Join-Path $Agent $name
  New-Item -ItemType Junction -Path $target -Target $source | Out-Null
  Write-Host "Linked $target -> $source"
}

Write-Host "Done. Local skills at: $Skills"
