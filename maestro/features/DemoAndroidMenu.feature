Feature: Menú Android demo
  Como usuario en Android
  Quiero abrir el menú lateral de navegación
  Para ver las opciones principales de la app demo

  # flows/DemoAndroidMenu.yml → android/DemoAndroidMenu.yml
  Scenario: Usuario abre el menú lateral en Android
    Given la app demo está instalada
    When abro el menú lateral de navegación
    Then veo las opciones del menú principal
