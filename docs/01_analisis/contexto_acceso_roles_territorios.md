# Contexto del proyecto

Estoy desarrollando un sistema web de gestión de incidencias en **Laravel (API REST)** con **PostgreSQL**. El frontend es independiente (HTML/CSS/JavaScript) y consume la API.

Actualmente ya existe un modelo de base de datos funcional que **no quiero rediseñar desde cero**. El objetivo es evolucionarlo manteniendo la mayor compatibilidad posible.

---

# Modelo actual [ruta](/docs/02_diagramas/SCRIPT-INCIDENCIAS.sql)

El sistema ya dispone, entre otras, de las siguientes entidades:

- users
- roles
- roles_users
- permisos
- instituciones
- reporte_incidencias
- historial_incidencias
- estados_incidencia
- usuario_incidencia
- direcciones
- territorios
- categorias_incidencia
- prioridades

La tabla `territorios` tiene la siguiente estructura conceptual:

- id
- pais_id
- parent_id
- nombre
- tipo

Su objetivo es representar una jerarquía territorial mediante `parent_id`.

Ejemplo:

Ecuador

- Provincia
  - Cantón
    - Parroquia

No existen tablas separadas para provincias, cantones o parroquias.

---

# Seeder de territorios [al seeder, este obtiene el json de los territorios del ecuador](/backend/api/database/seeders/UbicacionesSeeder.php)

Dispongo de un JSON oficial de Ecuador con la estructura:

```json
{
  "1": {
    "provincia": "AZUAY",
    "cantones": {
      "101": {
        "canton": "CUENCA",
        "parroquias": {
          "10101": "BELLAVISTA",
          "10102": "CAÑARIBAMBA"
        }
      }
    }
  }
}
```

Actualmente el seeder crea los registros utilizando `parent_id`:

Provincia

↓

Cantón

↓

Parroquia

Este enfoque se debe mantener.

---

# Relación actual de las incidencias

La relación existente es:

reporte_incidencias

↓

direccion_id

↓

direcciones

↓

territorio_id

↓

territorios

No quiero agregar columnas como:

- provincia_id
- canton_id
- parroquia_id

en la tabla `reporte_incidencias`, ya que sería información redundante.

La ubicación debe seguir obteniéndose desde la dirección.

---

# Objetivo funcional

El sistema debe funcionar de forma similar al despacho de incidencias utilizado por organismos de emergencia.

Existen tres actores principales:

- Ciudadano
- Supervisor (actualmente todo el que tenga rol de supervisor tiene acceso a cualquier incidencia)
- Institución responsable (el rol de institucion propiamente dicho tiene asociacion con la entidad institucion para que solo las incidencias en las que se asignen a una institucion especifica le aparezcan para resolver)

Los ciudadanos generan incidencias.

Los supervisores las validan y priorizan.

Las instituciones ejecutan la atención.

---

# Restricción importante

NO quiero crear un rol distinto para cada provincia.

Ejemplos que NO deseo implementar:

- SUPERVISOR_GUAYAS
- SUPERVISOR_PICHINCHA
- SUPERVISOR_MANABI
- etc.

Debe existir únicamente un rol genérico:
actualmente la entidad usuario tiene un pais_id, pero no se usa. El sistema debería funcionar a nivel nacional y ser escalable para ser a nivel mundial. Para eso es que se hizo la tabla recursiva de territorios.

SUPERVISOR_TERRITORIAL

La cobertura geográfica debe administrarse mediante datos, no mediante roles.

---

# Recomendación de arquitectura que quiero implementar

El sistema debe separar claramente los conceptos de:

- Rol → Qué puede hacer el usuario.
- Cobertura territorial → Dónde puede hacerlo.
- Institución → Para qué entidad trabaja.
- Turno → Cuándo puede hacerlo.

No deben mezclarse estas responsabilidades.

---

# MEJORA 1: Cambio principal solicitado

Quiero incorporar una relación entre usuarios y territorios mediante una tabla adicional.

Ejemplo:

usuario_territorios

- id
- user_id
- territorio_id
- created_at
- updated_at

Esta tabla permitirá:

- un supervisor con varios territorios;
- varios supervisores sobre un mismo territorio;
- asignación dinámica;
- escalabilidad.

No quiero almacenar el territorio directamente dentro de la tabla users.

---

# Funcionamiento esperado

Cuando un usuario inicia sesión:

1. Se obtiene su rol.
2. Se obtienen los territorios asignados.
3. El sistema únicamente devuelve las incidencias cuya dirección pertenezca a esos territorios (o a sus descendientes si corresponde).

No quiero lógica basada en:

```php
if ($usuario == "Supervisor Guayas")
```

ni

```php
if ($rol == "SUPERVISOR_GUAYAS")
```

Toda la lógica debe obtenerse desde la base de datos.

---

# MEJORA 2: Mejoras recomendadas para territorios

Se recomienda incorporar una columna:

codigo

para almacenar los códigos oficiales del INEC provenientes del JSON.

Ejemplos:

Provincia

1

Cantón

101

Parroquia

10101

No quiero depender del nombre para identificar un territorio.

---

# Tipo de territorio

Actualmente la columna `tipo` almacena textos como:

- Provincia
- Cantón
- Parroquia

Se recomienda migrar el código hacia un Enum de PHP (o constantes) para evitar inconsistencias, manteniendo la compatibilidad con la base de datos.

---

# Seeder

El seeder debe ser idempotente.

Siempre que sea posible utilizar:

- firstOrCreate()
- updateOrCreate()
- upsert()

en lugar de insertar registros duplicados.

---

# Objetivo de las siguientes tareas

Las propuestas deben respetar la arquitectura existente y centrarse en:

- revisar el modelo de datos;
- diseñar la tabla usuario_territorios;
- definir relaciones Eloquent;
- implementar el filtrado automático de incidencias por cobertura territorial;
- diseñar el algoritmo de asignación de supervisores;
- evitar duplicidad de información;
- mantener una arquitectura limpia, escalable y alineada con buenas prácticas de Laravel y PostgreSQL.

No deseo un rediseño completo del sistema, sino una evolución incremental compatible con el modelo actual.
