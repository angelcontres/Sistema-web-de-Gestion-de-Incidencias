- **Descripción:** Implementar la base de datos de incidencias, la API CRUD y las pantallas frontend para listar, buscar y crear/editar incidencias.
- **Componentes del Ticket:**
  1. **Backend (Base de Datos y API):** Implementación según el er.md
     - Migración para la tabla `reporte_incidencias` y la tabla pivote usuario_incidencia` en [database/migrations](database/migrations). La tabla pivote es una tabla puente que se conecta entre usuarios y reporte_incidencias
     - Modelo `Incidencia` en app/Models.
     - `IncidenciaController` con las acciones CRUD (`index`, `store`, `show`, `update`, `destroy`).
     - `IncidenciasRequest` para modularizar validaciones, intanciando esta en el controller
     - los archivos ya están creados

  2. **Frontend (Vistas SPA):** (ya está creada la page en /frontend/js/pages)
     - Componente `<app-incidencia-index>` para listado.
     - Componente `<app-incidencia-form>` para creación y edición.
     - Rutas `#/incidencias` y `#/incidencias/form` en frontend/js/router.js
     - Las tablas deben generarse con el app-data-table genérico creado en [App-data-table](frontend/js/shared/components/app-data-table/app-data-table.component.js)
     - Se deberá seguir estrictamente la paleta de colores utilizada en el sistema.
     - Se presentará un mockup del form. No se deberá modificar elementos fuera del formulario, como el navbar ya definido, el sidebar, iconos, formas, etc. Solo se debe seguir la estructura y orden de los elementos ya especificados.
     - El formulario constará de dos partes: una para los datos y otra para recursos opcionales (fotos). Esto compuesto en un menú bar, con pestañas para datos y otra para recursos.
     - El mock para una guía visual se encuentra en [mock-form-incidencias](docs/03_mocks/form-incidencias)

- **Especificaciones de negocio:**
  1. Mientras sea rol de Institucion, a la institucion respectiva solo le aparecerán incidencias de su área. Esto quiere decir que esta pantalla debe ser correctamente gestionada para habilitar lo que puede ver o no el rol de institución. Lo mismo con el rol de operador
  2. Se deberá definir umbrales según la cantidad de afectados en la incidencia. Por ejemplo, si para un arbol caído existen mínimo 10 personas afectadas y está definida con prioridad alta, se recalculará la prioridad a crítica.
  3. El formulario debería presentar primero los campos más importantes:
     3.1. La categorización de la incidencia, por una incidencia que se escoja se deberán cargar en un combobox las subcategorías relacionadas a ella, y automáticamente asignar la prioridad (Crítica, Alta, Media, Baja) según cómo esté definido por debajo. La relación ya está definida en la bd pero falta agregar registros detallando quién va con quién.
     3.2. La ubicación utilizando el mapa de leaflet. El mapa debe permitir buscar una direccion y marcar zonas cercanas para agilizar la definición de la ubicación exacta. Por debajo automaticamente se va registrando todo lo necesario utilizado en la tabla Territorios (El país es siempre Ecuador ya que es a nivel nacional)
     3.3. Una zona opcional para adjuntar recursos de imagen
     3.4. Una descripción opcional en relación con la incidencia, pues se consideran factores de alto riesgo que pueden llegar a perjudicar el rescate al momento de llenar un formulario.
  4. El despacho de incidencias debe conseguirse siempre y cuando alguien lo apruebe y lo suba público. Como analogía, se asimila a las Pull Request en Github. Cuando se sube una PR si no es revisada y aprobada, el responsable no será capaz de mergearla.
- **Criterios de Aceptación:**
  - [ ] Interfaz responsive para computadoras y celulares en caso de que los ciudadanos lo reporten desde el teléfono.
  - [ ] CRUD funcional de extremo a extremo con listado.
  - [ ] El formulario envía los datos de coordenadas y prioridades al backend.
  - [ ] Formateo con Pint y Prettier exitoso.
  - [ ] Actualizar modelos y relaciones del backend en caso de que el er.md se haya actualizado
  - [ ] ...
