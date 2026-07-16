# Compendio de Avance QA - Sistema de Gestión de Incidencias

Este documento consolida el estado del aseguramiento de calidad (QA) a través de los entregables desarrollados, estructurado para ser utilizado como base en la presentación de diapositivas.

---

## 1. Estrategia de Gestión de Riesgos (Entregables 1 y 2)

### Plan de Gestión de Calidad (Entregable 1)
La "Constitución de Calidad del Proyecto" establece una estrategia rigurosa basada en estándares internacionales:
* **Modelo de Calidad (ISO/IEC 25010):** Se priorizaron 5 atributos críticos: Usabilidad (interfaz ciudadana), Seguridad (no repudio y JWT), Fiabilidad (Soft-deletes), Mantenibilidad (Docker y separación de capas) y Eficiencia (tiempos < 5s).
* **Seguridad Web:** Integración del estándar OWASP Top 10 mitigando inyecciones, fallos de autenticación, control de accesos quebrado y configuraciones incorrectas.
* **Integración Continua:** Pipeline automatizada en GitHub Actions (`php artisan test`) detiene despliegues ante cualquier fallo funcional.

### Matriz de Riesgos Técnicos (Entregable 2)
Se identificaron y priorizaron los siguientes riesgos que atentan contra la calidad técnica del software:

| Riesgo Técnico / Funcional | Nivel de Impacto | Prioridad | Estrategia de Mitigación |
| :--- | :---: | :---: | :--- |
| **RF-01:** Inconsistencia de Estados (saltos inválidos) | Alta | Alta | Validación centralizada en Backend y test unitarios. |
| **RT-01:** Falta de Transaccionalidad | Alta | Crítico | Manejo adecuado del ORM y bloqueos optimistas. |
| **RT-02:** Exposición de Datos Sensibles en API | Alta | Crítico | Control de Resource classes y ocultamiento de campos (`$hidden`). |
| **RT-03:** Renderizado Lento de Mapas | Media | Media | Implementación de paginación API y `Leaflet.markercluster`. |
| **Accesos no Autorizados (OWASP A01)** | Alta | Crítico | Middlewares estrictos de autenticación y roles. |

---

## 2. Pruebas, Defectos y Métricas (Entregables 3, 4 y 5)

### Ejecución de Pruebas: Módulo "Registro de una Incidencia"
Se diseñaron e integraron los siguientes casos de prueba (Caja Negra - Partición de equivalencia / Valores límite) documentados en el Entregable 3 y ejecutados con evidencia en el Entregable 4:

* **CP-F-01 (Registrar incidencia):** [Aprobado] Se validó con éxito el registro estándar y la inferencia espacial. 
    * *Gestión de Defectos (Bug-01):* Se identificó un fallo cuando Leaflet no encontraba la parroquia. Se gestionó habilitando selección manual como respaldo.
* **CP-F-09 (Clasificar prioridad):** [Aprobado] La interfaz muestra dinámicamente colores según jerarquía de gravedad.
* **CP-F-10 (Asignar tipo/subtipo):** [Aprobado] El sistema autocompleta catálogos encadenados de forma reactiva al registrar.
* **CP-F-11 (Registrar ubicación):** [Aprobado] El mapa autocompleta coordenadas al hacer clic.

### Cuadro Final de Métricas e Indicadores de Calidad (Entregable 5)
A partir de la ejecución global de la suite de pruebas (25 casos totales), se obtuvieron los siguientes indicadores, demostrando un sistema robusto:

* **Tasa de Éxito (TE):** **88%** (22/25 casos aprobados). Ligera desviación del umbral del 90% por flujos pendientes.
* **Cobertura Funcional (CF):** **72.72%**.
* **Densidad de Defectos (DD):** **0.04**. La probabilidad de fallos críticos es minúscula; el core es limpio y estable.
* **Porcentaje de Corrección (PC):** **100%**. Alta eficacia del equipo en solventar reportes (ej. error de mapas API).
* **Índice de Estabilidad (IE):** **96%**. Plataforma sumamente confiable y libre de errores operativos severos.

---

## 3. Análisis Estático y Seguridad (Entregable 6)

Para consolidar la calidad interna del código, se integró y configuró un potente *Toolkit de Análisis Estático (SAST/SCA)*. El estado de avance es el siguiente:

* **Frontend (ESLint v9):** Configurado mediante *Flat Config*. Mapea objetos globales (`Leaflet`, `Chart.js`) e ignora el código de pruebas para prevenir sesgos en las métricas.
* **Backend (PHPStan y Laravel Pint):** 
    * *PHPStan (Larastan - Nivel 4):* Configurado para detectar bugs lógicos, tipado estricto y código inalcanzable, entendiendo la magia de Eloquent sin generar falsos positivos.
    * *Laravel Pint:* Garantiza homogeneidad y legibilidad (PSR-12).
* **Full Stack (SonarQube):** El entorno está configurado a través del archivo `sonar-project.properties`, filtrando directorios de terceros (`vendor`, `node_modules`) para levantar las métricas de duplicación, code smells y deuda técnica.
* **Auditoría de Dependencias:** Snyk y Composer Audit integrados para escanear vulnerabilidades en librerías en los contenedores Docker.

> **Nota para Diapositivas:** Las configuraciones se integran en un esquema OLAP, donde los comandos (`php artisan sqa:*`) inyectan resultados a un Data Warehouse (`metrics`) para visualización histórica en paneles de control.
