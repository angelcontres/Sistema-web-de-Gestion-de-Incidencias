# Guía de Ejecución y Despliegue

Este documento detalla las instrucciones necesarias para levantar el **Sistema Web de Gestión de Incidencias Georreferenciadas** de forma local, configurar sus conexiones y comprender el entorno del despliegue en producción.

---

## 6. Instrucciones de ejecución

### Pasos para ejecutar el sistema

#### A. Cómo iniciar el proyecto

El proyecto está completamente contenedorizado para garantizar portabilidad. Los pasos para inicializarlo son:

1. **Requisitos previos:** Asegúrese de tener instalados **Docker** y **Docker Compose** en su sistema.
2. **Clonar el repositorio e ingresar a la carpeta del proyecto:**
   ```bash
   git clone <url-del-repositorio>
   cd Sistema-web-de-Gestion-de-Incidencias
   ```
3. **Levantar los contenedores de Docker:**
   Desde la raíz del repositorio (donde se encuentra `docker-compose.yml`), ejecute:
   ```bash
   docker compose up -d --build
   ```
   *Esto compilará la imagen de Laravel y descargará e iniciará los servicios de Nginx, PostgreSQL PostGIS, Grafana, SonarQube y Cloudflare Tunnel.*
4. **Ejecutar migraciones y sembrar base de datos (Seeders):**
   Una vez que los contenedores estén corriendo, inicialice las tablas transaccionales, las dimensiones del Data Warehouse y cargue los usuarios por defecto:
   ```bash
   docker exec -it sistema_laravel php artisan migrate --seed
   ```
   *(Nota: Esto creará automáticamente las tablas del esquema `public` y reconstruirá el esquema `metrics` para el análisis OLAP).*

---

#### B. Cómo conectar la base de datos

La base de datos utiliza **PostgreSQL 17** con la extensión geoespacial **PostGIS**. El sistema se conecta internamente mediante la red Docker `sistema_net` de la siguiente forma:

1. **Configuración del Backend (`backend/api/.env`):**
   El backend se conecta al contenedor de la base de datos usando las siguientes variables de entorno preconfiguradas:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=postgres
   DB_PORT=5432
   DB_DATABASE=gestion_incidencias
   DB_USERNAME=angeltux
   DB_PASSWORD=password_segura_upse
   ```
2. **Conexión desde el Host (pgAdmin / DBeaver / VS Code):**
   Si desea conectar un cliente externo de base de datos desde su máquina host, use los siguientes parámetros:
   * **Host:** `localhost` (o `127.0.0.1`)
   * **Puerto:** `5436` (el puerto externo mapeado en `docker-compose.yml`)
   * **Base de datos:** `gestion_incidencias`
   * **Usuario:** `angeltux`
   * **Contraseña:** `password_segura_upse`
3. **Esquema Híbrido (OLTP + OLAP):**
   * El esquema transaccional de negocio reside en **`public`**.
   * El esquema analítico (Data Warehouse) reside en **`metrics`** y se alimenta en tiempo real/programado mediante procesos ETL integrados en Laravel.

---

#### C. Cómo acceder al sistema

Una vez que los contenedores estén arriba y la base de datos migrada, puede acceder a las distintas herramientas del sistema a través de las siguientes URLs locales:

* **Aplicación Web (Cliente Frontend SPA + API Backend):**
  * URL: [http://localhost:3005](http://localhost:3005)
  * *Acceso directo a la SPA de JavaScript Vanilla que consume la API REST de Laravel expuesta en `/api/v1`.*
* **Panel de Analíticas y KPIs (Grafana):**
  * URL: [http://localhost:3010](http://localhost:3010)
  * *Permite visualizar los dashboards de rendimiento TRP y métricas SQA. (Credenciales por defecto: `admin` / `admin`).*
* **Servidor de Aseguramiento de Calidad (SonarQube):**
  * URL: [http://localhost:9009](http://localhost:9009)
  * *Hospeda los reportes de calidad de código y análisis estático. (Credenciales por defecto: `admin` / `admin`).*
* **Credenciales de Acceso Inicial para la App:**
  * **Usuario Admin:** `admin@admin.com` / **Contraseña:** `holamundo`
  * **Usuario Test:** `test@example.com` / **Contraseña:** `password123`
  * **Usuario Institución (Policía):** `policianacional@example.com` / **Contraseña:** `policia123`

---

## 7. Despliegue

### Descripción del entorno de producción

#### A. Uso de contenedores
El despliegue está orquestado a través de **Docker** y se compone de los siguientes 8 contenedores aislados en la red interna `sistema_net`:

1. **`sistema_nginx` (nginx:alpine):** Reverse Proxy y Gateway del sistema. Despacha los archivos estáticos del frontend en la raíz (`/`) y delega las peticiones `/api` a Laravel a través de FastCGI.
2. **`sistema_laravel` (Laravel 11 / PHP-FPM):** Servidor del backend API REST encargado de procesar la lógica de negocio y transacciones.
3. **`sistema_laravel_worker` (queue:work):** Procesa de manera asíncrona las tareas en cola (ETL de analíticas, envío de notificaciones y reportes pesados).
4. **`sistema_laravel_scheduler` (schedule:work):** Ejecuta tareas cronometradas como los cálculos de indicadores de calidad SQA y backups automáticos.
5. **`sistema_postgres` (postgis/postgis:17):** Motor de base de datos relacional y espacial.
6. **`sistema_grafana` (grafana/grafana:latest):** Renderiza los dashboards analíticos embebidos en el frontend.
7. **`sistema_sonarqube` & `sistema_sonarqube_db`:** Infraestructura dedicada para las auditorías de calidad SQA.
8. **`sistema_tunnel_staging` (cloudflared):** Agente de Cloudflare para exponer de manera segura los puertos de la aplicación a la web.

---

#### B. Entorno donde se ejecuta
El sistema se encuentra desplegado en un **Servidor VPS (Virtual Private Server) en la nube**, el cual cuenta con una distribución Linux optimizada para Docker. 

La arquitectura de red del servidor bloquea todo puerto externo a excepción de las conexiones internas del túnel de Cloudflare. Esto garantiza que las bases de datos y APIs no estén expuestas directamente a internet, mitigando ataques de denegación de servicio (DDoS) o escaneos de puertos no autorizados.

---

#### C. URL del sistema (para verificar funcionalidad completa)

La aplicación web ha sido desplegada en producción y se encuentra disponible públicamente bajo el siguiente dominio seguro con cifrado SSL/TLS:

* **URL de Acceso Principal:** **[https://alertcity.dihm-muertos.site](https://alertcity.dihm-muertos.site)**
* **Funcionalidad verificada:**
  * Registro de incidencias ciudadanas georreferenciadas (integrado con mapas de OpenStreetMap).
  * Panel de control (Kanban y despacho) para operadores e instituciones.
  * Sincronización analítica y dashboards interactivos embebidos.
  * Sesión y autenticación basada en tokens Sanctum a través de HTTPS.
