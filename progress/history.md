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
- Se verificó la suite de pruebas del componente de login (`login.component.test.js`) con éxito al 100%.

## Sesión - Feature ID 18 (Estilos CSS Responsivos)
**Nombre:** implement_responsive_css
**ID en feature_list.json:** 18
**Status final:** done

### Resumen de Trabajo Realizado
- Se implementaron y verificaron las 10 tareas (T1..T10) de la especificación SDD para estilos CSS responsivos y estandarización de componentes en todo el frontend:
  - Se configuró la prevención global de desbordamiento horizontal (`overflow-x: hidden`) en `layout.css` y media queries para ajuste de espaciado y fuentes en dispositivos móviles.
  - Se aseguró que los contenedores de tablas usen `.table-responsive` y se estandarizó la grilla flexbox y clases utilitarias de Bootstrap en todas las vistas de incidencias, ubicaciones y reportes.
  - Se refactorizó la estructura del panel de chat en `estado-individual-incidencia` usando `.chat-panel-card` y `.h-100` con media queries que limitan la expansión vertical excesiva en pantallas `< 992px`.
  - Se optimizó la botonera de acceso rápido del dashboard para ocultar el texto en móviles (`d-none d-sm-block`) y centrar los iconos en resoluciones pequeñas (`justify-content-center justify-content-sm-start`).
  - Se estandarizaron los modales en todo el frontend con clases `.premium-modal-content`, fondo consistente, bordes visibles (`1px solid var(--border-color)`) y esquinas redondeadas (`var(--radius-xl)`).
  - Se refactorizó el módulo de Categorías para reemplazar tablas HTML manuales por el componente estandarizado `<app-data-table>`.
- Se creó y mantuvo la trazabilidad en `progress/impl_implement_responsive_css.md`.
- Se resolvieron exitosamente todas las observaciones de auditoría del revisor (`CHANGES_REQUESTED` y `CHANGES_REQUESTED` 2), restaurando el archivo `.env.local` del backend y logrando el 100% de pruebas en verde para toda la suite unitaria de frontend.
- Feature aprobada oficialmente (`APPROVED`) por el revisor.
