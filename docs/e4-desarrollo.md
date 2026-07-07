# Reporte de Ejecución de Pruebas (Entregable 4)

Este documento contiene los resultados de la ejecución de los casos de prueba diseñados en el **Entregable 3** (Ver diseño en [02-e3.md](./entregable3/02-e3.md)).

---

## 1. Línea Base del Ambiente

Detalle de las versiones de hardware, software e infraestructura de red utilizadas durante la ejecución de las pruebas.

* **Sistema Operativo (Host):** [Completar SO, ej. Windows 11 / Ubuntu 22.04]
* **Entorno de Contenedores:** Docker (Docker Engine v[Completar versión], Docker Compose v[Completar versión])
* **Backend:** PHP [Completar versión], Laravel [Completar versión]
* **Base de Datos:** PostgreSQL [Completar versión]
* **Frontend:** Bootstrap [Completar versión], Vanilla JS (Fetch API)
* **Navegador de Pruebas:** [Completar navegador, ej. Google Chrome vX.X / Mozilla Firefox vX.X]
* **Herramientas Adicionales:** Postman v[Completar versión]

---

## 2. Bitácora e Historial de Ejecución

A continuación se registra el historial de ejecución de los casos diseñados en el Entregable 3.

### 2.1 Pruebas Funcionales (15 Casos)

| ID | Requisito | Tipo | Datos / Escenario | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| **CP-F-01** | RF-01 | Funcional | Registrar incidencia | La incidencia se registró correctamente en la base de datos y se visualiza en la tabla. | Aprobado |
| **CP-F-02** | RF-01 | Funcional | Editar incidencia | Los datos de la incidencia fueron actualizados exitosamente en la base de datos. | Aprobado |
| **CP-F-03** | RNF-02 | Funcional | Eliminación lógica | El registro no fue eliminado físicamente, se actualizó el campo `deleted_at`. | Aprobado |
| **CP-F-04** | RF-03 | Funcional | Cambio de estado | El estado de la incidencia fue actualizado exitosamente. | Aprobado |
| **CP-F-05** | RF-03 | Funcional | Historial de cambios | La funcionalidad para visualizar el historial de cambios no se encuentra implementada. | Fallido |
| **CP-F-06** | RF-05 | Funcional | Asignar responsable | Se logró asignar un responsable a la incidencia exitosamente. | Aprobado |
| **CP-F-07** | RF-03 | Funcional | Agregar comentario | El comentario fue agregado y enlazado correctamente a la incidencia. | Aprobado |
| **CP-F-08** | RF-07 | Funcional | Generar notificación | La funcionalidad de envío de notificaciones automáticas no se encuentra implementada. | Fallido |
| **CP-F-09** | RF-06 | Funcional | Clasificar prioridad | La incidencia se muestra con la etiqueta/color correspondiente según su nivel de prioridad. | Aprobado |
| **CP-F-10** | RF-01 | Funcional | Asignar tipo/subtipo | El tipo y subtipo fueron asignados y guardados correctamente en la base de datos. | Aprobado |
| **CP-F-11** | RF-04 | Funcional | Registrar ubicación | Las coordenadas y jerarquía geográfica se almacenaron correctamente mediante el mapa. | Aprobado |
| **CP-F-12** | RF-03 | Funcional | Consulta por estado | El sistema filtra correctamente las incidencias de acuerdo a su estado en la tabla. | Aprobado |
| **CP-F-13** | RF-01 | Funcional | Consulta por tipo | El sistema filtra correctamente las incidencias de acuerdo al tipo seleccionado. | Aprobado |
| **CP-F-14** | RNF-01 | Funcional | Dashboard métricas | El dashboard aún no despliega la totalidad de la información de métricas (incompleto). | Fallido |
| **CP-F-15** | RF-02 | Funcional | Auditoría automática | El motor de auditoría automática (triggers) no se encuentra implementado en la base de datos. | Fallido |

### 2.2 Pruebas de Validación (5 Casos)

