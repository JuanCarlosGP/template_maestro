# Izertis Maestro Template

**Versión:** 0.3.0

Plantilla del framework de tests E2E con **Maestro** y **Gherkin**. Incluye escenarios demo ficticios que ilustran el patrón shared / Android / iOS. Sustituye los demos por tests reales de tu app.

## Stack

- Framework: Maestro
- Plataforma: iOS / Android
- Runner: Gherkin → step-definitions → flows YAML

---

## Capas del template

### Core (siempre)

Gherkin, step-definitions, flows Maestro, runner y validación estática. Funciona sin Azure, sin CI concreto y sin app real (modo demo).

```
.features ──► gherkin-runner.js ──► step-definitions/ ──► flows/*.yml ──► dispositivo
                    │
                    └──► reports/summary.json + junit.xml  (post-ejecución)
```

### Calidad portable

Comandos agnósticos de CI:

```bash
npm run check      # test + validate + gherkin-extract (strict)
npm run validate   # Gherkin, schema step-defs, flows
npm test           # unit tests del framework
```

Detalle CI: [`docs/CI.md`](docs/CI.md). Ejemplos copiables en [`integrations/`](integrations/).

### Integraciones opcionales (por cliente)

| Integración | Cuándo | Cómo |
|-------------|--------|------|
| Azure Test Plans | Cliente usa Azure DevOps QA | `publish-results.js`, vars en `.env`, quitar `--no-publish` |
| BrowserStack | Ejecución en cloud | `--executor browserstack` |
| Azure MCP / skills | Authoring con ADO | `.mcp.json`, `.claude/skills/` |

---

## Catálogo vs resultados de ejecución

| Herramienta | Momento | Salida |
|-------------|---------|--------|
| [`gherkin-dictionary`](maestro/scripts/gherkin-dictionary/) | Estático, sin device | Catálogo paso → step-def → flow |
| `reports/` (tras `npm run feature`) | Post-ejecución | Pass/fail, errores, JUnit para CI |

---

## Requisitos

- **macOS** o **WSL (Ubuntu)** — el Makefile asume entorno Unix. En Windows nativo usa **npm** (ver abajo).
- Node.js 20+ (`make setup` o `npm install`)
- Para ejecución en dispositivo: simulador iOS o emulador Android con la app instalada

## Instalación

```bash
make setup
# o: cp .env.example .env && npm install
```

```bash
make doctor     # deps, Maestro, dispositivos
npm run check   # gate headless (recomendado en CI)
```

---

## Variables de entorno

Plantilla: [`.env.example`](.env.example) — bloques **Core**, **Reporting**, **Azure (opcional)**, **BrowserStack (opcional)**.

---

## Escenarios demo incluidos

| Feature | Tipo | Flow |
| ------- | ---- | ---- |
| `DemoOnboarding.feature` | Shared (Android + iOS) | `flows/DemoOnboarding.yml` → `android/` / `ios/` |
| `DemoLogin.feature` | Shared | `flows/DemoLogin.yml` → `shared/DemoLogin.yml` |
| `DemoAndroidMenu.feature` | Android | `flows/DemoAndroidMenu.yml` → `android/` |
| `DemoIosTabs.feature` | iOS | `flows/DemoIosTabs.yml` → `ios/` |
| `DemoGherkinStructures.feature` | Background + Outline | Pickles expandidos (3 ejecuciones) |

---

## Ejecución

### npm (Windows / multiplataforma)

```bash
npm run check
npm test
npm run validate
npm run demo-login
npm run feature -- --feature maestro/features/DemoLogin.feature --platform ios --no-publish
npm run flow:android -- --flow maestro/flows/DemoLogin.yml
npm run gherkin-extract
```

Tras un run con el runner, revisa `reports/summary.json` y `reports/junit.xml` (desactivar con `--no-reports`).

### make (macOS / WSL)

```bash
make feature FEATURE=maestro/features/DemoLogin.feature PLATFORM=ios
make flow-android FLOW=maestro/flows/DemoLogin.yml
make suite PLATFORM=android   # requiere Azure Test Plans configurado
```

---

## Diccionario Gherkin

[`maestro/scripts/gherkin-dictionary/README.md`](maestro/scripts/gherkin-dictionary/README.md)

```bash
make gherkin-report
make gherkin-extract
```

---

## Estructura del proyecto

```text
izertis-maestro-template/
├── docs/CI.md
├── integrations/          # ejemplos CI copiables (no pipeline oficial)
├── reports/               # resultados de ejecución (gitignored)
└── maestro/
    ├── features/
    ├── flows/ shared/ ios/ android/
    ├── step-definitions/  # schema.json + *.json
    └── scripts/
        ├── lib/             # gherkin, write-reports, tests
        ├── check.js         # gate headless CI
        ├── gherkin-runner.js
        ├── validate.js
        └── gherkin-dictionary/
```

---

## Añadir un test real

1. `maestro/features/<Nombre>.feature`
2. `maestro/step-definitions/<nombre>.json` (validar contra `schema.json`)
3. Flows en `flows/`, `shared/`, `android/`, `ios/`
4. `npm run check`

---

## Emulador Android

```bash
make emulator-start
make emulator-stop
```
