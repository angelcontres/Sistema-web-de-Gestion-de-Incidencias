# Sistema Web de Gestión de Incidencias Georreferenciadas

Sistema web orientado a la gestión, seguimiento y visualización de incidencias ciudadanas georreferenciadas, permitiendo registrar eventos, asignar responsables, gestionar estados, generar métricas y mantener trazabilidad completa de cada incidencia.

El proyecto fue desarrollado bajo una arquitectura basada en servicios, integrando frontend, backend, procesamiento de datos y almacenamiento híbrido mediante bases de datos relacionales y documentales.

---

# Objetivo del Proyecto

Desarrollar una aplicación web que permita gestionar incidencias georreferenciadas con trazabilidad completa, integrando:

- Frontend interactivo.
- Backend basado en API REST.
- Persistencia híbrida de datos.
- Procesamiento mediante IA/NLP.
- Validaciones funcionales.
- Despliegue mediante contenedores Docker.

---

# Arquitectura del Sistema

La arquitectura implementada sigue un enfoque desacoplado orientado a servicios.

## Componentes principales

### Frontend

Encargado de:

- Registro de incidencias.
- Visualización de datos.
- Dashboard y métricas.
- Gestión de estados y seguimiento.

**Tecnologías:**

- HTML
- CSS
- Bootstrap
- JavaScript (Fetch API)

---

### Backend API

Servicio principal encargado de:

- Validaciones.
- Lógica de negocio.
- Gestión de incidencias.
- Integración con IA.
- Comunicación con las bases de datos.

**Tecnologías:**

- Laravel
- PHP
- API REST

---

### Servicio IA/NLP

Microservicio encargado de:

- Normalización de texto.
- Clasificación de incidencias.
- Procesamiento de lenguaje natural.
- Extracción de información relevante.

**Ejemplo:**

#### Entrada

```text
"hOLA VRODER ME RONARON CAUSA AYUDAAAAAA"
```

#### Salida

```json
{
  "tipo": "robo",
  "prioridad": "alta",
  "texto_normalizado": "hola brother me robaron ayuda"
}
```

---

### MongoDB

Utilizado para almacenar:

- Datos no estructurados.
- Resultados IA.
- Logs.
- Evidencias.
- Información flexible y dinámica.

---

### Base de Datos Relacional

Encargada de:

- Persistencia transaccional.
- Gestión de usuarios.
- Historial de estados.
- Asignaciones.
- Trazabilidad.
- Consultas y métricas.

**Motores compatibles:**

- PostgreSQL
- MySQL

---

# Funcionalidades Implementadas

## Gestión de incidencias

- Registro.
- Edición.
- Eliminación.
- Seguimiento.

## Gestión de estados

- Pendiente.
- En proceso.
- Resuelto.
- Historial completo de cambios.

### Ejemplo de flujo

```text
Pendiente → En proceso → Resuelto
```

## Asignación de responsables

- Responsable principal.
- Usuarios de apoyo.

## Comentarios y seguimiento

- Registro de comentarios.
- Historial por incidencia.
- Fecha y autor.

## Clasificación jerárquica

Ejemplos:

```text
Seguridad → Robo
Infraestructura → Alumbrado
```

## Georreferenciación

- País.
- Provincia.
- Ciudad.
- Coordenadas geográficas.

## Dashboard y métricas

- Incidencias por estado.
- Incidencias por ubicación.
- Tiempo promedio de resolución.
- Indicadores visuales.

## Notificaciones

- Cambios de estado.
- Alertas del sistema.
- Estado leído/no leído.

---

# Arquitectura de Datos

El sistema implementa persistencia híbrida.

## MongoDB

Utilizado para:

- Datos crudos.
- Resultados NLP.
- Evidencias.
- Logs.
- Información flexible.

Ejemplo:

```json
{
  "texto_original": "me ronaron ayuda",
  "texto_normalizado": "me robaron ayuda",
  "tipo": "robo",
  "prioridad": "alta",
  "confianza": 0.94
}
```

## Base de Datos Relacional

Utilizada para:

- Entidades principales.
- Relaciones.
- Integridad transaccional.
- Consultas analíticas.
- Reportes del sistema.

---

# Tecnologías Utilizadas

| Componente | Tecnología |
|------------|------------|
| Frontend | HTML, CSS, Bootstrap, JavaScript |
| Backend | Laravel |
| API | REST |
| IA/NLP | Python |
| Base de Datos Relacional | PostgreSQL / MySQL |
| Base de Datos NoSQL | MongoDB |
| Contenedores | Docker |

---

# Estructura del Proyecto

```text
frontend/
backend/
ia_python_nlp/
database/
docker/
docs/
```

---

# Flujo General del Sistema

```text
Usuario
   │
   ▼
Frontend
   │
   ▼
Backend API
   │
   ├──► Servicio IA/NLP
   │          │
   │          ▼
   │       MongoDB
   │
   ▼
Base de Datos Relacional
```

---

# Despliegue

El sistema se ejecuta mediante contenedores Docker permitiendo:

- Separación de servicios.
- Escalabilidad.
- Persistencia de datos.
- Facilidad de despliegue.

Servicios considerados:

- Backend.
- Base de datos relacional.
- MongoDB.
- Servicio IA.

---

# Validaciones y Calidad del Sistema

El proyecto incorpora:

- Validaciones frontend y backend.
- Manejo de errores.
- Casos de prueba funcionales.
- Evidencias de testing.
- Pruebas básicas de carga.
- Métricas e indicadores.

---

# Requisitos

## Software requerido

- Docker
- Docker Compose
- PHP 8+
- Composer
- Node.js
- PostgreSQL o MySQL
- MongoDB

---

# Ejecución del Proyecto

## 1. Clonar repositorio

```bash
git clone <repositorio>
cd proyecto
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

## 3. Levantar contenedores

```bash
docker compose up -d
```

## 4. Ejecutar migraciones

```bash
php artisan migrate
```

## 5. Ejecutar servidor

```bash
php artisan serve
```

---

# Roles del Sistema

## Administrador

Permisos:

- Gestión total de incidencias.
- Visualización global.
- Asignaciones.
- Dashboard.
- Reportes.

## Usuario

Permisos:

- Registro de incidencias.
- Seguimiento.
- Comentarios.

---

# Evidencias del Proyecto

El sistema contempla:

- Capturas funcionales.
- Dashboard y visualización.
- Evidencias de testing.
- Casos de prueba.
- Validaciones implementadas.
- Evidencias de despliegue.

---

# Integrantes

- Integrante 1
- Integrante 2
- Integrante 3

---

# Docentes

- Tecnologías y Desarrollo Web
- Calidad de Software
- Base de Datos
- Administración de Data Center

---

# Licencia

Proyecto desarrollado con fines académicos para la carrera de Software.