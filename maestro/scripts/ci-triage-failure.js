#!/usr/bin/env node
/**
 * CI failure triage via agent SDK (local on the runner).
 * Reads reports/summary.json + Maestro screenshots, writes a short reports/ci-triage.md,
 * and may apply a minimal fix (e.g. stale assertion text). Does not commit.
 *
 * Env:
 *   AGENT_API_KEY   — required (generic name; value is the agent provider key)
 *   REPORT_DIR      — default reports
 *   CI_TRIAGE_APPLY — "1" to allow editing flows/features (default 1 in CI)
 */
'use strict'

const fs = require('fs')
const path = require('path')

async function main() {
  const apiKey = process.env.AGENT_API_KEY
  if (!apiKey) {
    console.error('AGENT_API_KEY is not set — skip triage')
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

  const prompt = `Eres el Agente de triage de fallos E2E en CI (Izertis Maestro Template).
Diagnóstico solo (docs/agent/debug-flow): NO relances emulador ni Maestro.

## Fallos
${JSON.stringify(failed, null, 2)}

## Screenshots
${screenshots.length ? screenshots.map((p) => `- ${p}`).join('\n') : '(ninguna)'}

## Archivos a revisar
${[...flowHints].map((x) => `- ${x}`).join('\n') || '(ver summary)'}

## Obligatorio: escribe EXACTAMENTE este informe corto en español en \`${triageOut}\`
Máximo ~15 líneas. Sin relleno. Plantilla:

\`\`\`markdown
## Agente — triage E2E

**Qué pasa:** <1 frase clara>

**Escenario:** <nombre>

**Causa probable:** <1 frase>

**Cómo arreglarlo:**
1. <acción concreta (archivo + cambio)>
2. <alternativa breve>

**Screenshot:** \`<ruta relativa bajo reports/ si existe, o "no disponible">\`
\`\`\`

${apply
    ? 'Si el fallo es claramente un texto/assert desactualizado y ves el texto nuevo en la screenshot con alta confianza, aplica el cambio mínimo en el flow YAML y/o .feature. No toques nada más. No hagas commit.'
    : 'No modifiques el repo; solo el informe.'}

Al terminar, responde en chat con 2-3 líneas máximo.`

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
    if (result.result) console.log(String(result.result).slice(0, 1500))
    if (result.status === 'error') process.exit(2)
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error('Agent startup/run error:', err.message, 'retryable=', err.isRetryable)
      process.exit(1)
    }
    throw err
  }

  if (fs.existsSync(triageOut)) {
    const md = fs.readFileSync(triageOut, 'utf8')
    const summaryFile = process.env.GITHUB_STEP_SUMMARY
    if (summaryFile) {
      fs.appendFileSync(summaryFile, `\n${md}\n`)
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