| ID | Requisito | Tipo | Datos / Escenario | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| **CP-V-01** | RF-04 | Validación | Latitud fuera de rango | El sistema rechazó la latitud inválida (HTTP 422). | Aprobado |
| **CP-V-02** | RF-04 | Validación | Longitud fuera de rango | El sistema rechazó la longitud inválida (HTTP 422). | Aprobado |
| **CP-V-03** | RF-01 | Validación | Campos obligatorios vacíos | El sistema bloqueó la creación al faltar el tipo y subtipo. | Aprobado |
| **CP-V-04** | RF-03 | Validación | Comentario supera longitud | La funcionalidad de comentarios aún no se encuentra implementada. | Fallido |
| **CP-V-05** | RF-01 | Validación | Tipo/Subtipo inválido | El sistema rechazó la creación al enviar un catálogo inexistente. | Aprobado |

### 2.3 Pruebas de Seguridad (5 Casos)

| ID | Requisito | Tipo | Datos / Escenario | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| **CP-S-01** | RNF-01 | Seguridad | Acceso sin autenticación | Se denegó el acceso (HTTP 401) a una ruta protegida sin token. | Aprobado |
| **CP-S-02** | RF-05 | Seguridad | Acceso con rol no autorizado | Se denegó el acceso (HTTP 403) al intentar acceder a gestión de roles con un rol ciudadano. | Aprobado |
| **CP-S-03** | RNF-01 | Seguridad | Manipulación de token | El sistema rechazó el token modificado devolviendo HTTP 401. | Aprobado |
| **CP-S-04** | RNF-01 | Seguridad | Expiración de sesión | El sistema bloqueó el acceso tras revocarse/expirar el token. | Aprobado |
| **CP-S-05** | RF-05 | Seguridad | Ocultamiento de opciones menú | Las opciones del menú retornadas por la API filtraron los accesos según el rol. | Aprobado |

---

## 3. Depósito Documental de Evidencias

En esta sección se compilan las capturas de pantalla, respuestas de servidor, consultas HTTP (Postman) o logs del sistema para cada uno de los casos. 

**Indicaciones:** Por favor, asegúrese de adjuntar las evidencias en los espacios designados utilizando referencias relativas (ej. `![Evidencia CP-F-01](./assets/evidencias/cp-f-01.png)`).

### Pruebas Funcionales

* **CP-F-01** (Registrar incidencia) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA: Formulario completado exitosamente o respuesta HTTP]

* **CP-F-02** (Editar incidencia) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA: Pantalla de edición]

* **CP-F-03** (Eliminación lógica) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ EL LOG / CONSULTA A BDD: Comprobación del campo deleted_at y deleted_by]

* **CP-F-04** (Cambio de estado) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA / RESPUESTA HTTP]

* **CP-F-05** (Historial de cambios) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ EL LOG O PANTALLA DEL HISTORIAL]

* **CP-F-06** (Asignar responsable) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA]

* **CP-F-07** (Agregar comentario) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA]

* **CP-F-08** (Generar notificación) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA]

* **CP-F-09** (Clasificar prioridad) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA]

* **CP-F-10** (Asignar tipo/subtipo) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA]

* **CP-F-11** (Registrar ubicación) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA / RESPUESTA JSON]

* **CP-F-12** (Consulta por estado) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA]

* **CP-F-13** (Consulta por tipo) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA]

* **CP-F-14** (Dashboard métricas) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA DEL DASHBOARD]

* **CP-F-15** (Auditoría automática) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ EL LOG / REGISTRO DE AUDITORÍA]

### Pruebas de Validación

* **CP-V-01** (Latitud fuera de rango) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA: Mensaje de error de validación en UI]

* **CP-V-02** (Longitud fuera de rango) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA: Mensaje de error de validación en UI]

* **CP-V-03** (Campos obligatorios vacíos) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA O RESPUESTA POSTMAN: Error 422]

* **CP-V-04** (Comentario supera longitud) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA: Validación de longitud excedida]

* **CP-V-05** (Tipo/Subtipo inválido) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA O RESPUESTA POSTMAN: Error por catálogo]

### Pruebas de Seguridad

* **CP-S-01** (Acceso sin autenticación) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ EL LOG / CONSULTA HTTP POSTMAN: HTTP 401 o Redirección al login]

* **CP-S-02** (Acceso con rol no autorizado) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA O POSTMAN: Respuesta HTTP 403 Forbidden]

* **CP-S-03** (Manipulación de token) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CONSULTA HTTP POSTMAN: Intento con token alterado]

