# Ticket: Implementar Motor de Auditoría Automática

## Información General

| Campo | Valor |
|-------|-------|
| **ID** | TICKET-001 |
| **Título** | Implementar Motor de Auditoría Automática |
| **Tipo** | Feature |
| **Prioridad** | Alta |
| **Estado** | Pendiente |
| **Módulo** | Backend / Base de Datos |
| **Caso de Uso** | RF-02, UC-03 |

---

## Descripción

Implementar el motor de auditoría automática que registre cualquier operación (creación, actualización, borrado) sobre tablas críticas del sistema, capturando el estado previo y actual en formato JSONB.

---

## Requisitos

### Requisito Funcional (RF-02)

> Motor de auditoría que registre cualquier operación (creación, actualización, borrado) sobre tablas críticas, capturando estado previo y actual en formato cambio.

### Tabla `auditorias` (documentada en ER)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT PK | Identificador único |
| `tabla_nombre` | VARCHAR | Nombre de la tabla afectada |
| `registro_id` | BIGINT | ID del registro modificado |
| `operacion` | VARCHAR | Tipo: CREATE, UPDATE, DELETE |
| `valores_anteriores` | JSONB | Estado previo del registro |
| `valores_nuevos` | JSONB | Estado nuevo del registro |
| `usuario_id` | BIGINT FK | Usuario que realizó la operación |
| `fecha_cambio` | TIMESTAMP | Fecha y hora de la operación |

---

## Alcance

### Tablas Críticas a Auditar

Según documentación, las tablas que deben ser auditadas son:

1. `users` - Gestión de usuarios
2. `roles` - Roles del sistema
3. `permisos` - Permisos granulares
4. `reporte_incidencias` - Incidencias principales
5. `historial_incidencias` - Historial de cambios
6. `usuario_incidencia` - Asignaciones
7. `estados_incidencia` - Estados del ciclo de vida
8. `categorias_incidencia` - Clasificación de incidencias
9. `direcciones` - Direcciones geográficas
10. `instituciones` - Organismos responsables

### Funcionalidades a Implementar

1. **Migración** para tabla `auditorias` en esquema `public`
2. **Modelo** `Auditoria.php` con campos y relaciones
3. **Trait** `Auditable` para ser aplicado a modelos auditables
4. **Observer** o **Event Listeners** para capturar eventos de Eloquent
5. **Lógica** para serializar cambios en formato JSONB

---

## Criterios de Aceptación

- [ ] La tabla `auditorias` existe en la base de datos con la estructura documentada
- [ ] Cada operación CREATE en tablas críticas genera un registro con `valores_nuevos`
- [ ] Cada operación UPDATE en tablas críticas genera un registro con `valores_anteriores` y `valores_nuevos`
- [ ] Cada operación DELETE en tablas críticas genera un registro con `valores_anteriores`
- [ ] El campo `usuario_id` se registra automáticamente desde el usuario autenticado
- [ ] El campo `fecha_cambio` se registra con la fecha/hora del servidor
- [ ] El trait `Auditable` funciona al agregarlo a cualquier modelo
- [ ] La auditoría no afecta el rendimiento de las operaciones CRUD
- [ ] La prueba CP-F-15 (Auditoría automática) pasa exitosamente

---

## Tareas

### Tarea 1: Migración
- Crear migración para tabla `auditorias`
- Executar migrate para verificar estructura

### Tarea 2: Modelo
- Crear `app/Models/Auditoria.php`
- Definir campos mass assignable y relaciones

### Tarea 3: Trait Auditable
- Crear `app/Traits/Auditable.php`
- Implementar lógica para capturar cambios
- Serializar valores anteriores/nuevos a JSON

### Tarea 4: Observer/Events
- Crear `app/Observers/AuditoriaObserver.php`
- Registrar observer en `AppServiceProvider`
- Implementar métodos `created`, `updated`, `deleted`

### Tarea 5: Integración
- Agregar trait `Auditable` a modelos críticos:
  - User
  - Role
  - Permiso
  - ReporteIncidencia
  - HistorialIncidencia
  - UsuarioIncidencia
  - EstadoIncidencia
  - CategoriaIncidencia
  - Direccion
  - Institucion

### Tarea 6: Pruebas
- Crear tests para verificar:
  - Registro de auditoría en CREATE
  - Registro de auditoría en UPDATE con valores anteriores/nuevos
  - Registro de auditoría en DELETE
  - Captura correcta del usuario_id

---

## Estructura de Código Propuesta

```
app/
├── Models/
│   ├── Auditoria.php
│   ├── User.php (agregar trait)
│   ├── Role.php (agregar trait)
│   └── ... (otros modelos auditables)
├── Traits/
│   └── Auditable.php
├── Observers/
│   └── AuditoriaObserver.php
database/
└── migrations/
    └── XXXX_create_auditorias_table.php
tests/
└── Feature/
    └── AuditoriaTest.php
```

---

## Referencias

### Documentación
- `docs/REQUERIMIENTOS.md` - RF-02
- `docs/02_diagramas/er.md` - Definición de tabla
- `docs/01_analisis/casos_uso_descripcion.md` - UC-03
- `docs/entregable3/01-e3.md` - CP-F-15 (prueba fallida)

### Código Relacionado
- `app/Models/` - Modelos a auditar
- `app/Providers/AppServiceProvider.php` - Registro de observer
- `database/migrations/` - Migraciones existentes
- `tests/Feature/` - Tests existentes

---

## Notas

- La tabla `auditorias` está documentada en el ER pero no existe migración
- La prueba CP-F-15 del Entregable 4 reportó fallo por esta funcionalidad no implementada
- El sistema ya utiliza Eloquent ORM, por lo que los Events/Observers son la solución natural
- Considerar impacto en rendimiento: la auditoría no debe bloquear operaciones CRUD
