Feature: About My Demo App
  Como usuario de My Demo App
  Quiero abrir el sitio de Sauce Labs desde About
  Para verificar la redirección al navegador externo

  Scenario: Abrir Sauce Labs desde About
    Given abro My Demo App en la pantalla principal
    When abro el menú lateral
    And pulso "About" en el menú
    And pulso el enlace al sitio de Sauce Labs
    Then veo el texto "The World's Only Full-Lifecycle AI-Quality Platform"
