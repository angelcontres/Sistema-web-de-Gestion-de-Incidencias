# Plan de Gestión de Calidad del Proyecto
## Sistema Web de Gestión de Incidencias Georreferenciadas

---

## 💡 Nota de Coherencia Metodológica
Este entregable se constituye como la **"Constitución de Calidad del Proyecto"**. Toda actividad posterior (incluyendo el diseño de casos de prueba, especificación de métricas, análisis estático con herramientas como PHPStan o SonarQube, auditorías de seguridad OWASP y la ejecución de pruebas de carga) emana estrictamente de la estructura y pautas aquí plasmadas para garantizar el rigor metodológico, académico y profesional del software desarrollado.

---

## 1. Descripción del Proyecto

El **Sistema Web de Gestión de Incidencias Georreferenciadas** es una plataforma tecnológica diseñada para registrar, clasificar, asignar, dar seguimiento y visualizar geográficamente problemas o reportes generados en entornos urbanos o institucionales. El sistema permite mantener una trazabilidad histórica del estado de cada incidencia, facilitando la colaboración y la toma de decisiones basada en datos espaciales.

### 1.1. Objetivo General del Sistema
Proporcionar una solución web robusta y centralizada que permita a los ciudadanos y usuarios reportar incidencias georreferenciadas de forma sencilla, y a los equipos de gestión operativa canalizar, priorizar y resolver estos eventos con una trazabilidad completa de su historial, métricas de rendimiento y notificaciones en tiempo real.

### 1.2. Alcance Funcional
El sistema cubre las siguientes fronteras operativas:
*   **Gestión de Reportes:** Permite el registro completo de incidencias incluyendo título, descripción, tipo/subtipo, nivel de prioridad y archivos adjuntos (fotografías o evidencias).
*   **Georreferenciación Jerárquica:** Almacena la ubicación normalizada mediante tablas relacionadas de entidades geopolíticas (`pais`, `provincia`, `ciudad`) y coordenadas espaciales exactas (latitud y longitud).
*   **Ciclo de Vida de Incidencias:** Soporta el flujo de estados obligatorio (`Pendiente` ➔ `En proceso` ➔ `Resuelto`) con cambio controlado y registro histórico inalterable de auditoría.
*   **Asignación de Responsables:** Asignación de múltiples operadores a cada caso, definiendo explícitamente sus roles (responsable principal o personal de apoyo).
*   **Colaboración y Seguimiento:** Hilo de comentarios cronológicos con restricciones de edición temporal (máximo 30 minutos desde la publicación) para garantizar el no repudio.
*   **Mapeo Dinámico y Espacial:** Representación visual mediante un mapa interactivo (Leaflet/OpenStreetMap) que agrupa los marcadores (clusters), muestra ventanas de detalle (popups) y permite búsquedas por radio de proximidad.
*   **Dashboard y Reportería:** Tablero analítico que presenta KPIs de rendimiento (tiempos promedio de resolución, volumen por tipo de incidencia) y exportación de informes en formatos CSV y PDF.
*   **Seguridad y Roles:** Control de acceso estricto basado en roles predefinidos (`Administrador`, `Gestor Operativo` y `Ciudadano/Usuario Reportante`).

```
  +------------------+       +-------------------+       +--------------------+
  |     Frontend     |       |    Backend API    |       |   Base de Datos    |
  |   (HTML/CSS/JS/  | ➔ ➔ ➔ |     (Laravel)     | ➔ ➔ ➔ |    (PostgreSQL)    |
  |    Bootstrap)    |       |   Auth & Routes   |       |  Tablas Relac. y   |
  | Mapas & Leaflet  |       | Validaciones / CI |       | Historial (Audit)  |
  +------------------+       +-------------------+       +--------------------+
```

### 1.3. Principales Módulos
1.  **Módulo de Registro e Integridad de Datos:** Encargado de capturar, normalizar y validar los datos de entrada en el frontend y backend.
2.  **Módulo de Trazabilidad y Gestión de Estados:** Responsable de registrar cada transición de estado en la base de datos relacional junto con marcas temporales (timestamps) y autoría.
3.  **Módulo Cartográfico y de Búsqueda Espacial:** Gestiona el mapa interactivo, realiza el cálculo de proximidad y procesa la renderización en el cliente.
4.  **Módulo de Asignación y Seguimiento Colaborativo:** Coordina los hilos de conversación de incidencias y la relación muchos-a-muchos de responsables.
5.  **Módulo de Dashboard e Indicadores (Analytics):** Encargado de agregar datos operativos para calcular promedios de resolución y tendencias de reportes.
6.  **Módulo de Seguridad, Autenticación y Control de Accesos:** Autenticación de sesiones y tokens web, controlando el acceso mediante middlewares.
7.  **Módulo de Notificaciones y Configuración:** Encola y despacha mensajes internos (in-app) o por correo electrónico.

### 1.4. Usuarios Involucrados
*   **Ciudadano / Usuario Reportante:** Persona con acceso a la plataforma para registrar incidencias y consultar el estado y el historial de sus propios reportes.
*   **Gestor Operativo / Responsable:** Funcionario técnico que recibe la asignación de la incidencia, actualiza los estados del ciclo de trabajo, añade comentarios técnicos y asocia personal de apoyo.
*   **Administrador del Sistema:** Rol con privilegios globales para crear usuarios, asignar permisos, visualizar el dashboard completo, exportar informes y auditar las acciones del sistema.

---

## 2. Objetivos de Calidad

Con el fin de asegurar un producto estable, seguro y confiable, se establecen los siguientes objetivos de calidad preventivos e integrales:

