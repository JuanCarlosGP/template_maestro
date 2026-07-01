Feature: Estructuras Gherkin demo
  Como usuario de la app demo
  Quiero verificar Background y Scenario Outline
  Para confirmar que el runner ejecuta todas las variantes Gherkin

  Background:
    Given la app demo está instalada

  Scenario: Escenario con background heredado
    When completo el onboarding inicial
    Then veo la pantalla de bienvenida

  Scenario Outline: Login parametrizado
    When inicio sesión con usuario "<user>" y clave "<pass>"
    Then accedo al área principal
    Examples:
      | user      | pass      |
      | demo_user | demo_pass |
      | alt_user  | alt_pass  |
