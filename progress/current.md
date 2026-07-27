# Estado Actual (Sesión en curso)

## Feature en desarrollo
**Nombre:** Soporte de borrado lógico y reactivación automática de instituciones (Mejora y soporte)
**ID en feature_list.json:** N/A (Mantenimiento / Soporte UX)
**Status actual:** done

## Últimos cambios realizados
- Se modularizaron las reglas de validación en `InstitucionesRequest.php` creando el método helper `uniqueRule()` que aplica `Rule::unique()->whereNull('deleted_at')`.
- Se modularizó el método `store()` en `InstitucionController.php` extrayendo la lógica de restauración al método privado `restoreIfTrashed(array $data)`.
- Se agregó el test de integración `test_store_restores_trashed_institucion()` en `InstitucionTest.php` para validar la reactivación sin error HTTP 422.
- Todas las pruebas de `InstitucionTest` pasaron de forma exitosa (100% verde).
- Se corrigió el botón de creación en `institucion-index.component.html` reemplazando `<a href="#/instituciones/form">` por `<button type="button">` (igual que en Permisos y Roles) para evitar navegación o recarga del router SPA.
- Se agregó limpieza de modales huérfanos en `institucion-form.component.js` dentro de `onInit()` antes de adjuntar el modal al `document.body` y se estandarizó el ocultamiento con `bootstrap.Modal.getInstance()`.

## Problemas actuales / Bloqueos
- Ninguno

## Próximos pasos
- El usuario puede verificar en el navegador la creación y edición de instituciones sin recarga de página ni errores 422.