*   **Garantizar la Integridad y Consistencia de Datos:** El 100% de los registros de incidencias deben asociarse a una ubicación normalizada en la estructura de base de datos (`pais` ➔ `provincia` ➔ `ciudad`) y contar con coordenadas de latitud/longitud válidas, evitando redundancias u orfandad espacial.
*   **Minimizar Defectos Funcionales:** Lograr una tasa de aprobación de pruebas de al menos un 90% en la validación de los flujos críticos (transición de estados, control de tiempos de resolución, asignación múltiple de roles y comentarios).
*   **Asegurar Rendimiento Temporal:** Garantizar que bajo condiciones normales de carga, los tiempos promedio de respuesta de la API REST del servidor y la carga inicial del mapa interactivo sean entre 3 a 5 segundos.
*   **Mitigar Riesgos de Seguridad Críticos:** Obtener una evaluación limpia de vulnerabilidades de seguridad web críticas, cumpliendo rigurosamente con los 5 vectores del estándar OWASP Top 10 seleccionados.
*   **Mantener la Arquitectura y Código Limpio:** Implementar una arquitectura limpia y desacoplada mediante el uso de contenedores Docker (Nginx, Laravel, PostgreSQL), facilitando la mantenibilidad, extensibilidad y la futura integración de microservicios (por ejemplo, el módulo de IA/NLP o persistencia NoSQL).

---

## 3. Glosario de Términos

Con el fin de asegurar la trazabilidad documental y la claridad metodológica para todos los involucrados, se definen los siguientes términos, siglas y acrónimos utilizados en este plan:

*   **SQAP (Software Quality Assurance Plan / Plan de Aseguramiento de Calidad de Software):** Documento formal bajo el cual se rigen los procedimientos, métricas, roles y estándares destinados a certificar que el producto cumple con los niveles de aceptación pactados.
*   **SCM (Software Configuration Management / Gestión de la Configuración de Software):** Disciplina que consiste en aplicar procedimientos técnicos y organizativos para dirigir y vigilar la evolución, versiones, líneas base e integridad del código fuente y sus configuraciones.
*   **ORM (Object-Relational Mapping / Mapeo Objeto-Relacional):** Herramienta o técnica de software (como Eloquent en Laravel) que mapea la estructura relacional de la base de datos a un modelo orientado a objetos, evitando escribir consultas SQL manuales.
*   **HU (Historia de Usuario):** Unidad de medida funcional en metodologías ágiles que describe un requerimiento desde la perspectiva del usuario que interactuará con el sistema.
*   **XSS (Cross-Site Scripting / Secuencias de Comandos en Sitios Cruzados):** Vulnerabilidad de seguridad web en la cual un usuario inyecta scripts de código dañino en los campos de datos de entrada, afectando la navegación y seguridad de otros usuarios.
*   **CI/CD (Continuous Integration and Continuous Delivery / Integración y Despliegue Continuo):** Metodología de desarrollo en la cual los cambios de código se prueban de forma automática (CI) y se despliegan automáticamente a entornos de prueba o producción (CD).
*   **Soft-delete (Borrado Lógico):** Procedimiento en el cual los registros eliminados de la base de datos no se suprimen de los sectores físicos de almacenamiento, sino que se les asigna una marca temporal (campo `deleted_at`), de forma que queden ocultos de las consultas normales pero se conserve el registro histórico para auditoría.
*   **SLA (Service Level Agreement / Acuerdo de Nivel de Servicio):** Compromiso formal que define el tiempo límite establecido para atender (dar respuesta inicial) y solucionar (resolver el defecto) un error de software según su nivel de prioridad o severidad.
*   **PR (Pull Request / Petición de Integración):** Mecanismo de colaboración y control en Git que avisa a los revisores de código que el trabajo de desarrollo de una rama de características está completo y listo para ser analizado e integrado a la rama principal.

---

## 4. Atributos de Calidad Seleccionados (ISO/IEC 25010)

Basados en el modelo de calidad de producto de software **ISO/IEC 25010**, se seleccionan y justifican los siguientes atributos críticos:

| Atributo de Calidad | Característica / Subcaracterística | Justificación Técnica en el Proyecto |
| :--- | :--- | :--- |
| **Usabilidad** | • Aprendizaje<br>• Operabilidad<br>• Estética de la interfaz de usuario | El sistema cuenta con un enfoque ciudadano. Dado que la alfabetización digital de los usuarios reportantes varía ampliamente, la interfaz (construida sobre Bootstrap) debe ser limpia y comprensible. Los mapas interactivos de Leaflet deben contar con iconos claros y popups informativos de lectura ágil. |
| **Seguridad** | • Confidencialidad<br>• Integridad<br>• Autenticación<br>• Responsabilidad (No repudio) | Se gestionan datos de georreferenciación institucionales y de seguridad ciudadana. La API en Laravel debe forzar la autenticación mediante tokens/sesiones seguras y verificar permisos mediante middlewares antes de cualquier mutación de datos. Las restricciones temporales de edición de comentarios apoyan el no repudio. |
| **Fiabilidad** | • Tolerancia a fallos<br>• Recuperabilidad | El historial de cambios de estado y las asignaciones de operadores no deben verse comprometidos ante fallos de conexión o concurrencia transaccional en PostgreSQL. El sistema implementa "soft delete" (eliminación lógica) para evitar la pérdida accidental de datos y mantener la trazabilidad histórica de auditoría. |
| **Mantenibilidad** | • Modularidad<br>• Capacidad de ser modificado<br>• Analizabilidad | Al estructurar el proyecto mediante contenedores Docker independientes y separar las responsabilidades de Frontend (HTML/JS) y Backend (Laravel API REST), el código fuente es altamente extensible. Esto simplifica la futura incorporación de otros componentes (como el microservicio IA o MongoDB) sin alterar el núcleo transaccional. |
| **Eficiencia de Desempeño** | • Comportamiento temporal | El renderizado de mapas con múltiples incidencias cargadas de forma síncrona puede degradar la experiencia de usuario. La API REST debe proveer filtros espaciales, consultas optimizadas mediante índices en la base de datos PostgreSQL, paginación eficiente de datos y carga asíncrona de marcadores (clusters). |

