Feature: Login demo
  Como usuario registrado de la app demo
  Quiero iniciar sesión
  Para acceder al área principal

  # flows/DemoLogin.yml → shared/DemoLogin.yml (incluye onboarding opcional)
  Scenario: Usuario inicia sesión con credenciales válidas
    Given la app demo está instalada
    When inicio sesión con usuario "demo_user" y clave "demo_pass"
    Then accedo al área principal
