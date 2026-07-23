# ENTREGABLE 7: Reporte de Rendimiento y Calidad Operacional

## 1. Objetivos del Sprint de Carga
**Objetivo General:**
Evaluar el rendimiento, escalabilidad y estabilidad del Sistema Web de Gestión de Incidencias Georreferenciadas bajo condiciones progresivas de carga concurrente simulada.

**Funcionalidades Críticas Sometidas a Estrés:**
*   **Autenticación de Usuarios (`POST /api/v1/login`):** Validación de generación de tokens para 4 perfiles distintos (admin, ciudadano, supervisor, institución).
*   **Consulta de Incidencias (`GET /api/v1/incidents`):** Medición de latencia en la recuperación de datos para mapas.
*   **Métricas del Dashboard (`GET /api/v1/dashboard/stats`):** Procesamiento de estadísticas agregadas.
*   **Catálogos y Geocodificación:** Carga de territorios (`GET /api/v1/catalogs/territories`) y geocodificación inversa (`GET /api/v1/geocoding/reverse`).

## 2. Perfil del Entorno & Herramientas

**Infraestructura de Pruebas:**
*   **Entorno de Despliegue:** Producción (Servidor VPS / Cloud hospedando `alertcity.dihm-muertos.site` vía HTTPS).
*   **Base de Datos:** PostgreSQL en entorno de producción.

**Herramientas Utilizadas:**
*   **Apache JMeter (v5.6.3):** Herramienta principal para simular la carga e inyectar peticiones HTTP estructuradas con cabeceras `Authorization: Bearer` y `Accept: application/json`.

## 3. Definición de Escenarios Operativos

Se definieron tres grupos de prueba (Ramp-up progresivo) atacando simultáneamente múltiples endpoints del sistema:

| Grupo de Prueba | Nivel de Estrés | Muestras Totales (Samples) | Endpoints Involucrados | Meta Funcional (SLA - Hito 1) |
| :--- | :--- | :--- | :--- | :--- |
| **Grupo 1** | Carga Ligera (Línea Base) | 1,750 peticiones (250 x endpoint) | 7 endpoints (Logins, Incidents, Dashboard, Geocoding) | < 3000ms |
| **Grupo 2** | Carga Media | 4,500 peticiones (750 x endpoint) | 6 endpoints (Logins, Incidents, Dashboard) | < 3000ms |
| **Grupo 3** | Carga Pesada (Estrés) | 14,997 peticiones (~2160 x endpoint) | 7 endpoints (Logins, Incidents, Dashboard, Territories) | < 3000ms |

## 4. Telemetría de Indicadores & Gráficos

A continuación, se tabulan los resultados obtenidos para el conjunto global de cada prueba y se adjuntan los gráficos generados por JMeter.

### Tabla Consolidada de Resultados (Promedios Globales)

| Grupo de Prueba | Tiempo Promedio (ms) | Tiempo Máximo (ms) | Throughput (Req/s) | Tasa de Error (%) |
| :--- | :--- | :--- | :--- | :--- |
| **Grupo 1** | 1,521 ms | 5,902 ms | 13.97 req/s | 0.000 % |
| **Grupo 2** | **696 ms** | 3,260 ms | **57.01 req/s** | 0.000 % |
| **Grupo 3** | 8,186 ms | 96,718 ms | 17.81 req/s | 0.007 % |

### Gráficos de Comportamiento

#### Resultados - Grupo 1 (Carga Ligera)
![Grafico Grupo 1](./imagenes/grafico-grupo1.png)

#### Resultados - Grupo 2 (Carga Media)
![Grafico Grupo 2](./imagenes/grafico-grupo2.png)

#### Resultados - Grupo 3 (Carga Pesada / Estrés)
![Grafico Grupo 3](./imagenes/grafico-grupo3.png)


## 5. Detección de Cuellos de Botella

Basado en el análisis de las muestras por endpoint en los archivos CSV, se detectaron los siguientes cuellos de botella críticos:

1.  **Colapso en la carga de Territorios (Grupo 3):** 
    Durante la prueba de estrés masivo (Grupo 3), el endpoint `GET territories` promedió un tiempo de respuesta inaceptable de **51,158 ms (51 segundos)**, con un pico máximo de 96,718 ms. Esto indica que extraer todo el catálogo de territorios simultáneamente agota la memoria/CPU de la base de datos bajo alta concurrencia.
2.  **Degradación en Geocodificación (Grupo 1):**
    El endpoint `GET geocoding reverse` fue el más lento en la prueba ligera, promediando 3,243 ms. Esto se debe a que realiza peticiones a APIs externas (OpenStreetMap / BigDataCloud), limitando severamente la velocidad de respuesta del propio sistema.
3.  **Consulta de Incidencias:**
    Aunque resistió bien en cargas bajas y medias (1256 ms y 701 ms respectivamente), durante el Grupo 3 (`GET incidents` con 2161 peticiones) el tiempo se elevó a 2,438 ms de promedio.

## 6. Recomendaciones, Objetivos (E1) y Dictamen

**Plan de Remediación Especifico:**
1.  **Caché en Territorios:** Es mandatorio implementar una estrategia de caché (ej. Redis o Caché nativo de Laravel) para el endpoint de `territories`, ya que es información de solo lectura que cambia rara vez, pero cuyo tamaño colapsa la BD en lectura concurrente.
2.  **Asincronismo o Caché Espacial en Geocoding:** Los resultados de `geocoding reverse` deben cachearse en la base de datos (guardar lat/lng previamente consultados) para evitar salir a internet en cada petición, lo que dispara los tiempos de respuesta a más de 3 segundos.
3.  **Optimización de Queries en Incidencias:** Revisar la implementación de paginación o añadir índices espaciales a las coordenadas de PostgreSQL para mantener los tiempos bajo 1 segundo incluso con carga pesada.

**Contraste con Acuerdos de Nivel de Servicio (SLA) del Hito 1:**
Según el **Plan de Gestión de Calidad (Hito 1)**, el SLA para el **Tiempo de Respuesta Promedio (TRP)** dicta un umbral de **$< 3\text{ s}$ (entre 3 a 5 segundos como máximo)** y una tasa de éxito $\ge 90\%$.
*   **Disponibilidad:** El sistema cumplió sobradamente, manteniendo 0.000% de errores en los Grupos 1 y 2, y apenas un 0.007% en el Grupo 3.
*   **Latencia (TRP):** El sistema **CUMPLE** el SLA bajo escenarios de uso normales y medios (Grupos 1 y 2 con promedios de 1.5s y 0.69s). Sin embargo, **INCUMPLE** el SLA en el escenario de estrés (Grupo 3 con promedio de 8.18s), arrastrado principalmente por el endpoint de territorios.

**Dictamen:**
El sistema actual es **VIABLE** para paso a producción bajo las cargas simuladas para un escenario de uso diario normal, dado que el Throughput escaló excelentemente hasta las 57 peticiones por segundo sin pérdida de datos. Sin embargo, para soportar eventos de crisis (avalanchas de reportes), es requisito aplicar las recomendaciones de caché antes mencionadas.