---

## 5. Estándares, Modelos y Guías de Referencia

Para normar y validar la ingeniería del software en el proyecto, se adoptan formalmente los siguientes estándares internacionales:

### 5.1. ISO/IEC 25010
Es el estándar rector empleado para estructurar, clasificar y evaluar de manera integral los atributos de calidad del producto de software, asegurando que las pruebas técnicas no se limiten únicamente a la funcionalidad básica, sino también al comportamiento sistémico del software.

### 5.2. OWASP Top 10 (Mitigación Web)
Se define como guía obligatoria de seguridad para el desarrollo y auditoría del sistema web, evaluando y mitigando específicamente los siguientes 5 vectores de riesgo:
*   **`A01:2021-Broken Access Control` (Control de Acceso Quebrado):** Mitigado mediante la asignación explícita de roles en la base de datos y validación de permisos en el backend a través de Middlewares en las rutas de la API en Laravel (ej. evitar que un `usuario` normal altere asignaciones o acceda al dashboard administrativo).
*   **`A02:2021-Identification and Authentication Failures` (Fallas en Identificación y Autenticación):** Mitigado a través de la implementación de autenticación robusta mediante tokens seguros de Laravel, hasheo criptográfico obligatorio de contraseñas de usuarios con algoritmos modernos (Bcrypt/Argon2) y protección contra fuerza bruta en los intentos de login.
*   **`A03:2021-Injection` (Inyección de Datos/Código):** Mitigado mediante el uso del ORM Eloquent de Laravel, el cual por defecto implementa consultas preparadas parametrizadas en PostgreSQL, evitando la inyección de sentencias SQL maliciosas. Asimismo, se aplican validaciones estrictas y sanitización del HTML de entrada para evitar ataques de Cross-Site Scripting (XSS) en formularios y comentarios.
*   **`A05:2021-Security Misconfiguration` (Configuración Incorrecta de Seguridad):** Controlado separando las configuraciones del entorno mediante archivos `.env` (excluidos del repositorio mediante `.gitignore`), inhabilitando el modo debug de Laravel en producción (`APP_DEBUG=false`), restringiendo puertos no esenciales en Docker y configurando directivas de cabeceras seguras en Nginx.
*   **`A06:2021-Vulnerable and Outdated Components` (Componentes Vulnerables y Desactualizados):** Gestionado mediante el uso de dependencias estables y actualizadas. En la fase de construcción de contenedores, se programará la auditoría de dependencias mediante comandos automáticos (`composer audit` en el backend PHP y auditorías periódicas de librerías JS frontend).

---

## 6. Roles y Responsabilidades de Calidad

El equipo de ingeniería de software asume los siguientes roles de calidad, los cuales pueden ser compartidos o rotativos según el sprint o iteración de desarrollo:

*   **Revisión Técnica:**
    *   *Responsabilidad:* Realizar inspecciones manuales y walkthroughs del código fuente (Pull Requests), verificar la calidad estructural de las migraciones de bases de datos PostgreSQL y validar la idoneidad de la configuración de contenedores Docker y del servidor web Nginx.
*   **Diseño de Pruebas:**
    *   *Responsabilidad:* Diseñar analíticamente los escenarios de prueba y especificar detalladamente los casos de prueba (entradas, pasos y resultados esperados) basándose en las historias de usuario e interacciones de la API REST.
*   **Ejecución de Pruebas:**
    *   *Responsabilidad:* Ejecutar de manera rigurosa las pruebas de caja negra a nivel de la interfaz de usuario en el frontend, ejecutar pruebas de integración y verificar la ejecución automatizada de las pruebas de backend (`php artisan test`) integradas en la pipeline de integración continua de GitHub Actions.
*   **Gestión de Defectos:**
    *   *Responsabilidad:* Identificar, reportar y documentar los fallos o comportamientos anómalos (bugs) en el backlog, realizar el seguimiento de su ciclo de vida (Registrado ➔ Asignado ➔ Resuelto ➔ Re-testeo ➔ Cerrado) y asegurar que ningún defecto de criticidad alta/media llegue a producción.
*   **Elaboración de Métricas:**
    *   *Responsabilidad:* Medir cuantitativamente los indicadores clave del software, analizar logs de errores de Nginx y Laravel, monitorear el tiempo de respuesta promedio de los endpoints y graficar los resultados del aseguramiento de calidad para la directiva técnica.

---

## 7. Riesgos Iniciales de Calidad

Identificación preventiva de riesgos asociados al software que atentan contra la calidad de la entrega, junto con su probabilidad, impacto y estrategias específicas de mitigación:

