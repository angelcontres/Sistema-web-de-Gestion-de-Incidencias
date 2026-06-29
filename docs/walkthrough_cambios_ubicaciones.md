# Walkthrough de Cambios: Pantalla de Mantenimiento de Ubicaciones con Mapa Interactivo

Este documento detalla los cambios realizados en el proyecto **Sistema Web de Gestión de Incidencias** para implementar la pantalla de mantenimiento de **Ubicaciones** e integrar un sistema de mapas geográficos interactivo ("mapa insano").

---

## 🗺️ Descripción General de la Solución

Para la gestión de ubicaciones y direcciones, se diseñó una solución de tres niveles jerárquicos de acuerdo al modelo de datos existente:
1. **Países** (ej: Perú, México, Ecuador)
2. **Territorios** (ej: Departamentos/Estados/Provincias $\rightarrow$ Provincias/Cantones/Municipios $\rightarrow$ Distritos/Parroquias)
3. **Direcciones** (asociadas al nivel territorial más específico, ahora con coordenadas geográficas).

Además, se integró la biblioteca de mapas de código abierto **Leaflet.js** para visualizar las direcciones sobre un mapa interactivo y permitir ubicar nuevas direcciones haciendo clic en el mapa.

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
    *   Se actualizaron las validaciones en los métodos `store` y `update` para restringir y verificar los rangos geográficos permitidos (`latitud` entre -90 y 90, `longitud` entre -180 y 180).
*   **Sembrado de Datos ([UbicacionesSeeder.php](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/backend/api/database/seeders/UbicacionesSeeder.php)):**
    *   Se agregaron las coordenadas de latitud y longitud reales correspondientes a las direcciones iniciales de **Perú**, **México** y **Ecuador** (ej: el Gobierno Zonal en Guayaquil, y el CCI en Quito).

---

### 2. 💻 Frontend (Vanilla JS SPA)

Se integró **Leaflet.js** y se rediseñó la pestaña de direcciones para ofrecer un panel de visualización moderno en pantalla dividida.

*   **Biblioteca de Mapas ([index.html](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/index.html)):**
    *   Se importaron las hojas de estilo y scripts de **Leaflet.js** desde un CDN confiable de forma global para la aplicación.
*   **Rediseño de la Plantilla HTML ([ubicaciones-index.component.html](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/js/pages/ubicaciones/component/index/ubicaciones-index.component.html)):**
    *   **Pestaña Direcciones:** Modificada a un diseño de dos columnas (`row` con `.col-lg-7` y `.col-lg-5`):
        *   **Izquierda:** Tabla compacta e interactiva con el listado de direcciones registradas.
        *   **Derecha:** Un panel contenedor para el mapa geográfico (`#map`) que ocupa todo el alto disponible, junto con un botón para centrar la cámara en todos los marcadores disponibles.
    *   **Modal de Dirección:**
        *   Se dividió el modal en dos columnas: el formulario tradicional de detalles del lado izquierdo, y un mapa dinámico interactivo (`#modalMap`) del lado derecho.
        *   Se agregaron inputs de lectura para que el usuario visualice las coordenadas exactas de latitud y longitud asignadas.
*   **Lógica Interactiva del Componente JS ([ubicaciones-index.component.js](file:///home/angel/Documentos/GitHub/Sistema-web-de-Gestion-de-Incidencias/frontend/js/pages/ubicaciones/component/index/ubicaciones-index.component.js)):**
    *   **Carga Perezosa (Lazy Load):** Los mapas de Leaflet requieren calcular el espacio físico del contenedor. Se programó la inicialización del mapa principal solo cuando se muestra la pestaña "Direcciones" (`shown.bs.tab`), y el mapa del modal solo cuando este se despliega por completo (`shown.bs.modal`).
    *   **Interacción Tabla-Mapa:** Al hacer clic en cualquier fila de dirección dentro de la tabla, el mapa realiza un paneo suave (`setView`) hacia las coordenadas de esa dirección, aumentando el zoom y abriendo automáticamente su globo de información (*popup*).
    *   **Creador Geográfico (Pinning):** Al abrir el modal de creación o edición, el mapa se centrará en el país seleccionado. El usuario puede hacer clic en cualquier lugar del mapa para colocar o arrastrar un marcador. Las coordenadas del input se actualizan automáticamente al instante de soltar el pin.
    *   **Capa de Azulejos Estética:** Se cargó el estilo de mapas *CartoDB Voyager*, el cual ofrece una estética moderna, limpia y minimalista ideal para sistemas web empresariales.

---

## 🌟 Características Destacadas de la Interfaz (UX/UI)

1.  **Miller Columns (Explorador de Territorios):**
    *   Navegación fluida de 3 columnas para estructurar áreas geográficas por países.
2.  **Geolocalización en Pantalla Dividida (Split View):**
    *   El mapa se sincroniza en tiempo real con las filas seleccionadas de la tabla.
3.  **Marcado Fácil e Intuitivo:**
    *   Arrastra y suelta el pin en el mapa dentro del modal para reajustar las coordenadas geográficas de la dirección.
4.  **Auto-Ajuste de Cámara (Fit Bounds):**
    *   Al cargar la pestaña, el mapa calcula la caja delimitadora de todos los marcadores y hace un zoom óptimo para encuadrarlos a todos (tanto Perú, México como Ecuador).
5.  **Centrado Inteligente:**
    *   Al cambiar el selector de país en el modal de dirección, el mapa del modal realiza un viaje suave al centro geográfico de ese país en específico.
