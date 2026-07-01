#!/usr/bin/env node

'use strict'

// PostToolUse hook. When Claude edits a .feature, a step-definitions/*.json, or a Maestro
// flow .yml, run the static validator. On failure, exit 2 so the error is fed back to
// Claude. Non-relevant edits and a clean validation exit 0 silently.

const { execFileSync } = require('child_process')
const path = require('path')

let raw = ''
process.stdin.on('data', c => { raw += c })
process.stdin.on('end', () => {
  let filePath = ''
  try {
    filePath = (JSON.parse(raw).tool_input || {}).file_path || ''
  } catch {
    process.exit(0)
  }

  const relevant =
    /\.feature$/.test(filePath) ||
    /step-definitions\/.*\.json$/.test(filePath) ||
    /maestro\/(flows|shared|ios|android)\/.*\.yml$/.test(filePath)

  if (!relevant) process.exit(0)

  const validator = path.join(__dirname, '..', '..', 'maestro', 'scripts', 'validate.js')
  try {
    execFileSync('node', [validator], { stdio: 'pipe' })
    process.exit(0)
  } catch (err) {
    const out = (err.stdout || '').toString() + (err.stderr || '').toString()
    process.stderr.write(`Static validation failed after editing ${path.basename(filePath)}:\n${out}`)
    process.exit(2)
  }
})