| Código | Riesgo Identificado | Prob. | Imp. | Estrategia de Mitigación / Contingencia |
| :--- | :--- | :---: | :---: | :--- |
| **R-01** | **Accesos no autorizados a paneles administrativos**<br>*Un usuario malintencionado o sin privilegios accede a vistas de gestión o APIs de edición de incidencias.* | Media | Alta | **Mitigación:** Aplicar middleware de autenticación (ej: `auth:sanctum` de Laravel) y control de acceso basado en roles en todos los endpoints de consulta administrativa. Realizar pruebas de penetración manuales sobre rutas de API. |
| **R-02** | **Inconsistencia en datos de georreferenciación**<br>*Incidencias registradas con coordenadas geográficas nulas, incorrectas o sin correspondencia en la jerarquía geopolítica (`pais`, `provincia`, `ciudad`).* | Media | Alta | **Mitigación:** Configurar restricciones de clave foránea y no-nulidad en PostgreSQL. Validar la estructura del payload JSON en la API REST de Laravel antes de persistir, implementando geocodificación de respaldo en el frontend. |
| **R-03** | **Errores en el flujo de cambio de estados**<br>*Permitir transiciones de estado inválidas (ej. pasar directo de `Pendiente` a `Resuelto` sin pasar por `En proceso`, o modificar incidencias ya cerradas).* | Alta | Media | **Mitigación:** Implementar lógica de validación centralizada (máquina de estados) en el backend Laravel. Crear pruebas unitarias automáticas (`php artisan test`) específicas para validar las transiciones permitidas y denegadas. |
| **R-04** | **Consultas y renderizado lentos en el mapa dinámico**<br>*Demoras superiores a los 5 segundos en el mapa de Leaflet debido a la descarga simultánea de cientos de marcadores espaciales sin agrupar.* | Baja | Media | **Mitigación:** Implementar paginación a nivel de API REST y uso de la biblioteca `Leaflet.markercluster` en el frontend para agrupar marcadores geográficos. Crear índices espaciales en la base de datos PostgreSQL. |
| **R-05** | **Fallas en la integración asíncrona de servicios futuros**<br>*Caída de servicios externos de notificaciones de correo o en la comunicación con la futura IA de clasificación de texto.* | Media | Media | **Mitigación:** Implementar colas de trabajo asíncronas en Laravel (Queue Jobs) para el envío de correos y la comunicación HTTP. Establecer políticas de reintento automatizado y registrar fallos detallados en logs. |

---

## 8. Actividades de Aseguramiento de Calidad

Para cumplir con los objetivos del plan, se programan las siguientes actividades formales de control e ingeniería de software durante el ciclo de vida del desarrollo:

### 8.1. Revisiones Técnicas y Walkthroughs
Inspecciones estructuradas de los modelos de base de datos relacionales, el diseño lógico de las APIs y la configuración de contenedores Docker. Se realizarán revisiones cruzadas de código (Pull Requests en GitHub) requiriendo la aprobación de al menos un revisor técnico antes de la integración a la rama principal.

### 8.2. Análisis Estático de Código
Ejecución automatizada de herramientas de validación de sintaxis, estándares de codificación y detección temprana de bugs (como PHP CodeSniffer o PHPStan para Laravel, y linters estándar para JavaScript y CSS). Esto previene código espagueti y asegura la mantenibilidad del software.

### 8.3. Diseño y Documentación de Casos de Prueba
Basados en la norma IEEE 29119, antes del inicio de la codificación de cada funcionalidad, el encargado de diseño de pruebas elaborará los casos de prueba de caja negra correspondientes. Cada caso detallará las condiciones previas, datos de entrada, secuencia de pasos a ejecutar, y el comportamiento esperado del frontend o backend.

### 8.4. Pruebas Funcionales (Caja Negra)
Validación sistemática en un entorno de staging idéntico al de producción (levantado mediante Docker Compose). Se verificará que cada formulario web cumpla con las validaciones de campos obligatorios, adjuntos admitidos y que las llamadas AJAX (Fetch API) procesen correctamente los estados HTTP de respuesta (200, 201, 422, 500).

### 8.5. Pruebas de Carga y Eficiencia
Ejecución de simulaciones de peticiones concurrentes a la API del backend, concentrándose en el endpoint de consulta cartográfica y carga del dashboard de métricas. Se validará el uso de recursos de hardware en los contenedores PostgreSQL y Laravel para evitar fugas de memoria o bloqueos.

### 8.6. Integración Continua (CI/CD)
Uso de la pipeline automatizada definida en el workflow de Github Actions que se personalizó.. En cada push a la rama `develop`, la pipeline levantará los contenedores en el entorno self-hosted, instalará las dependencias de Composer, generará las claves de entorno, ejecutará las migraciones de base de datos y correrá la suite de pruebas automatizadas mediante:
```bash
docker exec sistema_laravel php artisan test
```
Cualquier falla en la suite de pruebas detendrá inmediatamente el flujo de despliegue, notificando al equipo de desarrollo de forma preventiva.

---

## 9. Métricas e Indicadores de Calidad

Para evaluar objetivamente la calidad del software, se definen los siguientes indicadores cuantificables:

| Indicador / Métrica | Fórmula de Cálculo | Propósito Operativo | Valor Objetivo |
| :--- | :--- | :--- | :--- |
| **Tasa de éxito de pruebas** | $$\text{TEP} = \left( \frac{\text{Casos de Prueba Aprobados}}{\text{Casos de Prueba Ejecutados}} \right) \times 100$$ | Mide el nivel de estabilidad y correcto comportamiento funcional frente a las pruebas planificadas. | $$\ge 90\%$$ |
| **Cobertura funcional** | $$\text{CF} = \left( \frac{\text{Historias de Usuario Validadas}}{\text{Total de Historias de Usuario}} \right) \times 100$$ | Asegura que el alcance del software cumple con los requisitos y HU obligatorios detallados. | $$100\%$$ |
| **Densidad de defectos** | $$\text{DD} = \frac{\text{Defectos de Criticidad Alta/Media Detectados}}{\text{Casos de Prueba Ejecutados}}$$ | Permite identificar la concentración de fallos por bloque funcional y la madurez de la codificación. | $$\le 0.1$$ |
| **Vulnerabilidades críticas (OWASP)** | $$\text{VCO} = \text{Total de Hallazgos en Auditoría OWASP}$$ | Cuantifica las brechas de seguridad identificadas según los 5 vectores del estándar OWASP adoptados. | $$0$$ |
| **Tiempo de respuesta promedio** | $$\text{TRP} = \frac{\sum(\text{Tiempos de Respuesta de Endpoints})}{\text{Total de Transacciones Medidas}}$$ | Evalúa el rendimiento de los servicios del backend (Laravel) y consultas espaciales en PostgreSQL. | $$< 3\text{ s}$$ |

