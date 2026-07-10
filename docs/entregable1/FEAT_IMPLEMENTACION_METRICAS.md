# Feature: Implementación de Métricas e Indicadores SQA

Este documento detalla el plan de implementación técnica para las métricas e indicadores de calidad definidos en la sección 09 del Plan de Gestión de Calidad.

---

## 1. Métrica: Tasa de Éxito de Pruebas (TEP)
*Mide la estabilidad y correcto comportamiento del software a través del porcentaje de pruebas unitarias/integración aprobadas.*

### Base de Datos
* Crear migración para la tabla `sqa_metrics_history`:
  * `id` (Primary Key, autoincrementable)
  * `tep` (decimal, 5, 2) - Porcentaje de éxito de las pruebas (ej: 95.50)
  * `pruebas_aprobadas` (integer) - Cantidad de pruebas exitosas
  * `pruebas_fallidas` (integer) - Cantidad de pruebas fallidas
  * `pruebas_omitidas` (integer) - Cantidad de pruebas omitidas
  * `total_pruebas` (integer) - Sumatoria total de las pruebas ejecutadas
  * `fecha_ejecucion` (timestamp) - Marca de tiempo cuando se ejecutó la suite de pruebas
  * Campos de auditoría estándar: `created_at`, `updated_at`, `deleted_at` (Soft Delete)

### Backend
* Crear el modelo `SqaMetricsHistory` en Laravel.
* Crear las rutas de la API en `routes/api.php` protegidas mediante token de autenticación:
  * `POST /api/sqa/metrics-history` (Para registrar resultados desde la pipeline CI/CD)
  * `GET /api/sqa/metrics-history` (Para consulta en el Dashboard)
* Crear `StoreSqaMetricsHistoryRequest` para validar la creación:
  * `tep`: `required|numeric|between:0,100`
  * `pruebas_aprobadas`: `required|integer|min:0`
  * `pruebas_fallidas`: `required|integer|min:0`
  * `pruebas_omitidas`: `required|integer|min:0`
  * `total_pruebas`: `required|integer|min:0`
  * `fecha_ejecucion`: `required|date_format:Y-m-d H:i:s`
* Crear `SqaMetricsHistoryController` para procesar el guardado y consulta de datos.

### Frontend
* Integrar componente visual tipo "Badge" dinámico en la cabecera del panel administrativo que muestre el estado general del build actual y el porcentaje TEP.
* Crear un gráfico de líneas temporales (ej. con Chart.js o Recharts) que muestre la evolución histórica de la Tasa de éxito de pruebas.

### Flujo de implementación (TEP)
* **Cuantificación:** PHPUnit exporta un reporte en formato JUnit XML mediante `php artisan test --log-junit tests/results.xml` al finalizar las pruebas unitarias y de integración.
* **Persistencia:** Un script en la pipeline lee el XML, extrae los contadores (total de pruebas, aprobadas, fallidas, omitidas), calcula la tasa porcentual (`tep`) y envía los datos mediante una petición HTTP `POST` a `/api/sqa/metrics-history`, donde el modelo `SqaMetricsHistory` los guarda.

---

## 2. Métrica: Cobertura Funcional (CF)
*Mide el porcentaje de Historias de Usuario (HU) del backlog validadas mediante pruebas de aceptación.*

### Base de Datos
* Crear migración para la tabla `sqa_functional_coverage`:
  * `id` (Primary Key, autoincrementable)
  * `cf` (decimal, 5, 2) - Porcentaje de cobertura funcional (ej: 100.00)
  * `hus_validadas` (integer) - Cantidad de HUs con test de aceptación exitoso
  * `total_hus` (integer) - Cantidad total de HUs en el backlog
  * `fecha_medicion` (timestamp) - Fecha en que se tomó la métrica
  * Campos de auditoría estándar: `created_at`, `updated_at`, `deleted_at`

### Backend
* Crear el modelo `SqaFunctionalCoverage` en Laravel.
* Crear endpoint `GET /api/sqa/functional-coverage` para retornar el último estado e historial de cobertura.
* Crear un comando de consola de Artisan (`app/Console/Commands/SyncFunctionalCoverage.php`) que:
  * Consulte mediante GraphQL la API de Linear App para obtener las historias de usuario y su estado.
  * Verifique los casos de prueba ejecutados y su cobertura analítica.
  * Calcule y registre los valores de Cobertura Funcional de forma automática.
