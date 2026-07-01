#!/usr/bin/env node
'use strict'

/**
 * Resuelve la ruta al CLI de Maestro para spawn/exec desde Node (npm no hereda siempre el mismo PATH).
 * Entorno soportado: macOS y Linux (incl. WSL). Orden: MAESTRO_CLI / MAESTRO_PATH → which → ~/.maestro/bin/maestro.
 */
const fs = require('fs')
const os = require('os')
const path = require('path')

// Raíz del repo (…/maestro/scripts → ../../). Maestro IDE no ejecuta este módulo: ahí siguen aplicando defaults en YAML o variables del IDE.
require('dotenv').config({
  path: path.join(__dirname, '..', '..', '.env'),
})
const { execFileSync } = require('child_process')

let cached = null

function resolveMaestroBinary() {
  const fromEnv = process.env.MAESTRO_CLI || process.env.MAESTRO_PATH || process.env.MAESTRO_BINARY
  if (fromEnv) {
    if (fs.existsSync(fromEnv)) return fromEnv
    console.warn(`[resolve-maestro-bin] MAESTRO_CLI/MAESTRO_PATH/MAESTRO_BINARY no existe: ${fromEnv}`)
  }

  try {
    const out = execFileSync('which', ['maestro'], { encoding: 'utf8' }).trim()
    const first = out.split('\n')[0].trim()
    if (first && fs.existsSync(first)) return first
  } catch (_) {
    /* which no encontró maestro */
  }

  const home = process.env.HOME || ''
  const candidates = [
    path.join(home, '.maestro', 'bin', 'maestro'),
  ]
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p
  }

  return 'maestro'
}

function getMaestroBinary() {
  if (!cached) cached = resolveMaestroBinary()
  return cached
}

/**
 * Flags opcionales para Android: dispositivo explícito y reinstalar driver Maestro.
 */
function appendAndroidMaestroFlags(maestroArgs, platform) {
  if (platform !== 'android') return
  const serial = process.env.ANDROID_SERIAL || process.env.ANDROID_DEVICE_SERIAL
  if (serial) {
    maestroArgs.push('--device', serial)
  }
  if (/^(1|true|yes)$/i.test(process.env.MAESTRO_REINSTALL_DRIVER || '')) {
    maestroArgs.push('--reinstall-driver')
  }
}

/** Carpeta `maestro/` del repo (flows, config.yaml). */
function getMaestroWorkspaceDir() {
  return path.resolve(path.join(__dirname, '..'))
}

function rmQuiet(targetPath) {
  if (!fs.existsSync(targetPath)) return
  const st = fs.statSync(targetPath)
  if (st.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true })
  } else {
    fs.unlinkSync(targetPath)
  }
}

/**
 * Borra ~/.maestro/session y ~/.maestro/sessions para forzar una sesión CLI nueva.
 *
 * Pensado para desarrollo local (un dispositivo / un runner): evita fallos si Maestro Studio
 * dejó una sesión colgada (connection refused en localhost:7001, mobile-dev-inc/maestro#3065).
 *
 * No usar en CI con varios workers Maestro en la misma máquina: compiten por ese directorio.
 * En ese caso define MAESTRO_KEEP_SESSION=1 o aísla cada job (agente/contenedor distinto).
 * El gherkin-runner solo invoca esto con executor=local (no en BrowserStack).
 *
 * Omitir limpieza: MAESTRO_KEEP_SESSION=1
 */
function clearMaestroCliSessionStore() {
  if (/^(1|true|yes)$/i.test(process.env.MAESTRO_KEEP_SESSION || '')) {
    return
  }
  const base = path.join(os.homedir(), '.maestro')
  const candidates = [path.join(base, 'session'), path.join(base, 'sessions')]
  for (const sessionPath of candidates) {
    try {
      if (!fs.existsSync(sessionPath)) continue
      rmQuiet(sessionPath)
      console.log(`[maestro] Sesión CLI reiniciada (eliminado: ${sessionPath}). Cierra Maestro Studio si sigue abierto.`)
    } catch (e) {
      console.warn(`[maestro] No se pudo borrar ${sessionPath}: ${e.message}`)
    }
  }
}

/**
 * Preparación antes de `maestro test` Android en local (gherkin-runner, executor=local).
 */
function prepareMaestroAndroidBeforeCliRun() {
  clearMaestroCliSessionStore()
}

/**
 * Argumentos base `maestro test` con `--config` si existe maestro/config.yaml.
 */
function buildMaestroTestArgs(platform, maestroWorkspaceDir) {
  const ws = maestroWorkspaceDir || getMaestroWorkspaceDir()
  const maestroArgs = ['test']
  const configYaml = path.join(ws, 'config.yaml')
  if (fs.existsSync(configYaml)) {
    maestroArgs.push('--config', configYaml)
  }
  maestroArgs.push('-p', platform)
  appendAndroidMaestroFlags(maestroArgs, platform)
  return { maestroArgs, cwd: ws }
}

/**
 * Formato `--env` de Maestro. Valores con espacios: KEY="valor con espacios"
 * (ver mobile-dev-inc/Maestro#1726).
 */
function formatMaestroEnvArg(key, value) {
  const s = String(value)
  if (/[\s"]/.test(s)) {
    return `${key}="${s.replace(/"/g, '\\"')}"`
  }
  return `${key}=${s}`
}

/** Añade flags `--env` al comando Maestro. */
function appendMaestroEnvArgs(maestroArgs, env) {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined || v === null) continue
    maestroArgs.push('--env', formatMaestroEnvArg(k, v))
  }
}

/** Ejecuta el CLI de Maestro desde Node. */
function execMaestroSync(maestroArgs, extraOpts) {
  const maestroBin = getMaestroBinary()
  const extra = extraOpts || {}
  const opts = {
    stdio: 'inherit',
    ...extra,
    env: {
      ...process.env,
      ...(extra.env || {}),
    },
  }
  execFileSync(maestroBin, maestroArgs, opts)
}

module.exports = {
  getMaestroBinary,
  resolveMaestroBinary,
  execMaestroSync,
  appendMaestroEnvArgs,
  formatMaestroEnvArg,
  appendAndroidMaestroFlags,
  getMaestroWorkspaceDir,
  clearMaestroCliSessionStore,
  prepareMaestroAndroidBeforeCliRun,
  buildMaestroTestArgs,
}