### 9.1. Implementación, Almacenamiento y Visualización de las Métricas

Para asegurar que las métricas definidas se recolecten y exploten de manera efectiva durante el desarrollo y pruebas del proyecto, se establece la siguiente infraestructura técnica y de base de datos:

#### 1. Tasa de Éxito de Pruebas (TEP)
*   **Implementación:** Se calcula automáticamente al finalizar la ejecución de la suite de pruebas unitarias y de integración en el contenedor `sistema_laravel` mediante la bandera de exportación JUnit de PHPUnit: `php artisan test --log-junit tests/results.xml`. Un script automatizado parsea el XML extrayendo los contadores de pruebas exitosas, fallidas y omitidas.
*   **Almacenamiento (PostgreSQL):** Los resultados agregados (porcentaje de éxito, total de pruebas y fecha) se envían vía POST a un endpoint interno de administración que los persiste en la tabla de control `sqa_metrics_history` en PostgreSQL.
    *   **Estado de la Tabla:** ⚠️ *No existe en la base de datos actual.* El desarrollador deberá crearla mediante una nueva migración de Laravel (ej. `database/migrations/xxxx_create_sqa_metrics_history_table.php`) durante la fase de infraestructura (Sprint 0).
*   **Visualización:** Se genera una insignia (badge) dinámica en el `README.md` del repositorio que indica el estado del build y la tasa de éxito de la última ejecución, y se despliega un gráfico histórico en el Dashboard de Calidad del administrador.

#### 2. Cobertura Funcional (CF)
*   **Implementación:** Se calcula cruzando el listado de Historias de Usuario (HU) del backlog en **Linear App** con las pruebas que cuentan con anotaciones de cobertura funcional (ej. `@covers HU-01`). Un script en la pipeline de integración continua consulta Linear mediante GraphQL para validar cuáles historias están en estado "Completado" y cuentan con su test de aceptación asociado.
*   **Almacenamiento (PostgreSQL):** Los registros consolidados de cobertura se guardan en la tabla `sqa_functional_coverage` en la base de datos PostgreSQL.
    *   **Estado de la Tabla:** ⚠️ *No existe en la base de datos actual.* El desarrollador deberá crearla mediante una migración de Laravel durante el Sprint 1 (módulo de registro e inicios de sesión).
*   **Visualización:** Se muestra en el Dashboard del sistema un gráfico de tipo pastel (pie chart) interactivo que ilustra la relación porcentual entre historias de usuario cubiertas con pruebas vs. total de historias del backlog.

#### 3. Densidad de Defectos (DD)
*   **Implementación:** Se calcula de manera automática dividiendo el número de issues catalogadas como bugs activos (`[BUG]`) y prioridad Alta/Media en Linear App entre la sumatoria acumulada de casos de prueba ejecutados y registrados en los logs de testing.
*   **Almacenamiento (PostgreSQL):** El cálculo lo realiza una tarea cron diaria programada mediante el programador de tareas de Laravel (`Laravel Task Scheduler`) y se almacena en la tabla relacional `sqa_defect_densities` en PostgreSQL.
    *   **Estado de la Tabla:** ⚠️ *No existe en la base de datos actual.* El desarrollador deberá crearla mediante una migración de Laravel durante el Sprint 2.
*   **Visualización:** Se proyecta un gráfico de líneas temporales (trend chart) en el panel administrativo que permite monitorear la tendencia de reducción de defectos por Sprint (la meta de calidad es lograr una tendencia descendente hacia el cierre del Sprint 3).

#### 4. Vulnerabilidades Críticas (OWASP) (VCO)
*   **Implementación:** Ejecución automática de escáneres de seguridad DAST/SAST. Se integra la herramienta `composer audit` en el backend y `npm audit` en el frontend dentro del proceso de build de los contenedores Docker. Adicionalmente, se configuran las alertas automáticas de Dependabot en GitHub para detectar vulnerabilidades en dependencias externas.
*   **Almacenamiento (PostgreSQL):** Los reportes estructurados de las herramientas se guardan en formato JSON en el directorio `docs/evidencias/seguridad/`. El contador global de hallazgos críticos se envía a la tabla `sqa_security_findings` en PostgreSQL.
    *   **Estado de la Tabla:** ⚠️ *No existe en la base de datos actual.* El desarrollador deberá crearla mediante una migración de Laravel durante el Sprint 0.
*   **Visualización:** Se expone como un indicador de estado tipo semáforo en el panel de control del administrador del sistema. Si el valor es mayor a 0, se muestra una alerta visual destacada y se bloquea la promoción automática a la rama de producción (`main`).

#### 5. Tiempo de Respuesta Promedio (TRP)
*   **Implementación:** Se miden los milisegundos transcurridos desde que inicia la petición hasta que se despacha el Response (`microtime(true)`) mediante un Middleware de telemetría de rendimiento (`MeasureResponseTime`) que intercepta todas las peticiones entrantes de la API REST de Laravel. En el servidor Nginx se configura el log de accesos para imprimir la variable `$upstream_response_time`.
*   **Almacenamiento (PostgreSQL):** El middleware de Laravel inserta asíncronamente los tiempos de respuesta que superen los 100 ms en la tabla de base de datos relacional `performance_logs` en PostgreSQL, registrando el timestamp, endpoint solicitado y los milisegundos medidos.
    *   **Estado de la Tabla:** ⚠️ *No existe en la base de datos actual.* El desarrollador deberá crearla mediante una migración de Laravel (ej. `database/migrations/xxxx_create_performance_logs_table.php`) en el Sprint 2 (integración cartográfica y optimizaciones).
