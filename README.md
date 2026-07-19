# Sistema web de Gestión de Incidencias

Proyecto para gestionar incidencias georreferenciadas: registro, seguimiento,
asignación y resolución con trazabilidad completa.

## Integrantes

- Paulo Orrala Arriaga
- Carlos Fernando Patiño García
- Angel Alejandro Villon Panimboza

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

## Estándares de Código y Formateo (Para el Equipo)

Para mantener la base de código limpia y evitar conflictos de formato (espaciados, llaves, comillas) en las Pull Requests, el proyecto ya cuenta con **reglas de estilo globales preconfiguradas** en el repositorio (`pint.json` y `.prettierrc`).

Todos los integrantes del equipo deben utilizarlas siguiendo estos pasos:

### Backend (Laravel) - Laravel Pint

El backend está configurado bajo el estándar de Laravel definido en `backend/api/pint.json`. No debes crear ni modificar reglas, solo ejecutarlas:

1.  **Ejecutar formateador**: Abre tu terminal y corre:

    ```bash
    # En Docker:
    docker compose exec laravel ./vendor/bin/pint

    # En local:
    cd backend/api
    ./vendor/bin/pint
    ```

2.  Esto escaneará tu código PHP modificado y lo formateará automáticamente.

3.  **El worker que se utiliza para rastrear la duracion de las peticiones REST se ejecuta automaticamente y los datos graficos se pueden ver en el menú SQA del sidebar**

### Frontend (HTML, CSS, JS) - Prettier

El frontend utiliza las reglas compartidas definidas en `frontend/.prettierrc`.

1.  Instala la extensión **Prettier - Code Formatter** en tu VS Code.
2.  Como el repositorio ya incluye la configuración compartida en `.vscode/settings.json`, tu editor utilizará Prettier y formateará de forma automática cada vez que guardes un archivo (`Ctrl + S`).

---

## Arquitectura de Datos y Data Warehouse (OLAP)

El proyecto cuenta con una arquitectura híbrida que separa la base de datos transaccional de negocio (esquema `public`) del Data Warehouse/esquema analítico (esquema `metrics`) utilizado para almacenar y consultar el histórico de métricas de rendimiento, incidencias y calidad de software (SQA).

### 1. Estructura del Data Warehouse (Esquema `metrics`)

El esquema OLAP utiliza un modelado en estrella con dimensiones y tablas de hechos para consultas rápidas y estructuradas:

- **Dimensiones Generales:**
  - `dim_tiempo`: Registro histórico indexado por hora (`YYYYMMDDHH`) que actúa como eje temporal de todas las métricas.
  - `dim_metric`: Catálogo de métricas del sistema (ej. `DD` para Densidad de Defectos, `CF` para Cobertura Funcional).
- **Métricas de Seguridad (VCO):**
  - `dim_capa`: Clasifica la ubicación del fallo (1 = Backend, 2 = Frontend).
  - `dim_vulnerabilidad`: Almacena tipos de vulnerabilidad únicos identificados por un hash, conteniendo el título de la vulnerabilidad y su severidad (`critical`, `high`, `medium`, `low`).
  - `fact_security`: Registro granular de cada vulnerabilidad encontrada. Contiene llaves foráneas a tiempo, capa y vulnerabilidad, además del `componente_afectado` (paquete o archivo) y la `linea_afectada` (se registra como `0` para vulnerabilidades a nivel de paquete en backend).
- **Métricas de Calidad y Pruebas (CF y TEP):**
  - `dim_historia_usuario`: Catálogo de las HUs definidas en el documento de requerimientos (`historias_usuario.md`).
  - `fact_cobertura`: Almacena el resultado individual por HU (`aprobada` true/false) para un momento en el tiempo.
  - `fact_testing`: Almacena la Tasa de Éxito de Pruebas (TEP) junto con los contadores de pruebas aprobadas, fallidas y omitidas.
  - `fact_quality`: Almacena porcentajes de indicadores consolidados (como Cobertura Funcional general o Densidad de Defectos).

---

### 2. Comandos de Métricas SQA (Artisan)

Para poblar y calcular las métricas SQA directamente en el Data Warehouse, se dispone de cuatro comandos de Artisan. Estos comandos ya no generan archivos JSON locales; en su lugar, actualizan las dimensiones y cargan los hechos de grano fino de forma automatizada:

```bash
# Calcular y registrar Vulnerabilidades Críticas (VCO)
php artisan sqa:vco

# Calcular y registrar Densidad de Defectos (DD)
php artisan sqa:dd

# Calcular y registrar Cobertura Funcional (CF) a nivel global e individual por HU
php artisan sqa:cf

# Calcular y registrar la Tasa de Éxito de Pruebas (TEP)
php artisan sqa:tep
```

