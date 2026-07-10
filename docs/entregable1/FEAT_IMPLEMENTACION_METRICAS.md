# Feature: Implementación de Métricas e Indicadores SQA

Este documento detalla el plan de implementación técnica para las métricas e indicadores de calidad definidos en la sección 09 del Plan de Gestión de Calidad.

---

## 1. Métrica: Tasa de Éxito de Pruebas (TEP)

_Mide la estabilidad y correcto comportamiento del software a través del porcentaje de pruebas unitarias/integración aprobadas._

### Enfoque de Automatización (Sin Base de Datos)

No es necesario crear una tabla en la base de datos transaccional de PostgreSQL para esta métrica. Al ser una métrica de Aseguramiento de Calidad (SQA), su registro operativo debe vivir fuera del _core_ del negocio, utilizando un enfoque de artefactos en formato JSON que Grafana pueda leer directamente.

### Flujo de Implementación (TEP)

- **Cuantificación:** PHPUnit exporta un reporte en formato estructurado (JUnit XML) mediante `php artisan test --log-junit tests/results.xml` al finalizar las pruebas unitarias y de integración.
- **Procesamiento:** Un script automatizado en la pipeline de CI/CD (o un comando local de Artisan) parsea el XML, cuenta el total de pruebas aprobadas, fallidas y omitidas, calcula la tasa porcentual (`tep`), y vuelca el resultado en un archivo estático: `backend/tests/metrics-stg/tep.json-YYYY-MM-DD.json`.
- **Visualización (Grafana):** Grafana consume el archivo `tep-YYYY-MM-DD.json` mediante el plugin gratuito **JSON API Data Source**. Se configura un panel de tipo **Gauge** (Tacómetro) que pinta el porcentaje de éxito (Verde > 90%, Amarillo > 80%, Rojo < 80%).

---

## 2. Métrica: Cobertura Funcional (CF)

_Mide el porcentaje de Historias de Usuario (HU) de la especificación técnica (`docs/01_analisis/historias_usuario.md`) validadas mediante escenarios de aceptación estructurados en formato BDD/Gherkin._

### Enfoque BDD (Behavior-Driven Development) y Gherkin

En lugar de persistir esta métrica en una base de datos operativa (lo cual agrega sobrecarga innecesaria al modelo relacional de producción), se utiliza un enfoque de trazabilidad directa basado en desarrollo guiado por comportamiento:

1. **Especificación:** Cada Historia de Usuario descrita en `historias_usuario.md` se mapea a uno o más escenarios de prueba en formato Gherkin (`Given-When-Then`) guardados como características (`.feature`) o documentados en los bloques de test de aceptación.
2. **Automatización:** Se escriben pruebas de aceptación correspondientes en PHPUnit/Pest.
3. **Métrica:** La Cobertura Funcional se calcula cruzando las HUs del documento de análisis que tienen sus escenarios BDD completamente aprobados frente al total de HUs declaradas.

### Guía de Redacción Técnica (Ejemplos Gherkin)

#### HU-01: Registro de incidencia (Aprobado)

```gherkin
Feature: Registro de incidencia
  Como ciudadano o empleado
  Quiero registrar una incidencia con ubicación y prioridad
  Para que sea atendida por las autoridades

  Scenario: Registro exitoso con datos válidos
    Given que soy un ciudadano autenticado en el sistema
    And selecciono una ubicación válida en el mapa (latitud: -2.2, longitud: -80.9)
    And elijo la categoría "Falla Eléctrica" y prioridad "Alta"
    When envío el formulario con una descripción de 50 caracteres
    Then el sistema debe responder HTTP 201 (Creado)
    And la incidencia debe guardarse con el estado "Pendiente" automáticamente

  Scenario: Rechazo por campos obligatorios vacíos (Validación)
    Given que soy un ciudadano autenticado
    When intento registrar una incidencia sin especificar el tipo ni la descripción
    Then el sistema debe responder HTTP 422 (Unprocessable Entity)
    And el JSON de respuesta debe detallar los errores de validación
```

#### HU-06: Comentar en una incidencia (Aprobado)

```gherkin
Feature: Comentar en una incidencia
  Como usuario registrado
  Quiero agregar comentarios a una incidencia
  Para aportar seguimiento o evidencias

  Scenario: Agregar comentario válido
    Given que soy un usuario autenticado
    And existe una incidencia activa en la base de datos
    When publico un comentario con texto "Inspección de zona realizada"
    Then el sistema debe responder HTTP 201
    And el comentario debe asociarse cronológicamente al historial de la incidencia

  Scenario: Rechazo por superar longitud máxima
    Given que soy un usuario autenticado
    When intento publicar un comentario que supera los 200 caracteres
    Then el sistema debe responder HTTP 422 (Excede longitud máxima)
```

### Flujo de Implementación y Cuantificación (CF)

