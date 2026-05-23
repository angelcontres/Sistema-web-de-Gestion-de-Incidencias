# Requisitos del proyecto

Documento que resume los requisitos funcionales y no funcionales extraídos de
`docs/2026_Proyecto_Estudiantes_TecDesWeb.pdf`.

## Descripción general

Desarrollar un sistema web para registrar, gestionar y visualizar incidencias
georreferenciadas con trazabilidad completa (historial de estados, asignación de
responsables, comentarios y notificaciones). El sistema debe ejecutarse en
contenedores y demostrar pruebas y evidencias de calidad.

## Requisitos funcionales

1. Gestión de incidencias
   - Registrar incidencias con datos básicos (título, descripción, ubicación,
     prioridad, tipo/subtipo, adjuntos opcionales).
   - Editar y eliminar incidencias.

2. Gestión de estados
   - Registrar histórico de cambios de estado con fecha y usuario responsable.
   - Estados típicos: Pendiente → En proceso → Resuelto (con historial completo).

3. Asignación de responsables
   - Asignar uno o varios usuarios a una incidencia.
   - Definir roles (responsable, apoyo).

4. Sistema de comentarios / seguimiento
   - Agregar comentarios a incidencias con autor y fecha.

5. Ubicación y georreferenciación
   - Ubicación normalizada almacenada en tablas relacionadas (País, Provincia,
     Ciudad) para evitar redundancia.

6. Clasificación jerárquica
   - Tipo de incidencia y subtipo (ej.: Infraestructura → Alumbrado).

7. Notificaciones
   - Notificaciones por cambios relevantes (cambio de estado, asignación).
   - Marcado leído/no leído para notificaciones.

8. Prioridad y control
   - Soportar prioridad (alta, media, baja), fecha de creación y cálculo de tiempo
     de resolución.

9. Consultas, filtros y métricas
   - Consultas por estado, tipo, ubicación.
   - Métricas: tiempo promedio de resolución, conteos por filtro.
   - Visualización mediante tablas o gráficos simples (dashboard).

## Requisitos no funcionales y de calidad

- Validaciones y manejo de errores en frontend y backend.
- Diseño consistente de la interfaz (Bootstrap recomendado).
- Pruebas funcionales documentadas y evidencias (casos de prueba, resultados).
- Prueba básica de carga/estrés sobre funcionalidades principales.
- Uso de contenedores para ejecución y despliegue (Docker / Docker Compose).

## Tecnologías recomendadas

- Backend: Laravel (API REST)
- Frontend: HTML, CSS, Bootstrap y JavaScript (fetch)
- Base de datos: MySQL o PostgreSQL
- Contenedores: Docker / Docker Compose

## Entregables obligatorios

- Código fuente completo del sistema.
- Archivo de base de datos (dump SQL).
- Documento técnico (8–12 páginas) con implementación, decisiones y evidencias.
- Enlaces URL para evidenciar la funcionalidad completa (si aplica).

## Criterios de evaluación (resumen)

- Interfaz de usuario y experiencia.
- Integración frontend-backend y consumo de API.
- Correcto funcionamiento del CRUD, asignación, comentarios y trazabilidad.
- Organización del código y buenas prácticas.
- Documentación técnica y evidencias de pruebas.

## Notas adicionales

- Implementaciones opcionales para bonificación: escalado con múltiples
  instancias, optimizaciones de contenedores y mejoras justificadas.
- Incluir en `docs/` capturas, métricas y evidencias solicitadas por la rúbrica.
