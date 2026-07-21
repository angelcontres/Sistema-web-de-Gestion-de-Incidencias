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
- Se refactorizó el middleware `CheckResourcePermission.php` para eliminar el diccionario hardcodeado, obteniendo el nombre del recurso de forma dinámica mediante `$request->route()->getName()$.
- Se aplicaron alias a todas las rutas de recursos en `api.php` mediante `->names(...)`.
- El frontend se actualizó para mapear de manera estricta los permisos de un solo nombre (ej. `categorias`).
- Integración funcional de `AuthService.hasPermission()` en la generación dinámica del Sidebar.
- Se añadió un interceptor global para el código HTTP 403 en `api.js`, despachando un CustomEvent para mostrar un `ToastService` al usuario.

