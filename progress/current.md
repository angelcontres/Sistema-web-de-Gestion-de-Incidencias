# Estado Actual (Sesión en curso)

> **Nota para el Agente:** Documenta aquí tu progreso. Cuando cierres la sesión (ver `AGENTS.md`), mueve el resumen al final de `history.md` y deja esta plantilla limpia para el siguiente agente.

## Feature en desarrollo
**Nombre:** [Nombre de la feature]
**ID en feature_list.json:** [ID]
**Status actual:** [pending | spec_ready | in_progress | done]

## Últimos cambios realizados
- [Lista de cambios]

## Problemas actuales / Bloqueos
- [Lista de problemas]

## Próximos pasos
- [Lista de próximos pasos]

## Feature en desarrollo
**Nombre:** fix_frontend_issues
**ID en feature_list.json:** 13
**Status actual:** in_progress

## Últimos cambios realizados
- Iniciando la feature, ejecutando tareas (T1).
- Agregados los atributos `integrity` y `crossOrigin` al elemento script de ECharts en `dashboard.component.js` para asegurar la integridad de subrecursos (SRI).
- Simplificada la lógica de `replaceAll` en `app-data-table.component.js` reemplazando la expresión regular por un literal de cadena `'${value}'` para una mejor mantenibilidad y legibilidad.
- Refactorización de `direccion-form.component.js`:
  - `guardarDireccion`, `autofillUbicacionDesdeCoords`, `actualizarFeedbackResolver`, `procesarJerarquiaGeograficaAutofill` y `configurarResolverTerritoriosFaltantes` fueron modularizadas y refactorizadas para reducir la complejidad ciclomática y cumplir con el límite máximo de 7 parámetros por función.
  - Se extrajo lógica en funciones auxiliares como `procesarNivelGeograficoAutofill`, `esSoloNivel3FaltanteConFallback`, `configurarOpcionFallbackResolver`, `configurarOpcionRegistroResolver`, `limpiarYActualizarUIAutofill`, `aplicarTerritorioDetectado` y `verificarNivelesFaltantes`.
- Actualización y ampliación de pruebas unitarias en `direccion-form.component.test.js`:
  - Se solucionó el problema de registro del Web Component (`TypeError: component.onInit is not a function`) importando explícitamente el módulo `./direccion-form.component.js` en el archivo de prueba.
  - Se añadieron pruebas unitarias para las nuevas funciones auxiliares (`configurarResolverTerritoriosFaltantes`, `procesarNivelGeograficoAutofill` y `aplicarTerritorioDetectado`), alcanzando una cobertura de **86.60% en líneas** y **83.62% en sentencias** (superando la meta requerida del 80%).
- Refactorización de `user-form.component.js`:
  - Se modularizó la función interna `const init = async () =>` extrayendo su lógica hacia métodos limpios de clase (`inicializarFormulario`, `configurarInterfazModo`, `configurarModoEdicion`, `configurarModoCreacion` y `cargarDatosModo`).
  - Se modularizó la función `cargarDatosEdicion` descomponiéndola en funciones auxiliares (`poblarCamposBasicosUsuario`, `poblarInstitucionUsuario`, `procesarRolesUsuario`, `poblarTerritoriosUsuario` y `manejarErrorCargaEdicion`) para reducir significativamente la complejidad ciclomática y mantener los límites de parámetros.
  - Se resolvió el fallo intermitente del registro de Web Component en pruebas agregando la importación explícita `./user-form.component.js` en `user-form.component.test.js`.
  - Se crearon pruebas unitarias para cubrir los nuevos métodos, el manejo de errores en `cargarDatosEdicion` y el comportamiento de *drag and drop*, alcanzando un **88.59% de cobertura de líneas** y **86.71% en sentencias** (todas las 9 pruebas del componente pasaron 100%).

## Problemas actuales / Bloqueos
- Ninguno en `user-form` y `direccion-form`. Ambos componentes tienen 100% pruebas exitosas y más del 80% de cobertura.

## Próximos pasos
- Continuar con el resto de requerimientos o features pendientes en el backlog.
