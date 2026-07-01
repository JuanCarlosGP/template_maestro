#!/usr/bin/env node

'use strict'

// ---------------------------------------------------------------------------
// Static validator for the Gherkin -> step-definitions -> flows chain.
//
// Checks, without touching a device:
//   1. Every .feature file parses as valid Gherkin.
//   2. Every step in every scenario and Background (including those nested
//      inside a Rule) resolves to a step definition.
//   3. Every non-null flow referenced by a step has a flows/<name>.yml file.
//   4. Every Maestro flow file has a valid frontmatter block (header + `---`).
//
// Exit code 0 = all good, 1 = at least one problem found.
// Used both by the `validate-edit` hook and the /author-e2e-test skill.
// ---------------------------------------------------------------------------

const fs = require('fs')
const path = require('path')
const { generateMessages } = require('@cucumber/gherkin')
const { IdGenerator } = require('@cucumber/messages')
const { resolveStep } = require('../step-definitions/index')

const MAESTRO_DIR = path.join(__dirname, '..')
const FEATURES_DIR = path.join(MAESTRO_DIR, 'features')
const FLOWS_DIR = path.join(MAESTRO_DIR, 'flows')
const FLOW_DIRS = ['flows', 'shared', 'ios', 'android'].map(d => path.join(MAESTRO_DIR, d))

const problems = []

function parseFeature(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8')
  const messages = generateMessages(source, filePath, 'text/x.cucumber.gherkin+plain', {
    newId: IdGenerator.uuid(),
    includeGherkinDocument: true,
    includePickles: false,
  })
  const parseError = messages.find(m => m.parseError)
  if (parseError) throw new Error(parseError.parseError.message)
  const docMessage = messages.find(m => m.gherkinDocument)
  if (!docMessage) throw new Error('No gherkin document found')
  return docMessage.gherkinDocument
}

// Collect every step-bearing node in a feature: top-level scenarios and
// backgrounds, plus scenarios/backgrounds nested inside a Rule. Without this a
// Background or a Rule's steps would never reach resolveStep and validate would
// pass green without covering them.
function collectStepGroups(feature) {
  const groups = []
  const pushChild = (child, prefix) => {
    if (child.background) {
      groups.push({ label: `${prefix}Background`, steps: child.background.steps || [] })
    } else if (child.scenario) {
      groups.push({ label: `${prefix}"${child.scenario.name}"`, steps: child.scenario.steps || [] })
    } else if (child.rule) {
      for (const ruleChild of child.rule.children || []) {
        pushChild(ruleChild, `Rule "${child.rule.name}" › `)
      }
    }
  }
  for (const child of feature.children || []) pushChild(child, '')
  return groups
}

// 1 + 2 + 3 — features parse, steps resolve, referenced flows exist
function validateFeatures() {
  if (!fs.existsSync(FEATURES_DIR)) return
  const files = fs.readdirSync(FEATURES_DIR).filter(f => f.endsWith('.feature')).sort()

  for (const file of files) {
    const filePath = path.join(FEATURES_DIR, file)
    let doc
    try {
      doc = parseFeature(filePath)
    } catch (err) {
      problems.push(`${file}: Gherkin parse error — ${err.message}`)
      continue
    }
    const feature = doc.feature
    if (!feature) {
      problems.push(`${file}: no Feature found`)
      continue
    }
    for (const group of collectStepGroups(feature)) {
      for (const step of group.steps) {
        let resolved
        try {
          resolved = resolveStep(step.text)
        } catch (err) {
          problems.push(`${file} › ${group.label}: ${err.message}`)
          continue
        }
        if (resolved.flow) {
          const flowFile = path.join(FLOWS_DIR, `${resolved.flow}.yml`)
          if (!fs.existsSync(flowFile)) {
            problems.push(`${file} › ${group.label}: step "${step.text}" maps to flow "${resolved.flow}" but flows/${resolved.flow}.yml does not exist`)
          }
        }
      }
    }
  }
}

// 4 — every flow yml has a frontmatter block
function validateFlowFrontmatter() {
  for (const dir of FLOW_DIRS) {
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.yml'))) {
      const filePath = path.join(dir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const rel = path.relative(MAESTRO_DIR, filePath)
      if (!/^---$/m.test(content)) {
        problems.push(`${rel}: missing the "---" frontmatter separator`)
      }
    }
  }
}

function main() {
  validateFeatures()
  validateFlowFrontmatter()

  if (problems.length === 0) {
    console.log('✓ validate: Gherkin, step-definitions and flows are consistent')
    process.exit(0)
  }

  console.error(`✗ validate: ${problems.length} problem(s) found`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

main()
