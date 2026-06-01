[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ujanwRJ4)
<p align="center">
  <img src="driver-app/public/images/logo.png" alt="DriveMe Logo" width="120" />
</p>

<h1 align="center">Driver App - DriveMe</h1>

## Deploy
- **Enlace de Producción:** [http://proyecto-a-driver-driveme.vercel.app]

## Usuarios de prueba
Para facilitar la corrección, pueden utilizar los siguientes usuarios de prueba pre-configurados:

- **Rol Conductor:**
  - **Email:** `driver+clerktest@iaw.com`
  - **Contraseña:** `iawuser#`

- **Rol Administrador:**
  - **Email:** `admin+clerktest@iaw.com`
  - **Contraseña:** `iawuser#`

## Instrucciones de uso
Inicie sesión con las credenciales provistas. Como conductor, podrá ponerse en línea, aceptar o rechazar solicitudes de viaje, registrar el inicio y fin de un recorrido, y visualizar su rendimiento diario (metas, ingresos y estadísticas). Como administrador tendrá acceso a funciones de gestión del sistema. 

## Descripción
Aplicación **Driver** del [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/) — comisión `DriveMe`.

Esta aplicación gestiona el ciclo de vida de los viajes desde la perspectiva del conductor. Permite a los conductores ponerse en línea, aceptar o rechazar solicitudes de viaje, registrar el inicio y fin de un recorrido, y visualizar su rendimiento diario (metas, ingresos y estadísticas).

## Notas para la corrección (Rendimiento y Lighthouse)

Al evaluar la aplicación con Lighthouse, ciertas advertencias de rendimiento son inevitables debido a la arquitectura y herramientas modernas empleadas. Las causas principales son:

- **Clerk (Autenticación):** Al depender de este proveedor, se inyectan recursos de red, scripts empaquetados y cookies de terceros que escapan a nuestro control.
  - *Advertencias impactadas:* "Reduce el código JavaScript sin usar", "Evita encadenar solicitudes críticas", "Mejora la entrega de imágenes" y "Utiliza cookies de terceros".

- **Ecosistema React y Mapas:** La inicialización de componentes interactivos complejos, como *React Leaflet* en el Dashboard, requiere tiempo de evaluación en el hilo principal (*main thread*).
  - *Advertencias impactadas:* "Reduce el tiempo de ejecución de JavaScript", "Minimiza el trabajo del hilo principal" y "Largest Contentful Paint (LCP)".

- **Next.js y Serverless (Vercel/Neon):** El arranque en frío de las funciones sin servidor y la latencia de red hacia la BD agregan tiempo de respuesta. Además, Next.js empaqueta *polyfills* automáticamente.
  - *Advertencias impactadas:* "Reduce el tiempo de respuesta inicial del servidor (TTFB)" y "JavaScript heredado".

- **Datos Sensibles (Tiempo Real):** Utilizamos intencionalmente `cache-control: no-store` para evitar que un conductor retroceda en el navegador y vea información desactualizada, protegiendo así el flujo de viaje.
  - *Advertencias impactadas:* "Se impidió el restablecimiento de la memoria caché atrás/adelante (BFCache)".
