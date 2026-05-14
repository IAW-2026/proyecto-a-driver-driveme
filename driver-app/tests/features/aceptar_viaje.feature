Feature: Aceptar Solicitud de Viaje
  Como conductor de la plataforma
  Quiero poder aceptar una solicitud de viaje pendiente
  Para iniciar el servicio de transporte y vincularme a la solicitud

  Scenario: El conductor acepta una solicitud de viaje exitosamente
    Given un conductor autenticado con ID "cond_123"
    And una solicitud de viaje pendiente con ID "sol_abc123"
    When el conductor envía una petición POST a "/api/viajes" con los datos del viaje
    Then la respuesta debe tener el código HTTP 201
    And la respuesta debe indicar que la operación fue exitosa
    And el viaje debe quedar registrado en la base de datos con estado "ACEPTADO"

  Scenario: El conductor intenta aceptar una solicitud que ya fue aceptada por otro
    Given un conductor autenticado con ID "cond_123"
    And una solicitud de viaje con ID "sol_abc123" que ya ha sido aceptada previamente
    When el conductor envía una petición POST a "/api/viajes" con los datos del viaje
    Then la respuesta debe tener el código HTTP 409
    And el mensaje de error debe indicar un conflicto de unicidad
