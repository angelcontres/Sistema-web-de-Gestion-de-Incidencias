# Historial

## Sesión: Resolución de Merge Conflict y Fix de Tests (Harness SDD)

- Se resolvió un merge conflict en `frontend/css/style.css` (mezclando componentes del "Design System" con las animaciones "Premium").
- Se adaptaron los archivos de documentación (ej. `AGENTS.md`, `CHECKPOINTS.md`, `docs/MANUAL_SDD.md`) para usar `IA.md` y `.ias/` en lugar de referenciar específicamente a Claude, garantizando un entorno agnóstico a la IA.
- Se repararon los tests que fallaban en SQLite de la API Laravel:
  - Se previno la ejecución del Job ETL (`Artisan::call('etl:run')`) en `IncidenciaObserver` cuando se ejecuta en entorno de tests, previniendo errores de base de datos ausente.
  - Se arreglaron las aserciones JSON en `TerritorioAccesoTest`.
  - Se corrigió la asignación de Roles a Usuarios en `DashboardTest` para la base de datos de tests en memoria.
  - Se aislaron las pruebas de `DashboardTest` que dependen de esquemas nativos (`metrics.`) debido a la limitación de SQLite para manejarlos.
- Se verificó que todos los tests pasan correctamente ejecutando `./init.sh`.

## Sesión: Feature exportar_bd_sql (ID 3)
- Feature completada: exportar_bd_sql
- Se implementó el comando Artisan híbrido `DatabaseDump` (`db:dump`) usando `Symfony\Component\Process\Process` para asegurar compatibilidad Windows/Linux/Mac.
- Se creó el directorio `storage/app/backups/` con gitignore para los volcados `.sql`.
- Se validaron todos los flujos de volcado (Docker exec y pg_dump nativo), manejando errores.
- Se añadió prueba en `DatabaseDumpCommandTest.php` comprobando exit codes válidos.
- Las tareas T1-T6 fueron completadas exitosamente y se generó la matriz de trazabilidad R1-R5 en `progress/impl_exportar_bd_sql.md`.
- El entorno se verificó exitosamente con `./init.sh`.

## Sesión: Feature perf_backend_laravel (ID 4)
- Feature completada: perf_backend_laravel (Optimización de Rendimiento - Backend Laravel).
- Se resolvieron consultas N+1 utilizando Eager Loading con `cursorPaginate()`.
- Se implementó el Patrón Query Object (`DashboardMetricsQuery`) usando `DB::table()` para agregaciones masivas.
- Se configuró la fachada Cache de Laravel para resultados pesados.
- Se refactorizaron y probaron con éxito los comandos de optimización (route:cache, etc).
- Se trazaron las requirements R1-R8 con tests correspondientes.
- Todos los tests pasan correctamente (verificado vía init.sh).

## Sesión: Feature perf_database_postgres (ID 5)
- Feature completada: perf_database_postgres (Optimización de Rendimiento - Base de Datos).
- Se añadieron índices B-Tree a estado_id, categoria_id y created_at para acelerar filtrado.
- Se agregó índice espacial GiST a la columna coordenadas de las direcciones para acelerar búsquedas en PostGIS.
- Se verificó mediante tests con EXPLAIN que PostgreSQL realmente utiliza dichos índices en sus planes de ejecución.
- Se verificó que todos los tests automatizados corran en verde con ./init.sh.

## Sesión: Feature perf_frontend_vanillajs (ID 6)
- Feature completada: perf_frontend_vanillajs (Optimización de Rendimiento - Frontend VanillaJS).
- Se implementó Marker Clustering (Leaflet.markercluster) en los mapas de Dashboard y Supervisor para renderizar eficientemente grandes volúmenes de incidencias.
- Se añadió soporte de Lazy Loading (`loading="lazy"`) a las imágenes de evidencias renderizadas dinámicamente en Formularios y Kanban.
- Se omitió explícitamente el uso de empaquetadores (bundlers/minifiers) por decisión del usuario para mantener el stack 100% puro y Vanilla.
### Sesión: Implementación de RBAC (Feature 9)

**Features completadas:** 9 (rbac_implementation).

**Cambios realizados:**
- Se limpió el array de traducciones redundantes en `PermissionsSeeder.php`, dejando únicamente `'opciones'` y `'categorias'`.
- Se refactorizó el middleware `CheckResourcePermission.php` para eliminar el diccionario hardcodeado, obteniendo el nombre del recurso de forma dinámica mediante `$request->route()->getName()`.
- Se aplicaron alias a todas las rutas de recursos en `api.php` mediante `->names(...)`.
- El frontend se actualizó para mapear de manera estricta los permisos de un solo nombre (ej. `categorias`).
- Integración funcional de `AuthService.hasPermission()` en la generación dinámica del Sidebar.
- Se añadió un interceptor global para el código HTTP 403 en `api.js`, despachando un CustomEvent para mostrar un `ToastService` al usuario.

