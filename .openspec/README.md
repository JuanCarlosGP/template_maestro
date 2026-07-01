# .openspec — E2E automation specs

A lightweight, convention-based spec system for the **Izertis Maestro Template**. **Not
an npm package** — just structured markdown plus a planner agent.

Each spec is the **source of truth for automating one Azure work item / test case**: it
captures the Gherkin, the automation plan, per-platform notes, and — crucially — the
decisions that otherwise vanish into chat (selector strategy, dropped scenarios and *why*,
whether an MSW dev build was needed).

## Layout

```
.openspec/
└── specs/
    └── <work-item-id>.md     # one spec per automated work item
```

## Workflow

1. `/author-e2e-test <work-item-id>` launches the **`test-planner`** agent.
2. `test-planner` reads the work item (Azure DevOps MCP), the linked test case's Gherkin,
   existing flows, and the app source, then writes `.openspec/specs/<id>.md`.
3. The spec becomes the source of truth for the rest of `/author-e2e-test` (what to build,
   how to cover both platforms) and records the final outcome (Automated / Dropped / MSW).

## Spec format

See [specs/demo-onboarding.md](specs/demo-onboarding.md) for a worked example. Sections: metadata header,
Objetivo, Escenarios (Gherkin), Plan de automatización, Cobertura por plataforma,
Selectores clave, Decisiones, Casos límite, Fuera de alcance, Riesgos/Notas, Gate/Resultado.
Keep content in **Spanish** (matching the work item and app UI); write `(ninguno)` for an
empty section rather than omitting it.