*   **Visualización:** Se visualiza a través de un gráfico de líneas dinámico en el Dashboard de Administración que muestra las variaciones de velocidad de la API en las últimas 24 horas y los picos de latencia del endpoint de georreferenciación en el mapa interactivo.

---

## 10. Criterios de Aceptación del Producto

Para que el producto de software pueda considerarse apto para su entrega formal y liberación definitiva, debe cumplir estrictamente con los siguientes umbrales y condiciones en el entorno de staging:

1.  **Validación Funcional Completa:** El 100% de las Historias de Usuario obligatorias (HU-01 a HU-11) deben estar implementadas, operativas y verificadas sin inconsistencias de negocio.
2.  **Aprobación de la Suite de Pruebas:** Se requiere una tasa de éxito de pruebas (TEP) igual o superior al **90%** en la suite general de pruebas funcionales e integración.
3.  **Backlog Limpio de Defectos Críticos:** No debe existir ningún defecto abierto clasificado con impacto **Alto o Crítico** (que impida la georreferenciación, rompa el ciclo de estados de incidencias, o bloquee la base de datos).
4.  **Cumplimiento de Seguridad OWASP:** Ausencia absoluta de vulnerabilidades críticas o explotables asociadas a los 5 vectores OWASP (A01, A02, A03, A05 y A06) en los reportes de auditoría final.
5.  **Desempeño Temporal Aceptable:** El tiempo de carga promedio del mapa dinámico en el cliente y las respuestas REST de la API de Laravel deben situarse por debajo del umbral de **3 a 5 segundos** bajo simulación de carga operativa normal.
6.  **Código e Infraestructura Limpia:** La suite de pruebas de integración continua (`php artisan test`) debe ejecutarse y aprobarse exitosamente dentro del flujo de GitHub Actions sin presentar advertencias o errores en la consola. La base de datos debe poder migrarse desde cero (`php artisan migrate --force`) de manera limpia.

---

## 11. Gestión de la Configuración del Software (SCM)

Para garantizar el control del código y la trazabilidad de los cambios (requisito formal de calidad en IEEE 730), se estructuran los siguientes lineamientos del repositorio de control de versiones Git:

### 11.1. Modelo de Ramas (GitFlow Simplificado)
El desarrollo y la integración del software se rige bajo la siguiente estructura de ramificación organizada:
*   `main`: Rama estable y productiva del sistema. Cada commit incorporado aquí representa una versión liberada y debe ser inmutable. Solo recibe cambios desde la rama `develop` mediante peticiones de integración controladas (Releases) o desde ramas `hotfix/*` tras una emergencia.
*   `develop`: Rama principal de integración y desarrollo. Concentra todas las funcionalidades finalizadas de los desarrolladores. Está asociada directamente a la pipeline CI del servidor de staging para su testeo continuo.
*   `feature/*`: Ramas temporales destinadas a construir características o historias de usuario individuales (ej: `feature/hu-01-registro`). Nacen a partir de la última versión de `develop` y se reincorporan a ella exclusivamente por Pull Request.
*   `hotfix/*`: Ramas críticas que nacen a partir de `main` para resolver bugs urgentes detectados directamente en producción. Una vez corregido el problema, se mezclan de vuelta tanto en `main` como en `develop`.

### 11.2. Políticas de Fusión (`git merge`) y Pull Requests (Code Review)
*   Queda estrictamente prohibido realizar commits o empujar (`push`) código de forma directa sobre las ramas `develop` y `main`.
*   Para incorporar cualquier cambio a `develop`, el desarrollador deberá abrir un Pull Request (PR).
*   **Requisitos obligatorios para la fusión de un PR:**
    1.  **Aprobación Humana:** Al menos un revisor técnico del equipo debe inspeccionar el código y aprobar la idoneidad y el cumplimiento de las convenciones de nomenclatura.
    2.  **Pruebas Automáticas Exitosas:** La suite de pruebas de backend en GitHub Actions (`php artisan test`) debe haber compilado y ejecutado todos los tests con 100% de éxito.
    3.  **Análisis Estático Limpio:** La inspección de los linters no debe arrojar advertencias críticas ni de formato.

---

## 12. Proceso Formal de Gestión de Defectos

El ciclo de vida de los defectos funcionales, lógicos y de seguridad se gestionará bajo un flujo formalizado que garantice que ningún bug crítico afecte la experiencia en producción.

### 12.1. Herramienta de Seguimiento
Se adoptará **Linear App** como la herramienta única de registro, asignación y auditoría de bugs.

### 12.2. Campos Requeridos para el Registro de un Defecto
Cada vez que el equipo de Aseguramiento de Calidad (o el Gestor Operativo) identifique un comportamiento anómalo, abrirá una "Issue" en Linear App completando de manera mandatoria la siguiente plantilla estructural:
*   **Título del Error:** Breve y descriptivo, iniciando con la etiqueta de severidad (ej. `[BUG - ALTA] El historial de estados no muestra la autoría del cambio`). En linear se pueden usar etiquetas de prioridad para indicar la prioridad del error (Alta, Media, Baja).
*   **Descripción del Comportamiento Actual:** Redacción textual del fallo y la inconsistencia detectada.
*   **Comportamiento Esperado:** Detalle del comportamiento correcto según las Historias de Usuario o criterios de aceptación del plan.
*   **Pasos Exactos para su Reproducción:** Lista numerada con las entradas, urls, datos ingresados y clics realizados para recrear el error.
*   **Evidencias Adjuntas:** Capturas de pantalla, archivos de log del servidor Laravel (`storage/logs/laravel.log`) o capturas de la consola de desarrollador del navegador.
*   **Prioridad / Criticidad:** Clasificación formal en Crítica, Alta, Media o Baja.
*   **Responsable de la Corrección:** Asignación explícita de un desarrollador del equipo para resolverlo.
*   **Comunicación con el equipo:** El responsable de abrir la "Issue" deberá comunicar por los grupos de Whatsapp o Teams para notificar de la situación.


