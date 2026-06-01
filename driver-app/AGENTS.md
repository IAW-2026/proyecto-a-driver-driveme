<!-- BEGIN:nextjs-agent-rules -->
# Reglas de Proyecto: Driver App - Plataforma de Transporte

## 1. Identidad y Arquitectura del Sistema
- **Rol principal:** Esta aplicación es la "Driver App". Es la dueña absoluta y la fuente de verdad del ciclo de vida de un viaje.
- **Microservicios aislados:** El proyecto funciona de forma independiente. **Obligatorio:** Cualquier comunicación con las otras aplicaciones del ecosistema debe realizarse utilizando stubs o datos mockeados a nivel local. No intentes conectar con URLs externas en el entorno de desarrollo.
- **Comunicación:** Se utilizan exclusivamente APIs REST. Para flujos continuos (como la telemetría de ubicación), se asume una estrategia de *polling* desde el cliente.
- **Gestión de estado:** Los únicos estados válidos para la entidad Viaje aquí son `ACEPTADO`, `EN_CURSO`, `FINALIZADO` y `CANCELADO_POR_CONDUCTOR`.

## 2. Stack Tecnológico
- **Framework:** Next.js (App Router).
- **Base de Datos:** PostgreSQL.
- **ORM:** Prisma. No utilices consultas SQL crudas (`pg`) ni Knex. Toda interacción de base de datos se hace vía Prisma Client.
- **Estilos:** Tailwind CSS.
- **Autenticación:** Clerk.

## 3. Convenciones de Código y Diseño
- **TypeScript:** Utiliza tipado estricto en todos los archivos. Evita el uso de `any`.
- **Separación de responsabilidades:** Los archivos `page.tsx` deben limitarse a ser componentes de UI. Toda la lógica de negocio, reglas de validación y llamadas a Prisma deben extraerse a capas de servicio (por ejemplo, en directorios `lib/` o `services/`).
- **Autenticación en endpoints:** En cada ruta de API (dentro de `app/api/`), se debe verificar el token JWT de Clerk. Es indispensable validar que el claim `role` sea exactamente `"driver"` y utilizar el claim `sub` para garantizar que el usuario en sesión es el dueño legítimo del recurso que intenta modificar.

## 4. Testing y Calidad
- Las pruebas automatizadas son un requisito de primer nivel.
- **BDD:** Utiliza la sintaxis Gherkin (Cucumber) para redactar los escenarios de prueba guiados por comportamiento.
- **E2E:** Utiliza Playwright para automatizar y ejecutar las pruebas End-to-End, garantizando que el conductor pueda interactuar con la UI, aceptar un viaje simulado, y finalizarlo correctamente.
<!-- END:nextjs-agent-rules -->
