#!/usr/bin/env node
/**
 * CI failure triage via Cursor SDK (local agent on the runner).
 * Reads reports/summary.json + Maestro screenshots, writes reports/ci-triage.md,
 * and may apply a minimal fix (e.g. stale assertion text). Does not commit.
 *
 * Env:
 *   CURSOR_API_KEY  — required
 *   REPORT_DIR      — default reports
 *   CI_TRIAGE_APPLY — "1" to allow editing flows/features (default 1 in CI)
 */
'use strict'

const fs = require('fs')
const path = require('path')

async function main() {
  const apiKey = process.env.CURSOR_API_KEY
  if (!apiKey) {
    console.error('CURSOR_API_KEY is not set — skip triage')
    process.exit(0)
  }

  const reportDir = path.resolve(process.env.REPORT_DIR || 'reports')
  const summaryPath = path.join(reportDir, 'summary.json')
  if (!fs.existsSync(summaryPath)) {
    console.error(`No ${summaryPath} — skip triage`)
    process.exit(0)
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
  const failed = []
  for (const platform of summary.platforms || []) {
    for (const r of platform.results || []) {
      if (r.status === 'failed') {
        failed.push({ platform: platform.name, ...r })
      }
    }
  }

  if (failed.length === 0) {
    console.log('No failed scenarios — skip triage')
    process.exit(0)
  }

  const shotsRoot = path.join(reportDir, 'maestro-screenshots')
  const screenshots = []
  if (fs.existsSync(shotsRoot)) {
    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name)
        if (ent.isDirectory()) walk(p)
        else if (/\.(png|jpe?g|webp)$/i.test(ent.name)) screenshots.push(p)
      }
    }
    walk(shotsRoot)
  }

  const flowHints = new Set()
  for (const f of failed) {
    for (const fr of f.flows || []) {
      if (fr.status === 'failed' && fr.flow) flowHints.add(fr.flow)
    }
    if (f.featureFile) flowHints.add(`maestro/features/${f.featureFile}`)
  }

  const apply = (process.env.CI_TRIAGE_APPLY || '1') === '1'
  const triageOut = path.join(reportDir, 'ci-triage.md')

  const prompt = `Eres el agente de triage de fallos E2E en CI del Izertis Maestro Template.

Sigue la fase de diagnóstico de docs/agent/debug-flow/SKILL.md (NO relances el emulador ni Maestro).
NO uses el playbook sanity-reviewer (ese es post-verde / cobertura HU).

## Fallos (de reports/summary.json)
${JSON.stringify(failed, null, 2)}

## Screenshots disponibles (léelas si hace falta)
${screenshots.length ? screenshots.map((p) => `- ${p}`).join('\n') : '(ninguna)'}

## Flows / features a revisar
${[...flowHints].map((x) => `- ${x}`).join('\n') || '(ver summary)'}

## Tareas
1. Identifica la causa más probable (copy/assert desactualizado, selector, timing, flaky externo, etc.).
2. Escribe el informe en español en \`${triageOut}\` con:
   - Veredicto
   - Escenario(s) fallidos
   - Causa probable
   - Evidencia (screenshot / step)
   - Fix propuesto (archivos y cambio concreto)
   - Riesgo si se aplica
3. ${apply
    ? `Si la causa es claramente un texto/assert desactualizado (p. ej. marketing de una web externa) y puedes inferir el texto nuevo con alta confianza desde la screenshot o el contexto, APLICA el cambio mínimo en el YAML del flow y/o el .feature. No toques otros archivos. No hagas commit ni push.`
    : `NO modifiques archivos del repo; solo escribe el informe.`}

Responde en el chat con un resumen breve al terminar.`

  let Agent
  let CursorAgentError
  try {
    ;({ Agent, CursorAgentError } = require('@cursor/sdk'))
  } catch {
    console.error('Install @cursor/sdk in this job before running triage (npm install @cursor/sdk)')
    process.exit(1)
  }

  console.log(`Triaging ${failed.length} failed scenario(s); screenshots=${screenshots.length}; apply=${apply}`)

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: 'composer-2.5' },
      local: { cwd: process.cwd() },
    })
    console.log('agent status:', result.status)
    if (result.result) console.log(String(result.result).slice(0, 4000))
    if (result.status === 'error') process.exit(2)
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error('CursorAgentError:', err.message, 'retryable=', err.isRetryable)
      process.exit(1)
    }
    throw err
  }

  if (fs.existsSync(triageOut)) {
    const md = fs.readFileSync(triageOut, 'utf8')
    const summaryFile = process.env.GITHUB_STEP_SUMMARY
    if (summaryFile) {
      fs.appendFileSync(summaryFile, `\n## CI triage (Cursor)\n\n${md}\n`)
    }
    console.log(`Wrote ${triageOut}`)
  } else {
    console.warn(`Agent finished but ${triageOut} was not created`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
