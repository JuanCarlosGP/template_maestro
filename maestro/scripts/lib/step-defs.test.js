'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateStepDefinitionsFile,
  validateStepEntry,
  countCaptureGroups,
} = require('../validate-step-defs')
const { resolveStep, resolveStepSafe } = require('../../step-definitions/index')

describe('validate-step-defs', () => {
  it('countCaptureGroups counts regex groups', () => {
    assert.equal(countCaptureGroups('literal'), 0)
    assert.equal(countCaptureGroups('user "(.+)" pass "(.+)"'), 2)
    assert.equal(countCaptureGroups('(?:non-capturing) (.+)'), 1)
  })

  it('rejects entry with params but no capture groups', () => {
    const problems = validateStepEntry(
      { pattern: 'literal step', flow: 'Demo', params: ['X'] },
      'test.json',
      0,
    )
    assert.ok(problems.some(p => p.includes('no capture groups')))
  })

  it('rejects mismatched params count', () => {
    const problems = validateStepEntry(
      { pattern: 'user "(.+)"', flow: 'Demo', params: ['A', 'B'] },
      'test.json',
      0,
    )
    assert.ok(problems.some(p => p.includes('capture group')))
  })

  it('validates appium-practice.json', () => {
    const filePath = path.join(__dirname, '..', '..', 'step-definitions', 'appium-practice.json')
    const problems = validateStepDefinitionsFile(filePath)
    assert.deepEqual(problems, [])
  })

  it('invalid temp file fails validation', () => {
    const filePath = path.join(os.tmpdir(), `step-def-bad-${Date.now()}.json`)
    fs.writeFileSync(filePath, JSON.stringify({
      steps: [{ pattern: 'bad ((', flow: 'X', params: ['Y'] }],
    }))
    try {
      const problems = validateStepDefinitionsFile(filePath)
      assert.ok(problems.length > 0)
    } finally {
      fs.unlinkSync(filePath)
    }
  })
})

describe('appium-practice step patterns', () => {
  const loginStep =
    'entro en "12 EXPAND BANK" e inicio sesión con usuario "practice" y clave "practice"'

  it('matches parameterized expand bank login step', () => {
    const resolved = resolveStep(loginStep)
    assert.equal(resolved.flow, 'ExpandBankLoginForm')
    assert.equal(resolved.params.SECTION, '12 EXPAND BANK')
    assert.equal(resolved.params.USERNAME, 'practice')
    assert.equal(resolved.params.PASSWORD, 'practice')
  })

  it('does not match unrelated text', () => {
    assert.equal(resolveStepSafe('inicio sesión sin credenciales'), null)
  })
})