- **Cuantificación:** Se listan las 12 HUs de `docs/01_analisis/historias_usuario.md`. Al ejecutar la suite de pruebas unitarias y de integración en Laravel:
  - Se evalúa cuáles HUs tienen la totalidad de sus escenarios Gherkin automatizados e implementados en código con estado exitoso.
  - Si una HU (como `HU-08: Recibir notificaciones`) tiene sus pruebas pendientes, se considera no cubierta (0% para esa historia).
- **Cálculo:**
  $$\text{CF} = \left( \frac{\text{HUs con BDD aprobados (9 de 12)}}{\text{Total HUs especificadas (12)}} \right) \times 100 = 75.0\%$$
- **Visualización:** Esta métrica se expone directamente en el reporte de métricas del Entregable 5 y se grafica en Grafana mediante un widget estático (tipo Gauge) o procesando el reporte JSON/XML generado por el corredor de pruebas.

---

## 3. Métrica: Densidad de Defectos (DD)

_Mide la cantidad de bugs detectados por cada caso de prueba ejecutado para controlar la madurez del código._

### Enfoque de Automatización (Sin Base de Datos)

Al igual que las métricas anteriores, no requiere de una tabla de PostgreSQL. La Densidad de Defectos se extrae del cruce entre el gestor de incidentes del proyecto (ej: Linear App o GitHub Issues) y el total de pruebas ejecutadas de PHPUnit.

### Flujo de Implementación (DD)

- **Cuantificación:** Un script automatizado o un comando de Artisan programado (`cron`) realiza una consulta a la API de Linear/GitHub para contar los bugs activos con etiqueta de prioridad Alta/Media. Luego, cruza este valor dividiéndolo para el total de casos del archivo `results.xml` de PHPUnit.
- **Registro en Artefacto:** El script matemático vuelca el resultado en un archivo ligero de consumo web `public/metrics/defect_density.json`.
- **Visualización (Grafana):** Mediante el **JSON API Data Source**, Grafana consume el archivo y proyecta un panel tipo **Stat** numérico o un gráfico de **Series Temporales**. Si el valor supera el límite paramétrico de `0.1` definido en el E1, el panel en Grafana se pintará automáticamente en color Rojo para alertar al equipo.

---

## 4. Métrica: Vulnerabilidades Críticas (OWASP) (VCO)

_Controla y cuantifica las brechas de seguridad según los 5 vectores del estándar OWASP adoptados._

### Enfoque de Automatización (Sin Base de Datos)

Las herramientas de análisis de seguridad estático y dinámico (SAST/DAST) funcionan perfectamente mediante _outputs_ de consola. No se justifica gastar recursos de una base de datos relacional para ello.

### Flujo de Implementación

1. **Ejecución del Escaneo:** Durante la fase de validación de seguridad (localmente o en CI/CD), se ejecutan los auditores de dependencias exportando su salida directamente a formato JSON:
   - **Backend (PHP):** `composer audit --format=json > public/metrics/audit_backend.json`
   - **Frontend (JS):** `npm audit --json > public/metrics/audit_frontend.json`
2. **Visualización (Grafana):** Grafana se conecta mediante el plugin JSON a dichos archivos de auditoría, sumando dinámicamente las vulnerabilidades de severidad "critical" o "high" descubiertas por el analizador.
3. Se diseña un panel tipo **Semáforo (State Timeline o Stat)** en Grafana: Si la suma de vulnerabilidades es `0`, se mantiene en Verde. Si hay `>0` hallazgos críticos, emite una alerta Roja parpadeante.

---

## 5. Métrica: Tiempo de Respuesta Promedio (TRP)

_Monitorea el rendimiento temporal de la API REST del backend en Laravel y las consultas espaciales en PostgreSQL._

### Enfoque de Base de Datos (Única tabla necesaria)

**SÍ** es indispensable almacenar esta métrica en la base de datos de PostgreSQL (mediante la tabla `performance_logs`). ¿Por qué? Porque a diferencia de las métricas anteriores (que provienen de auditorías de código estático y suites de pruebas), el Tiempo de Respuesta recopila el **comportamiento real en producción**. Mide telemetría dinámica derivada del tráfico vivo de usuarios.

### Base de Datos

- Se mantiene la migración de la tabla `performance_logs`:
  - `trp` (integer) - Tiempo de respuesta en milisegundos.
  - `endpoint` (string) - URI de la petición.
  - `logged_at` (timestamp) - Fecha y hora.

### Backend

- El middleware `MeasureResponseTime` calcula los milisegundos tras despachar la respuesta.
- Si el tiempo supera el umbral esperado (ej. 100 ms), envía de forma asíncrona mediante Laravel Queues el registro a `performance_logs`.

### Visualización (Grafana)

- **Grafana se conecta de forma nativa a tu base de datos de PostgreSQL** (usando el PostgreSQL Data Source integrado).
- Se crea una gráfica de líneas de Series Temporales (Time Series) ejecutando un simple `SELECT logged_at as time, trp as value FROM performance_logs`.
- Grafana mostrará de forma instantánea y elegante la evolución de la velocidad de tu API a lo largo de las horas, incluyendo los picos de latencia, sin que tengas que programar ni un solo componente en HTML/Vue.

---
