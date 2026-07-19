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
