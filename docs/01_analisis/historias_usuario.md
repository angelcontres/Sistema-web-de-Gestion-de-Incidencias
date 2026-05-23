# Historias de Usuario

## HU-01: Registro de incidencia
**Como** ciudadano o empleado
**Quiero** registrar una incidencia con título, descripción, ubicación, prioridad, tipo/subtipo y adjuntos
**Para** que quede documentada y pueda ser atendida

**Criterios de aceptación:**
- Todos los campos obligatorios tienen validación
- La ubicación se selecciona de listas anidadas (País → Provincia → Ciudad)
- Los tipos y subtipos son jerárquicos
- Se pueden subir múltiples archivos adjuntos
- Al guardar, se asigna estado "Pendiente" automáticamente

## HU-02: Ver historial de cambios
**Como** usuario responsable
**Quiero** ver el historial completo de estados con fechas y usuarios
**Para** entender la trazabilidad de la incidencia

**Criterios de aceptación:**
- Se muestra línea de tiempo con todos los cambios
- Cada cambio muestra fecha, usuario, estado anterior y nuevo
- Los comentarios aparecen integrados en el historial

## HU-03: Listar y filtrar incidencias
**Como** usuario del sistema
**Quiero** ver una lista de incidencias con filtros por estado, tipo,
ubicación y prioridad
**Para** encontrar rápidamente las incidencias relevantes

**Criterios de aceptación:**
- La lista muestra paginación, orden y búsqueda por texto.
- Los filtros combinados (estado + ubicación + rango de fechas) funcionan.
- Cada fila muestra título, estado, prioridad, ubicación y fecha de creación.

## HU-04: Editar y eliminar incidencia
**Como** autor o administrador
**Quiero** editar los datos de una incidencia o marcarla como eliminada
**Para** corregir información o mantener la base de datos limpia

**Criterios de aceptación:**
- Solo usuarios autorizados pueden editar o eliminar.
- La eliminación debe ser soft delete por defecto.
- Las ediciones quedan registradas en el historial de la incidencia.

## HU-05: Asignar responsables
**Como** gestor operativo
**Quiero** asignar uno o varios usuarios a una incidencia con roles
**Para** que quede claro quién responde de su resolución

**Criterios de aceptación:**
- Se puede asignar múltiples usuarios con rol (`responsable`/`apoyo`).
- Las asignaciones generan notificaciones a los usuarios asignados.
- Se puede filtrar incidencias por usuario asignado.

## HU-06: Comentar en una incidencia
**Como** cualquier usuario registrado
**Quiero** agregar comentarios a una incidencia
**Para** aportar seguimiento, decisiones o evidencias

**Criterios de aceptación:**
- Los comentarios incluyen autor y timestamp.
- Los comentarios aparecen en el hilo de la incidencia y en el historial.
- Permitir edición limitada de comentarios por su autor (opcional).

## HU-07: Ver incidencias en mapa
**Como** usuario
**Quiero** visualizar incidencias georreferenciadas en un mapa interactivo
**Para** entender la distribución espacial y localizar problemas cercanos

**Criterios de aceptación:**
- Las incidencias con coordenadas aparecen en el mapa.
- El mapa soporta clusters y popups con información mínima.
- Se puede aplicar filtros desde el mapa (por tipo, estado y radio).

## HU-08: Recibir notificaciones
**Como** usuario asignado o administrador
**Quiero** recibir notificaciones in-app y por correo para eventos
**Para** estar informado de cambios importantes

**Criterios de aceptación:**
- Notificaciones por asignación, cambio de estado y comentarios.
- Estado leído/no leído y opción de marcar como leído.
- Preferencias de notificación configurables por usuario.

## HU-09: Dashboard de métricas
**Como** gestor o administrador
**Quiero** ver métricas y KPIs (incidencias por estado, tiempo medio de
resolución)
**Para** monitorear desempeño y priorizar recursos

**Criterios de aceptación:**
- Panel con gráficos y tablas filtrables por periodo y ubicación.
- Exportar métricas a CSV para reporting.

## HU-10: Exportar listados e informes
**Como** usuario administrativo
**Quiero** exportar listados de incidencias y reportes en CSV/PDF
**Para** compartir información y cumplir con informes oficiales

**Criterios de aceptación:**
- Exportar con los filtros aplicados.
- Incluir columnas clave: id, título, estado, prioridad, asignados, fechas.

## HU-11: Gestión de usuarios y roles
**Como** administrador
**Quiero** crear, editar y asignar roles a usuarios
**Para** controlar accesos y responsabilidades

**Criterios de aceptación:**
- Roles predefinidos (`admin`, `gestor`, `usuario`) y posibilidad de
	asignar permisos básicos.
- Registro seguro y recuperación de contraseña por email.

## HU-12: Evidencias y pruebas funcionales
**Como** miembro del equipo de calidad
**Quiero** ejecutar y documentar pruebas funcionales sobre las principales
funcionalidades
**Para** entregar evidencias requeridas en el documento técnico

**Criterios de aceptación:**
- Casos de prueba documentados y resultados almacenados en `docs/`.
- Capturas de pantalla de la UI que muestran las funciones implementadas.
- Resultados de pruebas básicas de carga o estrés sobre endpoints clave.

