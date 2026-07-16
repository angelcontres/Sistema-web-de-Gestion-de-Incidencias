# Estado general del proyecto

El equipo de desarrollo se encuentra ejecutando revisiones técnicas mediante inspecciones manuales y análisis estático de código (Pull Requests en GitHub) para prevenir defectos funcionales antes del despliegue en el entorno de staging.

# 1. Estado Actual del Proyecto

## 1.1. Funcionalidades implementadas

- Se han configurado los contenedores Docker independientes para Nginx, Laravel y PostgreSQL.
- También se ha implementado componentes web para el mantenimiento de roles y usuarios. A la par también existen las migraciones de base de datos que ayudarán a poblar tablas para pruebas rápidas.
- Se implementa middleware de autorización, el cual se relaciona con los usuarios, sus roles y permisos para redirecciones seguras.
- Refresh de tokens de Sanctum desde backend.
- Carga de menús condicionales en el sidebar (anteriormente había un navbar que tenía los ítems hardcodeados, pero eso se reemplazará por icono del sistema, notificaciones y perfil), validación de formularios y un componente de asignación de roles interactivo del tipo **Drag & Drop**.

## 1.2. Funcionalidades pendientes

- Integrar completamente la biblioteca **Leaflet.markercluster** para el Módulo de Normalización Geográfica. Tablas y llamadas API para catálogos encadenados de Provincias, Cantones y Parroquias, junto con el guardado de coordenadas.
- Visor Cartográfico: componente frontend basado en Leaflet para marcar georreferenciaciones.
- Habilitación del Módulo de Dashboard e Indicadores para los reportes en CSV y PDF.
- CRUD de Incidencias: creación, actualización y desactivación de reportes de incidencias.
- Historial e Indicadores: auditoría del flujo de estados (timeline) y dashboard del tiempo medio de resolución.

# 2. Matriz de Riesgos de Calidad e Inspección OWASP

A partir del análisis del ciclo de vida de las incidencias y la arquitectura del sistema, se han identificado las siguientes anomalías potenciales.

## 2.1. Riesgos Funcionales

- **RF-01 Inconsistencia de Estados:** Posibilidad de que una incidencia cambie de estado directamente de **"Pendiente"** a **"Resuelto"** sin registrar las firmas del operador responsable o el tiempo transcurrido en el estado **"En Proceso"**.
- **RF-02 Duplicidad Espacial:** Registro redundante de la misma incidencia física por falta de algoritmos de validación de coordenadas de proximidad (tolerancia en metros).

## 2.2. Riesgos Técnicos

- **RT-01 (Falta de Transaccionalidad):** Fallo en la consistencia de datos si una transacción SQL de asignación de permisos/roles o guardado de direcciones físicas se interrumpe a mitad de proceso.
- **RT-02 (Exposición de Datos Sensibles):** El API REST de Laravel expone información detallada de los usuarios (como timestamps de creación, campos no sanitizados) en respuestas que deberían ser minimalistas.
- **RT-03 (Renderizado de mapas):** Se anticipan demoras superiores a 5 segundos en el mapa de Leaflet debido a la descarga y renderizado simultáneo de cientos de marcadores espaciales sin una agrupación adecuada (_clustering_).

## 2.3. Evaluación Preliminar OWASP (Top 10)

| Vector de Riesgo OWASP                  | ¿Existe riesgo? | Observación Inicial / Diagnóstico                                                                                                             |
| --------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **A01:2021: Broken Access Control**     | Sí              | Si no se configuran correctamente los middlewares en las rutas de la API, un usuario normal podría acceder al dashboard administrativo.       |
| **A02:2021: Cryptographic Failures**    | No              | Las credenciales se almacenan mediante hashing seguro con Bcrypt mediante el casting nativo `'password' => 'hashed'` en el modelo `User.php`. |
| **A03:2021: Injection (SQL/XSS)**       | No              | El riesgo de inyección SQL está mitigado por defecto al utilizar el ORM Eloquent de Laravel con consultas preparadas en PostgreSQL.           |
| **A05:2021: Security Misconfiguration** | Sí              | El entorno podría exponer variables sensibles si no se inhabilita el modo debug de Laravel en producción (`APP_DEBUG=false`).                 |
| **A07:2021: Authentication Failures**   | Sí              | Ausencia de **Rate Limiting** en la ruta `/v1/login`, dejando el sistema vulnerable a ataques de fuerza bruta.                                |

# 3. Priorización de Riesgos (Matriz Probabilidad × Impacto)

| Riesgo Evaluado                                                       | Probabilidad | Impacto | Prioridad |
| --------------------------------------------------------------------- | ------------ | ------- | --------- |
| Accesos no autorizados a paneles administrativos                      | Media        | Alta    | Crítico   |
| Errores en el flujo de cambio de estados                              | Media        | Alta    | Alta      |
| Inconsistencia en datos de georreferenciación (coordenadas nulas)     | Media        | Media   | Alta      |
| Consultas y renderizado lentos en el mapa dinámico                    | Baja         | Media   | Media     |
| Fallas en la integración asíncrona de servicios futuros (ej. correos) | Media        | Media   | Media     |

# 4. Revisión Técnica Estructurada del Sistema

## 4.1. Revisión de Requisitos

