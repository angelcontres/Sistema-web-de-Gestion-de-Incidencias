# Sistema web de Gestión de Incidencias

Proyecto para gestionar incidencias georreferenciadas: registro, seguimiento,
asignación y resolución con trazabilidad completa.

## Descripción

Sistema web para gestionar incidencias georreferenciadas con historial de
estados, asignación de responsables, comentarios, prioridades y consultas
filtradas. El proyecto integra frontend, backend, base de datos y despliegue
en contenedores; incluye pruebas funcionales y documentación técnica.

## Estructura del repositorio

- `backend/` - Código del servidor (Laravel API REST según especificación).
- `frontend/` - Interfaz (HTML, CSS, Bootstrap y JavaScript cliente con `fetch`).
- `docs/` - Documentación del proyecto (documento técnico, rúbrica, evidencias).

Consulta `docs/2026_Proyecto_Estudiantes_TecDesWeb.pdf` para los lineamientos
completos del proyecto (requisitos, rúbrica y entregables obligatorios).

## Tecnologías y stack (según `docs/`)

- Backend: Laravel (API REST)
- Frontend: HTML, CSS, Bootstrap, JavaScript (fetch)
- Base de datos: MySQL o PostgreSQL
- Despliegue: Docker / Docker Compose (contenedores para backend y BD)

## Requisitos funcionales principales

- Registro, edición y eliminación de incidencias
- Histórico de cambios de estado (fecha y usuario)
- Asignación de uno o varios responsables y roles (responsable/apoyo)
- Comentarios con autor y fecha
- Ubicación normalizada (país, provincia, ciudad) y georreferenciación
- Clasificación jerárquica (tipo → subtipo)
- Notificaciones por cambios (leído/no leído)
- Prioridad (alta/media/baja), fecha de creación y tiempo de resolución
- Consultas y métricas: incidencias por estado/tipo/ubicación, tiempo medio

## Requisitos no funcionales y calidad

- Validaciones y manejo de errores en frontend y backend
- Casos de prueba funcionales y evidencias de testing
- Pruebas básicas de carga/estrés y métricas simples
- Ejecución en contenedores; opción de escalado básico para bonificación

## Instalación y ejecución (Laravel + Frontend)

1. Clona el repositorio:

```bash
git clone <url-del-repo>
cd Sistema-web-de-Gestion-de-Incidencias
```

2. Backend (Laravel):

```bash
cd backend
composer install
cp .env.example .env
# Configura variables de BD en .env (DB_DATABASE, DB_USERNAME, DB_PASSWORD)
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000
```

3. Frontend (HTML/CSS/Bootstrap + JS):

Si el frontend es estático, puedes abrir `frontend/index.html` en el navegador
o servir con un servidor estático durante el desarrollo:

```bash
cd frontend
python -m http.server 3000
# o: npx http-server . -p 3000
```

4. Con Docker (opcional, recomendado para entrega):

Si existe `docker-compose.yml` en la raíz o en `backend/`, ejecuta:

```bash
docker-compose up --build
```

## Configuración de base de datos

- Crea la base de datos (MySQL/Postgres) y actualiza `.env` del backend.
- Para entrega, adjunta un volcado SQL en `docs/` o en la carpeta indicada.

## Tests

Ejecuta tests de Laravel:

```bash
cd backend
php artisan test
# o: vendor/bin/phpunit
```

Incluye evidencias de pruebas funcionales en `docs/`.

## Despliegue y entrega

Entrega obligatoria:

- Código fuente completo
- Archivo de base de datos (dump SQL)
- Documento técnico (8–12 páginas) que evidencie implementación y decisiones
- URL(s) públicas para verificar la aplicación (si es aplicable)

El `docs/2026_Proyecto_Estudiantes_TecDesWeb.pdf` detalla el contenido del
documento técnico, la rúbrica y las evidencias esperadas (capturas, pruebas,
credenciales de acceso, modelo ER, diagrama de arquitectura).

## Criterios de evaluación (resumen)

- Interfaz de usuario y experiencia
- Integración frontend-backend (consumo de API con `fetch`)
- Funcionalidad (CRUD, asignación, comentarios, historial)
- Lógica del sistema y organización del código
- Documentación técnica y demostración funcional

## Contribuir

- Crear una rama por feature: `git checkout -b feature/nombre`
- Commits pequeños y claros
- Incluir pruebas y evidencias en `docs/`
- Abrir Pull Request con descripción y pasos para reproducir