#### Configuración del Programador:

- **VCO (Vulnerabilidades Críticas - Activa):** Programada para ejecutarse automáticamente todas las madrugadas a las **02:00 AM**.
- **DD, CF y TEP (Pasivas/Manuales):** Aunque son métricas que los desarrolladores ejecutan de manera manual, están programadas en cascada por la madrugada (03:00, 04:00 y 05:00 AM respectivamente) para asegurar que el Data Warehouse se actualice diariamente y mantenga el histórico completo en producción de forma desatendida.

---

### 3. Migraciones del Esquema Analítico (OLAP)

Las migraciones del esquema analítico están aisladas en la carpeta:
[Ruta](/backend/api/database/migrations/olap/)

> [!WARNING]
> La carpeta de migraciones por defecto en Laravel es `/database/migrations`. Para evitar que las migraciones del Data Warehouse se mezclen con las transaccionales, sigue estas reglas:

#### En Desarrollo Local (Ejecución y Reset)

Para ejecutar, revertir o refrescar **únicamente** el esquema OLAP sin alterar las tablas de negocio:

```bash
# Ejecutar migraciones OLAP
php artisan migrate --path=database/migrations/olap

# Refrescar y reiniciar el Data Warehouse desde cero
php artisan migrate:refresh --path=database/migrations/olap
```

#### En Producción (Despliegue Seguro)

- **Regla de Oro:** **NUNCA** ejecutes `php artisan migrate:fresh` en producción. Esto borrará irreversiblemente todo el histórico de métricas acumulado en el Data Warehouse.
- **Actualizaciones Seguras de Tablas de Negocio:** Para repoblar el negocio sin tocar el esquema de métricas, utiliza el parámetro `--exclude-path`:
  ```bash
  php artisan migrate:fresh --exclude-path=database/migrations/olap --seed
  ```
- **Migraciones Incrementales:** Para cualquier cambio estructurado en el Data Warehouse de producción, crea archivos de migración no destructivos y ejecútalos de manera estándar:
  ```bash
  php artisan migrate
  ```

---

### 4. Automatización del ETL y Schedulers

#### Desarrollo Local

Para que las métricas y sincronizaciones ETL se actualicen automáticamente en segundo plano mientras el servidor local corre:

1. Abre otra pestaña de tu terminal.
2. Ejecuta el daemon programador de desarrollo:
   ```bash
   php artisan schedule:work
   ```

#### Producción (Cron Daemon)

En producción, debes configurar el **Cron** del sistema operativo para que ejecute el programador de Laravel cada minuto.

1. Abre el crontab del servidor: `crontab -e`
2. Añade la siguiente línea adaptada a la ruta absoluta de tu proyecto (carpeta `backend/api`):
   ```bash
   * * * * * cd /ruta/a/tu/proyecto && php artisan schedule:run >> /dev/null 2>&1
   ```

## Análisis de Calidad de Código SQA (SonarQube)

El proyecto cuenta con una integración lista para su ejecución local y en entornos de integración continua (CI/CD) para la validación estática, seguridad y calidad de código a través de SonarQube.

### Levantamiento Rápido (Local)

El entorno de `docker-compose.yml` incluye servicios preconfigurados de SonarQube y una base de datos PostgreSQL 15 aislada para preservar los históricos de análisis de código de tu proyecto:

```bash
docker-compose up -d sonarqube
```

El servidor estará expuesto en: **http://localhost:9009**
- Las credenciales por defecto de un despliegue fresco de SonarQube son `admin` / `admin`.

### Configuración del Proyecto (sonar-project.properties)

El archivo en la raíz `sonar-project.properties` contiene la huella y configuración general del proyecto, con soporte directo para Producción y Pipelines:

- **Autenticación segura**: Mediante el uso de un token que puede ser inyectado por CLI (`-Dsonar.token=$SONAR_TOKEN`), evitas subir contraseñas planas al repositorio.
- **Mapeo de cobertura**: Ya está preconfigurado para leer la salida XML (Clover) generada por PHPUnit, y el archivo `lcov.info` de las métricas Frontend, de manera que la cobertura de código se centralice en los dashboards SQA.

---

## Contribuir

- Crear una rama por feature: `git checkout -b <nombre generado en linear>`
- **Correr el formateador (`Pint` / `Prettier`) antes de hacer commit.**
- Commits pequeños y claros.
- Incluir pruebas y evidencias en `docs/`.
- Abrir Pull Request con descripción y pasos para reproducir.
