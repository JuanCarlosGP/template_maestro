Feature: Pestañas iOS demo
  Como usuario en iOS
  Quiero navegar por las pestañas inferiores
  Para cambiar entre secciones de la app demo

  # flows/DemoIosTabs.yml → ios/DemoIosTabs.yml
  Scenario: Usuario navega por las pestañas inferiores en iOS
    Given la app demo está instalada
    When navego por las pestañas inferiores
    Then la pestaña activa se resalta correctamente
