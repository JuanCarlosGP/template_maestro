# Izertis Maestro Template

**Versión:** 0.3.3

Plantilla del framework de tests E2E con **Maestro** y **Gherkin**. Incluye escenarios demo ficticios que ilustran el patrón shared / Android / iOS. Sustituye los demos por tests reales de tu app.

## Stack

- Framework: Maestro
- Plataforma: iOS / Android
- Runner: Gherkin → step-definitions → flows YAML
- **Contrato de ejecución:** npm (Windows, macOS, Linux, CI)

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
| Authoring asistido | Automatizar con agente IA | [`docs/agent/`](docs/agent/README.md), [`.openspec/`](.openspec/README.md), [`.mcp.json`](.mcp.json) |

### Authoring asistido (opcional)

No necesario para `npm run check` ni CI headless.

- **[`docs/agent/`](docs/agent/)** — playbooks neutros (planificar, autorar, depurar tests)
- **[`.openspec/specs/`](.openspec/README.md)** — specs de automatización por ticket
- **[`.mcp.json`](.mcp.json)** — MCP Maestro (+ Azure opcional)
- **[`contrib/ide/`](contrib/ide/README.md)** — wiring local opcional (skills, hooks IDE)

Reglas del proyecto para agentes: [`AGENTS.md`](AGENTS.md).

---

## Catálogo vs resultados de ejecución

| Herramienta | Momento | Salida |
|-------------|---------|--------|
| [`gherkin-dictionary`](maestro/scripts/gherkin-dictionary/) | Estático, sin device | Catálogo paso → step-def → flow |
| `reports/` (tras `npm run feature`) | Post-ejecución | Pass/fail, errores, JUnit para CI |

---

## Requisitos

- **Node.js 20+**
- **Maestro CLI** — instalado por `npm run setup` en macOS/Linux; en Windows nativo, instalar manualmente ([docs Maestro](https://docs.maestro.dev/getting-started/installing-maestro))
- Para ejecución en dispositivo: simulador iOS o emulador Android con la app instalada (Android Studio / Xcode)

## Compatibilidad por SO

El **contrato del template** es npm + Node 20; funciona en Windows, macOS y Linux. La ejecución en **dispositivo** depende del SO y de la plataforma móvil (iOS solo en macOS de forma local).

| Capa | Windows | macOS | Linux |
|------|:-------:|:-----:|:-----:|
| Calidad headless (`npm run check`, validate, tests) | Sí | Sí | Sí |
| Authoring (features, flows, `docs/agent/`) | Sí | Sí | Sí |
| CI (GitHub / Azure / GitLab) | Sí | Sí | Sí |
| Instalación Maestro vía `npm run setup` | Manual | Sí | Sí |
| E2E **Android** en emulador/dispositivo | Sí | Sí | Sí |
| E2E **iOS** en simulador | No | Sí | No |

Notas:

- **Windows:** instala Maestro manualmente si `npm run setup` lo indica ([docs Maestro](https://docs.maestro.dev/getting-started/installing-maestro)). Emulador Android con Android Studio.
- **macOS:** único SO con soporte local **iOS + Android** (Xcode + Android Studio).
- **Linux:** Android en emulador; iOS solo vía CI macOS, agente cloud (p. ej. BrowserStack) o `--executor browserstack` en `.env`.
- **`npm run doctor`** puede fallar sin `adb`/`xcrun` aunque `npm run check` pase — normal en máquinas solo headless.

Comandos CLI de emuladores (macOS/Linux): [`docs/DEVICE.md`](docs/DEVICE.md).

---

## Instalación

```bash
npm run setup
```

Crea `.env` desde la plantilla, instala dependencias npm, intenta instalar Maestro (Unix) e ejecuta `doctor`.

En Windows, si Maestro no está en PATH, sigue las instrucciones que imprime el script o instálalo manualmente y vuelve a ejecutar `npm run doctor`.

```bash
npm run doctor     # deps, Maestro, dispositivos
npm run check      # gate headless (recomendado en CI)
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

```bash
npm run check
npm test
npm run validate
npm run doctor
npm run demo-login
npm run feature -- --feature maestro/features/DemoLogin.feature --platform ios --no-publish
npm run flow:android -- --flow maestro/flows/DemoLogin.yml
npm run flow:ios -- --flow maestro/flows/DemoLogin.yml
npm run gherkin-extract
npm run gherkin-report
```

Tras un run con el runner, revisa `reports/summary.json` y `reports/junit.xml` (desactivar con `--no-reports`).

Pasa `--no-publish` al runner para no publicar en Azure (valor por defecto en los scripts demo).

Suite completa desde Azure Test Plans:

```bash
node maestro/scripts/gherkin-runner.js --from-suite --plan-id $PLAN_ID --suite-id $SUITE_ID --platform all --no-publish
```

(`PLAN_ID` y `SUITE_ID` en `.env`.)

---

## Dispositivos

Antes de `npm run feature` o `npm run flow:*`, arranca simulador/emulador e instala la app (Android Studio / Xcode). Comandos CLI opcionales: [`docs/DEVICE.md`](docs/DEVICE.md).

---

## Diccionario Gherkin

[`maestro/scripts/gherkin-dictionary/README.md`](maestro/scripts/gherkin-dictionary/README.md)

```bash
npm run gherkin-report      # extrae y abre la UI
npm run gherkin-extract     # solo regenera JSON/CSV
```

---

## Estructura del proyecto

```text
izertis-maestro-template/
├── AGENTS.md              # reglas para agentes IA (neutro)
├── docs/
│   ├── CI.md
│   ├── DEVICE.md          # emuladores / adb / suite CLI (opcional)
│   └── agent/             # playbooks authoring (opcional)
├── contrib/ide/           # wiring IDE local (opcional)
├── .openspec/             # specs de automatización (opcional)
├── integrations/          # ejemplos CI
├── reports/               # resultados (gitignored)
└── maestro/
    ├── features/
    ├── flows/ shared/ ios/ android/
    ├── step-definitions/
    └── scripts/
        ├── hooks/         # hooks IDE opcionales
        ├── check.js
        ├── setup.js
        └── ...
```

---

## Añadir un test real

1. `maestro/features/<Nombre>.feature`
2. `maestro/step-definitions/<nombre>.json` (validar contra `schema.json`)
3. Flows en `flows/`, `shared/`, `android/`, `ios/`
4. `npm run check`
