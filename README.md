# Izertis Maestro Template

**Versión:** 0.1.0

Plantilla del framework de tests E2E con **Maestro** y **Gherkin**. Incluye escenarios demo ficticios que ilustran el patrón shared / Android / iOS. Sustituye los demos por tests reales de tu app.

## Stack

- Framework: Maestro
- Plataforma: iOS / Android
- Runner: Gherkin → step-definitions → flows YAML

---

## Arquitectura del runner

Los tests están definidos en Gherkin (`.feature`), que el runner mapea a flows de Maestro mediante los ficheros JSON de `step-definitions/`. Opcionalmente, los resultados se publican en Azure Test Plans.

```
Azure Test Plans ──► gherkin-runner.js ──► step-definitions/ ──► flows/*.yml ──► dispositivo
        ▲                                                                              │
        └──────────────────── publish-results.js ◄─────────────────────────────────────┘
```

---

## Requisitos

- **macOS** o **WSL (Ubuntu)** — el Makefile y los scripts asumen entorno Unix (`bash`, `grep`, `make`). En Windows usa WSL.
- Node.js 20+ (`make setup` instala el resto)
- Para ejecución en dispositivo: simulador iOS o emulador Android con la app instalada

## Instalación

```bash
make setup
```

`make setup` crea `.env` desde `.env.example`, instala dependencias de Node (incluido el MCP de Azure DevOps), instala el **Maestro CLI** si falta, y ejecuta el preflight (`make doctor`).

```bash
make doctor     # comprueba deps, Maestro, dispositivos, PAT y APP_SOURCE_DIR
make validate   # chequeo estático Gherkin -> step-definitions -> flows (sin dispositivo)
```

### Comandos adicionales

```bash
make install           # solo dependencias de Node
make install-maestro   # solo el Maestro CLI
make install-android   # adb install
make install-ios       # xcrun simctl install booted
make copy-builds       # copia builds desde ANDROID_SRC / IOS_SRC
```

---

## Variables de entorno

Todas en `.env` (plantilla: `.env.example`).

**Azure** (opcional — publicar resultados)

| Variable | Descripción |
| -------- | ----------- |
| `AZURE_DEVOPS_PAT` | Personal Access Token |
| `AZURE_DEVOPS_ORG` | Organización |
| `AZURE_DEVOPS_PROJECT` | Proyecto |
| `PLAN_ID` / `SUITE_ID` | Plan y suite de Azure Test Plans |

**App demo** (sustituir por tu app real)

| Variable | Descripción |
| -------- | ----------- |
| `ANDROID_APP_ID` / `IOS_APP_ID` | Bundle ID instalado en el dispositivo |
| `ANDROID_APP_NAME` / `IOS_APP_NAME` | Nombre en diálogos de permisos |
| `USERNAME` / `PASSWORD` | Credenciales de demo |
| `PLATFORM` | `android`, `ios` o `all` |

**Dispositivo** (solo si hace falta)

| Variable | Descripción |
| -------- | ----------- |
| `ANDROID_SERIAL` | Emulador o móvil por USB en WSL |

---

## Escenarios demo incluidos

| Feature | Tipo | Flow |
| ------- | ---- | ---- |
| `DemoOnboarding.feature` | Shared (Android + iOS) | `flows/DemoOnboarding.yml` → `android/` / `ios/` |
| `DemoLogin.feature` | Shared | `flows/DemoLogin.yml` → `shared/DemoLogin.yml` |
| `DemoAndroidMenu.feature` | Android | `flows/DemoAndroidMenu.yml` → `android/` |
| `DemoIosTabs.feature` | iOS | `flows/DemoIosTabs.yml` → `ios/` |

Los selectores son **genéricos y ficticios** — ilustran la estructura del framework, no están pensados para pasar contra una app concreta sin adaptarlos.

---

## Ejecución

### Feature concreta

```bash
make feature FEATURE=maestro/features/DemoLogin.feature PLATFORM=ios
make demo-login PLATFORM=android
```

### Flow Maestro directo (sin runner Gherkin)

```bash
make flow-android FLOW=maestro/flows/DemoLogin.yml
make flow-ios     FLOW=maestro/flows/DemoLogin.yml
```

### Suite completa desde Azure Test Plans (opcional)

```bash
make suite PLATFORM=android
```

---

## Diccionario Gherkin

Catálogo de pasos Gherkin cruzados con `step-definitions/`. Detalle en [`maestro/scripts/gherkin-dictionary/README.md`](maestro/scripts/gherkin-dictionary/README.md).

```bash
make gherkin-report    # extrae datos y abre la UI
make gherkin-extract   # solo regenerar JSON/CSV
```

---

## Estructura del proyecto

```text
izertis-maestro-template/
└── maestro/
    ├── features/          # Escenarios Gherkin (.feature)
    ├── flows/             # Entry flows Maestro (.yml)
    ├── shared/            # Flows compartidos entre plataformas
    ├── android/           # Flows específicos de Android
    ├── ios/               # Flows específicos de iOS
    ├── step-definitions/  # Mapeo paso Gherkin → flow Maestro
    └── scripts/
        ├── gherkin-dictionary/   # Diccionario Gherkin (extract + UI)
        ├── gherkin-runner.js
        ├── validate.js
        ├── doctor.js
        └── publish-results.js
```

---

## Añadir un test real

1. Crear `maestro/features/<Nombre>.feature` con el escenario en Gherkin.
2. Crear `maestro/step-definitions/<nombre>.json` mapeando cada paso a un flow (o `null`).
3. Crear los flows en `flows/`, `shared/`, `android/` e `ios/` según la plataforma.
4. Ejecutar `make validate` y `make gherkin-extract` (debe dar `pasosSinDefinicion: 0`).

Cada área funcional tiene su propio JSON en `step-definitions/`. `index.js` los descubre y fusiona automáticamente.

---

## Emulador Android

```bash
make emulator-start   # arranca emulator -avd Small_Phone
make emulator-stop    # adb emu kill
```