* **CP-S-04** (Expiración de sesión) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA / POSTMAN: Petición con token expirado]

* **CP-S-05** (Ocultamiento de opciones menú) - Fecha: [Completar fecha]
  * **Resultado:** [Aprobado/Fallido]
  * *Evidencia:* 
    > [AQUÍ SE ADJUNTARÁ LA CAPTURA DE PANTALLA: UI sin opciones para el rol respectivo]

---

## 4. Registro de Bugs & Ciclo de Vida

En caso de encontrar fallos durante la ejecución, regístrelos en el siguiente inventario.

| ID Bug | Caso Asociado | Descripción del Defecto | Severidad | Estado | Re-test (ID) |
|---|---|---|---|---|---|
| BUG-01 | [Ej. CP-F-01] | [Breve descripción del fallo] | [Crítico/Alto/Medio/Bajo] | [Abierto/En Progreso/Resuelto] | [Evidencia / ID Re-test] |
| BUG-02 | | | | | |
| BUG-03 | | | | | |

* **Evidencias de Re-testeo:**
  > [AQUÍ SE ADJUNTARÁN LAS EVIDENCIAS DEL RE-TEST: Capturas o logs que demuestren que el bug fue cerrado correctamente y verificado de nuevo tras la aplicación del parche.]

---

## 5. Cuadro Estadístico de Cierre

Consolidado numérico preciso al finalizar las pruebas.

| Métrica | Cantidad | Porcentaje (%) |
|---|---|---|
| **Casos Diseñados (Total)** | 25 | 100% |
| **Casos Ejecutados** | [Completar] | [Completar]% |
| **Casos Aprobados** | [Completar] | [Completar]% |
| **Casos Fallidos** | [Completar] | [Completar]% |
| **Defectos Encontrados** | [Completar] | - |
| **Defectos Corregidos** | [Completar] | [Completar]% |
| **Defectos Pendientes** | [Completar] | [Completar]% |

---

## 6. Análisis, Trazabilidad y Lecciones

### 6.1 Matriz de Trazabilidad Actualizada

Reflejo de la cobertura basada en los estados reales de aprobación tras ejecutar las pruebas (referencia original en [03-e3.md](./entregable3/03-e3.md)).

| Requisito | Descripción | Casos asociados | Estado de los Casos (Aprobado/Fallido) |
|---|---|---|---|
| RF-01 | Registro de incidencias | CP-F-01, CP-F-02, CP-V-03, CP-F-10, CP-F-13 | [Completar] |
| RF-02 | Auditoría automática | CP-F-15 | [Completar] |
| RF-03 | Gestión de estados | CP-F-04, CP-F-05, CP-F-07, CP-F-12, CP-V-04 | [Completar] |
| RF-04 | Ubicación geográfica | CP-F-11, CP-V-01, CP-V-02 | [Completar] |
| RF-05 | Roles y permisos | CP-F-06, CP-S-02, CP-S-05 | [Completar] |
| RF-06 | Clasificación por prioridad | CP-F-09 | [Completar] |
| RF-07 | Instituciones responsables | CP-F-08 | [Completar] |
| RNF-01 | API REST | CP-F-14, CP-S-01, CP-S-03, CP-S-04 | [Completar] |
| RNF-02 | Eliminación lógica | CP-F-03 | [Completar] |
| RNF-03 | Docker | CP-F-14 | [Completar] |
| RNF-04 | Precisión GPS | CP-V-01, CP-V-02 | [Completar] |

### 6.2 Análisis de Zonas Frágiles y Conclusiones

* **Zonas Frágiles Detectadas:**
  * [Completar describiendo qué módulos presentaron mayor cantidad de defectos o dificultades técnicas, ej. Validación de coordenadas, roles complejos].
* **Conclusiones Predictivas sobre la Calidad:**
  * [Completar indicando si el sistema cuenta con un nivel de calidad aceptable para el despliegue en producción/demo final, basándose en el porcentaje de éxito de las pruebas].
* **Lecciones Aprendidas:**
  * [Completar indicando aspectos metodológicos o técnicos que se mejorarían a futuro (ej. mejorar los logs de auditoría, optimizar tiempos de respuesta)].
