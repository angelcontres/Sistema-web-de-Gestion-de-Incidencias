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

## Problemas actuales / Bloqueos
- Ninguno

## Próximos pasos
- El usuario puede probar la creación y reactivación de instituciones en la interfaz web sin errores 422.

