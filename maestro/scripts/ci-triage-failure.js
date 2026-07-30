#!/usr/bin/env node
/**
 * CI failure triage via a pluggable agent provider (vendor-neutral).
 * Report-only: reads reports/summary.json + Maestro screenshots (+ live Maestro MCP
 * when a device is still connected), writes reports/ci-triage.md and a short
 * "Solución sugerida" into the Job Summary. Never edits features/flows; no PRs.
 *
 * Env:
 *   AGENT_API_KEY       — required (provider API key; store as CI secret)
 *   AGENT_PROVIDER      — optional adapter id (default: cursor — only one wired for now)
 *   AGENT_MAESTRO_MCP   — "1" (default) attach Maestro MCP; "0" to disable
 *   REPORT_DIR          — default reports
 */
'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const { listScenarioResults } = require('./lib/playwright-report')
const { loadAgentProvider } = require('./lib/agent-providers')

function maestroMcpConfig() {
  if ((process.env.AGENT_MAESTRO_MCP || '1') === '0') return undefined
  const bin =
    process.env.MAESTRO_BIN ||
    path.join(os.homedir(), '.maestro', 'bin', process.platform === 'win32' ? 'maestro.bat' : 'maestro')
  return {
    maestro: {
      type: 'stdio',
      command: bin,
      args: ['mcp', '--no-viewer', '--working-dir', process.cwd()],
    },
  }
}

function extractSuggestedFix(md) {
  const lines = String(md || '').split(/\r?\n/)
  for (const line of lines) {
    const m = line.match(/^\*\*Soluci[oó]n sugerida:\*\*\s*(.+)\s*$/i)
    if (m) return m[1].trim()
  }
  for (const line of lines) {
    const m = line.match(/^\*\*C[oó]mo arreglarlo:\*\*\s*$/i)
    if (m) continue
  }
  const howto = md.match(/\*\*C[oó]mo arreglarlo:\*\*\s*\n+1\.\s*(.+)/i)
  if (howto) return howto[1].trim()
  return null
}

function appendBriefToSummaries(brief, triagePath) {
  const block = `## Solución sugerida (Agente)

${brief}

Detalle: \`${path.relative(process.cwd(), triagePath).replace(/\\/g, '/')}\`
`

  const reportDir = path.dirname(triagePath)
  const ciSummary = path.join(reportDir, 'ci-summary.md')
  if (fs.existsSync(ciSummary)) {
    let existing = fs.readFileSync(ciSummary, 'utf8')
    existing = existing.replace(/\nVer detalle del Agente[^\n]*\n?/g, '\n')
    fs.writeFileSync(ciSummary, `${existing.trimEnd()}\n\n${block}\n`, 'utf8')
  }

  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (summaryFile) {
    fs.appendFileSync(summaryFile, `\n${block}\n`)
  }
}

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
  const failed = listScenarioResults(summary).filter((r) => r.status === 'failed')

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

  const triageOut = path.join(reportDir, 'ci-triage.md')
  const providerName = process.env.AGENT_PROVIDER || 'cursor'
  const mcpServers = maestroMcpConfig()

  let provider
  try {
    provider = loadAgentProvider(providerName)
  } catch (e) {
    console.error(e.message || e)
    process.exit(e.code === 'AGENT_PROVIDER_UNKNOWN' ? 0 : 1)
  }

  const prompt = `Eres el Agente de triage de fallos E2E en CI (Izertis Maestro Template).
Modo INFORME SOLAMENTE: no edites archivos, no hagas commit ni PR, no relances Maestro ni el emulador como suite completa.

## Fallos
${JSON.stringify(failed, null, 2)}

## Screenshots en disco
${screenshots.length ? screenshots.map((p) => `- ${p}`).join('\n') : '(ninguna)'}

## Archivos a revisar (solo lectura)
${[...flowHints].map((x) => `- ${x}`).join('\n') || '(ver summary)'}

## Maestro MCP
${
  mcpServers
    ? `Tienes el servidor MCP \`maestro\`. Úsalo para confirmar la causa (p. ej. jerarquía / texto visible en pantalla si el diálogo del fallo sigue abierto). Si MCP falla o no hay device, basate en screenshots + YAML/.feature.`
    : `Maestro MCP desactivado — usa screenshots + YAML/.feature.`
}

## Obligatorio: escribe EXACTAMENTE este informe corto en español en \`${triageOut}\`
Máximo ~15 líneas. Sin relleno. Plantilla:

\`\`\`markdown
## Agente — triage E2E

**Qué pasa:** <1 frase clara>

**Escenario:** <nombre>

**Causa probable:** <1 frase>

**Solución sugerida:** <1 frase concreta: archivo + cambio recomendado. NO digas "ya aplicado".>

**Cómo comprobarlo:** <1 frase; p. ej. qué mirar en screenshot o en MCP>

**Screenshot:** \`<ruta relativa bajo reports/ si existe, o "no disponible">\`
\`\`\`

Al terminar, responde en chat con 2-3 líneas máximo.`

  console.log(
    `Triaging ${failed.length} failed scenario(s); provider=${provider.id}; screenshots=${screenshots.length}; maestroMcp=${Boolean(mcpServers)}; apply=false`,
  )

  try {
    const result = await provider.prompt(prompt, {
      apiKey,
      cwd: process.cwd(),
      mcpServers,
      mode: 'plan',
    })
    console.log('agent status:', result.status)
    if (result.result) console.log(String(result.result).slice(0, 1500))
    if (result.status === 'error') process.exit(2)
  } catch (err) {
    if (err.code === 'AGENT_PROVIDER_ERROR' || err.code === 'AGENT_SDK_MISSING') {
      console.error('Agent provider error:', err.message, 'retryable=', err.isRetryable)
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

    const brief = extractSuggestedFix(md)
    if (brief) {
      appendBriefToSummaries(brief, triageOut)
      console.log('Solución sugerida:', brief)
    } else {
      console.warn('No **Solución sugerida:** line found in ci-triage.md')
    }
  } else {
    console.warn(`Agent finished but ${triageOut} was not created`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
