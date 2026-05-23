
# Casos de uso - Descripciones

Este documento contiene descripciones de casos de uso principales del
sistema de Gestión de Incidencias. Cada caso de uso incluye actor(es),
precondiciones, flujo principal, flujos alternativos y postcondiciones.

---

## UC-01: Registrar incidencia
- Actores: Ciudadano / Usuario autenticado
- Precondición: Usuario autenticado (o formulario público, según configuración)
- Flujo principal:
	1. El actor abre el formulario de nueva incidencia.
	2. Completa título, descripción, tipo/subtipo, prioridad y ubicación
		 (País→Provincia→Ciudad) y puede añadir adjuntos.
	3. El sistema valida campos y geocodifica/normaliza la ubicación.
	4. El sistema guarda la incidencia con estado `Pendiente` y registra
		 creador y timestamp.
	5. Se genera registro en historial y se notifica a usuarios pertinentes.
- Flujos alternativos:
	- A1: Validación falla → Mostrar errores y permitir corrección.
	- A2: Geocodificación falla → Guardar sin coordenadas y marcar advertencia.
- Postcondición: Incidencia creada con estado `Pendiente` y entrada en historial.

## UC-02: Ver detalle y historial de una incidencia
- Actores: Usuario autenticado, Responsable
- Precondición: Incidencia existente y actor con permiso de visualización
- Flujo principal:
	1. El actor abre la página de detalle de la incidencia.
	2. El sistema muestra datos completos, adjuntos y la cronología de
		 cambios de estado y comentarios.
	3. El actor puede navegar por el historial y ver quién realizó cada
		 cambio y cuándo.
- Flujos alternativos:
	- A1: Incidencia no encontrada → Mostrar mensaje 404.
- Postcondición: Visualización read-only del detalle y el historial.

## UC-03: Editar incidencia
- Actores: Autor, Administrador, Usuario con permisos
- Precondición: El actor tiene permisos de edición sobre la incidencia
- Flujo principal:
	1. El actor abre la edición de la incidencia.
	2. Modifica campos permitidos y guarda.
	3. El sistema valida cambios, los persiste y añade entrada al historial
		 indicando cambios realizados, usuario y timestamp.
- Flujos alternativos:
	- A1: Intento de edición sin permisos → Denegar operación.
	- A2: Conflicto de edición (optimistic locking) → Avisar y ofrecer reintento.
- Postcondición: Incidencia actualizada y registro en historial.

## UC-04: Eliminar incidencia (soft delete)
- Actores: Administrador
- Precondición: Incidencia existente y actor con permiso de eliminación
- Flujo principal:
	1. El administrador marca la incidencia como eliminada (soft delete).
	2. El sistema marca el registro como `deleted` sin perder historial ni
		 archivos adjuntos.
	3. La incidencia deja de aparecer en listados por defecto.
- Flujos alternativos:
	- A1: Restaurar incidencia desde administración → Revertir `deleted`.
- Postcondición: Incidencia oculta en listados normales; historial preservado.

## UC-05: Cambiar estado de una incidencia
- Actores: Responsable, Gestor
- Precondición: Incidencia asignada o actor con permiso para cambiar estado
- Flujo principal:
	1. El actor selecciona un nuevo estado (ej. `En proceso`, `Resuelto`).
	2. El sistema registra el cambio en el historial con usuario y timestamp.
	3. Si el estado es `Resuelto`, calcular tiempo de resolución y notificar.
- Flujos alternativos:
	- A1: Cambio no permitido por reglas de negocio → Bloquear y mostrar motivo.
- Postcondición: Historial actualizado y notificaciones generadas si aplica.

## UC-06: Asignar responsables
- Actores: Gestor, Administrador
- Precondición: Usuarios disponibles en el sistema
- Flujo principal:
	1. El gestor selecciona uno o varios usuarios y asigna roles (responsable/
		 apoyo) a la incidencia.
	2. El sistema guarda las asignaciones y crea entradas en historial.
	3. Se envían notificaciones a los usuarios asignados.
- Flujos alternativos:
	- A1: Usuario no válido o inactivo → Mostrar error y evitar asignación.
- Postcondición: Incidencia vinculada a los usuarios asignados y notificados.

## UC-07: Comentar en una incidencia
- Actores: Usuarios autenticados
- Precondición: Incidencia existente
- Flujo principal:
	1. El usuario añade un comentario en el hilo de la incidencia.
	2. El sistema guarda el comentario con autor y timestamp y lo incluye en
		 el historial.
	3. Notifica a interesados según preferencias.
- Flujos alternativos:
	- A1: Contenido no permitido (p. ej. adjuntos muy grandes) → Rechazar y
		mostrar motivo.
- Postcondición: Comentario persistido y visible en el detalle e historial.

## UC-08: Visualizar incidencias en mapa
- Actores: Usuario autenticado
- Precondición: Incidencias con coordenadas
- Flujo principal:
	1. El usuario abre el módulo de mapa.
	2. El sistema carga y muestra incidencias como marcadores/cluster.
	3. El usuario interactúa (zoom, popup con info, filtrado espacial).
- Flujos alternativos:
	- A1: Incidencias sin coordenadas no se muestran en mapa; se listan
		en la vista tabular.
- Postcondición: Usuario obtiene vista espacial de incidencias.

## UC-09: Notificar eventos
- Actores: Sistema, Usuarios
- Precondición: Eventos configurados (asignación, cambio de estado)
- Flujo principal:
	1. Ocurre un evento relevante (ej. asignación).
	2. El sistema crea notificación in-app y/o encola correo para envío.
	3. Usuarios reciben notificación según sus preferencias.
- Flujos alternativos:
	- A1: Canal no disponible (correo falla) → Reintentar o marcar fallo.
- Postcondición: Notificaciones registradas y entregadas cuando es posible.

## UC-10: Consultas y reportes (dashboard)
- Actores: Gestor, Administrador
- Precondición: Datos en la base actualizados
- Flujo principal:
	1. El actor abre el dashboard y selecciona filtros (fechas, ubicación,
		 tipo).
	2. El sistema calcula métricas y muestra gráficos y tablas.
	3. El actor puede exportar resultados a CSV/PDF.
- Flujos alternativos:
	- A1: Volumen de datos alto → Paginación o pre-cálculo de métricas.
- Postcondición: Reporte generado y/o exportado.

## UC-11: Gestión de usuarios y roles
- Actores: Administrador
- Precondición: Administrador autenticado
- Flujo principal:
	1. El administrador crea/edita usuarios y asigna roles y permisos.
	2. El sistema valida y guarda los cambios.
	3. Opcional: Enviar invitación por correo para nuevos usuarios.
- Flujos alternativos:
	- A1: Intento de asignar rol inválido → Rechazar.
- Postcondición: Usuarios y roles actualizados.

## UC-12: Exportar base de datos / dump para entrega
- Actores: Administrador / Equipo de despliegue
- Precondición: Base de datos operativa
- Flujo principal:
	1. El actor solicita volcado (dump) de la base de datos para entrega.
	2. El sistema genera el archivo SQL o backup y lo disponibiliza para
		 descarga/adjunto en `docs/`.
- Flujos alternativos:
	- A1: Tamaño del volcado grande → Ofrecer compresión o exportación parcial.
- Postcondición: Archivo de base de datos disponible para entrega.

---
