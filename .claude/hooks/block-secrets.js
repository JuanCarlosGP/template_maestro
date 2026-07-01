#!/usr/bin/env node

'use strict'

// PreToolUse hook for Edit|Write. Blocks writing real credentials into tracked files.
// Secrets belong only in .env / .env.local (gitignored). Exit 2 blocks the write and
// feeds the reason back to Claude.

let raw = ''
process.stdin.on('data', c => { raw += c })
process.stdin.on('end', () => {
  let input
  try {
    input = JSON.parse(raw)
  } catch {
    process.exit(0)
  }

  const ti = input.tool_input || {}
  const filePath = ti.file_path || ''

  // Allowed homes for secrets.
  if (/(^|\/)\.env(\.|$)/.test(filePath) || /(^|\/)\.env\.local$/.test(filePath)) process.exit(0)
  // Templates legitimately show empty keys.
  if (/\.env\.example$/.test(filePath) || /\.env\.template$/.test(filePath)) process.exit(0)

  const content = [ti.content, ti.new_string].filter(Boolean).join('\n')
  if (!content) process.exit(0)

  // Patterns: a secret-looking key assigned a non-empty, non-placeholder value.
  const patterns = [
    /AZURE_DEVOPS_PAT\s*[:=]\s*['"]?[A-Za-z0-9]{20,}/,
    /\b(PASSWORD|PASSWD|PWD)\s*[:=]\s*['"]?(?!\s*$)(?!\$\{)(?!<)[^\s'"]{3,}/i,
    /\b(USERNAME|USER)\s*[:=]\s*['"]?(?!\s*$)(?!\$\{)(?!<)(?!planes\b)[^\s'"]{3,}/i,
  ]

  const hit = patterns.find(p => p.test(content))
  if (hit) {
    process.stderr.write(
      `Blocked: this write appears to put a real credential into a tracked file (${filePath}).\n` +
      `Credentials must live only in .env / .env.local. Reference them via \${VAR} instead.`
    )
    process.exit(2)
  }

  process.exit(0)
})
