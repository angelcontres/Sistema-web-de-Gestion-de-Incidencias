# Walkthrough de Cambios: Pantalla de Mantenimiento de Ubicaciones con Mapa Interactivo (Versión Modular)

Este documento detalla los cambios realizados en el proyecto **Sistema Web de Gestión de Incidencias** para implementar la pantalla de mantenimiento de **Ubicaciones** e integrar un sistema de mapas geográficos interactivo, estructurado de manera altamente modular mediante Web Components.

---

## 🗺️ Descripción General de la Solución

Para la gestión de ubicaciones y direcciones, se diseñó una solución de tres niveles jerárquicos de acuerdo al modelo de datos existente:
1. **Países** (ej: Perú, México, Ecuador)
2. **Territorios** (ej: Departamentos/Estados/Provincias $\rightarrow$ Provincias/Cantones/Municipios $\rightarrow$ Distritos/Parroquias)
3. **Direcciones** (asociadas al nivel territorial más específico, ahora con coordenadas geográficas).

El módulo de Ubicaciones se dividió en componentes altamente desacoplados y enfocados en una sola responsabilidad:
*   `app-ubicaciones-index`: Contenedor principal que maneja la estructura de pestañas y coordina la inicialización de mapas.
*   `app-ubicaciones-paises`: Maneja el catálogo de países y su CRUD.
*   `app-ubicaciones-territorios`: Administrador de jerarquías (Miller Columns) y su CRUD.
*   `app-ubicaciones-direcciones`: Gestiona el listado de direcciones físicas, el mapa principal y el georeferenciador interactivo del modal.

---

## 🛠️ Detalle de Cambios Realizados

### 1. ⚙️ Backend (Laravel API & Base de Datos)

Se agregaron los campos de coordenadas geográficas (`latitud` y `longitud`) a la tabla de direcciones y se adaptaron los controladores.

*   **Esquema de Base de Datos (`2026_06_27_000003_create_direcciones_table.php`):**
    *   Se añadieron las columnas decimales `latitud` y `longitud` para almacenar coordenadas con alta precisión:
        ```php
        $table->decimal('latitud', 10, 8)->nullable();
        $table->decimal('longitud', 11, 8)->nullable();
        ```
*   **Modelo de Datos ([Direccion.php](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/backend/api/app/Models/Direccion.php)):**
    *   Se incluyeron `latitud` y `longitud` dentro del atributo `#[Fillable(...)]`.
    *   Se configuró el casteo automático a tipo `float` en la función `casts()` para evitar discrepancias de tipos al consumir la API desde Javascript.
*   **Controlador de la API ([DireccionController.php](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/backend/api/app/Http/Controllers/DireccionController.php)):**
    *   Se actualizaron las validaciones en los métodos `store` y `update` para verificar los rangos geográficos permitidos (`latitud` entre -90 y 90, `longitud` entre -180 y 180).
*   **Sembrado de Datos ([UbicacionesSeeder.php](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/backend/api/database/seeders/UbicacionesSeeder.php)):**
    *   Se agregaron las coordenadas de latitud y longitud reales correspondientes a las direcciones iniciales de **Perú**, **México** y **Ecuador** (ej: el Gobierno Zonal en Guayaquil, y el CCI en Quito).

---

### 2. 💻 Frontend (Refactorización Modular en Web Components)

Se dividió el módulo en componentes independientes comunicados mediante eventos nativos del DOM.

*   **Biblioteca de Mapas ([index.html](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/index.html)):**
    *   Se importaron las hojas de estilo y scripts de **Leaflet.js** desde un CDN confiable.
*   **Contenedor Principal (`app-ubicaciones-index`):**
    *   [ubicaciones-index.component.html](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/js/pages/ubicaciones/component/index/ubicaciones-index.component.html): Contiene la navegación por pestañas de Bootstrap 5 y hospeda los tres sub-componentes.
    *   [ubicaciones-index.component.js](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/js/pages/ubicaciones/component/index/ubicaciones-index.component.js): Registra el elemento e importa los sub-componentes. Escucha el cambio de pestaña para forzar al mapa a recalcular su tamaño (`invalidateSize`).
*   **Sub-componente Países (`app-ubicaciones-paises`):**
    *   [ubicaciones-paises.component.js](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/js/pages/ubicaciones/components/paises/ubicaciones-paises.component.js): Administra la tabla y el modal de países. Al actualizarse la lista, emite el evento personalizado `paises-updated`.
*   **Sub-componente Territorios (`app-ubicaciones-territorios`):**
    *   [ubicaciones-territorios.component.js](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/js/pages/ubicaciones/components/territorios/ubicaciones-territorios.component.js): Implementa la vista de 3 columnas para territorios. Escucha `paises-updated` para sincronizar el selector de países. Al registrar cambios, emite `territorios-updated`.
*   **Sub-componente Direcciones (`app-ubicaciones-direcciones`):**
    *   [ubicaciones-direcciones.component.js](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/js/pages/ubicaciones/components/direcciones/ubicaciones-direcciones.component.js): Controla la tabla de direcciones, la sincronización del mapa principal, y el modal con selectores en cascada y mapa georeferenciador. Escucha `paises-updated` para sincronizar su formulario.

---

## 🌟 Ventajas del Diseño Modular (UX/UI & Arquitectura)

1.  **Código Mantenible y Limpio:**
    *   En lugar de tener un único archivo monolítico de 700 líneas de JS y 500 de HTML, ahora cada archivo tiene menos de 250 líneas y está enfocado en una sola responsabilidad.
2.  **Comunicación Reactiva mediante Eventos del DOM:**
    *   Los componentes no se acoplan entre sí. Comparten información de manera limpia mediante eventos estándar como `paises-updated` y `territorios-updated`.
3.  **Seguridad Integrada:**
    *   Cada componente valida de manera independiente los permisos del usuario logueado (`AuthService.isAdmin()`) para ocultar o mostrar los botones de acción (Nuevo, Editar, Eliminar).
4.  **UX Premium del Mapa:**
    *   El mapa se sincroniza al hacer clic en las filas de la tabla de direcciones, realizando un paneo fluido al marcador correspondiente.
    *   El georeferenciador del modal permite colocar y arrastrar un pin de manera sumamente interactiva.
