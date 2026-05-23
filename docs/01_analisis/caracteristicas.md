# Características del Sistema - Gestión de Incidencias

## Feature 1: Gestión de incidencias
- F1.1: Crear incidencia con datos básicos y adjuntos
- F1.2: Editar incidencia existente
- F1.3: Eliminar incidencia (soft delete sugerido)
- F1.4: Visualizar detalle de incidencia con trazabilidad

## Feature 2: Flujo de trabajo y estados
- F2.1: Cambiar estado (Pendiente → En proceso → Resuelto)
- F2.2: Registrar histórico automático con timestamp y usuario
- F2.3: Tiempo de resolución automático

## Feature 3: Asignación y roles
- F3.1: Asignar responsables múltiples
- F3.2: Definir rol por asignación (responsable/apoyo)
- F3.3: Filtrar incidencias por usuario asignado

## Feature 4: Georreferenciación jerárquica
- F4.1: Almacenar ubicación geográfica normalizada
	- Guardar coordenadas (latitud, longitud) por incidencia.
	- Relacionar registro con tablas normalizadas: `pais`, `provincia`, `ciudad`.
	- Validar y normalizar direcciones/ubicaciones al crear o editar incidencias.
- F4.2: Visualización y búsqueda espacial
	- Mostrar incidencias en un mapa interactivo (por ejemplo Leaflet).
	- Soportar zoom, clusters y popups con detalle mínimo (título, estado,
		prioridad).
	- Búsqueda por proximidad (ej.: radio en metros/kilómetros) y filtrado por
		ubicación administrativa (país/provincia/ciudad).
- F4.3: Geocodificación y entrada asistida
	- Permitir entrada manual de coordenadas y geocodificación por dirección
		(opcional, mediante API pública o servicio interno).

## Feature 5: Sistema de notificaciones
- F5.1: Notificaciones por eventos relevantes
	- Notificaciones in-app cuando cambie el estado de una incidencia o cuando
		un usuario sea asignado.
	- Notificaciones por correo electrónico (configurable) para eventos críticos.
- F5.2: Historial y estado de notificaciones
	- Registrar notificaciones en tabla con metadatos (tipo, recurso, usuario,
		fecha, leído/no leído).
	- Permitir al usuario marcar notificaciones como leídas/archivadas.
- F5.3: Preferencias de notificación
	- Permitir a cada usuario configurar qué eventos quiere recibir y el canal
		preferido (in-app, email).

## Feature 6: Dashboard y métricas
- F6.1: Dashboard de métricas clave
	- Mostrar métricas y KPIs: número de incidencias por estado, por tipo,
		por ubicación y tiempo promedio de resolución.
	- Representación con gráficos sencillos (barras, pastel, líneas) y tablas
		con paginación.
- F6.2: Filtrado y exportación
	- Permitir filtros por rango de fechas, ubicación, estado, prioridad y usuario
		asignado.
	- Exportar resultados en CSV y/o PDF para informes.
- F6.3: Widgets y paneles reutilizables
	- Diseñar componentes reutilizables para mostrar conteos, tendencias y
		listas recientes.

## Feture 7: Autenticación y roles
- F7.1: Autenticación y gestión de usuarios
	- Registro y autenticación segura (login/logout) con contraseñas hasheadas.
	- Recuperación de contraseña (email) y gestión de perfil.
- F7.2: Roles y permisos
	- Definir roles: `admin`, `gestor` (operativo), `usuario` (reportante).
	- Controlar permisos: creación, edición, asignación, cierre, exportación y
		administración de usuarios.
- F7.3: Auditoría y trazabilidad por usuario
	- Registrar quién realizó acciones sobre incidencias (creación, cambio de
		estado, asignaciones) para trazabilidad y auditoría.

## Criterios de aceptación (por feature)
- F1.x: Crear/editar/eliminar incidencia funciona via UI y API; los datos se
	validan y se almacenan en BD. Pruebas funcionales y evidencia (capturas).
- F2.x: Historial de estados muestra entradas con timestamp y autor; el
	cálculo de tiempo de resolución se puede reproducir.
- F3.x: Asignación permite múltiples responsables; al filtrar por usuario se
	listan correctamente las incidencias asignadas.
- F4.x: Las incidencias aparecen en el mapa con ubicación correcta y la
	búsqueda por proximidad devuelve resultados plausibles.
- F5.x: Las notificaciones llegan in-app; las preferencias de usuario se
	respetan; existe registro de leído/no leído.
- F6.x: El dashboard muestra métricas y permite exportar según filtros.
- F7.x: Los roles aplican permisos correctamente y existe auditoría de acciones.

## Notas de implementación sugeridas
- Utilizar una tabla `locations` normalizada para evitar redundancia.
- Usar JWT o sesiones seguras para auth; aplicar middleware de permisos en
	endpoints.
- Implementar colas para envío de correos y procesos asíncronos (Laravel
	queues o jobs equivalentes).