### 12.3. Acuerdos de Nivel de Servicio (SLA) de Calidad
De acuerdo a la criticidad del defecto, el equipo acuerda los siguientes tiempos límite de respuesta (primera atención/asignación) y resolución (defecto corregido y verificado en staging):

| Nivel de Criticidad | Criterio Técnico de Clasificación | SLA Respuesta | SLA Resolución |
| :--- | :--- | :---: | :---: |
| **Crítica (Critical)** | Defecto que inhabilita completamente la operación del sistema sin workaround posible (ej: caída de PostgreSQL, fallos en la autenticación general, errores 500 al guardar cualquier reporte). | < 2 horas | < 8 horas |
| **Alta (High)** | Defecto que degrada significativamente un módulo crítico, impidiendo su objetivo de negocio, pero el sistema sigue en marcha (ej: mapas Leaflet que no cargan marcadores, o transiciones de estado de incidencias que fallan). | < 4 horas | < 24 horas |
| **Media (Medium)** | Errores funcionales parciales o discrepancias en criterios de aceptación con workaround operativo (ej: comentarios editables después de 30 minutos, problemas de paginación en listados). | < 12 horas | < 72 horas |
| **Baja (Low)** | Defectos cosméticos, de alineación visual en Bootstrap o textos y ortografía, que no alteran en absoluto la operatividad funcional de la plataforma. | < 24 horas | < 5 días hábiles |


### 12.4. Ejemplificación de Registro de Defecto (Linear App)

Para ilustrar la aplicación del estándar de reporte definido en la sección 12.2, se presenta a continuación el registro formal del defecto correspondiente a las inconsistencias detectadas en la pantalla de gestión:

*   **Título del Error:** `[BUG - ALTA] Inconsistencias visuales del listado y error de eliminación de incidencias recién creadas`
*   **Descripción del Comportamiento Actual:**
    Al ingresar a la pantalla de Gestión de Incidencias (`http://localhost/html/vista.html`), se observan múltiples desviaciones estéticas y una falla funcional de criticidad alta:
    1.  *Layout de filtros:* El panel superior de filtros se distribuye en dos filas, desperdiciando espacio vertical en la interfaz.
    2.  *Ausencia de búsqueda:* El selector "Todas las incidencias" carece de un campo de búsqueda incremental/predictiva.
    3.  *Desbordamiento de texto:* La columna "Descripción" muestra el texto completo de los reportes en lugar de limitarse a una sola línea, desordenando la altura de las filas.
    4.  *Formato de fuentes:* El contenido de las columnas "Reportado por" y "Ubicación" se renderiza en negrita (fuente de peso bold).
    5.  *Disposición de columnas:* El orden visual de las columnas de la tabla no es el requerido.
    6.  *Falta de responsividad:* En resoluciones de pantalla estándar de 1366×768 o superiores, la visualización de las 8 columnas genera un scroll horizontal innecesario.
    7.  *Paginador estático:* Los botones del paginador y el indicador del total de registros tienen estilos Bootstrap inconsistentes y el selector numérico "Mostrar X elementos" no actualiza el listado.
    8.  *Falla en eliminación:* Si un usuario crea una incidencia y, sin refrescar el navegador, intenta eliminarla desde el listado, el registro permanece visible en la pantalla. Al hacer clic por segunda vez sobre el botón "Eliminar", se genera un error HTTP genérico sin causa descrita. El registro solo desaparece del DOM si se fuerza una acción de edición y posterior cancelación.
*   **Comportamiento Esperado:**
    La interfaz debe alinearse con los criterios de usabilidad del plan y el backend debe responder de manera semántica:
    1.  *Layout de filtros:* Los filtros deben compactarse y alinearse en una única fila horizontal.
    2.  *Búsqueda predictiva:* Incluir un cuadro de texto incremental que filtre dinámicamente por título o ID de la incidencia mediante llamadas asíncronas de Fetch API.
    3.  *Truncamiento de texto:* La columna "Descripción" debe limitar su texto a una sola línea (utilizando truncamiento CSS con elipsis `...`), desplegando el contenido total únicamente al posicionar el cursor sobre la celda mediante un tooltip estándar de Bootstrap.
    4.  *Formato de fuentes:* Las columnas "Reportado por" y "Ubicación" deben renderizarse con peso de fuente normal (`font-weight: normal`).
    5.  *Orden de columnas:* El listado debe estructurarse estrictamente en la secuencia: *Código, Título, Reportado por, Tipo, Prioridad, Descripción, Caracteres, Estado*.
    6.  *Ajuste responsivo:* La tabla con las 8 columnas debe autoajustarse dinámicamente y ser completamente legible sin scroll horizontal en resoluciones iguales o superiores a 1366×768.
    7.  *Paginador dinámico:* El paginador final debe calcular de manera dinámica las páginas en base al total de incidencias devueltas por la API, mostrar estilos estándar de Bootstrap y reaccionar al cambio del selector de cantidad de registros.
    8.  *Flujo de eliminación seguro:* Al accionar el botón de eliminación sobre cualquier registro, se debe ejecutar una petición AJAX `DELETE` exitosa, remover inmediatamente la fila del DOM y, en caso de fallo relacional o de lógica en el servidor (ej: incidencia cerrada o con comentarios críticos vinculados), retornar un código de error HTTP estructurado y un mensaje informativo preciso en pantalla.