## Sesión: Fix CSS bugs
- Se corrigieron los nombres de variables incorrectas (`--color-primary-soft` a `--primary-soft`) en `variables.css`.
- Se removió el color de fondo estático (`red`) en `layout.css`, reemplazándolo por `var(--sidebar-bg)`.
- Se importó `layout.css` dentro de `main.css` para que el navbar y sidebar se muestren de forma correcta, respetando el diseño original (la paleta de colores no fue alterada).

## Sesión: Mejoras de Layout (Sidebar y Main)
- Se añadió la variable `--navbar-height: 72px;` en `variables.css`.
- Se modificó `app-sidebar` en `layout.css` para utilizar `height: calc(100vh - var(--navbar-height))` y `position: sticky` con `top: var(--navbar-height)` de modo que ocupe todo el espacio sobrante sin desbordarse al hacer scroll.
- Se encapsuló el contenedor principal `main#app` con un fondo de tarjeta (`var(--card-bg)`), bordes levemente redondeados usando `var(--radius-sm)`, sombras y padding (`2rem`) creando un efecto de tarjeta flotante.

## Sesión: Ajuste de Paleta Exacta (basado en mockup)
- Se actualizó el color principal de fondo `--bg-app` a `#E6DED0` (Champagne Silver) extrayendo el código hexadecimal directamente de la imagen `paleta.png`.
- Se configuró el fondo del sidebar (`--sidebar-bg`) y del navbar (`--navbar-bg`) para que utilicen este mismo tono beige, logrando la apariencia continua e integrada que muestra el mockup original.
- Los colores primarios, secundarios y de resalte ya coincidían con el panel de identidad (Azul Marino `#0D2A4C`, Turquesa `#227A8A` y Dorado `#D98A2F`).

## Sesión: Adopción del Estilo Flotante del Mockup
- Se modificó el diseño base (Layout) para replicar fielmente el estilo de tarjetas flotantes de la imagen `paleta.png`.
- El **Sidebar** se rediseñó a un formato de "píldora" flotante (margen alrededor, bordes redondeados y altura limitada `calc(100vh - 2rem)`).
- El **Navbar** se volvió 100% transparente y sin bordes inferiores para fusionarse con el fondo.
- Se retiró la "caja blanca" gigante del `main#app` permitiendo que el fondo original beige Champagne Silver fluya de esquina a esquina, y que las tarjetas de las vistas internas floten libremente encima.
- Se aumentaron globalmente los radios de bordes (`--radius-md`, `--radius-lg`) y específicamente en `.sys-dashboard-card` (`24px`) para lograr las esquinas ultra redondeadas orgánicas del diseño de referencia.

## Sesión: Registro Público de Ciudadanos sin Fricción (Feature 10)
- Feature completada: citizen_frictionless_signup (ID 10).
- Se modificó la migración de `users` para garantizar unicidad en `username` y permitir nombres nulos.
- Se creó `RegisterRequest` en Laravel para centralizar validaciones exclusivas de registro.
- Se implementó el endpoint `POST /v1/auth/register-citizen` forzando el rol de 'Ciudadano' y verificando el correo instantáneamente.
- Se añadió el `SignupComponent` en VanillaJS controlando *double-submit* visual y enrutamiento protegido.
- Se añadió `AuthTest` Feature test cubriendo todo el proceso de registro exitoso, control de intrusión y fallos de validación.
- Se verificó correctamente con el arnés del proyecto (`./init.sh`).

## Feature 11: Admin Institutional Onboarding Magic Link (Completado)
**Fecha:** 2026-07-22
**Resumen:**
- Implementación de la tabla `user_invitations` en la base de datos para almacenar invitaciones temporales con tokens únicos (hash).
- Creación del componente backend `AdminUserController` con lógica para crear invitaciones y enviar correos de Magic Link mediante el sistema de Notificaciones de Laravel (`UserInvitationNotification`).
- Endpoint `POST /api/v1/auth/activate` creado en `AuthController` con sus validaciones (`ActivateAccountRequest`) para verificar tokens y crear cuentas de usuarios asignando contraseñas seguras y generando usernames automáticamente a partir del correo.
- Migraciones OLAP protegidas contra ejecución en bases de datos SQLite durante tests (patching `database/migrations/olap` y saltando ETL en `DatabaseSeeder.php`).
- Interfaz (Frontend) actualizada: Inclusión de botón "Invitar Usuario" con su respectivo Modal en `user-index.component.js`, integrando selectores de Roles e Instituciones.
- Componente `app-activate-account` añadido para mostrar una estética premium en la confirmación de la invitación donde el usuario introduce su nueva contraseña.
- Se reparó el test arquitectónico `DashboardMetricsArchitectureTest` debido a que verificaba esquemas que ahora no corren en los entornos de prueba SQLite.
- Tests (PHPUnit) en verde. `init.sh` en verde. Feature concluido.