* Crear `StoreSqaFunctionalCoverageRequest` (en caso de actualización externa vía endpoint):
  * `cf`: `required|numeric|between:0,100`
  * `hus_validadas`: `required|integer|min:0`
  * `total_hus`: `required|integer|min:0`
  * `fecha_medicion`: `required|date_format:Y-m-d H:i:s`

### Frontend
* Crear un gráfico de tipo pastel (Pie/Donut Chart) en el Dashboard de Calidad que ilustre la proporción de historias de usuario validadas vs. las no validadas/pendientes.

### Flujo de implementación (CF)
* **Cuantificación:** Se consumen las APIs GraphQL de **Linear App** para obtener la lista de Historias de Usuario (HUs) del Sprint. Luego, se cruzan con el total de pruebas de aceptación implementadas en el código que posean anotaciones de cobertura funcional (ej: `@covers HU-01`).
* **Persistencia:** Una tarea programada en Laravel Task Scheduler (`app/Console/Kernel.php`) realiza la consulta, calcula el porcentaje (`cf`) y crea un registro usando `SqaFunctionalCoverage::create(...)`.

---

## 3. Métrica: Densidad de Defectos (DD)
*Mide la cantidad de bugs detectados por cada caso de prueba ejecutado para controlar la madurez del código.*

### Base de Datos
* Crear migración para la tabla `sqa_defect_densities`:
  * `id` (Primary Key, autoincrementable)
  * `dd` (decimal, 5, 4) - Densidad de defectos calculada (ej: 0.0450)
  * `bugs_alta_media` (integer) - Cantidad de bugs activos de severidad Alta o Media
  * `casos_ejecutados` (integer) - Cantidad total de casos de prueba ejecutados en testing
  * `fecha_calculo` (timestamp) - Fecha en la que se realizó el cálculo
  * Campos de auditoría estándar: `created_at`, `updated_at`, `deleted_at`

### Backend
* Crear el modelo `SqaDefectDensity` en Laravel.
* Crear endpoint `GET /api/sqa/defect-density` para el consumo del dashboard.
* Implementar tarea programada (cron) en `app/Console/Kernel.php` que se ejecute diariamente:
  * Llama a la API de Linear App para contar los bugs activos con prioridad Alta/Media.
  * Consulta el total de casos ejecutados en la tabla `sqa_metrics_history`.
  * Realiza la división matemática, instancia el modelo y persiste los datos.
* Crear `StoreSqaDefectDensityRequest` para validación:
  * `dd`: `required|numeric|min:0`
  * `bugs_alta_media`: `required|integer|min:0`
  * `casos_ejecutados`: `required|integer|min:0`
  * `fecha_calculo`: `required|date_format:Y-m-d H:i:s`

### Frontend
* Crear un gráfico de líneas temporales de tendencia (Trend Chart) en el panel administrativo, con una línea horizontal estática de referencia en `0.1` que marque el límite máximo aceptable de densidad de defectos.

### Flujo de implementación (DD)
* **Cuantificación:** Se calcula dividiendo la cantidad de Bugs activos (abiertos en Linear App con prioridad Alta/Media) entre el histórico acumulado de casos de prueba ejecutados en testing (obtenido de `sqa_metrics_history`).
* **Persistencia:** Laravel Task Scheduler corre diariamente un comando Artisan que realiza el cálculo del ratio y persiste los datos con `SqaDefectDensity::create(...)`.

---

## 4. Métrica: Vulnerabilidades Críticas (OWASP) (VCO)
*Controla y cuantifica las brechas de seguridad según los 5 vectores del estándar OWASP adoptados.*

### Base de Datos
* Crear migración para la tabla `sqa_security_findings`:
  * `id` (Primary Key, autoincrementable)
  * `vco` (integer) - Total de vulnerabilidades críticas/hallazgos OWASP
  * `hallazgos_altos` (integer) - Cantidad de vulnerabilidades altas
  * `hallazgos_medios` (integer) - Cantidad de vulnerabilidades medias
  * `hallazgos_bajos` (integer) - Cantidad de vulnerabilidades bajas
  * `detalle_hallazgos` (json) - Objeto JSON con el listado detallado de vulnerabilidades reportadas
  * `fecha_auditoria` (timestamp) - Fecha en que se realizó el escaneo
  * Campos de auditoría estándar: `created_at`, `updated_at`, `deleted_at`

