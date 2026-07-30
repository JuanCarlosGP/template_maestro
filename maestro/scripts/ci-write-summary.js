#!/usr/bin/env node
/**
 * Write a short run summary markdown from reports/summary.json.
 * Always safe to run after gherkin-runner (pass or fail).
 *
 * Env:
 *   REPORT_DIR — default reports
 * Writes: reports/ci-summary.md and appends to GITHUB_STEP_SUMMARY if set.
 */
'use strict'

const fs = require('fs')
const path = require('path')

function fmtSec(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return '—'
  return `${(Number(ms) / 1000).toFixed(1)}s`
}

function main() {
  const reportDir = path.resolve(process.env.REPORT_DIR || 'reports')
  const summaryPath = path.join(reportDir, 'summary.json')
  const outPath = path.join(reportDir, 'ci-summary.md')

  if (!fs.existsSync(summaryPath)) {
    const md = `## Resultado E2E

**Estado:** sin informe (\`summary.json\` no generado)
`
    fs.mkdirSync(reportDir, { recursive: true })
    fs.writeFileSync(outPath, md, 'utf8')
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${md}\n`)
    }
    console.log(md)
    return
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
  const passed = summary.passed ?? summary.stats?.expected ?? 0
  const failed = summary.failed ?? summary.stats?.unexpected ?? 0
  const duration = summary.durationMs ?? summary.stats?.duration
  const ok = failed === 0
  const lines = []

  lines.push('## Resultado E2E')
  lines.push('')
  lines.push(`**Estado:** ${ok ? 'todos los tests OK' : 'hay fallos'}`)
  lines.push(`**Resumen:** ${passed} passed · ${failed} failed · ${fmtSec(duration)}`)
  lines.push('')

  const results = []
  for (const platform of summary.platforms || []) {
    for (const r of platform.results || []) {
      results.push({ platform: platform.name, ...r })
    }
  }

  if (results.length) {
    lines.push('| Escenario | Plataforma | Resultado | Tiempo |')
    lines.push('|-----------|------------|-----------|--------|')
    for (const r of results) {
      const name = String(r.title || r.scenario || '—').replace(/\|/g, '\\|')
      const status = r.status === 'passed' ? 'PASS' : 'FAIL'
      lines.push(`| ${name} | ${r.platform || '—'} | ${status} | ${fmtSec(r.durationMs)} |`)
    }
    lines.push('')
  }

  if (!ok) {
    lines.push('Ver detalle del Agente en `ci-triage.md` si el step de triage corrió.')
    lines.push('')
  }

  const md = `${lines.join('\n')}\n`
  fs.writeFileSync(outPath, md, 'utf8')
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${md}\n`)
  }
  console.log(md)
}

main()
