# [demo] Onboarding demo

**Type:** E2E Test Automation
**Status:** Example
**Date:** 2026-01-01
**Source:** manual (template demo)
**Test Case:** (ninguno)
**Gherkin:** verbatim

---

## Objetivo

Automatizar el onboarding inicial de la app demo en Android e iOS.

## Criterios de aceptación (HU / Issue)

- El usuario completa el onboarding en el primer arranque.
- Tras completarlo, ve la pantalla de bienvenida.

## Reconocimiento del entorno

(ejemplo — en un flujo real lo rellena environment-scout)

- Dispositivos: emulador Android + simulador iOS con app demo instalada.
- Pantalla inicial: flujo de onboarding con pasos «Continuar» / «Bienvenido».

## Escenarios (Gherkin)

```gherkin
Feature: Onboarding demo
  Scenario: Usuario completa el onboarding en el primer arranque
    Given la app demo está instalada
    When completo el onboarding inicial
    Then veo la pantalla de bienvenida
```

## Plan de automatización

- Feature: `maestro/features/DemoOnboarding.feature`
- Step-definitions: `step-definitions/demo-onboarding.json` (reutiliza pasos existentes)
- Flows: `flows/DemoOnboarding.yml` → `android/DemoOnboarding.yml`, `ios/DemoOnboarding.yml`
- Reutiliza: split de plataforma del template demo

## Cobertura por plataforma

- iOS: flujo en `ios/DemoOnboarding.yml`
- Android: flujo en `android/DemoOnboarding.yml`

## Selectores clave

- Onboarding: `text:'Continuar'`, `text:'Bienvenido'` — demo genérico; sustituir en app real

## Decisiones

- Permisos de notificaciones con `${APP_NAME}` en diálogo del sistema.

## Casos límite confirmados

- (ninguno) — demo simplificado

## Fuera de alcance

- Reinstalación limpia de la app en cada run

## Riesgos / Notas

- Copy genérico del demo; no validado contra app de producción.

## Sanity (post-ejecución)

(ejemplo — lo completa sanity-reviewer tras run verde)

**Veredicto:** OK (demo)
**Trazabilidad:** criterio «pantalla de bienvenida» → `Then veo la pantalla de bienvenida`

## Gate / Resultado

Automatizado (iOS+Android) — escenario demo del template.