- Se verificó analíticamente que las Historias de Usuario obligatorias cubran el flujo de estados obligatorio (**Pendiente → En proceso → Resuelto**) manteniendo un registro histórico inalterable.
- Para las métricas definidas al inicio se utilizará un nuevo esquema de la base de datos llamado **`metrics`** donde se guarden datos de tiempos de respuesta de endpoints y cubrimiento de pruebas de manera automatizada. Estos se podrán exportar en formato CSV o TXT para su debido análisis.

## 4.2. Revisión del Modelo de Datos

- Se implementa borrado lógico (_soft delete_) para evitar pérdida de datos en tablas de mantenimiento.
- El trabajo de normalización de las tablas de entidades geopolíticas (país, provincia, ciudad) se considera que puede ser más optimizado con tablas recursivas.
- Donde sí existe recursividad, es en la tabla de roles. También existe una tabla puente que unifica a la de usuarios y guarda los roles de cada usuario. Es importante recalcar que al borrar una fila de usuario se deben borrar también los roles de él en cascada, para evitar claves huérfanas.

## 4.3. Revisión de Arquitectura

- La separación de responsabilidades se cumple. El enlace es exitoso entre el Frontend (HTML/JS) y el Backend (Laravel API REST) a través de contenedores Docker, lo cual garantiza la mantenibilidad y extensibilidad del código.
- Aislamiento de Servicios: El contenedor que sostiene a PostgreSQL se encuentra aislado dentro de la red interna de Docker (`sistema_net`), exponiendo únicamente el puerto de Nginx al exterior para mayor seguridad de red.

## 4.4. Revisión Manual de Código Fuente

Se determinó la necesidad de ejecutar herramientas automatizadas:

### Laravel Pint

Utiliza un comando para corregir errores de formato:

- Comas, paréntesis ausentes.
- Indentación.
- No utiliza archivos de configuración puesto que ya es propio de Laravel.

### PHP CodeSniffer

- **`phpcs`**: Escanea el proyecto y genera un informe con todas las infracciones al estilo de código.
- **`phpcbf`**: Corrige automáticamente muchos de estos problemas de formato sin que tengas que hacerlo a mano.

### PHPStan

Lee el código sin ejecutarlo para buscar errores lógicos profundos. Por ejemplo:

- Llamadas a funciones o métodos que no existen.
- Parámetros incorrectos enviados a una función.
- Acceso a propiedades no definidas en un objeto.
- Variables nulas (`null`) que podrían causar que la aplicación falle.

# 5. Lista de Verificación de Calidad (Checklist)

| Ítem / Control de Calidad Analizado                                          | ¿Cumple? | Observación                                                                                                    |
| ---------------------------------------------------------------------------- | :------: | -------------------------------------------------------------------------------------------------------------- |
| CRUD operativo de gestión de incidencias georreferenciadas con adjuntos.     |  **NO**  | Funcionalidad pendiente para el siguiente sprint.                                                              |
| Validaciones aplicadas en el Frontend (formatos, campos mandatorios).        |  **SÍ**  | Validaciones nativas y clases dinámicas en el Light DOM.                                                       |
| Validaciones estrictas y sanitización HTML en el Backend para evitar XSS.    |  **SÍ**  | Anteriormente se pasaba el HTML dentro de una variable `innerHTML`; ahora se utiliza un componente compartido. |
| Historial y trazabilidad de auditoría en los cambios de estado (timestamps). |  **NO**  | Pendiente junto con el módulo de incidencias.                                                                  |
| Control de acceso estricto basado en roles (Admin, Operador, Ciudadano).     |  **SÍ**  | Ya existen tablas de roles y permisos, y el control de permisos se implementa con middleware.                  |

# 6. Registro de Hallazgos Encontrados

| ID       | Hallazgo / Defecto Identificado                                                                                                       | Severidad | Estado                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------- |
| **H-01** | Ausencia de sanitización HTML y validaciones estrictas de entrada, lo que expone formularios a ataques de Cross-Site Scripting (XSS). | Baja      |                                        |
| **H-02** | Rutas de la API REST que mutan datos operan sin middlewares de validación de permisos explícitos.                                     | Baja      |                                        |
| **H-03** | Inconsistencia de sesión local: los permisos cambiados en base de datos no se sincronizaban en el cliente.                            | Media     |                                        |
| **H-04** | Exposición redundante del perfil del usuario en la respuesta del endpoint de login.                                                   | Baja      | Se implementa autenticación por token. |
| **H-05** | Variable `APP_DEBUG=true` activa por defecto exponiendo trazas internas en el contenedor.                                             | Baja      |                                        |

# 7. Acciones Correctivas Propuestas

| ID Hallazgo | Plan de Acción / Resolución Técnica                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **H-01**    | Incorporar un diálogo de confirmación previo en la acción del botón de la tabla. _(Implementado)_                                              |
| **H-02**    | Desarrollar un middleware de Laravel y registrarlo en `bootstrap/app.php` para interceptar las peticiones y validar permisos. _(Implementado)_ |
| **H-03**    | Invocar el endpoint `/v1/me` al recargar o instanciar el enrutador para actualizar el almacenamiento local. _(Implementado)_                   |
| **H-04**    | Modificar la respuesta del controlador de login y hacer que el frontend consuma `/v1/me` para obtener el perfil. _(Implementado)_              |
| **H-05**    | Configurar el archivo `.env` de producción con `APP_DEBUG=false` para enmascarar excepciones del framework.                                    |
