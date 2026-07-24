'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { buildRunSummary, buildJUnitXml, buildStepReports } = require('./write-reports')

const fixture = {
  startedAt: '2026-07-01T10:00:00.000Z',
  finishedAt: '2026-07-01T10:05:00.000Z',
  version: '0.3.0',
  config: {
    executor: 'local',
    environment: 'staging',
    platforms: ['android'],
  },
  perPlatform: [
    {
      platform: 'android',
      results: [
        {
          scenarioName: 'DemoLogin',
          status: 'passed',
          error: null,
          screenshotPath: null,
          featureFile: 'Demo.feature',
          file: 'maestro/features/Demo.feature',
          startedAt: '2026-07-01T10:00:00.000Z',
          finishedAt: '2026-07-01T10:01:30.000Z',
          durationMs: 90000,
          gherkinSteps: [
            { keyword: 'Given', text: 'abro la app', flow: 'OpenApp', params: {} },
            { keyword: 'When', text: 'abro el menú', flow: null, params: {} },
            { keyword: 'And', text: 'pulso Login', flow: 'TapMenuItem', params: { MENU_ITEM: 'Log In' } },
          ],
          flows: [
            { flow: 'OpenApp', title: 'OpenApp', params: {}, status: 'passed', durationMs: 5000, error: null },
            {
              flow: 'TapMenuItem',
              title: 'TapMenuItem',
              params: { MENU_ITEM: 'Log In' },
              status: 'passed',
              durationMs: 8000,
              error: null,
            },
          ],
        },
        {
          scenarioName: 'Login parametrizado (#1)',
          status: 'failed',
          error: 'Element not found',
          screenshotPath: '/tmp/shot.png',
          featureFile: 'Demo.feature',
          file: 'maestro/features/Demo.feature',
          startedAt: '2026-07-01T10:01:30.000Z',
          finishedAt: '2026-07-01T10:02:10.000Z',
          durationMs: 40000,
          gherkinSteps: [
            { keyword: 'Given', text: 'abro la app', flow: 'OpenApp', params: {} },
            { keyword: 'When', text: 'hago login', flow: 'LoginWithCredentials', params: { USERNAME: 'a', PASSWORD: 'b' } },
            { keyword: 'Then', text: 'veo Home', flow: 'AssertVisibleText', params: { TEXT: 'Home' } },
          ],
          flows: [
            { flow: 'OpenApp', title: 'OpenApp', params: {}, status: 'passed', durationMs: 4000, error: null },
            {
              flow: 'LoginWithCredentials',
              title: 'LoginWithCredentials',
              params: { USERNAME: 'a', PASSWORD: 'b' },
              status: 'failed',
              durationMs: 12000,
              error: 'Element not found',
            },
          ],
        },
      ],
    },
  ],
}

describe('write-reports', () => {
  it('buildRunSummary aggregates pass/fail counts and Playwright-like stats', () => {
    const summary = buildRunSummary(fixture)
    assert.equal(summary.template, 'izertis-maestro-template')
    assert.equal(summary.version, '0.3.0')
    assert.equal(summary.passed, 1)
    assert.equal(summary.failed, 1)
    assert.equal(summary.durationMs, 300000)
    assert.equal(summary.stats.expected, 1)
    assert.equal(summary.stats.unexpected, 1)
    assert.equal(summary.stats.duration, 300000)
    assert.equal(summary.config.executor, 'local')
    assert.equal(summary.platforms[0].name, 'android')
    assert.equal(summary.platforms[0].results.length, 2)

    const passed = summary.platforms[0].results[0]
    assert.equal(passed.title, 'DemoLogin')
    assert.equal(passed.ok, true)
    assert.equal(passed.durationMs, 90000)
    assert.equal(passed.featureFile, 'Demo.feature')
    assert.equal(passed.steps.length, 3)
    assert.equal(passed.steps[1].status, 'skipped')
    assert.equal(passed.flows.length, 2)

    const failed = summary.platforms[0].results[1]
    assert.equal(failed.ok, false)
    assert.equal(failed.steps[2].status, 'interrupted')
    assert.equal(failed.attachments[0].path, '/tmp/shot.png')
    assert.equal(failed.errors[0].message, 'Element not found')
  })

  it('buildJUnitXml includes time and classname', () => {
    const summary = buildRunSummary(fixture)
    const xml = buildJUnitXml(summary)
    assert.match(xml, /^<\?xml version="1.0"/)
    assert.match(xml, /<testsuites tests="2" failures="1" errors="0" time="300"/)
    assert.match(xml, /<testsuite name="android" tests="2" failures="1" errors="0" time="130"/)
    assert.match(xml, /classname="Demo.feature" name="DemoLogin" time="90"/)
    assert.match(xml, /<failure message="Element not found">/)
    assert.match(xml, /<\/testsuites>$/)
  })

  it('buildStepReports marks null flows skipped and failed flows interrupt later steps', () => {
    const steps = buildStepReports(
      [
        { keyword: 'Given', text: 'a', flow: 'OpenApp', params: {} },
        { keyword: 'When', text: 'b', flow: null, params: {} },
        { keyword: 'And', text: 'c', flow: 'Login', params: {} },
        { keyword: 'Then', text: 'd', flow: 'Assert', params: {} },
      ],
      [
        { flow: 'OpenApp', params: {}, status: 'passed', durationMs: 1 },
        { flow: 'Login', params: {}, status: 'failed', durationMs: 2, error: 'boom' },
      ],
    )
    assert.equal(steps[0].status, 'passed')
    assert.equal(steps[1].status, 'skipped')
    assert.equal(steps[2].status, 'failed')
    assert.equal(steps[3].status, 'interrupted')
  })

  it('writeReports emits json, junit and html viewer', () => {
    const fs = require('fs')
    const os = require('os')
    const path = require('path')
    const { writeReports } = require('./write-reports')
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'maestro-reports-'))
    try {
      const summary = buildRunSummary(fixture)
      const paths = writeReports(summary, dir)
      assert.ok(fs.existsSync(paths.jsonPath))
      assert.ok(fs.existsSync(paths.xmlPath))
      assert.ok(fs.existsSync(paths.htmlPath))
      const html = fs.readFileSync(paths.htmlPath, 'utf-8')
      assert.match(html, /Izertis · Maestro run/)
      assert.match(html, /"passed":\s*1/)
      assert.doesNotMatch(html, /%%MAESTRO_REPORT_JSON%%/)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
