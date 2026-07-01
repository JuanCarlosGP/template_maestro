#!/usr/bin/env node

'use strict'

// SessionStart hook. Prints a short readiness report so Claude knows the state of the
// world up front: which devices are booted, whether the Azure PAT is set, and whether
// APP_SOURCE_DIR exists. Stdout is added to Claude's context.

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function safe(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

const lines = ['Izertis Maestro Template — environment readiness:']

// iOS simulators
const booted = safe('xcrun simctl list devices booted')
  .split('\n')
  .filter(l => l.includes('(Booted)'))
  .map(l => '    ' + l.trim())
lines.push(booted.length ? `  iOS simulator booted:\n${booted.join('\n')}` : '  iOS simulator: none booted')

// Android emulators
const adbDevices = safe('adb devices').split('\n').slice(1).filter(l => l.includes('device') && !l.includes('offline'))
lines.push(adbDevices.length ? `  Android device/emulator: ${adbDevices.length} connected` : '  Android device/emulator: none connected')

// Azure PAT
lines.push(process.env.AZURE_DEVOPS_PAT ? '  AZURE_DEVOPS_PAT: set (used by the runner for publishing results)' : '  AZURE_DEVOPS_PAT: not in this env (publishing via make reads it from .env; the Azure MCP is independent — it uses interactive browser login)')

// App source dir
const appSrc = process.env.APP_SOURCE_DIR || path.join(__dirname, '..', '..', '..', 'your-mobile-app')
lines.push(fs.existsSync(appSrc) ? `  APP_SOURCE_DIR: ${appSrc} (found)` : `  APP_SOURCE_DIR: ${appSrc} (MISSING — selector source unavailable)`)

console.log(lines.join('\n'))
process.exit(0)
