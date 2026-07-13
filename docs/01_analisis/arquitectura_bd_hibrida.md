# Contexto del proyecto

Estoy desarrollando un sistema web de gestión de incidencias utilizando:

- Laravel (Backend API REST)
- PostgreSQL
- Frontend desacoplado (HTML, CSS y JavaScript)
- Grafana para observabilidad y dashboards

Actualmente el sistema dispone de una base de datos **transaccional (OLTP)** completamente funcional bajo el esquema `public`.

No deseo modificar el modelo operacional existente más de lo necesario.

---

# Arquitectura actual

El esquema `public` contiene las entidades del negocio:

- users
- roles
- permisos
- instituciones
- territorios
- direcciones
- reporte_incidencias
- historial_incidencias
- usuario_incidencia
- categorias_incidencia
- prioridades
- etc.

Estas tablas representan la fuente oficial de la operación diaria del sistema.

Todas las operaciones CRUD continúan realizándose exclusivamente sobre este esquema.

---

# Nuevo objetivo

Quiero incorporar una **capa analítica (OLAP)** dentro del mismo PostgreSQL mediante un nuevo esquema:

```sql
metrics
```

Este esquema NO reemplaza el modelo transaccional.

Su objetivo es servir como fuente de datos para:

- Grafana
- Dashboards
- KPIs
- Observabilidad
- Métricas SQA
- Reportes históricos
- Business Intelligence

---

# Filosofía arquitectónica

Deseo implementar una arquitectura híbrida:

```
                Aplicación Laravel
                       │
        ┌──────────────┼──────────────┐
        │                              │
        ▼                              ▼
     public                      Procesos ETL
      OLTP                  (Jobs / Queues / Commands)
        │                              │
        └──────────────► metrics ◄─────┘
                          OLAP
```

El esquema `public` continúa siendo el sistema operacional.

El esquema `metrics` será exclusivamente analítico.

No quiero ejecutar consultas analíticas complejas sobre las tablas del negocio.

---

# Restricción importante

No deseo simplemente crear tablas independientes como:

```
metrics.performance_logs

metrics.test_results

metrics.security_scans
```

Quiero implementar un **modelo dimensional (Star Schema)** siguiendo principios de Data Warehouse.

---

# Modelo esperado

El esquema `metrics` debe componerse de:

## Tablas de dimensiones

Ejemplos:

- dim_date
- dim_metric
- dim_endpoint
- dim_usuario
- dim_territorio
- dim_categoria
- dim_estado
- dim_prioridad
- dim_institucion

Las dimensiones deben contener únicamente información necesaria para análisis.

No deben duplicar toda la información del modelo OLTP.

---

## Tablas de hechos

Ejemplos:

fact_performance

Debe almacenar:

- tiempo de respuesta
- endpoint
- método HTTP
- código de respuesta
- fecha
- usuario (si aplica)

---

fact_testing

Debe almacenar:

- total de pruebas
- pruebas exitosas
- pruebas fallidas
- porcentaje TEP
- duración de ejecución

---

fact_security

Debe almacenar:

- vulnerabilidades críticas
- altas
- medias
- bajas

---

fact_quality

Debe almacenar métricas SQA agregadas.

Ejemplos:

- Cobertura Funcional
- Densidad de Defectos
- Tasa de Éxito de Pruebas

---

fact_incidencias

Debe permitir análisis históricos de negocio.

Ejemplos:

- cantidad de incidencias
- tiempo promedio de atención
- incidencias por categoría
- incidencias por territorio
- incidencias por institución
- incidencias por prioridad

---

# Fuentes de datos

Las métricas pueden provenir de distintas fuentes.

## Base transaccional

public.\*

Ejemplo:

- reporte_incidencias
- historial
- usuarios
- territorios

---

## PHPUnit

Resultados XML o JSON.

No deseo almacenar el XML completo.

Únicamente los indicadores derivados.

---

## Composer Audit

No deseo almacenar el JSON completo.

Únicamente:

- Critical
- High
- Medium
- Low

---

## npm audit

Mismo criterio.

---

## GitHub / GitHub Issues

Solo indicadores derivados.

No almacenar respuestas completas de la API.

---

## Grafana Alloy

Logs y telemetría.

Solo almacenar información agregada o estructurada para análisis.

---

# Qué NO quiero almacenar en el OLAP

No quiero convertir el esquema `metrics` en un repositorio documental.

Por ejemplo, NO deben almacenarse como hechos:

- Historias de Usuario completas
- Casos de Uso
- Archivos Markdown
- Documentos IEEE
- Escenarios Gherkin completos
- XML completos de PHPUnit
- JSON completos de Composer Audit
- Logs completos

Estos continúan siendo artefactos externos.

El OLAP únicamente almacenará métricas e indicadores derivados.

---

# Responsabilidad del ETL

Deseo implementar procesos ETL mediante:

- Artisan Commands
- Laravel Jobs
- Queues
- Schedulers

Estos procesos deben:

Extraer

- datos del esquema public
- resultados PHPUnit
- auditorías Composer
- auditorías npm
- otras fuentes

Transformar

- calcular indicadores
- consolidar información
- generar agregados

Cargar

- tablas fact\_\*
- dimensiones dim\_\*

---

# Grafana

Grafana debe conectarse únicamente al esquema `metrics`.

No deseo que Grafana consulte directamente las tablas operacionales del negocio salvo casos excepcionales.

---

# Objetivos

El objetivo es disponer de una arquitectura profesional basada en:

- OLTP para operación.
- OLAP para analítica.
- ETL para sincronización.
- Modelo dimensional (Star Schema).
- Escalabilidad.
- Bajo acoplamiento.
- Buenas prácticas de Data Warehouse.

---

# Lo que necesito del agente

Quiero que analice el repositorio existente y proponga una implementación incremental, compatible con la arquitectura actual.

Las propuestas deben incluir:

- diseño completo del esquema `metrics`;
- modelo dimensional recomendado;
- definición de dimensiones y hechos;
- relaciones entre dimensiones y hechos;
- procesos ETL utilizando Laravel;
- estrategia de sincronización;
- comandos Artisan necesarios;
- Jobs y Queues;
- consultas SQL optimizadas;
- integración con Grafana;
- recomendaciones de indexación;
- particionamiento si resulta conveniente;
- convenciones de nombres;
- organización del código.

No deseo un rediseño del sistema operativo.

Deseo incorporar una capa analítica profesional sobre la arquitectura existente, manteniendo una separación clara entre OLTP y OLAP.
