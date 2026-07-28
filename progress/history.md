# Historial de Sesiones (Bitácora Append-Only)

## Sesión - Feature ID 18
**Nombre:** Arreglar problemas en la carga de datos del dashboard sin depender de la cache
**ID en feature_list.json:** 18
**Status final:** done

### Resumen de Trabajo Realizado
- Se aplicó el flujo SDD Kiro-style según requerimiento del usuario de **monitoreo en tiempo real sin caché**:
  - Se eliminó la dependencia de `Cache::remember` en `DashboardMetricsQuery::getMetrics()`, consultando directamente el almacén analítico (`metrics.fact_incidencias`) con el Query Builder de Laravel.
  - Se actualizó `IncidenciaObserver` mediante un helper auxiliar `syncEtl()`, ejecutando `Artisan::call('etl:run')` condicionalmente (`!app()->runningUnitTests()`) en los eventos `created`, `updated`, `deleted`, `restored` y `forceDeleted`.
  - Se adaptó la suite de pruebas eliminando la prueba legacy `test_metrics_are_cached` y reemplazándola por `test_metrics_are_not_cached` en `CachePerformanceTest.php`.
  - Se creó la prueba de integración `DashboardRealtimeMetricsTest.php` validando la obtención instantánea de datos y la activación del observer ante todo evento del ciclo de vida.
  - Se resolvieron las observaciones del revisor referidas al esquema de columnas en PostgreSQL (`tiempo_resolucion_minutos`) y la propagación múltiple de eventos (`updated` durante soft delete/restore) en Eloquent.
- Trazabilidad y verificación en verde al 100% mediante `./init.sh` y `php artisan test`.

## Sesión - Bug Fix Autenticación
**Nombre:** Corrección del Toast de éxito en errores de Login/Registro
**ID en feature_list.json:** N/A (Solicitud directa)
**Status final:** done

### Resumen de Trabajo Realizado
- Se detectó que `apiRequest` no lanza excepciones en errores HTTP, sino que retorna el JSON de respuesta.
- Se modificaron `AuthService.login` y `AuthService.register` en `frontend/js/core/auth.service.js` para validar la existencia de `access_token` en la respuesta y, de no existir, lanzar una excepción `Error` estructurada.
- Esto soluciona el bug en `LoginComponent` y `SignupComponent`, garantizando que en caso de error de autenticación el flujo de ejecución pase al bloque `catch` para mostrar un Toast de error en lugar de uno de éxito.
- Se actualizaron y mockearon las llamadas a `ToastService` en `login.component.test.js` para corregir errores preexistentes con Custom Elements y asegurar que pasen en verde.
- Se verificó la suite de pruebas del componente de login (`login.component.test.js`) con éxito al 100%.

## Sesión - Refactor incidencia-form.component.js
**Nombre:** Refactor incidencia-form.component.js
**ID en feature_list.json:** N/A (Solicitud directa)
**Status final:** done

### Resumen de Trabajo Realizado
- Se realizó un análisis exhaustivo del archivo `incidencia-form.component.js` (originalmente con 1403 líneas).
- Se identificó la violación del SRP (Single Responsibility Principle) y se propuso y ejecutó la extracción lógica a 4 clases de apoyo (`helpers`).
- Se crearon los helpers `MediaUploader`, `MapController`, `CategoryManager` y `LocationManager` dentro de la carpeta `frontend/js/pages/incidencias/components/lobby/form/helpers`.
- Se reescribió `incidencia-form.component.js` para instanciar y usar los helpers reduciendo drásticamente su complejidad y líneas de código (a ~400 líneas).
- Se canceló el script global `./init.sh` debido a un cuelgue prolongado en el backend, centrándose exclusivamente en validar el frontend.
- Se actualizaron las aserciones en el archivo de test `incidencia-form.component.test.js` para referenciar las nuevas dependencias (p. ej., `component.mapController.actualizarMarcador`).
- Se instalaron módulos de node en `frontend` y se comprobó que toda la suite de pruebas del formulario pasa con éxito al 100% (`npm test`).
