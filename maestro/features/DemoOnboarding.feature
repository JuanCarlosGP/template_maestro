Feature: Onboarding demo
  Como usuario nuevo de la app demo
  Quiero completar el onboarding inicial
  Para acceder a la pantalla de bienvenida

  # flows/DemoOnboarding.yml → android/ o ios/ según plataforma
  Scenario: Usuario completa el onboarding en el primer arranque
    Given la app demo está instalada
    When completo el onboarding inicial
    Then veo la pantalla de bienvenida
