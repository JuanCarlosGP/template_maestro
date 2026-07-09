# e2e-specs — automation planning specs

A lightweight, convention-based spec folder for the **Izertis Maestro Template**. **Not
an npm package** and **not** [OpenSpec](https://openspec.dev/) — just structured markdown
plus optional agent playbooks.

Each spec is the **source of truth for automating one ticket / test case**: it captures the
Gherkin, the automation plan, per-platform notes, and decisions that otherwise vanish into
chat (selector strategy, dropped scenarios and *why*, whether an MSW dev build was needed).

## Layout

```
e2e-specs/
└── specs/
    └── <id>.md     # Azure work item, GitHub Issue number, or manual slug
```

## Workflow

1. Start from [`docs/agent/author-e2e-test/`](../docs/agent/author-e2e-test/SKILL.md) with a ticket ID and Gherkin.
2. The **test-planner** agent ([`docs/agent/agents/test-planner.md`](../docs/agent/agents/test-planner.md)) reads the ticket (Azure, GitHub, or GitLab MCP — or pasted Gherkin),
   existing flows, and app source, then writes `e2e-specs/specs/<id>.md`.
3. The spec becomes the source of truth for building flows and records the final outcome (Automated / Dropped / MSW).

## Spec format

See [specs/demo-onboarding.md](specs/demo-onboarding.md) for a worked example. Sections: metadata header,
Objetivo, Escenarios (Gherkin), Plan de automatización, Cobertura por plataforma,
Selectores clave, Decisiones, Casos límite, Fuera de alcance, Riesgos/Notas, Gate/Resultado.
Keep content in **Spanish** (matching the ticket and app UI); write `(ninguno)` for an
empty section rather than omitting it.
