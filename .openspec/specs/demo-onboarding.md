# Spec de ejemplo: DemoOnboarding

> Plantilla OpenSpec del **Izertis Maestro Template**. Sustituir por specs reales vinculadas a work items.

## Objetivo

Automatizar el onboarding inicial de la app demo en Android e iOS.

## Gherkin

```gherkin
Feature: Onboarding demo
  Scenario: Usuario completa el onboarding en el primer arranque
    Given la app demo está instalada
    When completo el onboarding inicial
    Then veo la pantalla de bienvenida
```

## Plan de automatización

| Paso Gherkin | Flow | Plataforma |
| ------------ | ---- | ---------- |
| completo el onboarding inicial | `DemoOnboarding` | Android + iOS (split en `android/` e `ios/`) |
| veo la pantalla de bienvenida | (inline) | Ambas |

## Decisiones

- Selectores genéricos (`Bienvenido`, `Continuar`) — sustituir por copy real de la app.
- Permisos de notificaciones con `${APP_NAME}` en el diálogo del sistema.