*   **Pasos Exactos para su Reproducción:**
    1.  Iniciar sesión en la aplicación con perfil de Gestor Operativo.
    2.  Acceder al listado general en `http://localhost/html/vista.html`.
    3.  Validar visualmente el desbordamiento de la columna "Descripción", el scroll horizontal a 1366×768 y la doble fila de filtros.
    4.  Ir al formulario e ingresar una nueva incidencia ("Incidencia de prueba de SQA").
    5.  Retornar al listado y hacer clic inmediatamente en el botón "Eliminar" de la incidencia agregada.
    6.  Observar que la fila sigue visible en la tabla.
    7.  Hacer clic en "Eliminar" nuevamente y revisar el error 500 arrojado en la pestaña de red de la consola del navegador.
*   **Evidencias Adjuntas:**
    *   *Log del Servidor Laravel:* Exception `QueryException` en PostgreSQL debido a violación de clave foránea en la tabla relacional al intentar ejecutar DELETE sin control de dependencias.
    *   *Captura de Consola:* `DELETE http://localhost/api/incidencias/99 500 (Internal Server Error)`.
    *   *Capturas de Pantalla UI:* Listado con scroll horizontal activo y distorsión de la altura de la fila por descripción larga.
*   **Prioridad / Criticidad:** Alta (degradación funcional en el CRUD de incidencias y discrepancias múltiples de usabilidad).
*   **Responsable de la Corrección:** Desarrollador Frontend (`@dev-front`) + Desarrollador Backend (`@dev-back`).
*   **Módulo Afectado:** Frontend (Gestión de Vistas) / Backend API (Endpoints de Incidencia).
*   **Sprint Asociado:** Sprint 3 — Correcciones UI/UX y estabilidad.
*   **Estimación de Esfuerzo:** 6 horas de desarrollo y pruebas.
*   **Comunicación con el equipo:** Error registrado en Linear App y notificado al desarrollador backend a través del canal técnico de Teams para priorizar la verificación de integridad referencial.

## 13. Cronograma de Actividades de Calidad

El plan de calidad se ejecutará a lo largo de las iteraciones de desarrollo, estructurando las tareas de aseguramiento en base a los sprints definidos del proyecto (asumiendo 3 sprints de desarrollo de 2 semanas cada uno):

### Hito 1: Sprint 0 - Configuración de Infraestructura de Calidad (Semana 1)
*   **Aseguramiento del Proceso:**
    *   Definición y socialización de la convención de commits y estructura GitFlow con el equipo.
    *   Configuración inicial de los archivos de variables de entorno `.env.example` en backend y docker-compose.
*   **Aseguramiento de Calidad Técnica:**
    *   Configuración de los linters de JavaScript, CSS y PHP en los entornos locales de desarrollo.
    *   Estructuración inicial de la base de datos de pruebas PostgreSQL en entornos Docker locales.
    *   Escritura e integración de la pipeline automatizada CI/CD vía workflows en la carpeta `.github/workflows/` en la raíz del proyecto.

### Hito 2: Sprint 1 - Aseguramiento de Funcionalidades Base (Semanas 2-3)
*   **Foco Funcional:** Autenticación de usuarios, perfiles de roles (`admin`, `gestor`, `usuario`), pantallas de mantenimiento y módulo inicial de Registro de Incidencias con ubicación normalizada (`pais`, `provincia`, `ciudad`).
*   **Actividades de Calidad:**
    *   *Diseño de Pruebas:* Especificación de casos de prueba detallados para el formulario de registro y la consistencia de coordenadas espaciales.
    *   *Walkthroughs de Código:* Revisión estructurada de los modelos relacionales de migración inicial en Laravel.
    *   *Ejecución:* Pruebas de integración frontend-backend manuales sobre endpoints de inicio de sesión y registro de incidencias.
    *   *Auditoría SCM:* Monitoreo del correcto uso de ramas `feature/hu-01` y `feature/hu-11` en Git.

### Hito 3: Sprint 2 - Aseguramiento de Procesos e Integración Cartográfica (Semanas 4-5)
*   **Foco Funcional:** Mapeo espacial interactivo Leaflet, historial automático de trazabilidad de estados, asignación múltiple de responsables y sección de comentarios.
*   **Actividades de Calidad:**
    *   *Diseño de Pruebas:* Casos de prueba para las transiciones lógicas de estados de incidencia (HU-02) y la búsqueda espacial por radio (HU-07).
    *   *Análisis Estático Automático:* Primer análisis de mantenimiento y calidad con linters integrados en la pipeline CI.
    *   *Auditoría de Componentes:* Escaneo de dependencias npm y composer (`composer audit` en el backend para prevenir fallos de seguridad A06).
    *   *Ejecución:* Pruebas funcionales de extremo a extremo (E2E) simulando el flujo: *Reportar Incidencia ➔ Asignar Responsables ➔ Cambiar Estado ➔ Comentar Seguimiento*.

### Hito 4: Sprint 3 - Pruebas de Estrés, Seguridad OWASP y Cierre (Semana 6)
*   **Foco Funcional:** Dashboard de analíticas, exportación de reportes CSV/PDF, y notificaciones automáticas (in-app y email).
*   **Actividades de Calidad:**
    *   *Pruebas de Carga y Estrés:* Ejecución de pruebas de carga mediante Artillery o JMeter sobre el endpoint de mapa y el dashboard para verificar el comportamiento bajo peticiones masivas (cumpliendo con la métrica de tiempo de respuesta entre 3 y 5 segundos).
    *   *Auditoría de Seguridad:* Escaneo e inspección manual específica basada en las guías OWASP Top 10 mitigadas (A01, A02, A03, A05 y A06).
    *   *Pruebas de Regresión:* Ejecución completa de la suite de pruebas automatizadas locales y en CI (`php artisan test`) para certificar que las nuevas funciones no rompieron las iniciales.
    *   *Evaluación de Criterios de Aceptación:* Inspección final de cumplimiento de las 12 Historias de Usuario para emitir la recomendación formal de entrega del producto.
