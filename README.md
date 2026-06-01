[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ujanwRJ4)
# Driver App - DriveMe 🚗

Aplicación **Driver** del [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/) — comisión `DriveMe`.  

## Descripción
Esta aplicación gestiona el ciclo de vida de los viajes desde la perspectiva del conductor. Permite a los conductores ponerse en línea, aceptar o rechazar solicitudes de viaje, registrar el inicio y fin de un recorrido, y visualizar su rendimiento diario (metas, ingresos y estadísticas).

## Deploy
- **Enlace de Producción:** [http://proyecto-a-driver-driveme.vercel.app]

## Accesos y Credenciales

Para facilitar la revisión y evaluación del sistema, pueden utilizar las siguientes credenciales de prueba pre-configuradas:

- **Rol Conductor (Usuario Final):**
  - **Email:** `conductor@driveme.com`
  - **Contraseña:** `DriveMe2026!`
  - *Nota:* Este usuario posee el rol `driver` y puede aceptar/gestionar viajes.

- **Rol Administrador:**
  - **Email:** `admin@driveme.com`
  - **Contraseña:** `DriveMeAdmin2026!`
  - *Nota:* Este usuario cuenta con privilegios para tareas de administración.

---
Enunciado completo del proyecto: <https://iaw-2026.github.io/proyecto/>

## Notas sobre Rendimiento y Lighthouse

Al evaluar el rendimiento de la aplicación desplegada utilizando **Lighthouse**, es importante tener en cuenta que ciertas sugerencias de optimización no pueden resolverse por completo debido a la integración de **servicios de terceros**. Estas herramientas externas introducen costos de red y ejecución de scripts que escapan al control del código fuente del proyecto.

A continuación se detallan las sugerencias comunes de Lighthouse y el motivo por el cual persisten:

- **"Evita encadenar solicitudes críticas" / "Elimina los recursos que bloquean el renderizado":**
  - **Causa: Clerk (Autenticación).** La validación de la sesión y la carga del proveedor de autenticación requieren la descarga e inyección de scripts externos y estilos (CSS) que Clerk maneja de forma segura para prevenir parpadeos en la UI (*flickering*), lo que genera dependencias de red que no podemos diferir.

- **"Reduce el tiempo de ejecución de JavaScript" / "Evita cargas de red enormes":**
  - **Causa: Mapas (React Leaflet).** Las vistas que incluyen mapas interactivos obligan al navegador a procesar una librería compleja y descargar múltiples imágenes dinámicas (*tiles*) simultáneamente para armar el mapa, penalizando el *Largest Contentful Paint* (LCP).

- **"Reduce el tiempo de respuesta inicial del servidor" (TTFB):**
  - **Causa: Infraestructura Serverless (Neon / Vercel).** En las páginas renderizadas desde el servidor (SSR), el "arranque en frío" (*cold start*) de las Serverless Functions y la latencia de red al consultar la base de datos externa añaden milisegundos a la generación y entrega del documento HTML inicial.

- **"JavaScript heredado" (Legacy JavaScript / Polyfills):**
  - **Causa: Next.js y compatibilidad cruzada.** Lighthouse avisa que se están descargando funciones "extra" (como `Array.prototype.flat` o `Object.fromEntries`). Esto ocurre porque Next.js automáticamente empaqueta código de compatibilidad (polyfills) para asegurar que la aplicación no se rompa si un usuario entra desde un navegador desactualizado o antiguo. Aunque tu navegador moderno no lo necesite (y por eso lo marca como "desperdiciado"), es una práctica estándar para garantizar accesibilidad en la web.

- **"Reduce el código JavaScript sin usar" (Unused JavaScript):**
  - **Causa: Clerk (Autenticación).** Lighthouse detecta que se descargan *scripts* (`ui-common`, `vendors`, `clerk.browser`) desde el dominio de Clerk y no se ejecutan en su totalidad durante la carga inicial. Clerk empaqueta toda la lógica de autenticación (login, registro, perfiles, 2FA) en estos archivos para estar listos ante cualquier interacción del usuario. Al ser *scripts* alojados y controlados por un tercero, no es posible dividirlos (*code-splitting*) ni purgarlos desde nuestro código fuente.

- **"Utiliza cookies de terceros" (Third-party cookies):**
  - **Causa: Clerk.** Es normal visualizar este aviso en la pestaña *Issues* (Problemas) de las Herramientas para Desarrolladores de Chrome. Ocurre porque el servicio de autenticación de Clerk utiliza cookies desde su propio dominio (ej. `clerk.accounts.dev`) para mantener la sesión activa entre la aplicación y el proveedor. Al no ser el mismo dominio que la aplicación desplegada o local, el navegador lanza esta advertencia preventiva sobre cookies de terceros. No afecta el funcionamiento del sistema.

- **"Se impidió el restablecimiento de la memoria caché atrás/adelante" (BFCache) / "cache-control: no-store":**
  - **Causa: Next.js y Datos en Tiempo Real.** El navegador te avisa que no puede guardar la página en su memoria caché rápida para cuando usas los botones de "Atrás" o "Adelante". **Esto es totalmente intencional y no debes cambiarlo.** Como el *dashboard* de conductores muestra información sensible y en tiempo real (viajes disponibles, saldo, ubicación, validaciones de seguridad con Clerk), Next.js le indica explícitamente al navegador (`cache-control: no-store`) que siempre debe pedir los datos frescos al servidor para evitar que el conductor vea viajes viejos o información desactualizada al navegar hacia atrás.

  Estas métricas representan el balance (*trade-off*) entre utilizar un ecosistema moderno y robusto (que garantiza alta seguridad, velocidad de desarrollo y escalabilidad) frente a intentar alcanzar una puntuación perfecta en pruebas sintéticas.
