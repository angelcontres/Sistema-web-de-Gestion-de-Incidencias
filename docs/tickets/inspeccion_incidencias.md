# Objetivo

Quiero que actúes como un **Software Architect**, **Technical Lead** y **QA Lead** realizando una **Gap Analysis** completa del proyecto.

No quiero que implementes ninguna funcionalidad.

Tu única responsabilidad en esta tarea es inspeccionar el repositorio, compararlo con la documentación existente y detectar qué partes del proyecto todavía faltan por implementar o finalizar.

La documentación del proyecto será la **fuente oficial de verdad (Source of Truth)**.

---

# Fuente principal

La carpeta:

```
docs/
```

contiene toda la documentación funcional y técnica del proyecto.

Ejemplos (no limitativo):

* requisitos
* historias de usuario
* arquitectura
* diseño
* casos de uso
* reglas de negocio
* plan de calidad
* métricas
* documentación técnica
* entregables
* diagramas
* decisiones de diseño

Debes analizar toda la documentación antes de revisar el código.

---

# Revisión del proyecto

Después de comprender la documentación debes inspeccionar completamente el proyecto:

* estructura del repositorio
* backend Laravel
* modelos
* migraciones
* controladores
* servicios
* middleware
* políticas
* jobs
* comandos
* pruebas
* rutas
* frontend
* documentación
* scripts
* configuración

No debes asumir que algo falta únicamente porque no encuentres una implementación inmediatamente.

Antes debes verificar si:

* ya existe implementado con otro nombre;
* fue reemplazado por otra solución;
* la documentación fue actualizada;
* la funcionalidad cambió de diseño.

---

# Restricciones

No quiero recomendaciones del tipo:

* "sería buena idea..."
* "podría hacerse..."
* "se recomienda..."

Tampoco quiero propuestas de nuevas funcionalidades.

El alcance del proyecto ya fue definido desde el inicio.

No deseo ampliar el alcance (Scope Creep).

No quiero implementar mejoras que nunca estuvieron planificadas.

No quiero refactorizaciones completas.

No quiero rediseños arquitectónicos.

No quiero cambios por preferencias personales.

Quiero únicamente identificar diferencias reales entre:

DOCUMENTACIÓN

vs

IMPLEMENTACIÓN ACTUAL.

---

# Qué debes detectar

Busca únicamente:

* funcionalidades documentadas que no existen;
* funcionalidades parcialmente implementadas;
* endpoints faltantes;
* reglas de negocio incompletas;
* validaciones pendientes;
* pruebas faltantes;
* documentación desactualizada;
* integración incompleta;
* tareas iniciadas pero no terminadas;
* inconsistencias entre documentación y código.

No reportes mejoras opcionales.

---

# Información importante

El proyecto ha evolucionado significativamente.

Es posible que:

* existan cambios recientes;
* algunas decisiones arquitectónicas hayan cambiado;
* algunas implementaciones ya no coincidan con conversaciones antiguas;
* existan documentos antiguos dentro de `docs`.

Si detectas contradicciones entre documentos, indícalas antes de generar tareas.

No asumas automáticamente que el código está incorrecto.

---

# Resultado esperado

Quiero únicamente una lista priorizada de tareas tipo backlog.

Cada tarea debe ser corta.

Formato:

```
[TIPO] Título

Descripción breve (1 o 2 líneas)

Prioridad:
Alta | Media | Baja

Referencia:
Ruta del documento
Ruta del código relacionado
```

Ejemplo:

```
[Backend]

Implementar endpoint para reasignación de incidencias

Falta implementar el endpoint documentado para permitir la reasignación de incidencias entre supervisores.

Prioridad: Alta

Referencia:
docs/05_backend/incidencias.md
app/Http/Controllers/IncidenciaController.php
```

---

# Clasificación

Agrupa las tareas por categoría.

Por ejemplo:

Backend

Frontend

Base de Datos

Seguridad

Pruebas

Observabilidad

Documentación

DevOps

Calidad

---

# Antes de generar tareas

Primero determina:

* qué porcentaje del proyecto está implementado;
* qué porcentaje permanece pendiente;
* cuáles son los módulos completos;
* cuáles están parcialmente implementados;
* cuáles no comenzaron.

Después genera las tareas.

---

# Muy importante

No implementes nada.

No escribas código.

No propongas arquitectura nueva.

No propongas nuevas tecnologías.

No cambies el alcance.

No hagas optimizaciones.

No hagas refactorizaciones.

Tu objetivo es actuar como un auditor técnico del proyecto y producir un backlog realista de las brechas existentes entre la documentación y la implementación actual.