### Backend
* Crear el modelo `SqaSecurityFinding` en Laravel.
* Crear endpoint `POST /api/sqa/security-findings` (Protegido por API Key para la integración de la pipeline de Docker/Github Actions).
* Crear endpoint `GET /api/sqa/security-findings` para el consumo del panel administrativo.
* Crear `StoreSqaSecurityFindingRequest` para validar el reporte enviado por el escáner de seguridad:
  * `vco`: `required|integer|min:0`
  * `hallazgos_altos`: `required|integer|min:0`
  * `hallazgos_medios`: `required|integer|min:0`
  * `hallazgos_bajos`: `required|integer|min:0`
  * `detalle_hallazgos`: `nullable|array`
  * `fecha_auditoria`: `required|date_format:Y-m-d H:i:s`

### Frontend
* Implementar un widget de tipo semáforo o indicador de alerta visual:
  * **Verde**: Si el indicador global `vco` es igual a `0`.
  * **Amarillo**: Si `vco == 0` pero existen hallazgos medios o bajos.
  * **Rojo**: Si `vco > 0` (muestra alerta parpadeante "Vulnerabilidad Crítica Detectada").
* Diseñar un modal de desglose donde el administrador pueda ver los detalles técnicos del JSON y enlaces a las dependencias desactualizadas o afectadas.

### Flujo de implementación
Las vulnerabilidades no se cuentan manualmente; se extraen de herramientas SAST/DAST integradas en la Pipeline de Integración Continua (CI/CD):
1. **Ejecución del Escaneo:** Durante la fase de compilación en GitHub Actions, se ejecutan escaneos de dependencias con salida en formato JSON:
   * **Backend (PHP):** `composer audit --format=json`
   * **Frontend (JS):** `npm audit --json`
2. **Parseo y Conteo (Cuantificación):** Un script automatizado en la pipeline lee los archivos JSON resultantes y cuenta las vulnerabilidades cuya propiedad `severity` sea `"critical"` o `"high"`. La suma de este conteo es el valor para la columna `vco`.
3. **Registro en Base de Datos (Persistencia):** Al terminar la auditoría, el script de la pipeline realiza una petición HTTP `POST` a `/api/sqa/security-findings` enviando la información (el valor de `vco`, los desgloses y el JSON de detalles). El controlador de Laravel recibe la petición, la valida y guarda el registro con `SqaSecurityFinding::create($request->validated());`.


---

## 5. Métrica: Tiempo de Respuesta Promedio (TRP)
*Monitorea el rendimiento temporal de la API REST del backend en Laravel y las consultas espaciales en PostgreSQL.*

### Base de Datos
* Crear migración para la tabla `performance_logs`:
  * `id` (Primary Key, autoincrementable)
  * `trp` (integer) - Tiempo de respuesta de la petición en milisegundos (ej: 450)
  * `endpoint` (string) - URI de la petición (ej: `/api/incidencias`)
  * `metodo` (string, 10) - Método HTTP utilizado (GET, POST, PUT, DELETE, etc.)
  * `logged_at` (timestamp) - Fecha y hora del registro del log
  * Campos de auditoría estándar: `created_at`, `updated_at`, `deleted_at`

### Backend
* Crear el modelo `PerformanceLog` en Laravel.
* Crear el middleware de rendimiento `MeasureResponseTime`:
  * Registra el inicio de la petición con `microtime(true)`.
  * Calcula los milisegundos tras despachar la respuesta.
  * Si el tiempo de respuesta supera los 100 ms, envía un job asíncrono a la cola (`Queue Job`) para registrar la petición en la tabla `performance_logs` sin afectar la latencia del usuario final.
* Crear endpoint `GET /api/sqa/performance-stats` que retorne el tiempo de respuesta promedio de las últimas 24 horas y el top 5 de endpoints más lentos.
* *(Nota: Al recolectarse de manera interna a través de middleware, no se requiere FormRequest para la creación de registros).*

### Frontend
* Crear una gráfica de líneas en el Dashboard de Calidad que ilustre la latencia promedio de la API en el tiempo (por hora/día).
* Mostrar una tabla con el top 5 de endpoints más lentos de la API REST para guiar los esfuerzos de refactorización y optimización de base de datos.

#### Flujo de implementación (TRP)
* **Cuantificación:** Se mide en tiempo real mediante el Middleware de Laravel `MeasureResponseTime`, restando el tiempo de inicio de la petición (`LARAVEL_START`) del tiempo actual en milisegundos tras despacharse la respuesta.
* **Persistencia:** Si el tiempo de respuesta supera los 100 ms, el middleware despacha un Queue Job asíncrono para insertar el registro en `performance_logs` sin afectar la latencia del usuario. El panel administrativo calcula los promedios y máximos directamente con consultas agregadas (`avg('trp')`).

---